'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, ShoppingCart, Plus, Minus, Check, X } from 'lucide-react'
import Link from 'next/link'
import { useAppContext } from '@/context/AppContext'
import { orderAPI, productAPI } from '@/services/api'
import toast from 'react-hot-toast'

export default function ReorderPage() {
    const params = useParams()
    const router = useRouter()
    const { token, isAuthenticated, addMultipleToCart } = useAppContext()
    const [order, setOrder] = useState(null)
    const [products, setProducts] = useState({}) // Store fetched products by productId
    const [selectedItems, setSelectedItems] = useState({}) // { itemIndex: { selected: true, quantity: 1 } }
    const [loading, setLoading] = useState(true)
    const [fetchingProducts, setFetchingProducts] = useState(false)
    const [addingToCart, setAddingToCart] = useState(false)

    // Fetch order details
    const fetchOrderDetails = async () => {
        if (!isAuthenticated || !token || !params.orderId) {
            setLoading(false)
            return
        }

        try {
            setLoading(true)
            const response = await orderAPI.getUserOrderById(params.orderId, token)

            if (response.success) {
                setOrder(response.data)
                // Initialize selected items - all selected by default
                const initialSelection = {}
                response.data.items?.forEach((item, index) => {
                    initialSelection[index] = {
                        selected: true,
                        quantity: item.quantity || 1
                    }
                })
                setSelectedItems(initialSelection)
                
                // Fetch products for all items
                await fetchProductsForItems(response.data.items)
            } else {
                toast.error(response.message || 'Failed to fetch order details')
                router.push('/dashboard/my-orders')
            }
        } catch (error) {
            console.error('Error fetching order details:', error)
            toast.error('Failed to fetch order details')
            router.push('/dashboard/my-orders')
        } finally {
            setLoading(false)
        }
    }

    // Fetch product details for each order item
    const fetchProductsForItems = async (items) => {
        if (!items || items.length === 0) return

        try {
            setFetchingProducts(true)
            const productPromises = items.map(async (item) => {
                try {
                    // Get product ID - could be item.product (ObjectId), item.product._id (populated), or item.productId
                    const productId = item.product?._id || item.product || item.productId
                    
                    if (!productId) {
                        console.warn(`No product ID found for item: ${item.name}`)
                        return null
                    }

                    // Fetch product by ID
                    const productData = await productAPI.getProductById(productId)

                    if (productData?.success) {
                        return { productId, product: productData.data }
                    }
                    return null
                } catch (error) {
                    console.error(`Error fetching product for item ${item.name}:`, error)
                    return null
                }
            })

            const results = await Promise.all(productPromises)
            const productsMap = {}
            results.forEach((result) => {
                if (result && result.product) {
                    productsMap[result.productId] = result.product
                }
            })
            setProducts(productsMap)
        } catch (error) {
            console.error('Error fetching products:', error)
            toast.error('Some products could not be loaded')
        } finally {
            setFetchingProducts(false)
        }
    }

    useEffect(() => {
        fetchOrderDetails()
    }, [isAuthenticated, token, params.orderId])

    // Toggle item selection
    const toggleItemSelection = (index) => {
        setSelectedItems(prev => ({
            ...prev,
            [index]: {
                ...prev[index],
                selected: !prev[index]?.selected
            }
        }))
    }

    // Update quantity with stock check
    const updateQuantity = (index, newQuantity) => {
        if (newQuantity < 1) return

        const item = order.items[index]
        const productId = item.product?._id || item.product || item.productId
        const product = products[productId]
        
        if (!product) {
            toast.error('Product information not available')
            return
        }

        // Get the selected variant
        const selectedVariant = getSelectedVariant(item, product)
        
        // Check stock availability
        let availableStock = 0
        if (product.variants && product.variants.length > 0) {
            if (!selectedVariant) {
                toast.error('Variant not found')
                return
            }
            availableStock = selectedVariant.stockQuantity || 0
        } else {
            availableStock = product.totalStock || 0
        }

        // Check if requested quantity exceeds available stock
        if (newQuantity > availableStock) {
            toast.error(`Insufficient stock! Only ${availableStock} available.`)
            return
        }

        setSelectedItems(prev => ({
            ...prev,
            [index]: {
                ...prev[index],
                quantity: newQuantity
            }
        }))
    }

    // Get selected variant for an item
    const getSelectedVariant = (item, product) => {
        if (!product?.variants || product.variants.length === 0) {
            return null
        }

        // Find variant matching the order item's variant
        const itemSize = item.variant?.size
        const itemColor = item.variant?.color

        return product.variants.find(variant => {
            const sizeAttr = variant.attributes?.find(attr => attr.name === 'Size')
            const colorAttr = variant.attributes?.find(attr => attr.name === 'Color')
            
            const sizeMatches = sizeAttr?.value === itemSize
            const colorMatches = itemColor 
                ? colorAttr?.value === itemColor 
                : !colorAttr // If no color in order, variant should also have no color

            return sizeMatches && colorMatches
        })
    }

    // Get available stock for an item
    const getAvailableStock = (item, product) => {
        if (!product) return 0
        
        const selectedVariant = getSelectedVariant(item, product)
        
        if (product.variants && product.variants.length > 0) {
            if (!selectedVariant) return 0
            return selectedVariant.stockQuantity || 0
        } else {
            return product.totalStock || 0
        }
    }

    // Add selected items to cart
    const handleAddToCart = async () => {
        if (!order || !order.items) return

        const itemsToAdd = []
        const selectedIndices = Object.keys(selectedItems).filter(
            index => selectedItems[index]?.selected
        )

        if (selectedIndices.length === 0) {
            toast.error('Please select at least one item to reorder')
            return
        }

        setAddingToCart(true)

        try {
            for (const index of selectedIndices) {
                const item = order.items[index]
                const productId = item.product?._id || item.product || item.productId
                const product = products[productId]
                
                if (!product) {
                    toast.error(`Product "${item.name}" is no longer available`)
                    continue
                }

                // Get the variant that matches the order item
                const selectedVariant = getSelectedVariant(item, product)

                // If variant not found but product has variants, skip
                if (product.variants?.length > 0 && !selectedVariant) {
                    toast.error(`Variant for "${item.name}" is no longer available`)
                    continue
                }

                // Check stock availability before adding to cart
                const requestedQuantity = selectedItems[index].quantity
                let availableStock = 0
                
                if (product.variants && product.variants.length > 0) {
                    availableStock = selectedVariant?.stockQuantity || 0
                } else {
                    availableStock = product.totalStock || 0
                }

                if (availableStock <= 0) {
                    toast.error(`"${item.name}" is out of stock`)
                    continue
                }

                if (requestedQuantity > availableStock) {
                    toast.error(`Insufficient stock for "${item.name}". Only ${availableStock} available.`)
                    continue
                }

                // Prepare variant data for cart
                const variantData = selectedVariant ? {
                    size: selectedVariant.attributes?.find(attr => attr.name === 'Size')?.value,
                    color: selectedVariant.attributes?.find(attr => attr.name === 'Color')?.value,
                    hexCode: selectedVariant.attributes?.find(attr => attr.name === 'Color')?.hexCode,
                    currentPrice: selectedVariant.currentPrice,
                    originalPrice: selectedVariant.originalPrice,
                    sku: selectedVariant.sku,
                    stockQuantity: selectedVariant.stockQuantity,
                    stockStatus: selectedVariant.stockStatus
                } : null

                itemsToAdd.push({
                    product,
                    selectedVariant: variantData,
                    quantity: selectedItems[index].quantity
                })
            }

            if (itemsToAdd.length > 0) {
                addMultipleToCart(itemsToAdd)
                toast.success(`${itemsToAdd.length} item(s) added to cart!`)
                router.push('/cart')
            }
        } catch (error) {
            console.error('Error adding to cart:', error)
            toast.error('Failed to add items to cart')
        } finally {
            setAddingToCart(false)
        }
    }

    // Select all items
    const selectAll = () => {
        const allSelected = {}
        order?.items?.forEach((item, index) => {
            allSelected[index] = {
                selected: true,
                quantity: item.quantity || 1
            }
        })
        setSelectedItems(allSelected)
    }

    // Deselect all items
    const deselectAll = () => {
        setSelectedItems({})
    }

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="bg-white rounded-lg shadow-sm p-6 max-w-md">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Reorder</h1>
                    <p className="text-gray-600 mb-4">Please login to reorder items</p>
                    <Link
                        href="/login"
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                        Login
                    </Link>
                </div>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading order details...</p>
                </div>
            </div>
        )
    }

    if (!order) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-4xl mx-auto px-6 py-8">
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h1>
                        <p className="text-gray-600 mb-4">The order you're looking for doesn't exist.</p>
                        <Link
                            href="/dashboard/my-orders"
                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Orders
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    const selectedCount = Object.values(selectedItems).filter(item => item?.selected).length
    const allSelected = order.items?.length > 0 && selectedCount === order.items.length

    // Check if any selected item has insufficient stock
    const hasInsufficientStock = () => {
        if (!order || !order.items) return false
        
        const selectedIndices = Object.keys(selectedItems).filter(
            index => selectedItems[index]?.selected
        )
        
        for (const index of selectedIndices) {
            const item = order.items[index]
            const productId = item.product?._id || item.product || item.productId
            const product = products[productId]
            
            if (!product) continue
            
            const availableStock = getAvailableStock(item, product)
            const requestedQuantity = selectedItems[index].quantity
            
            if (availableStock <= 0 || requestedQuantity > availableStock) {
                return true
            }
        }
        
        return false
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-6">
                    <Link
                        href={`/dashboard/my-orders/${params.orderId}`}
                        className="inline-flex items-center text-gray-600 hover:text-gray-900 text-sm font-medium mb-4"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Order Details
                    </Link>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Reorder Items</h1>
                            <p className="text-gray-600 mt-1">Order #{order.orderId}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={allSelected ? deselectAll : selectAll}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
                            >
                                {allSelected ? 'Deselect All' : 'Select All'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Order Items */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    {fetchingProducts ? (
                        <div className="p-8 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="mt-4 text-gray-600">Loading products...</p>
                        </div>
                    ) : order.items && order.items.length > 0 ? (
                        <div className="divide-y divide-gray-200">
                            {order.items.map((item, index) => {
                                const productId = item.product?._id || item.product || item.productId
                                const product = products[productId]
                                const isSelected = selectedItems[index]?.selected || false
                                const quantity = selectedItems[index]?.quantity || item.quantity || 1
                                const selectedVariant = product ? getSelectedVariant(item, product) : null
                                const isAvailable = product && (!product.variants?.length || selectedVariant)
                                const availableStock = product ? getAvailableStock(item, product) : 0
                                const canIncreaseQuantity = quantity < availableStock
                                
                                return (
                                    <div key={index} className="p-6 hover:bg-gray-50">
                                        <div className="flex items-start gap-4">
                                            {/* Checkbox */}
                                            <div className="flex-shrink-0 pt-1">
                                                <button
                                                    onClick={() => toggleItemSelection(index)}
                                                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                                        isSelected
                                                            ? 'bg-blue-600 border-blue-600'
                                                            : 'border-gray-300 hover:border-blue-400'
                                                    } ${!isAvailable ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                                    disabled={!isAvailable}
                                                >
                                                    {isSelected && (
                                                        <Check className="h-3 w-3 text-white" />
                                                    )}
                                                </button>
                                            </div>

                                            {/* Product Image */}
                                            <div className="flex-shrink-0">
                                                <img
                                                    src={item.image || product?.featuredImage || '/images/placeholder.png'}
                                                    alt={item.name}
                                                    className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                                                    onError={(e) => {
                                                        e.target.src = '/images/placeholder.png'
                                                    }}
                                                />
                                            </div>

                                            {/* Product Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        {product?.slug ? (
                                                            <Link href={`/product/${product.slug}`}>
                                                                <h3 className="text-lg font-medium text-gray-900 hover:text-blue-600 transition-colors cursor-pointer">
                                                                    {item.name || product?.title || 'Product'}
                                                                </h3>
                                                            </Link>
                                                        ) : (
                                                            <h3 className="text-lg font-medium text-gray-900">
                                                                {item.name || product?.title || 'Product'}
                                                            </h3>
                                                        )}
                                                        {item.variant && (
                                                            <div className="mt-1 text-sm text-gray-600">
                                                                {item.variant.size && (
                                                                    <span>Size: {item.variant.size}</span>
                                                                )}
                                                                {item.variant.color && (
                                                                    <span className="ml-2">
                                                                        Color: {item.variant.color}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                        <div className="mt-2 text-lg font-semibold text-gray-900">
                                                            ৳{item.price?.toLocaleString() || '0'}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Availability Status */}
                                                {!product && (
                                                    <div className="mt-2 text-sm text-red-600">
                                                        Product no longer available
                                                    </div>
                                                )}
                                                {product && product.variants?.length > 0 && !selectedVariant && (
                                                    <div className="mt-2 text-sm text-red-600">
                                                        This variant is no longer available
                                                    </div>
                                                )}
                                                {product && (!product.variants?.length || selectedVariant) && (
                                                    <div className="mt-2 text-sm text-green-600">
                                                        Available
                                                    </div>
                                                )}
                                            </div>

                                            {/* Quantity Controls */}
                                            {isSelected && isAvailable && (
                                                <div className="flex-shrink-0 flex flex-col items-end gap-2">
                                                    <div className="flex items-center gap-3">
                                                        <button
                                                            onClick={() => updateQuantity(index, quantity - 1)}
                                                            className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors cursor-pointer"
                                                        >
                                                            <Minus className="h-4 w-4" />
                                                        </button>
                                                        <span className="w-12 text-center font-medium text-gray-900">
                                                            {quantity}
                                                        </span>
                                                        <button
                                                            onClick={() => updateQuantity(index, quantity + 1)}
                                                            disabled={!canIncreaseQuantity}
                                                            className={`w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center transition-colors ${
                                                                canIncreaseQuantity
                                                                    ? 'hover:bg-gray-100 cursor-pointer'
                                                                    : 'opacity-50 cursor-not-allowed bg-gray-100'
                                                            }`}
                                                        >
                                                            <Plus className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                    {availableStock > 0 && quantity >= availableStock && (
                                                        <div className="text-xs text-red-600">
                                                            Only {availableStock} available
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="p-8 text-center">
                            <p className="text-gray-600">No items found in this order</p>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex items-center justify-between bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="text-sm text-gray-600">
                        {selectedCount > 0 ? (
                            <span>{selectedCount} item(s) selected</span>
                        ) : (
                            <span>No items selected</span>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <Link
                            href={`/dashboard/my-orders/${params.orderId}`}
                            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </Link>
                        <button
                            onClick={handleAddToCart}
                            disabled={selectedCount === 0 || addingToCart || fetchingProducts || hasInsufficientStock()}
                            className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                                selectedCount === 0 || addingToCart || fetchingProducts || hasInsufficientStock()
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'
                            }`}
                        >
                            {addingToCart ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Adding...
                                </>
                            ) : (
                                <>
                                    <ShoppingCart className="h-4 w-4" />
                                    Add to Cart ({selectedCount})
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

