'use client';

import React, { useState, useEffect } from 'react';
import { Package, Calendar, Mail, ArrowLeft, Eye, User, Phone, MapPin, Search, ShieldAlert, ShieldBan, X, Info } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { formatDateForTable } from '@/utils/formatDate';
import { orderAPI, settingsAPI, blocklistAPI } from '@/services/api';
import { getCookie } from 'cookies-next';
import PermissionDenied from '@/components/Common/PermissionDenied';
import { useAppContext } from '@/context/AppContext';

export default function OrderHistoryPage() {
    const params = useParams();
    const identifier = params?.identifier ? decodeURIComponent(params.identifier) : '';
    const { hasPermission, loading: contextLoading } = useAppContext();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [permissionError, setPermissionError] = useState(null);
    const [settings, setSettings] = useState(null);
    const [orderSourceColors, setOrderSourceColors] = useState({});

    // Blocklist states
    const [blockedEntities, setBlockedEntities] = useState([]);
    const [blockModalOpen, setBlockModalOpen] = useState(false);
    const [entityToBlock, setEntityToBlock] = useState({ type: '', value: '' });
    const [blockReason, setBlockReason] = useState('');
    const [responseMsg, setResponseMsg] = useState('');
    const [blockDays, setBlockDays] = useState('');
    const [isPermanent, setIsPermanent] = useState(true);
    const [blocking, setBlocking] = useState(false);

    const [unblockModalOpen, setUnblockModalOpen] = useState(false);
    const [unblocking, setUnblocking] = useState(false);

    // Filter states
    const [filters, setFilters] = useState({
        status: 'all',
        startDate: '',
        endDate: '',
        orderSource: 'all',
        dateRange: 'custom'
    });

    // Pagination states
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 10,
        hasNextPage: false,
        hasPrevPage: false
    });

    useEffect(() => {
        if (!contextLoading) {
            if (!hasPermission('order', 'read')) {
                setPermissionError({
                    message: "You don't have permission to view orders.",
                    action: 'Read Orders'
                });
                setLoading(false);
            } else {
                fetchSettings();
            }
        }
    }, [contextLoading, hasPermission]);

    const fetchSettings = async () => {
        try {
            const data = await settingsAPI.getSettings();
            if (data.success && data.data) {
                setSettings(data.data);
                if (data.data.orderSourceColors) {
                    setOrderSourceColors(data.data.orderSourceColors);
                }
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
        }
    };

    const fetchBlockedEntities = async () => {
        try {
            const token = getCookie('token');
            const res = await blocklistAPI.getAllBlocks(token);
            if (res.success) {
                setBlockedEntities(res.data);
            }
        } catch (error) {
            console.error('Error fetching blocklist:', error);
        }
    };

    useEffect(() => {
        if (!contextLoading && hasPermission('order', 'read')) {
            fetchBlockedEntities();
        }
    }, [contextLoading, hasPermission]);

    useEffect(() => {
        if (contextLoading || !hasPermission('order', 'read') || !identifier) return;

        const timeoutId = setTimeout(() => {
            fetchOrders();
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [contextLoading, hasPermission, identifier, pagination.currentPage, pagination.itemsPerPage, filters.status, filters.startDate, filters.endDate, filters.orderSource]);

    const fetchOrders = async () => {
        try {
            const token = getCookie('token');
            setLoading(true);

            const searchParams = new URLSearchParams({
                page: pagination.currentPage.toString(),
                limit: pagination.itemsPerPage.toString(),
                search: identifier
            });

            if (filters.status && filters.status !== 'all') {
                searchParams.append('status', filters.status);
            }
            if (filters.orderSource && filters.orderSource !== 'all') {
                searchParams.append('orderSource', filters.orderSource);
            }
            if (filters.startDate) {
                searchParams.append('startDate', filters.startDate);
            }
            if (filters.endDate) {
                searchParams.append('endDate', filters.endDate);
            }

            const data = await orderAPI.getAdminOrders(token, searchParams.toString());

            if (data.success) {
                setOrders(data.data);
                setPermissionError(null);

                if (data.pagination) {
                    setPagination(prev => ({
                        ...prev,
                        ...data.pagination
                    }));
                }
            } else {
                toast.error(data.message || 'Failed to fetch orders');
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
            toast.error('Error fetching orders');
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));

        if (key === 'status' || key === 'orderSource' || key === 'dateRange') {
            setPagination(prev => ({ ...prev, currentPage: 1 }));
        }
    };

    const handleDateRangeChange = (range) => {
        const today = new Date();
        let start = '';
        let end = today.toISOString().split('T')[0];

        switch (range) {
            case 'today':
                start = end;
                break;
            case 'yesterday':
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                start = yesterday.toISOString().split('T')[0];
                end = start;
                break;
            case 'last7days':
                const last7 = new Date(today);
                last7.setDate(last7.getDate() - 7);
                start = last7.toISOString().split('T')[0];
                break;
            case 'last15days':
                const last15 = new Date(today);
                last15.setDate(last15.getDate() - 15);
                start = last15.toISOString().split('T')[0];
                break;
            case 'lastmonth':
                const lastMonth = new Date(today);
                lastMonth.setMonth(lastMonth.getMonth() - 1);
                start = lastMonth.toISOString().split('T')[0];
                break;
            case 'last6months':
                const last6Months = new Date(today);
                last6Months.setMonth(last6Months.getMonth() - 6);
                start = last6Months.toISOString().split('T')[0];
                break;
            case 'lastyear':
                const lastYear = new Date(today);
                lastYear.setFullYear(lastYear.getFullYear() - 1);
                start = lastYear.toISOString().split('T')[0];
                break;
            default:
                start = '';
                end = '';
        }

        setFilters(prev => ({
            ...prev,
            startDate: start,
            endDate: end,
            dateRange: range
        }));
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    };

    const clearFilters = () => {
        setFilters({
            status: 'all',
            startDate: '',
            endDate: '',
            orderSource: 'all',
            dateRange: 'custom'
        });
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'confirmed': return 'bg-blue-100 text-blue-800';
            case 'processing': return 'bg-purple-100 text-purple-800';
            case 'shipped': return 'bg-indigo-100 text-indigo-800';
            case 'delivered': return 'bg-green-100 text-green-800';
            case 'cancelled': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getPaymentStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'paid': return 'bg-green-100 text-green-800';
            case 'failed': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getOrderSourceLabel = (source) => {
        if (!source) return 'N/A';
        const labels = {
            'website': 'Website', 'facebook': 'Facebook', 'whatsapp': 'WhatsApp',
            'phone': 'Phone Call', 'email': 'Email', 'walk-in': 'Walk-in',
            'instagram': 'Instagram', 'manual': 'Manual', 'other': 'Other'
        };
        return labels[source] || source;
    };

    const isBlocked = (type, value) => {
        if (!value || value === 'N/A') return false;
        return blockedEntities.some(b => b.type === type && b.value === value);
    };

    const handleOpenBlockModal = (type, value) => {
        setEntityToBlock({ type, value });
        setBlockReason('');
        setIsPermanent(true);
        setBlockDays('');
        setBlockModalOpen(true);
    };

    const handleBlockSubmit = async (e) => {
        e.preventDefault();
        setBlocking(true);
        try {
            const token = getCookie('token');
            const data = {
                type: entityToBlock.type,
                value: entityToBlock.value,
                reason: blockReason,
                responseMsg: responseMsg,
                isPermanent,
                days: isPermanent ? null : parseInt(blockDays)
            };
            const res = await blocklistAPI.blockEntity(data, token);
            if (res.success) {
                toast.success(res.message);
                setBlockModalOpen(false);
                fetchBlockedEntities();
            } else {
                toast.error(res.message || 'Failed to block');
            }
        } catch (error) {
            toast.error(error.message || 'Error blocking entity');
        } finally {
            setBlocking(false);
        }
    };

    const handleOpenUnblockModal = (type, value) => {
        setEntityToBlock({ type, value });
        setUnblockModalOpen(true);
    };

    const handleUnblockConfirm = async () => {
        setUnblocking(true);
        try {
            const token = getCookie('token');
            const res = await blocklistAPI.unblockEntity(entityToBlock.value, token);
            if (res.success) {
                toast.success(res.message);
                setUnblockModalOpen(false);
                fetchBlockedEntities();
            } else {
                toast.error(res.message || 'Failed to unblock');
            }
        } catch (error) {
            toast.error(error.message || 'Error unblocking entity');
        } finally {
            setUnblocking(false);
        }
    };

    const getCustomerProfile = () => {
        if (orders.length === 0) return null;
        const latestOrder = orders[0];

        let name = 'N/A';
        let phone = 'N/A';
        let email = 'N/A';
        let address = 'N/A';

        if (latestOrder.user && typeof latestOrder.user === 'object') {
            name = latestOrder.user.name || `${latestOrder.user.firstName || ''} ${latestOrder.user.lastName || ''}`.trim() || 'N/A';
            phone = latestOrder.user.phone || latestOrder.user.phoneNumber || 'N/A';
            email = latestOrder.user.email || 'N/A';
        }

        let shippingPhone = latestOrder.shippingAddress?.phone || latestOrder.guestInfo?.phone || latestOrder.manualOrderInfo?.phone || 'N/A';

        if (name === 'N/A' || name === '') {
            name = latestOrder.guestInfo?.name || latestOrder.manualOrderInfo?.name || latestOrder.shippingAddress?.name || 'N/A';
        }
        
        if (phone === 'N/A' || phone === '') {
            phone = shippingPhone;
            shippingPhone = 'N/A';
        } else if (phone === shippingPhone) {
            shippingPhone = 'N/A';
        }

        if (email === 'N/A' || email === '') {
            email = latestOrder.guestInfo?.email || 'N/A';
        }

        const addr = latestOrder.shippingAddress;
        if (addr) {
            address = `${addr.street || addr.address || ''}, ${addr.area || ''}, ${addr.upazila || ''}, ${addr.district || ''}`.replace(/(^[,\s]+)|([,\s]+$)/g, '');
        }

        return { name, phone, shippingPhone, email, address };
    };

    if (permissionError) {
        return <PermissionDenied message={permissionError.message} action={permissionError.action} />;
    }

    const customerProfile = getCustomerProfile();

    return (
        <div className="p-6">
            <div className="flex items-center gap-4 mb-6">
                <Link href="/admin/dashboard/orders" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft className="h-5 w-5 text-gray-600" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Order History</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Displaying all orders for: <span className="font-semibold text-gray-800">{identifier}</span>
                    </p>
                </div>
            </div>

            {/* Customer Profile Card */}
            {customerProfile && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Customer Profile</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-blue-50 rounded-full">
                                <User className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-gray-500 uppercase">Name</p>
                                <p className="text-sm font-medium text-gray-900 mt-1">{customerProfile.name}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-green-50 rounded-full">
                                <Phone className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</p>
                                <div className="mt-1 flex flex-wrap items-center gap-y-2">
                                    <p className="text-sm font-medium text-gray-900">{customerProfile.phone}</p>
                                    {customerProfile.phone && customerProfile.phone !== 'N/A' && (
                                        isBlocked('phone', customerProfile.phone) ? (
                                            <button
                                                onClick={() => handleOpenUnblockModal('phone', customerProfile.phone)}
                                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-700 hover:bg-red-200 border border-red-300 transition-colors cursor-pointer shadow-sm ml-2"
                                                title="Click to Unblock"
                                            >
                                                <ShieldBan className="h-3.5 w-3.5" /> Blocked (Unblock)
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleOpenBlockModal('phone', customerProfile.phone)}
                                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200 transition-colors cursor-pointer ml-2"
                                                title="Block this Phone"
                                            >
                                                <ShieldAlert className="h-3.5 w-3.5" /> Block
                                            </button>
                                        )
                                    )}
                                </div>
                                {customerProfile.shippingPhone && customerProfile.shippingPhone !== 'N/A' && (
                                    <div className="mt-2 pt-2 border-t border-gray-100 flex flex-wrap items-center gap-y-2">
                                        <p className="text-xs font-medium text-gray-500 mr-2">Shipping:</p>
                                        <p className="text-sm font-medium text-gray-900">{customerProfile.shippingPhone}</p>
                                        {isBlocked('phone', customerProfile.shippingPhone) ? (
                                            <button
                                                onClick={() => handleOpenUnblockModal('phone', customerProfile.shippingPhone)}
                                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-700 hover:bg-red-200 border border-red-300 transition-colors cursor-pointer shadow-sm ml-2"
                                                title="Click to Unblock"
                                            >
                                                <ShieldBan className="h-3.5 w-3.5" /> Blocked (Unblock)
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleOpenBlockModal('phone', customerProfile.shippingPhone)}
                                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200 transition-colors cursor-pointer ml-2"
                                                title="Block Shipping Phone"
                                            >
                                                <ShieldAlert className="h-3.5 w-3.5" /> Block
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-purple-50 rounded-full">
                                <Mail className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-gray-500 uppercase">Email</p>
                                <p className="text-sm font-medium text-gray-900 mt-1">{customerProfile.email}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-orange-50 rounded-full">
                                <MapPin className="h-5 w-5 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-gray-500 uppercase">Latest Address</p>
                                <p className="text-sm font-medium text-gray-900 mt-1">{customerProfile.address || 'N/A'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {/* Order Source Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Order Source
                        </label>
                        <select
                            value={filters.orderSource}
                            onChange={(e) => handleFilterChange('orderSource', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        >
                            <option value="all">All Sources</option>
                            <option value="website">Website</option>
                            <option value="facebook">Facebook</option>
                            <option value="whatsapp">WhatsApp</option>
                            <option value="phone">Phone Call</option>
                            <option value="email">Email</option>
                            <option value="walk-in">Walk-in</option>
                            <option value="instagram">Instagram</option>
                            <option value="manual">Manual</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    {/* Status Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Order Status
                        </label>
                        <select
                            value={filters.status}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>

                    {/* Quick Date Range Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Date Range
                        </label>
                        <select
                            value={filters.dateRange || 'custom'}
                            onChange={(e) => handleDateRangeChange(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        >
                            <option value="custom">Custom</option>
                            <option value="today">Today</option>
                            <option value="yesterday">Yesterday</option>
                            <option value="last7days">Last 7 Days</option>
                            <option value="last15days">Last 15 Days</option>
                            <option value="lastmonth">Last Month</option>
                            <option value="last6months">Last 6 Months</option>
                            <option value="lastyear">Last Year</option>
                        </select>
                    </div>

                    {/* Start Date Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Start Date
                        </label>
                        <input
                            type="date"
                            value={filters.startDate}
                            onChange={(e) => {
                                handleFilterChange('startDate', e.target.value);
                                setPagination(prev => ({ ...prev, currentPage: 1 }));
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                    </div>

                    {/* End Date Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            End Date
                        </label>
                        <input
                            type="date"
                            value={filters.endDate}
                            onChange={(e) => {
                                handleFilterChange('endDate', e.target.value);
                                setPagination(prev => ({ ...prev, currentPage: 1 }));
                            }}
                            min={filters.startDate || undefined}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                    </div>
                </div>

                {/* Clear Filters Button */}
                <div className="mt-4 flex justify-end">
                    <button
                        onClick={clearFilters}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors cursor-pointer"
                    >
                        Clear Filters
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Package className="h-5 w-5 text-blue-600" />
                        <span className="font-semibold text-gray-800">Total Orders: {pagination.totalItems}</span>
                    </div>
                </div>

                {loading || contextLoading ? (
                    <div className="p-8 text-center">
                        <div className="flex items-center justify-center space-x-2">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <span className="text-gray-600">Loading history...</span>
                        </div>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="p-8 text-center">
                        <Package className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No orders found</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            We couldn't find any orders matching this email or phone number.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {orders.map((order) => (
                                    <tr
                                        key={order._id}
                                        className="hover:bg-gray-50/50"
                                        style={{ backgroundColor: (orderSourceColors?.[order.orderSource] && orderSourceColors[order.orderSource] !== '#ffffff') ? orderSourceColors[order.orderSource] : undefined }}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                {!order.isReadByAdmin && <span className="h-2 w-2 bg-pink-500 rounded-full"></span>}
                                                <div className="text-sm font-medium text-gray-900">
                                                    #{order.orderId || order._id.slice(-8).toUpperCase()}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                                                <div className="text-sm text-gray-900">{formatDateForTable(order.createdAt)}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">৳{order.total}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {order.ipAddress ? (
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">{order.ipAddress}</span>
                                                    {isBlocked('ip', order.ipAddress) ? (
                                                        <button
                                                            onClick={() => handleOpenUnblockModal('ip', order.ipAddress)}
                                                            className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold bg-red-100 text-red-700 hover:bg-red-200 border border-red-300 transition-colors cursor-pointer shadow-sm"
                                                            title="Click to Unblock IP"
                                                        >
                                                            <ShieldBan className="h-3.5 w-3.5" /> Blocked (Unblock)
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleOpenBlockModal('ip', order.ipAddress)}
                                                            className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200 transition-colors cursor-pointer"
                                                            title="Block this IP"
                                                        >
                                                            <ShieldAlert className="h-3.5 w-3.5" /> Block
                                                        </button>
                                                    )}
                                                    <a
                                                        href={`https://ipinfo.io/${order.ipAddress}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center p-1 rounded text-blue-600 hover:bg-blue-100 transition-colors cursor-pointer"
                                                        title="View IP Details"
                                                    >
                                                        <Info className="h-4 w-4" />
                                                    </a>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 italic">N/A</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col space-y-1">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(order.paymentStatus)}`}>
                                                    {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    {order.paymentMethod === 'cod' ? 'Cash on Delivery' : order.paymentMethod}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                {getOrderSourceLabel(order.orderSource)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <Link
                                                href={`/admin/dashboard/orders/${order._id}/invoice`}
                                                className="inline-flex items-center p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-md transition-colors"
                                                title="View Invoice"
                                            >
                                                <Eye className="h-5 w-5" />
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Full Pagination */}
                {orders.length > 0 && (
                    <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-700">Rows per page:</span>
                                <select
                                    value={pagination.itemsPerPage}
                                    onChange={(e) => setPagination(prev => ({ ...prev, itemsPerPage: Number(e.target.value), currentPage: 1 }))}
                                    className="border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="10">10</option>
                                    <option value="25">25</option>
                                    <option value="50">50</option>
                                    <option value="100">100</option>
                                </select>
                            </div>

                            <div className="flex items-center space-x-4">
                                <span className="text-sm text-gray-700">
                                    Showing {(pagination.currentPage - 1) * pagination.itemsPerPage + 1} to {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of {pagination.totalItems} results
                                </span>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                                        disabled={!pagination.hasPrevPage}
                                        className="px-3 py-1 border rounded-md disabled:opacity-50 hover:bg-gray-100 bg-white"
                                    >
                                        Previous
                                    </button>
                                    <button
                                        onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                                        disabled={!pagination.hasNextPage}
                                        className="px-3 py-1 border rounded-md disabled:opacity-50 hover:bg-gray-100 bg-white"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Block Modal */}
            {blockModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
                        <div className="flex justify-between items-center p-4 border-b">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                <ShieldAlert className="h-5 w-5 text-red-600" />
                                Block {entityToBlock.type.toUpperCase()}
                            </h3>
                            <button onClick={() => setBlockModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <form onSubmit={handleBlockSubmit} className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {entityToBlock.type === 'ip' ? 'IP Address' : 'Phone Number'}
                                </label>
                                <input
                                    type="text"
                                    value={entityToBlock.value}
                                    disabled
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 font-mono text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Internal Reason (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={blockReason}
                                    onChange={(e) => setBlockReason(e.target.value)}
                                    placeholder="For admin reference"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Response Message (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={responseMsg}
                                    onChange={(e) => setResponseMsg(e.target.value)}
                                    placeholder="Message shown to user when they try to order"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Duration
                                </label>
                                <div className="flex items-center gap-4 mb-3">
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="radio"
                                            checked={isPermanent}
                                            onChange={() => setIsPermanent(true)}
                                            className="text-red-600 focus:ring-red-500 h-4 w-4"
                                        />
                                        <span className="text-sm text-gray-700">Permanent</span>
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="radio"
                                            checked={!isPermanent}
                                            onChange={() => setIsPermanent(false)}
                                            className="text-red-600 focus:ring-red-500 h-4 w-4"
                                        />
                                        <span className="text-sm text-gray-700">Custom Days</span>
                                    </label>
                                </div>
                                {!isPermanent && (
                                    <input
                                        type="number"
                                        value={blockDays}
                                        onChange={(e) => setBlockDays(e.target.value)}
                                        min="1"
                                        placeholder="Number of days"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500 text-sm"
                                        required={!isPermanent}
                                    />
                                )}
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <button
                                    type="button"
                                    onClick={() => setBlockModalOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-red-500 focus:border-red-500 cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={blocking}
                                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    {blocking && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                                    Confirm Block
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Unblock Modal */}
            {unblockModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden">
                        <div className="flex justify-between items-center p-4 border-b">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                <ShieldBan className="h-5 w-5 text-gray-500" />
                                Unblock {entityToBlock.type.toUpperCase()}
                            </h3>
                            <button onClick={() => setUnblockModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="p-4">
                            <p className="text-sm text-gray-600 mb-4">Are you sure you want to unblock the following {entityToBlock.type}?</p>
                            <p className="font-mono bg-gray-50 p-2 rounded border text-center">{entityToBlock.value}</p>
                        </div>
                        <div className="flex justify-end gap-3 p-4 border-t bg-gray-50">
                            <button
                                type="button"
                                onClick={() => setUnblockModalOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleUnblockConfirm}
                                disabled={unblocking}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {unblocking && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                                Unblock
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
