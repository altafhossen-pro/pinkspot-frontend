'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft,
    Package,
    Calendar,
    User,
    MapPin,
    CreditCard,
    Phone,
    Mail,
    Truck,
    Clock,
    CheckCircle,
    AlertCircle,
    Info,
    DollarSign,
    ShoppingBag,
    FileText,
    Edit3,
    Save,
    X,
    Plus,
    Minus,
    Trash2,
    History,
    Eye
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDateForTable } from '@/utils/formatDate';
import { orderAPI, productAPI } from '@/services/api';
import { getCookie } from 'cookies-next';

export default function OrderEditPage() {
    const params = useParams();
    const router = useRouter();
    const orderId = params.id;

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [products, setProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showProductSearch, setShowProductSearch] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [newItemQuantity, setNewItemQuantity] = useState(1);
    const [newItemPrice, setNewItemPrice] = useState(0);

    // Form states
    const [formData, setFormData] = useState({
        items: [],
        shippingAddress: {},
        billingAddress: {},
        status: '',
        paymentStatus: '',
        paymentMethod: '',
        total: 0,
        shippingCost: 0,
        discount: 0,
        couponDiscount: 0,
        loyaltyDiscount: 0,
        orderNotes: '',
        adminNotes: '',
        // Update reasons
        itemUpdateReason: '',
        addressUpdateReason: '',
        priceUpdateReason: '',
        statusUpdateReason: '',
        paymentUpdateReason: '',
        notesUpdateReason: '',
        adminNotesUpdateReason: ''
    });

    useEffect(() => {
        fetchOrderDetails();
        fetchProducts();
    }, [orderId]);

    const fetchOrderDetails = async () => {
        try {
            setLoading(true);
            const data = await orderAPI.getAdminOrderDetails(orderId);

            if (data.success) {
                setOrder(data.data);
                setFormData({
                    items: data.data.items || [],
                    shippingAddress: data.data.shippingAddress || {},
                    billingAddress: data.data.billingAddress || {},
                    status: data.data.status || '',
                    paymentStatus: data.data.paymentStatus || '',
                    paymentMethod: data.data.paymentMethod || '',
                    total: data.data.total || 0,
                    shippingCost: data.data.shippingCost || 0,
                    discount: data.data.discount || 0,
                    couponDiscount: data.data.couponDiscount || 0,
                    loyaltyDiscount: data.data.loyaltyDiscount || 0,
                    orderNotes: data.data.orderNotes || '',
                    adminNotes: data.data.adminNotes || '',
                    itemUpdateReason: '',
                    addressUpdateReason: '',
                    priceUpdateReason: '',
                    statusUpdateReason: '',
                    paymentUpdateReason: '',
                    notesUpdateReason: '',
                    adminNotesUpdateReason: ''
                });
            } else {
                toast.error('Failed to fetch order details');
                router.push('/admin/dashboard/orders');
            }
        } catch (error) {
            console.error('Error fetching order details:', error);
            toast.error('Error fetching order details');
            router.push('/admin/dashboard/orders');
        } finally {
            setLoading(false);
        }
    };

    const fetchProducts = async () => {
        try {
            const data = await productAPI.getProducts({ limit: 100 });
            if (data.success) {
                setProducts(data.data);
            }
        } catch (error) {
            console.error('Error fetching products:', error);
        }
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleAddressChange = (type, field, value) => {
        setFormData(prev => ({
            ...prev,
            [type]: {
                ...prev[type],
                [field]: value
            }
        }));
    };

    const addNewItem = () => {
        if (!selectedProduct) {
            toast.error('Please select a product');
            return;
        }

        if (newItemQuantity < 1) {
            toast.error('Quantity must be at least 1');
            return;
        }

        if (newItemPrice <= 0) {
            toast.error('Price must be greater than 0');
            return;
        }

        const newItem = {
            product: selectedProduct._id,
            name: selectedProduct.title,
            image: selectedProduct.featuredImage,
            price: newItemPrice,
            quantity: newItemQuantity,
            subtotal: newItemPrice * newItemQuantity,
            variant: selectedVariant ? {
                size: selectedVariant.attributes?.find(attr => attr.name === 'Size')?.value || null,
                color: selectedVariant.attributes?.find(attr => attr.name === 'Color')?.value || null,
                colorHexCode: selectedVariant.attributes?.find(attr => attr.name === 'Color')?.hexCode || null,
                sku: selectedVariant.sku,
                stockQuantity: selectedVariant.stockQuantity,
                stockStatus: selectedVariant.stockStatus
            } : null
        };

        setFormData(prev => ({
            ...prev,
            items: [...prev.items, newItem]
        }));

        // Reset form
        setSelectedProduct(null);
        setSelectedVariant(null);
        setNewItemQuantity(1);
        setNewItemPrice(0);
        setShowProductSearch(false);
        setSearchTerm('');

        toast.success('Item added to order');
    };

    const removeItem = (index) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index)
        }));
        toast.success('Item removed from order');
    };

    const updateItemQuantity = (index, quantity) => {
        if (quantity < 1) return;

        setFormData(prev => ({
            ...prev,
            items: prev.items.map((item, i) =>
                i === index
                    ? { ...item, quantity, subtotal: item.price * quantity }
                    : item
            )
        }));
    };

    const updateItemPrice = (index, price) => {
        if (price < 0) return;

        setFormData(prev => ({
            ...prev,
            items: prev.items.map((item, i) =>
                i === index
                    ? { ...item, price, subtotal: price * item.quantity }
                    : item
            )
        }));
    };

    const calculateTotal = () => {
        const subtotal = formData.items.reduce((sum, item) => sum + item.subtotal, 0);
        const total = subtotal + formData.shippingCost - formData.discount - formData.couponDiscount - formData.loyaltyDiscount;
        return Math.max(0, total);
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const token = getCookie('token');

            const updateData = {
                ...formData,
                total: calculateTotal()
            };

            const response = await orderAPI.updateOrderComprehensive(orderId, updateData, token, { overrideStatus: 'true' });

            if (response.success) {
                toast.success('Order updated successfully');
                router.push(`/admin/dashboard/orders/${orderId}`);
            } else {
                toast.error(response.message || 'Failed to update order');
            }
        } catch (error) {
            console.error('Error updating order:', error);
            toast.error('Error updating order');
        } finally {
            setSaving(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending':
                return 'bg-amber-100 text-amber-800 border-amber-200';
            case 'confirmed':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'processing':
                return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'shipped':
                return 'bg-indigo-100 text-indigo-800 border-indigo-200';
            case 'delivered':
                return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            case 'cancelled':
                return 'bg-red-100 text-red-800 border-red-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getPaymentStatusColor = (status) => {
        switch (status) {
            case 'pending':
                return 'bg-amber-100 text-amber-800 border-amber-200';
            case 'paid':
                return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            case 'failed':
                return 'bg-red-100 text-red-800 border-red-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="flex flex-col items-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
                    <p className="text-slate-600 font-medium">Loading order details...</p>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <Package className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Order Not Found</h2>
                    <p className="text-slate-600">The order you're looking for doesn't exist.</p>
                    <Link
                        href="/admin/dashboard/orders"
                        className="inline-flex items-center px-4 py-2 mt-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Orders
                    </Link>
                </div>
            </div>
        );
    }

    // Check if order can be edited (not returned or cancelled)
    if (order.status === 'returned' || order.status === 'cancelled') {
        return (
            <div className="min-h-screen bg-white ">
                <div className="max-w-3xl mx-auto text-center   p-6">
                    <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                        {order.status === 'returned' ? (
                            <Package className="h-8 w-8 text-red-600" />
                        ) : (
                            <X className="h-8 w-8 text-red-600" />
                        )}
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">
                        Order Cannot Be Edited
                    </h2>
                    <p className="text-slate-600 mb-4">
                        This order has been {order.status === 'returned' ? 'returned' : 'cancelled'} and cannot be modified.
                    </p>
                    <div className="bg-slate-100 rounded-lg p-4 mb-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-slate-600">Order ID:</span>
                            <span className="text-sm font-bold text-slate-900">#{order._id.slice(-8).toUpperCase()}</span>
                        </div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-slate-600">Status:</span>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${order.status === 'returned'
                                    ? 'bg-pink-100 text-pink-800 border-pink-200'
                                    : 'bg-red-100 text-red-800 border-red-200'
                                }`}>
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-600">Customer:</span>
                            <span className="text-sm font-bold text-slate-900">{order.user?.email || 'N/A'}</span>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <Link
                            href={`/admin/dashboard/orders/${orderId}`}
                            className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <Eye className="h-4 w-4 mr-2" />
                            View Order Details
                        </Link>
                        <Link
                            href="/admin/dashboard/orders"
                            className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Orders
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Top Header Bar */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="xl:2xl:max-w-7xl xl:max-w-6xl max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center space-x-4">
                            <Link
                                href={`/admin/dashboard/orders/${orderId}`}
                                className="inline-flex items-center px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all duration-200"
                            >
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Order
                            </Link>
                            <div className="h-6 w-px bg-slate-300"></div>
                            <div>
                                <h1 className="text-xl font-bold text-slate-900 flex items-center">
                                    <Edit3 className="h-5 w-5 mr-2" />
                                    Edit Order #{order._id.slice(-8).toUpperCase()}
                                </h1>
                                <p className="text-sm text-slate-500">
                                    {formatDateForTable(order.createdAt)}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3">
                            <Link
                                href={`/admin/dashboard/orders/${orderId}`}
                                className="inline-flex items-center px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors text-sm font-medium"
                            >
                                <Eye className="h-4 w-4 mr-2" />
                                View Order
                            </Link>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${saving
                                        ? 'bg-gray-400 cursor-not-allowed text-white'
                                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                                    }`}
                            >
                                <Save className="h-4 w-4 mr-2" />
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="xl:2xl:max-w-7xl xl:max-w-6xl max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    {/* Left Column - Order Items */}
                    <div className="xl:col-span-2 space-y-8">
                        {/* Order Items */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-xl font-bold text-slate-900 flex items-center">
                                    <ShoppingBag className="h-6 w-6 mr-3 text-blue-600" />
                                    Order Items
                                </h2>
                                <button
                                    onClick={() => setShowProductSearch(true)}
                                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Item
                                </button>
                            </div>

                            <div className="space-y-6">
                                {formData.items.map((item, index) => (
                                    <div key={index} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-start space-x-6">
                                            <div className="relative flex-shrink-0">
                                                <img
                                                    src={item.image}
                                                    alt={item.name}
                                                    className="h-20 w-20 rounded-lg object-cover border border-gray-200"
                                                />
                                                <div className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                                                    {item.quantity}
                                                </div>
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                                                    {item.name}
                                                </h3>

                                                {/* Editable Fields */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Quantity
                                                        </label>
                                                        <input
                                                            type="number"
                                                            value={item.quantity}
                                                            onChange={(e) => updateItemQuantity(index, parseInt(e.target.value) || 1)}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                                            min="1"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Unit Price (৳)
                                                        </label>
                                                        <input
                                                            type="number"
                                                            value={item.price}
                                                            onChange={(e) => updateItemPrice(index, parseFloat(e.target.value) || 0)}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                                            min="0"
                                                            step="0.01"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Variant Information */}
                                                {item.variant && (
                                                    <div className="flex flex-wrap gap-2 mb-4">
                                                        {item.variant.size && (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                                                Size: {item.variant.size}
                                                            </span>
                                                        )}
                                                        {item.variant.color && (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800">
                                                                <div
                                                                    className="w-3 h-3 rounded-full mr-1 border border-white"
                                                                    style={{ backgroundColor: item.variant.colorHexCode }}
                                                                ></div>
                                                                {item.variant.color}
                                                            </span>
                                                        )}
                                                        {item.variant.sku && (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 font-mono">
                                                                SKU: {item.variant.sku}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex-shrink-0 text-right">
                                                <div className="bg-gray-50 rounded-lg p-4 mb-3">
                                                    <p className="text-2xl font-bold text-gray-900">
                                                        ৳{item.subtotal}
                                                    </p>
                                                    <p className="text-sm text-gray-500">Subtotal</p>
                                                </div>
                                                <button
                                                    onClick={() => removeItem(index)}
                                                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                                                >
                                                    <Trash2 className="h-4 w-4 mr-1" />
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {formData.items.length === 0 && (
                                    <div className="text-center py-12">
                                        <ShoppingBag className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                                        <h3 className="text-lg font-medium text-slate-900 mb-2">No items in order</h3>
                                        <p className="text-slate-500 mb-4">Add items to this order to get started.</p>
                                        <button
                                            onClick={() => setShowProductSearch(true)}
                                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add First Item
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Order Notes */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
                                <FileText className="h-6 w-6 mr-3 text-blue-600" />
                                Order Notes
                            </h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Customer Notes
                                    </label>
                                    <textarea
                                        value={formData.orderNotes}
                                        onChange={(e) => handleInputChange('orderNotes', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        rows="3"
                                        placeholder="Customer notes or special instructions..."
                                    />
                                    <input
                                        type="text"
                                        value={formData.notesUpdateReason}
                                        onChange={(e) => handleInputChange('notesUpdateReason', e.target.value)}
                                        className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Reason for notes update (optional)"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Admin Notes
                                    </label>
                                    <textarea
                                        value={formData.adminNotes}
                                        onChange={(e) => handleInputChange('adminNotes', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        rows="3"
                                        placeholder="Internal admin notes..."
                                    />
                                    <input
                                        type="text"
                                        value={formData.adminNotesUpdateReason}
                                        onChange={(e) => handleInputChange('adminNotesUpdateReason', e.target.value)}
                                        className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Reason for admin notes update (optional)"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Order Details */}
                    <div className="space-y-8">
                        {/* Order Status & Payment */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
                                <CheckCircle className="h-6 w-6 mr-3 text-emerald-600" />
                                Order Status & Payment
                            </h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Order Status
                                    </label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => handleInputChange('status', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="confirmed">Confirmed</option>
                                        <option value="processing">Processing</option>
                                        <option value="shipped">Shipped</option>
                                        <option value="delivered">Delivered</option>
                                        <option value="cancelled">Cancelled</option>
                                        <option value="returned">Returned</option>
                                    </select>
                                    <input
                                        type="text"
                                        value={formData.statusUpdateReason}
                                        onChange={(e) => handleInputChange('statusUpdateReason', e.target.value)}
                                        className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Reason for status change (optional)"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Payment Status
                                    </label>
                                    <select
                                        value={formData.paymentStatus}
                                        onChange={(e) => handleInputChange('paymentStatus', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="paid">Paid</option>
                                        <option value="failed">Failed</option>
                                        <option value="refunded">Refunded</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Payment Method
                                    </label>
                                    <select
                                        value={formData.paymentMethod}
                                        onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="cod">Cash on Delivery</option>
                                        <option value="card">Credit/Debit Card</option>
                                        <option value="bkash">bKash</option>
                                        <option value="nagad">Nagad</option>
                                        <option value="rocket">Rocket</option>
                                    </select>
                                    <input
                                        type="text"
                                        value={formData.paymentUpdateReason}
                                        onChange={(e) => handleInputChange('paymentUpdateReason', e.target.value)}
                                        className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Reason for payment change (optional)"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Pricing */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                                <DollarSign className="h-5 w-5 mr-2 text-emerald-600" />
                                Order Pricing
                            </h2>

                            <div className="space-y-4">
                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Shipping Cost (৳)
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.shippingCost}
                                            onChange={(e) => handleInputChange('shippingCost', parseFloat(e.target.value) || 0)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                            min="0"
                                            step="0.01"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            General Discount (৳)
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.discount}
                                            onChange={(e) => handleInputChange('discount', parseFloat(e.target.value) || 0)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                            min="0"
                                            step="0.01"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Coupon Discount (৳)
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.couponDiscount}
                                            onChange={(e) => handleInputChange('couponDiscount', parseFloat(e.target.value) || 0)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                            min="0"
                                            step="0.01"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Loyalty Points Discount (৳)
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.loyaltyDiscount}
                                            onChange={(e) => handleInputChange('loyaltyDiscount', parseFloat(e.target.value) || 0)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                            min="0"
                                            step="0.01"
                                        />
                                    </div>
                                </div>

                                {/* Total Display */}
                                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                    <div className="flex justify-between items-center">
                                        <span className="text-lg font-semibold text-gray-900">Order Total</span>
                                        <span className="text-2xl font-bold text-gray-900">৳{calculateTotal()}</span>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        Items: ৳{formData.items.reduce((sum, item) => sum + item.subtotal, 0)} +
                                        Shipping: ৳{formData.shippingCost} -
                                        Discounts: ৳{(formData.discount || 0) + (formData.couponDiscount || 0) + (formData.loyaltyDiscount || 0)}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Reason for Price Changes
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.priceUpdateReason}
                                        onChange={(e) => handleInputChange('priceUpdateReason', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                        placeholder="Optional: Explain why prices were modified"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Shipping Address */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                                <MapPin className="h-5 w-5 mr-2 text-red-600" />
                                Shipping Address
                            </h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Street Address
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.shippingAddress.street || ''}
                                        onChange={(e) => handleAddressChange('shippingAddress', 'street', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                        placeholder="Enter street address"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            City
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.shippingAddress.city || ''}
                                            onChange={(e) => handleAddressChange('shippingAddress', 'city', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                            placeholder="City"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            State/Division
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.shippingAddress.state || ''}
                                            onChange={(e) => handleAddressChange('shippingAddress', 'state', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                            placeholder="State/Division"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Postal Code
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.shippingAddress.postalCode || ''}
                                            onChange={(e) => handleAddressChange('shippingAddress', 'postalCode', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                            placeholder="Postal code"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Country
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.shippingAddress.country || ''}
                                            onChange={(e) => handleAddressChange('shippingAddress', 'country', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                            placeholder="Country"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Reason for Address Change
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.addressUpdateReason}
                                        onChange={(e) => handleInputChange('addressUpdateReason', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                        placeholder="Optional: Explain why address was modified"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Product Search Modal */}
            {showProductSearch && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[80vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-medium text-gray-900">Add Product to Order</h3>
                            <button
                                onClick={() => setShowProductSearch(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="mb-4">
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                            {products
                                .filter(product =>
                                    product.title.toLowerCase().includes(searchTerm.toLowerCase())
                                )
                                .map(product => (
                                    <div
                                        key={product._id}
                                        onClick={() => {
                                            setSelectedProduct(product);
                                            setNewItemPrice(product.priceRange?.min || 0);
                                        }}
                                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${selectedProduct?._id === product._id
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <img
                                            src={product.featuredImage}
                                            alt={product.title}
                                            className="w-full h-32 object-cover rounded-md mb-2"
                                        />
                                        <h4 className="font-medium text-gray-900">{product.title}</h4>
                                        <p className="text-sm text-gray-500">৳{product.priceRange?.min || 0}</p>
                                    </div>
                                ))}
                        </div>

                        {selectedProduct && (
                            <div className="border-t pt-6">
                                <h4 className="font-medium text-gray-900 mb-4">Product Details</h4>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Quantity
                                        </label>
                                        <input
                                            type="number"
                                            value={newItemQuantity}
                                            onChange={(e) => setNewItemQuantity(parseInt(e.target.value) || 1)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            min="1"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Price (৳)
                                        </label>
                                        <input
                                            type="number"
                                            value={newItemPrice}
                                            onChange={(e) => setNewItemPrice(parseFloat(e.target.value) || 0)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            min="0"
                                            step="0.01"
                                        />
                                    </div>
                                </div>

                                {selectedProduct.variants && selectedProduct.variants.length > 0 && (
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Variant
                                        </label>
                                        <select
                                            value={selectedVariant?._id || ''}
                                            onChange={(e) => {
                                                const variant = selectedProduct.variants.find(v => v._id === e.target.value);
                                                setSelectedVariant(variant);
                                                if (variant) {
                                                    setNewItemPrice(variant.currentPrice || 0);
                                                }
                                            }}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="">Select variant</option>
                                            {selectedProduct.variants.map(variant => (
                                                <option key={variant._id} value={variant._id}>
                                                    {variant.attributes?.map(attr => `${attr.name}: ${attr.value}`).join(', ')} - ৳{variant.currentPrice}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div className="flex justify-end space-x-3">
                                    <button
                                        onClick={() => setShowProductSearch(false)}
                                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={addNewItem}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                                    >
                                        Add to Order
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
