'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Trash2, Plus, Minus, Search, RefreshCw, Save, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { useAppContext } from '@/context/AppContext'
import { orderAPI, productAPI, addressAPI } from '@/services/api'
import toast from 'react-hot-toast'

export default function EditOrder() {
    const params = useParams()
    const router = useRouter()
    const { token, isAuthenticated, deliveryChargeSettings } = useAppContext()
    
    const [order, setOrder] = useState(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    
    const [items, setItems] = useState([])
    
    // Address State
    const [formData, setFormData] = useState({
        division: '',
        divisionId: '',
        district: '',
        districtId: '',
        upazila: '',
        upazilaId: '',
        area: '',
        areaId: '',
        deliveryType: 'outsideDhaka',
        deliveryAddress: '',
    })
    
    const [divisions, setDivisions] = useState([])
    const [districts, setDistricts] = useState([])
    const [upazilas, setUpazilas] = useState([])
    const [dhakaAreas, setDhakaAreas] = useState([])
    
    // Search State
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState([])
    const [searching, setSearching] = useState(false)
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [showConfirmModal, setShowConfirmModal] = useState(false)
    const searchRef = useRef(null)

    // Variant Modal State
    const [selectedProductForVariant, setSelectedProductForVariant] = useState(null)
    const [selectedVariantSku, setSelectedVariantSku] = useState(null)

    useEffect(() => {
        fetchOrderDetails()
        fetchDivisions()
    }, [isAuthenticated, token, params.orderId])

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowSuggestions(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const fetchOrderDetails = async () => {
        if (!isAuthenticated || !token || !params.orderId) {
            setLoading(false)
            return
        }
        try {
            setLoading(true)
            const response = await orderAPI.getUserOrderById(params.orderId, token)
            if (response.success) {
                const fetchedOrder = response.data
                if (fetchedOrder.status !== 'pending') {
                    toast.error('Only pending orders can be edited')
                    router.push(`/dashboard/my-orders/${params.orderId}`)
                    return
                }
                setOrder(fetchedOrder)
                
                const formattedItems = (fetchedOrder.items || []).map(item => {
                    let maxStock = 1000;
                    if (item.product && typeof item.product === 'object') {
                        if (item.product.isForceOutOfStock) {
                            maxStock = 0;
                        } else if (item.variantSku && item.product.variants) {
                            const variant = item.product.variants.find(v => (v.sku || v._id) === item.variantSku);
                            maxStock = variant ? variant.stockQuantity : 1000;
                        } else {
                            maxStock = item.product.totalStock ?? 1000;
                        }
                    }
                    return {
                        ...item,
                        product: item.product?._id || item.product, // ensure it's just the ID
                        maxStock
                    }
                });
                setItems(formattedItems)
                
                if (fetchedOrder.shippingAddress) {
                    const addr = fetchedOrder.shippingAddress
                    setFormData({
                        division: addr.division || '',
                        divisionId: addr.divisionId || '',
                        district: addr.district || '',
                        districtId: addr.districtId || '',
                        upazila: addr.upazila || '',
                        upazilaId: addr.upazilaId || '',
                        area: addr.area || '',
                        areaId: addr.areaId || '',
                        deliveryType: 'outsideDhaka',
                        deliveryAddress: addr.street || ''
                    })
                    if (addr.divisionId) fetchDistricts(addr.divisionId)
                    if (addr.districtId) {
                        if (addr.districtId === '65') fetchDhakaAreas()
                        else fetchUpazilas(addr.districtId)
                    }
                }
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

    // Address APIs
    const fetchDivisions = async () => {
        try {
            const response = await addressAPI.getDivisions()
            if (response.success) setDivisions(response.data)
        } catch (error) {}
    }
    const fetchDistricts = async (divisionId) => {
        try {
            const response = await addressAPI.getDistrictsByDivision(divisionId)
            if (response.success) setDistricts(response.data)
        } catch (error) {}
    }
    const fetchUpazilas = async (districtId) => {
        try {
            const response = await addressAPI.getUpazilasByDistrict(districtId)
            if (response.success) setUpazilas(response.data)
        } catch (error) {}
    }
    const fetchDhakaAreas = async () => {
        try {
            const response = await addressAPI.getAllDhakaCityAreas()
            if (response.success) setDhakaAreas(response.data)
        } catch (error) {}
    }

    useEffect(() => {
        if (formData.districtId) {
            if (formData.districtId === '65') {
                setFormData(prev => ({ ...prev, deliveryType: 'insideDhaka' }))
            } else if (formData.districtId === '1') {
                setFormData(prev => ({ ...prev, deliveryType: 'subDhaka' }))
            } else {
                setFormData(prev => ({ ...prev, deliveryType: 'outsideDhaka' }))
            }
        }
    }, [formData.districtId])

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name === 'divisionId') {
            const selectedDivision = divisions.find(d => d.id === value);
            setFormData(prev => ({
                ...prev,
                divisionId: value,
                division: selectedDivision ? selectedDivision.name : '',
                districtId: '', district: '',
                upazilaId: '', upazila: '',
                areaId: '', area: ''
            }));
            fetchDistricts(value);
        } else if (name === 'districtId') {
            const selectedDistrict = districts.find(d => d.id === value);
            setFormData(prev => ({
                ...prev,
                districtId: value,
                district: selectedDistrict ? selectedDistrict.name : '',
                upazilaId: '', upazila: '',
                areaId: '', area: ''
            }));
            if (value === '65') {
                fetchDhakaAreas();
            } else {
                fetchUpazilas(value);
            }
        } else if (name === 'upazilaId') {
            const selectedUpazila = upazilas.find(u => u.id === value);
            setFormData(prev => ({
                ...prev,
                upazilaId: value,
                upazila: selectedUpazila ? selectedUpazila.name : ''
            }));
        } else if (name === 'areaId') {
            const selectedArea = dhakaAreas.find(a => a._id === value);
            setFormData(prev => ({
                ...prev,
                areaId: value,
                area: selectedArea ? selectedArea.name : ''
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    }

    // Items management
    const handleQuantityChange = (index, delta) => {
        const newItems = [...items]
        const newQuantity = newItems[index].quantity + delta
        
        if (newQuantity < 1) return
        
        if (newItems[index].maxStock !== undefined && newQuantity > newItems[index].maxStock) {
            if (newItems[index].maxStock === 0) {
                toast.error('Product is currently out of stock')
            } else {
                toast.error(`Only ${newItems[index].maxStock} items available`)
            }
            return
        }

        newItems[index].quantity = newQuantity
        newItems[index].subtotal = newQuantity * newItems[index].price
        setItems(newItems)
    }

    const handleRemoveItem = (index) => {
        const newItems = [...items]
        newItems.splice(index, 1)
        setItems(newItems)
    }

    // Search logic
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchQuery.trim().length >= 2) {
                setSearching(true)
                try {
                    const response = await productAPI.searchProducts(searchQuery.trim(), { limit: 10 })
                    if (response.success) {
                        setSearchResults(response.data?.products || response.data || [])
                        setShowSuggestions(true)
                    }
                } catch (error) {}
                setSearching(false)
            } else {
                setSearchResults([])
                setShowSuggestions(false)
            }
        }, 500)
        return () => clearTimeout(delayDebounceFn)
    }, [searchQuery])

    // Variant Helpers
    const uniqueSizes = selectedProductForVariant?.variants?.reduce((acc, v) => {
        const sizeAttr = v.attributes.find(a => a.name === 'Size');
        if (sizeAttr && !acc.includes(sizeAttr.value)) acc.push(sizeAttr.value);
        return acc;
    }, []) || [];

    const uniqueColors = selectedProductForVariant?.variants?.reduce((acc, v) => {
        const colorAttr = v.attributes.find(a => a.name === 'Color');
        if (colorAttr && !acc.find(c => c.value === colorAttr.value)) acc.push({ value: colorAttr.value, hexCode: colorAttr.hexCode });
        return acc;
    }, []) || [];

    const getAvailableVariantsForSize = (size) => {
        if (!selectedProductForVariant?.variants) return [];
        if (size) {
            return selectedProductForVariant.variants.filter(variant => {
                const sizeAttr = variant.attributes?.find(attr => attr.name === 'Size');
                return sizeAttr && sizeAttr.value === size;
            });
        }
        return selectedProductForVariant.variants.filter(variant => {
            const sizeAttr = variant.attributes?.find(attr => attr.name === 'Size');
            return !sizeAttr;
        });
    };

    const getSelectedVariant = () => {
        if (!selectedProductForVariant?.variants) return null;
        return selectedProductForVariant.variants.find(variant => (variant.sku || variant._id) === selectedVariantSku);
    };

    const handleAddProduct = (product) => {
        if (product.variants && product.variants.length > 0) {
            setSelectedProductForVariant(product);
            
            // Auto-select first available variant
            const firstVariant = product.variants[0];
            setSelectedVariantSku(firstVariant.sku || firstVariant._id);
            
            setSearchQuery('');
            setShowSuggestions(false);
            return
        }
        
        addVariantToOrder(product, null, null, null);
    }

    const confirmVariantAddition = () => {
        const variant = getSelectedVariant();
        if (!variant) {
            toast.error('Please select valid options');
            return;
        }
        if (selectedProductForVariant.isForceOutOfStock) {
            toast.error('Product is currently out of stock');
            return;
        }
        if (variant.stockQuantity < 1) {
            toast.error('Selected variant is out of stock');
            return;
        }
        
        const sizeAttr = variant.attributes?.find(a => a.name === 'Size');
        const colorAttr = variant.attributes?.find(a => a.name === 'Color');
        addVariantToOrder(selectedProductForVariant, variant, sizeAttr?.value || null, colorAttr?.value || null);
        setSelectedProductForVariant(null);
    };

    const addVariantToOrder = (product, variant, size, color) => {
        const stockLimit = product.isForceOutOfStock ? 0 : (variant ? variant.stockQuantity : product.totalStock);
        
        if (stockLimit < 1) {
            toast.error('Product is currently out of stock');
            return;
        }

        const existingItemIndex = items.findIndex(item => item.product === product._id && item.variantSku === (variant?.sku || null));

        
        if (existingItemIndex >= 0) {
            handleQuantityChange(existingItemIndex, 1)
        } else {
            const price = variant ? variant.currentPrice : product.basePrice;
            setItems([...items, {
                product: product._id,
                name: product.title,
                image: product.featuredImage || product.image || '/images/placeholder.png',
                price: price,
                quantity: 1,
                subtotal: price,
                variantSku: variant ? variant.sku : null,
                variant: variant ? { size, color } : null,
                maxStock: stockLimit
            }])
        }
        setSearchQuery('')
        setShowSuggestions(false)
        toast.success('Product added to order')
    }

    // Calculations
    const subtotal = items.reduce((sum, item) => sum + (item.subtotal || 0), 0)
    
    let shippingCost = 0
    if (deliveryChargeSettings && formData.deliveryType) {
        if (subtotal >= deliveryChargeSettings.shippingFreeRequiredAmount) {
            shippingCost = 0
        } else if (formData.deliveryType === 'insideDhaka') {
            shippingCost = deliveryChargeSettings.insideDhaka
        } else if (formData.deliveryType === 'subDhaka') {
            shippingCost = deliveryChargeSettings.subDhaka
        } else if (formData.deliveryType === 'outsideDhaka') {
            shippingCost = deliveryChargeSettings.outsideDhaka
        }
    }
    const total = subtotal + shippingCost

    const onSaveClick = () => {
        if (items.length === 0) {
            toast.error('Order must have at least one item')
            return
        }
        if (!formData.deliveryAddress || !formData.divisionId || !formData.districtId) {
            toast.error('Please complete all required address fields')
            return
        }
        setShowConfirmModal(true)
    }

    const handleSaveChanges = async () => {
        setShowConfirmModal(false)

        try {
            setSaving(true)
            const payload = {
                items,
                shippingAddress: {
                    ...order.shippingAddress,
                    division: formData.division,
                    divisionId: formData.divisionId,
                    district: formData.district,
                    districtId: formData.districtId,
                    upazila: formData.upazila,
                    upazilaId: formData.upazilaId,
                    area: formData.area,
                    areaId: formData.areaId,
                    street: formData.deliveryAddress
                },
                shippingCost
            }

            const res = await orderAPI.updateOrderByUser(order._id, payload, token)

            if (res.success) {
                toast.success('Order updated successfully')
                router.push(`/dashboard/my-orders/${params.orderId}`)
            } else {
                toast.error(res.message || 'Failed to update order')
            }
        } catch (error) {
            console.error(error)
            toast.error('Failed to update order')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <RefreshCw className="h-8 w-8 text-pink-500 animate-spin" />
            </div>
        )
    }

    if (!order) return null

    return (
        <div className="min-h-screen bg-gray-50 py-6">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between mb-6">
                    <Link href={`/dashboard/my-orders/${params.orderId}`} className="inline-flex items-center text-gray-600 hover:text-gray-900">
                        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Order
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900">Edit Order #{order.orderId}</h1>
                </div>

                <div className="space-y-6">
                    {/* Items Section */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h2>
                        
                        <div className="mb-6 relative" ref={searchRef}>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search products to add..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-pink-500 focus:border-pink-500"
                                />
                            </div>
                            {showSuggestions && (
                                <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-auto">
                                    {searching ? (
                                        <div className="p-4 text-center text-gray-500">Searching...</div>
                                    ) : searchResults.length > 0 ? (
                                        searchResults.map(product => (
                                            <div key={product._id} className="p-3 hover:bg-gray-50 cursor-pointer flex items-center justify-between border-b last:border-b-0" onClick={() => handleAddProduct(product)}>
                                                <div className="flex items-center">
                                                    <img src={product.featuredImage || product.image || '/images/placeholder.png'} alt={product.title} className="w-10 h-10 object-cover rounded mr-3" />
                                                    <div>
                                                        <div className="text-sm font-medium">{product.title}</div>
                                                        <div className="text-sm text-pink-600">৳{product.variants?.[0]?.currentPrice || product.basePrice}</div>
                                                    </div>
                                                </div>
                                                <Plus className="h-4 w-4 text-gray-400" />
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-4 text-center text-gray-500">No products found</div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            {items.map((item, index) => (
                                <div key={index} className="flex items-center justify-between border-b pb-4">
                                    <div className="flex items-center flex-1">
                                        <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-lg mr-4" />
                                        <div>
                                            <div className="font-medium text-gray-900">{item.name}</div>
                                            {item.variant && (
                                                <div className="text-sm text-gray-500">
                                                    {item.variant.size && `Size: ${item.variant.size} `}
                                                    {item.variant.color && `Color: ${item.variant.color}`}
                                                </div>
                                            )}
                                            <div className="text-pink-600 font-medium">৳{item.price}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <div className="flex items-center border rounded-lg">
                                            <button type="button" onClick={() => handleQuantityChange(index, -1)} className="p-2 hover:bg-gray-100 cursor-pointer"><Minus className="w-4 h-4" /></button>
                                            <span className="w-12 text-center font-medium">{item.quantity}</span>
                                            <button type="button" onClick={() => handleQuantityChange(index, 1)} className="p-2 hover:bg-gray-100 cursor-pointer"><Plus className="w-4 h-4" /></button>
                                        </div>
                                        <button type="button" onClick={() => handleRemoveItem(index)} className="text-red-500 hover:text-red-700 p-2 cursor-pointer"><Trash2 className="w-5 h-5" /></button>
                                    </div>
                                </div>
                            ))}
                            {items.length === 0 && (
                                <div className="text-center py-6 text-gray-500">No items in order</div>
                            )}
                        </div>
                    </div>

                    {/* Shipping Address */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Delivery Address</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Division *</label>
                                <select name="divisionId" value={formData.divisionId} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500">
                                    <option value="">Select Division</option>
                                    {divisions.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">District *</label>
                                <select name="districtId" value={formData.districtId} onChange={handleInputChange} disabled={!formData.divisionId} className="w-full px-3 py-2 border rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500">
                                    <option value="">Select District</option>
                                    {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </select>
                            </div>
                            {formData.districtId === '65' ? (
                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Area *</label>
                                    <select name="areaId" value={formData.areaId} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500">
                                        <option value="">Select Area</option>
                                        {dhakaAreas.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
                                    </select>
                                </div>
                            ) : (
                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Upazila *</label>
                                    <select name="upazilaId" value={formData.upazilaId} onChange={handleInputChange} disabled={!formData.districtId} className="w-full px-3 py-2 border rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500">
                                        <option value="">Select Upazila</option>
                                        {upazilas.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                    </select>
                                </div>
                            )}
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Street Address *</label>
                                <textarea name="deliveryAddress" value={formData.deliveryAddress} onChange={handleInputChange} rows={3} className="w-full px-3 py-2 border rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500" placeholder="House/Road No, specific details"></textarea>
                            </div>
                        </div>
                    </div>

                    {/* Order Summary & Actions */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Summary</h2>
                        <div className="space-y-2 mb-6">
                            <div className="flex justify-between text-gray-600">
                                <span>Subtotal</span>
                                <span>৳{subtotal}</span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                                <span>Shipping Cost</span>
                                <span>৳{shippingCost}</span>
                            </div>
                            <div className="flex justify-between text-lg font-bold text-gray-900 pt-4 border-t">
                                <span>Total</span>
                                <span>৳{total}</span>
                            </div>
                            <div className="text-sm text-yellow-600 bg-yellow-50 p-3 rounded-lg mt-4">
                                Note: Editing your order will remove any previously applied coupons or loyalty point discounts.
                            </div>
                        </div>

                        <div className="flex justify-end gap-4">
                            <Link href={`/dashboard/my-orders/${params.orderId}`} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium cursor-pointer">Cancel</Link>
                            <button onClick={onSaveClick} disabled={saving || items.length === 0} className="flex items-center px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:bg-pink-400 font-medium cursor-pointer">
                                {saving ? <RefreshCw className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Variant Selection Modal */}
            {selectedProductForVariant && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-lg font-semibold mb-4">Select Options for {selectedProductForVariant.title}</h3>
                        
                        {(() => {
                            const selectedVariantObj = getSelectedVariant();
                            const currentSize = selectedVariantObj?.attributes?.find(a => a.name === 'Size')?.value;

                            return (
                                <>
                                    {uniqueSizes.length > 0 && (
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Select Size</label>
                                            <div className="flex flex-wrap gap-2">
                                                {uniqueSizes.map(size => {
                                                    const isSingleChar = size.length === 1;
                                                    const isSizeSelected = currentSize === size;
                                                    return (
                                                        <button
                                                            key={size}
                                                            onClick={() => {
                                                                const firstVariantOfSize = selectedProductForVariant.variants.find(v => {
                                                                    const sAttr = v.attributes?.find(a => a.name === 'Size');
                                                                    return sAttr && sAttr.value === size;
                                                                });
                                                                if (firstVariantOfSize) setSelectedVariantSku(firstVariantOfSize.sku || firstVariantOfSize._id);
                                                            }}
                                                            className={`rounded-md border-2 transition-all duration-200 flex items-center justify-center font-medium cursor-pointer ${
                                                                isSizeSelected
                                                                    ? 'bg-pink-500 text-white border-pink-500 shadow-sm'
                                                                    : 'border-gray-300 text-gray-700 hover:border-pink-400 hover:bg-pink-50'
                                                            } ${isSingleChar ? 'w-10 h-10 text-base md:text-lg' : 'px-3 py-2 text-sm'}`}
                                                        >
                                                            {size}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {(() => {
                                        const variantsToShow = getAvailableVariantsForSize(currentSize);

                                        return variantsToShow.length > 0 && (
                                            <div className="mb-6">
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Select Variant</label>
                                                <div className="flex flex-wrap gap-2">
                                                    {variantsToShow.map((variant) => {
                                                        const sizeAttr = variant.attributes?.find(attr => attr.name === 'Size');
                                                        const colorAttr = variant.attributes?.find(attr => attr.name === 'Color');

                                                        const isSelected = (variant.sku || variant._id) === selectedVariantSku;

                                                        const variantImage = variant.images && variant.images.length > 0
                                                            ? (variant.images[0]?.url || variant.images[0])
                                                            : (variant.image || selectedProductForVariant?.featuredImage);

                                                        const variantTitle = [
                                                            sizeAttr?.value,
                                                            colorAttr?.value
                                                        ].filter(Boolean).join(' - ') || 'Variant';

                                                        return (
                                                            <button
                                                                key={variant.sku || variant._id}
                                                                onClick={() => setSelectedVariantSku(variant.sku || variant._id)}
                                                                className={`w-12 h-12 rounded-md border-2 transition-all duration-200 flex items-center justify-center cursor-pointer overflow-hidden ${
                                                                    isSelected
                                                                        ? 'border-pink-500 ring-2 ring-pink-200 shadow-sm'
                                                                        : 'border-gray-300 hover:border-pink-400 hover:shadow-sm'
                                                                }`}
                                                                title={variantTitle}
                                                            >
                                                                {variantImage ? (
                                                                    <img
                                                                        src={variantImage}
                                                                        alt={variantTitle}
                                                                        className="w-full h-full object-cover"
                                                                        onError={(e) => {
                                                                            e.target.src = selectedProductForVariant?.featuredImage || '/images/placeholder.png';
                                                                        }}
                                                                    />
                                                                ) : (
                                                                    <div className="w-full h-full bg-gray-200 flex items-center justify-center text-xs text-gray-500">
                                                                        {sizeAttr?.value || colorAttr?.value || 'V'}
                                                                    </div>
                                                                )}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </>
                            );
                        })()}

                        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                            <button onClick={() => setSelectedProductForVariant(null)} className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-50 cursor-pointer">Cancel</button>
                            {(() => {
                                const selectedVariantObj = getSelectedVariant();
                                const isOutOfStock = selectedProductForVariant?.isForceOutOfStock || 
                                                     (selectedVariantObj && selectedVariantObj.stockQuantity <= 0);
                                
                                return (
                                    <button 
                                        onClick={confirmVariantAddition}
                                        disabled={isOutOfStock}
                                        className={`px-4 py-2 text-white rounded-lg ${
                                            isOutOfStock 
                                                ? 'bg-gray-400 cursor-not-allowed' 
                                                : 'bg-pink-600 hover:bg-pink-700 cursor-pointer'
                                        }`}
                                    >
                                        {isOutOfStock ? 'Out of Stock' : 'Add Product'}
                                    </button>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
                                <AlertCircle className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Are you sure?</h3>
                            <p className="text-gray-500 text-sm mb-4">
                                Are you sure you want to confirm these changes? This action cannot be undone.
                            </p>
                            <div className="text-sm text-yellow-700 bg-yellow-50 p-3 rounded-lg mb-6 text-left w-full border border-yellow-200">
                                <strong>Note:</strong> Editing your order will remove any previously applied coupons or loyalty point discounts.
                            </div>
                            <div className="flex w-full gap-3">
                                <button
                                    onClick={() => setShowConfirmModal(false)}
                                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveChanges}
                                    className="flex-1 px-4 py-2 text-white bg-pink-600 hover:bg-pink-700 rounded-lg font-medium transition-colors cursor-pointer"
                                >
                                    Confirm
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
