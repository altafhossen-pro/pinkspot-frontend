'use client'

import React, { useState, useEffect } from 'react'
import { X, Search, ShieldOff, CheckSquare, Square, ChevronLeft, ChevronRight } from 'lucide-react'
import { productAPI } from '@/services/api'
import toast from 'react-hot-toast'
import { getCookie } from 'cookies-next'

export default function CategoryExclusionModal({ isOpen, onClose, categoryId, categoryName }) {
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')
    const [saving, setSaving] = useState(false)

    // Pagination
    const [page, setPage] = useState(1)
    const [limit] = useState(10)
    const [total, setTotal] = useState(0)
    const [totalPages, setTotalPages] = useState(1)

    // Track explicitly added and removed exclusions to handle cross-page bulk operations safely
    const [addedExclusions, setAddedExclusions] = useState(new Set())
    const [removedExclusions, setRemovedExclusions] = useState(new Set())

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm)
            setPage(1) // Reset page on new search
        }, 500)
        return () => clearTimeout(timer)
    }, [searchTerm])

    useEffect(() => {
        if (isOpen && categoryId) {
            fetchProducts()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, categoryId, page, limit, debouncedSearch])

    const fetchProducts = async () => {
        try {
            setLoading(true)
            const token = getCookie('token')
            // Fetch products for this category with pagination and search
            const response = await productAPI.getAdminProducts({
                category: categoryId,
                page: page,
                limit: limit,
                search: debouncedSearch
            }, token)

            if (response.success) {
                setProducts(response.data)
                setTotal(response.pagination?.total || 0)
                setTotalPages(response.pagination?.totalPages || 1)
            } else {
                toast.error('Failed to fetch products')
            }
        } catch (error) {
            console.error('Error fetching products:', error)
            toast.error('Error fetching products')
        } finally {
            setLoading(false)
        }
    }

    const isProductExcluded = (product) => {
        const isInitiallyExcluded = product.excludeFromCategoryDiscount;
        if (addedExclusions.has(product._id)) return true;
        if (removedExclusions.has(product._id)) return false;
        return isInitiallyExcluded;
    }

    const toggleExclusion = (product) => {
        const currentlyExcluded = isProductExcluded(product);
        const id = product._id;

        if (currentlyExcluded) {
            // Include it
            setAddedExclusions(prev => {
                const next = new Set(prev)
                next.delete(id)
                return next
            })
            setRemovedExclusions(prev => {
                const next = new Set(prev)
                next.add(id)
                return next
            })
        } else {
            // Exclude it
            setRemovedExclusions(prev => {
                const next = new Set(prev)
                next.delete(id)
                return next
            })
            setAddedExclusions(prev => {
                const next = new Set(prev)
                next.add(id)
                return next
            })
        }
    }

    const handleSelectAll = () => {
        // Includes all on CURRENT page
        const newAdded = new Set(addedExclusions)
        const newRemoved = new Set(removedExclusions)
        products.forEach(p => {
            newAdded.delete(p._id)
            newRemoved.add(p._id)
        })
        setAddedExclusions(newAdded)
        setRemovedExclusions(newRemoved)
    }

    const handleDeselectAll = () => {
        // Excludes all on CURRENT page
        const newAdded = new Set(addedExclusions)
        const newRemoved = new Set(removedExclusions)
        products.forEach(p => {
            newRemoved.delete(p._id)
            newAdded.add(p._id)
        })
        setAddedExclusions(newAdded)
        setRemovedExclusions(newRemoved)
    }

    const handleSave = async () => {
        try {
            setSaving(true)
            const token = getCookie('token')

            const excludedArray = Array.from(addedExclusions)
            const includedArray = Array.from(removedExclusions)

            // If no changes, just close
            if (excludedArray.length === 0 && includedArray.length === 0) {
                onClose()
                return
            }

            const response = await productAPI.bulkExcludeCategoryDiscount({
                categoryId,
                excludedProductIds: excludedArray,
                includedProductIds: includedArray
            }, token)

            if (response.success) {
                toast.success('Exclusions updated successfully')
                onClose()
            } else {
                toast.error(response.message || 'Failed to update exclusions')
            }
        } catch (error) {
            console.error('Error saving exclusions:', error)
            toast.error('Error saving exclusions')
        } finally {
            setSaving(false)
        }
    }

    const getPriceDisplay = (product) => {
        const formatPrice = (p) => Number(Number(p).toFixed(2));
        
        if (product.variants && product.variants.length > 0) {
            const prices = product.variants.map(v => v.currentPrice || v.salePrice || v.originalPrice || 0)
            const minPrice = formatPrice(Math.min(...prices))
            const maxPrice = formatPrice(Math.max(...prices))
            return minPrice === maxPrice ? `৳${minPrice}` : `৳${minPrice} - ৳${maxPrice}`
        }
        
        if (product.priceRange?.min != null && product.priceRange?.max != null) {
            const minPrice = formatPrice(product.priceRange.min)
            const maxPrice = formatPrice(product.priceRange.max)
            return minPrice === maxPrice ? `৳${minPrice}` : `৳${minPrice} - ৳${maxPrice}`
        }

        return `৳${formatPrice(product.basePrice || product.salePrice || product.regularPrice || product.price || 0)}`
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

            {/* Modal Content */}
            <div className="relative bg-white w-full max-w-5xl mx-4 rounded-2xl shadow-[0_20px_50px_rgba(8,_112,_184,_0.07)] overflow-hidden flex flex-col max-h-[90vh] ring-1 ring-black/5">

                {/* Header */}
                <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100 bg-white">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800 flex items-center tracking-tight">
                            <ShieldOff className="w-5 h-5 mr-2 text-orange-500" />
                            Category Discount Exclusion
                        </h3>
                        <p className="text-sm text-gray-500 mt-1.5 font-medium">
                            Category: <span className="font-semibold text-gray-800 bg-gray-100 px-2 py-0.5 rounded-md ml-1">{categoryName}</span>
                        </p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 flex-1 overflow-y-auto">
                    <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="relative w-full sm:max-w-xs">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
                            <button
                                onClick={handleSelectAll}
                                className="text-blue-600 hover:text-blue-800 font-medium flex items-center text-sm"
                            >
                                <CheckSquare className="w-4 h-4 mr-1" />
                                Include Page
                            </button>
                            <button
                                onClick={handleDeselectAll}
                                className="text-orange-600 hover:text-orange-800 font-medium flex items-center text-sm"
                            >
                                <Square className="w-4 h-4 mr-1" />
                                Exclude Page
                            </button>
                        </div>
                    </div>

                    <div className="bg-gray-50/50 shadow-sm border border-gray-100 rounded-xl overflow-hidden h-[45vh] min-h-[350px] flex flex-col">
                        {loading ? (
                            <div className="flex justify-center items-center h-full p-6">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            </div>
                        ) : (
                            <div className="overflow-y-auto flex-1">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-gray-200">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                                                Include
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Product
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                                                Price
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {products.length === 0 ? (
                                            <tr>
                                                <td colSpan="3" className="px-6 py-8 text-center text-gray-500">
                                                    No products found.
                                                </td>
                                            </tr>
                                        ) : (
                                            products.map((product) => {
                                                const isExcluded = isProductExcluded(product);
                                                const isIncluded = !isExcluded;
                                                return (
                                                    <tr
                                                        key={product._id}
                                                        className={`hover:bg-blue-50/30 transition-colors cursor-pointer ${!isIncluded ? 'bg-orange-50/30' : ''}`}
                                                        onClick={() => toggleExclusion(product)}
                                                    >
                                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                                            <input
                                                                type="checkbox"
                                                                checked={isIncluded}
                                                                onChange={() => { }} // Handled by tr click
                                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                                                            />
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center">
                                                                <div className="h-10 w-10 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden relative border border-gray-200">
                                                                    {(product.featuredImage || product.gallery?.[0]?.url || product.images?.[0]?.url) ? (
                                                                        /* eslint-disable-next-line @next/next/no-img-element */
                                                                        <img 
                                                                            src={product.featuredImage || product.gallery?.[0]?.url || product.images?.[0]?.url} 
                                                                            alt={product.title || 'Product'} 
                                                                            className="h-full w-full object-cover"
                                                                        />
                                                                    ) : (
                                                                        <div className="h-full w-full flex items-center justify-center text-gray-400 text-xs font-medium">
                                                                            No Img
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="ml-4">
                                                                    <div className="text-sm font-medium text-gray-900">{product.title}</div>
                                                                    <div className="text-xs text-gray-500">
                                                                        {product.brand ? `Brand: ${product.brand} • ` : ''}
                                                                        {isIncluded ? (
                                                                            <span className="text-green-600">Included in discount</span>
                                                                        ) : (
                                                                            <span className="text-orange-600 font-medium">Excluded from discount</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm text-gray-900 font-medium">
                                                                {getPriceDisplay(product)}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Pagination Footer */}
                        <div className="bg-white px-4 py-3 border-t border-gray-100 flex items-center justify-between sm:px-6 mt-auto">
                            <div className="flex-1 flex justify-between sm:hidden">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages || totalPages === 0}
                                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </div>
                            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-sm text-gray-700">
                                        Showing <span className="font-medium">{total === 0 ? 0 : (page - 1) * limit + 1}</span> to{' '}
                                        <span className="font-medium">{Math.min(page * limit, total)}</span> of{' '}
                                        <span className="font-medium">{total}</span> results
                                    </p>
                                </div>
                                <div>
                                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                        <button
                                            onClick={() => setPage(p => Math.max(1, p - 1))}
                                            disabled={page === 1}
                                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                        >
                                            <span className="sr-only">Previous</span>
                                            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                                        </button>
                                        <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                                            Page {page} of {totalPages || 1}
                                        </span>
                                        <button
                                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                            disabled={page === totalPages || totalPages === 0}
                                            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                        >
                                            <span className="sr-only">Next</span>
                                            <ChevronRight className="h-5 w-5" aria-hidden="true" />
                                        </button>
                                    </nav>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex flex-row-reverse rounded-b-2xl gap-3">
                    <button
                        type="button"
                        disabled={loading || saving}
                        className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        onClick={handleSave}
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                        type="button"
                        className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    )
}
