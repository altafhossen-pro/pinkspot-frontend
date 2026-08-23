'use client';

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Barcode from 'react-barcode';
import { useReactToPrint } from 'react-to-print';
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
    Printer,
    Copy,
    Download,
    MoreVertical,
    Eye,
    MessageSquare,
    Coins,
    RotateCcw,
    CheckSquare,
    Square,
    ScanBarcode,
    XCircle,
    AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDateForTable } from '@/utils/formatDate';
import { orderAPI } from '@/services/api';
import OrderUpdateHistory from '@/components/Admin/OrderUpdateHistory';
import PermissionDenied from '@/components/Common/PermissionDenied';
import { useAppContext } from '@/context/AppContext';
import { getCookie } from 'cookies-next';
import { io } from 'socket.io-client';

export default function OrderDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const orderId = params.id;
    const { hasPermission, loading: contextLoading, user, roleDetails } = useAppContext();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [permissionError, setPermissionError] = useState(null);
    const [allActiveUsers, setAllActiveUsers] = useState([]);
    const [otherActiveUsers, setOtherActiveUsers] = useState([]);
    const [showPresenceWarning, setShowPresenceWarning] = useState(false);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [newStatus, setNewStatus] = useState('');
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
    const [returnQuantities, setReturnQuantities] = useState({});
    const [selectedItems, setSelectedItems] = useState(new Set());
    const [hoveredImage, setHoveredImage] = useState(null);
    const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });

    const handleImageMouseEnter = (e, imageUrl) => {
        setHoveredImage(imageUrl);
        setImagePosition({ x: e.clientX, y: e.clientY });
    };

    const handleImageMouseMove = (e) => {
        setImagePosition({ x: e.clientX, y: e.clientY });
    };

    const handleImageMouseLeave = () => {
        setHoveredImage(null);
    };

    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
    const printRef = useRef();

    const handleClosePrintModal = () => {
        setIsPrintModalOpen(false);
        if (typeof window !== 'undefined') {
            const searchParams = new URLSearchParams(window.location.search);
            if (searchParams.get('ref') === 'manual') {
                router.push('/admin/dashboard/manual-orders');
            } else {
                router.push('/admin/dashboard/orders');
            }
        } else {
            router.push('/admin/dashboard/orders');
        }
    };

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `Label_${order?.orderId || order?._id}`,
    });
    const [addingToSteadfast, setAddingToSteadfast] = useState(false);
    const [apiError, setApiError] = useState(null);
    const [trackingHistory, setTrackingHistory] = useState([]);
    const [isNextStatusModalOpen, setIsNextStatusModalOpen] = useState(false);

    // Scan Barcode States
    const [scanInputValue, setScanInputValue] = useState('');
    const [scanResult, setScanResult] = useState(null);
    const scanTimeoutRef = useRef(null);
    const scanInputRef = useRef(null);

    // Auto focus the scan input on load
    useEffect(() => {
        if (!contextLoading && order && scanInputRef.current) {
            scanInputRef.current.focus();
        }
    }, [contextLoading, order]);

    const handleScanInputChange = (e) => {
        const value = e.target.value;
        setScanInputValue(value);
        
        if (value.trim().length > 0 && order && order.items) {
            const scan = value.trim().toLowerCase();
            const foundIndex = order.items.findIndex(item => {
                return (item.variant && item.variant.sku && String(item.variant.sku).toLowerCase() === scan) || 
                       (item.productInfo && item.productInfo.slug && String(item.productInfo.slug).toLowerCase() === scan) ||
                       (item.sku && String(item.sku).toLowerCase() === scan);
            });

            if (foundIndex !== -1) {
                const foundItem = order.items[foundIndex];
                
                // Auto-select for packing
                setSelectedItems(prev => {
                    const newSet = new Set(prev);
                    newSet.add(foundIndex);
                    return newSet;
                });

                setScanResult({
                    status: 'success',
                    message: 'Product Found in Order!',
                    sku: value,
                    itemName: foundItem.name
                });
                setScanInputValue('');
                
                if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
                scanTimeoutRef.current = setTimeout(() => {
                    setScanResult(null);
                }, 1000);
            }
        }
    };

    const handleScanInputKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const value = e.target.value.trim();
            if (value.length > 0) {
                // If enter is pressed and we still have a value, it means it didn't match anything during typing
                setScanResult({
                    status: 'error',
                    message: 'Product Not Found in Order',
                    sku: value
                });
                setScanInputValue('');
                
                if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
                scanTimeoutRef.current = setTimeout(() => {
                    setScanResult(null);
                }, 3000);
            }
        }
    };

    useEffect(() => {
        // Check permission first
        if (!contextLoading) {
            if (!hasPermission('order', 'read')) {
                setPermissionError({
                    message: "You don't have permission to view order details.",
                    action: 'Read Orders'
                });
                setLoading(false);
            } else {
                fetchOrderDetails();
            }
        }
    }, [contextLoading, hasPermission, orderId]);

    // Setup socket connection for order presence
    useEffect(() => {
        if (!user || !orderId) return;

        const socketUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1').replace('/api/v1', '');
        const newSocket = io(socketUrl, {
            withCredentials: true,
            transports: ['websocket', 'polling']
        });

        newSocket.on('connect', () => {
            newSocket.emit('join_order_room', {
                orderId,
                user: {
                    userId: user._id,
                    name: user.name || user.email,
                    role: user.role
                }
            });
        });

        newSocket.on('order_presence_update', (data) => {
            if (data.orderId === orderId) {
                setAllActiveUsers(data.viewers);
                const others = data.viewers.filter(v => v.socketId !== newSocket.id);
                setOtherActiveUsers(others);
                if (others.length > 0) {
                    setShowPresenceWarning(true);
                }
            }
        });

        return () => {
            newSocket.emit('leave_order_room', { orderId });
            newSocket.disconnect();
        };
    }, [orderId, user]);

    // Load selected items from localStorage when order loads
    useEffect(() => {
        if (order && order._id) {
            const savedSelections = localStorage.getItem(`order_selections_${order._id}`);
            if (savedSelections) {
                try {
                    const parsed = JSON.parse(savedSelections);
                    setSelectedItems(new Set(parsed));
                } catch (e) {
                    console.error('Error loading saved selections:', e);
                }
            }
        }
    }, [order?._id]);

    // Save selected items to localStorage
    useEffect(() => {
        if (order && order._id) {
            if (selectedItems.size > 0) {
                localStorage.setItem(`order_selections_${order._id}`, JSON.stringify(Array.from(selectedItems)));
            } else {
                // Clear localStorage if no items selected
                localStorage.removeItem(`order_selections_${order._id}`);
            }
        }
    }, [selectedItems, order?._id]);

    const fetchOrderDetails = async () => {
        try {
            setLoading(true);
            const token = getCookie('token');
            const data = await orderAPI.getAdminOrderDetails(orderId, token);

            if (data.success) {
                setOrder(data.data);
                setPermissionError(null);

                // If order is unread, mark it as read and notify header
                if (data.data && !data.data.isReadByAdmin) {
                    orderAPI.markNotificationRead(orderId, token).catch(console.error);
                    window.dispatchEvent(new CustomEvent('notificationRead', { detail: orderId }));
                }

                // Fetch tracking history if added to Steadfast
                if (data.data?.isAddedIntoSteadfast || data.data?.steadfastConsignmentId) {
                    try {
                        const invoice = data.data.orderId || data.data._id;
                        const trackingRes = await orderAPI.getSteadfastTrackingHistory(invoice, token);
                        if (trackingRes.success) {
                            setTrackingHistory(trackingRes.data || []);
                        }
                    } catch (trackingError) {
                        console.error('Error fetching tracking history:', trackingError);
                    }
                }
            } else {
                // Check if it's a permission error
                if (data.message && (
                    data.message.toLowerCase().includes('permission') ||
                    data.message.toLowerCase().includes('access denied') ||
                    data.message.toLowerCase().includes("don't have permission")
                )) {
                    setPermissionError({
                        message: data.message,
                        action: 'Read Orders'
                    });
                } else {
                    toast.error('Failed to fetch order details');
                    router.push('/admin/dashboard/orders');
                }
            }
        } catch (error) {
            console.error('Error fetching order details:', error);
            // Check if it's a 403 error (permission denied)
            if (error.status === 403 || error.response?.status === 403) {
                const errorMessage = error.response?.data?.message || error.message || 'You don\'t have permission to access this resource.';
                setPermissionError({
                    message: errorMessage,
                    action: 'Read Orders'
                });
            } else {
                toast.error('Error fetching order details');
                router.push('/admin/dashboard/orders');
            }
        } finally {
            setLoading(false);
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
            case 'returned':
                return 'bg-pink-100 text-pink-800 border-pink-200';
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

    const getStatusIcon = (status) => {
        switch (status) {
            case 'pending':
                return <Clock className="h-4 w-4" />;
            case 'confirmed':
                return <CheckCircle className="h-4 w-4" />;
            case 'processing':
                return <Package className="h-4 w-4" />;
            case 'shipped':
                return <Truck className="h-4 w-4" />;
            case 'delivered':
                return <CheckCircle className="h-4 w-4" />;
            case 'cancelled':
                return <AlertCircle className="h-4 w-4" />;
            case 'returned':
                return <RotateCcw className="h-4 w-4" />;
            default:
                return <Info className="h-4 w-4" />;
        }
    };

    const getStatusTimeline = (status) => {
        const timeline = [
            { step: 'pending', label: 'Order Placed', completed: true },
            { step: 'confirmed', label: 'Order Confirmed', completed: ['confirmed', 'processing', 'shipped', 'delivered', 'returned'].includes(status) },
            { step: 'processing', label: 'Processing', completed: ['processing', 'shipped', 'delivered', 'returned'].includes(status) },
            { step: 'shipped', label: 'Shipped', completed: ['shipped', 'delivered', 'returned'].includes(status) },
            { step: 'delivered', label: 'Delivered', completed: ['delivered', 'returned'].includes(status) }
        ];

        // Add returned step if status is returned
        if (status === 'returned') {
            timeline.push({ step: 'returned', label: 'Returned', completed: true });
        }

        if (status === 'cancelled') {
            return timeline.map(item => ({ ...item, completed: false }));
        }

        return timeline;
    };

    const copyOrderId = () => {
        navigator.clipboard.writeText(order?.orderId || "Order ID not found");
        toast.success('Order ID copied!');
    };

    // Handle item selection for packaging
    const toggleItemSelection = (index) => {
        setSelectedItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(index)) {
                newSet.delete(index);
            } else {
                newSet.add(index);
            }
            return newSet;
        });
    };

    const selectAllItems = () => {
        if (order && order.items) {
            setSelectedItems(new Set(order.items.map((_, index) => index)));
        }
    };

    const clearAllItems = () => {
        setSelectedItems(new Set());
    };

    // Get available status options based on current status
    const getAvailableStatusOptions = (currentStatus) => {
        const statusFlow = {
            'pending': ['confirmed', 'cancelled'],
            'confirmed': ['processing', 'cancelled'],
            'processing': ['shipped', 'cancelled'],
            'shipped': ['delivered', 'returned'],
            'delivered': ['returned'],
            'cancelled': [], // Final status
            'returned': [] // Final status
        };

        return statusFlow[currentStatus] || [];
    };

    const openStatusModal = () => {
        setNewStatus(order.status);
        setIsStatusModalOpen(true);
    };

    const closeStatusModal = () => {
        setIsStatusModalOpen(false);
        setNewStatus('');
    };

    const getNextStatus = (currentStatus) => {
        const flow = {
            'pending': 'confirmed',
            'confirmed': 'processing',
            'processing': 'shipped',
            'shipped': 'delivered'
        };
        return flow[currentStatus] || null;
    };

    const openNextStatusModal = () => {
        setIsNextStatusModalOpen(true);
    };

    const closeNextStatusModal = () => {
        setIsNextStatusModalOpen(false);
    };

    const handleNextStatusConfirm = async () => {
        const next = getNextStatus(order.status);
        if (next) {
            setNewStatus(next);
            // We can directly call the existing handleStatusUpdate with the newStatus set,
            // but we need to ensure state updates first or pass it directly.
            // Let's create a dedicated function or use the existing one after setting state.
            // Actually, handleStatusUpdate uses the newStatus state, which might not be updated in time if we call it synchronously.
        }
    };

    const openReturnModal = () => {
        // Initialize return quantities with 0 for all items
        const initialQuantities = {};
        order.items.forEach((item, index) => {
            initialQuantities[index] = 0;
        });
        setReturnQuantities(initialQuantities);
        setIsReturnModalOpen(true);
    };

    const closeReturnModal = () => {
        setIsReturnModalOpen(false);
        setReturnQuantities({});
    };

    const handleReturnQuantityChange = (itemIndex, quantity) => {
        const maxQuantity = order.items[itemIndex].quantity;
        const validQuantity = Math.max(0, Math.min(quantity, maxQuantity));

        setReturnQuantities(prev => ({
            ...prev,
            [itemIndex]: validQuantity
        }));
    };

    const handleStatusUpdate = async () => {
        if (!newStatus) return;

        if (!hasPermission('order', 'update')) {
            toast.error("You don't have permission to update orders");
            closeStatusModal();
            return;
        }

        try {
            setUpdatingStatus(true);
            const token = getCookie('token');
            let response;

            if (newStatus === 'shipped') {
                response = await orderAPI.addOrderToSteadfast(order._id, token);
            } else {
                response = await orderAPI.updateOrderStatus(order._id, { status: newStatus }, token);
            }

            if (response.success) {
                toast.success(newStatus === 'shipped' ? 'Order shipped and added to Steadfast successfully' : 'Order status updated successfully');
                // Extract updated order (addOrderToSteadfast returns { order, steadfastResponse }, while updateOrderStatus returns the order directly)
                let responseOrder = response.data;
                if (newStatus === 'shipped' && response.data?.order) {
                    responseOrder = response.data.order;
                }

                // Update order with full response data (includes paymentStatus if updated)
                const updatedOrder = responseOrder || { ...order, status: newStatus };
                setOrder({ ...order, ...updatedOrder });
                closeStatusModal();
                if (newStatus === 'shipped' || (responseOrder && responseOrder.status === 'shipped')) {
                    setIsPrintModalOpen(true);
                }
            } else {
                setApiError({
                    title: 'Update Failed',
                    message: response.message || 'Failed to update order status'
                });
            }
        } catch (error) {
            console.error('Error updating order status:', error);
            if (error.status === 403 || error.response?.status === 403) {
                toast.error("You don't have permission to update orders");
            } else {
                const errorMessage = error.response?.data?.message || error.message || 'Error updating order status';
                setApiError({
                    title: newStatus === 'shipped' ? 'Steadfast Integration Error' : 'Update Failed',
                    message: errorMessage
                });
            }
        } finally {
            setUpdatingStatus(false);
        }
    };

    const handleNextStatusConfirmAction = async () => {
        const nextStatus = getNextStatus(order.status);
        if (!nextStatus) return;

        if (!hasPermission('order', 'update')) {
            toast.error("You don't have permission to update orders");
            closeNextStatusModal();
            return;
        }

        try {
            setUpdatingStatus(true);
            const token = getCookie('token');
            let response;

            if (nextStatus === 'shipped') {
                response = await orderAPI.addOrderToSteadfast(order._id, token);
            } else {
                response = await orderAPI.updateOrderStatus(order._id, { status: nextStatus }, token);
            }

            if (response.success) {
                toast.success(nextStatus === 'shipped' ? 'Order shipped and added to Steadfast successfully' : 'Order status updated successfully');
                let responseOrder = response.data;
                if (nextStatus === 'shipped' && response.data?.order) {
                    responseOrder = response.data.order;
                }

                const updatedOrder = responseOrder || { ...order, status: nextStatus };
                setOrder({ ...order, ...updatedOrder });
                closeNextStatusModal();
                if (nextStatus === 'shipped' || (responseOrder && responseOrder.status === 'shipped')) {
                    setIsPrintModalOpen(true);
                }
            } else {
                setApiError({
                    title: 'Update Failed',
                    message: response.message || 'Failed to update order status'
                });
            }
        } catch (error) {
            console.error('Error updating order status:', error);
            if (error.status === 403 || error.response?.status === 403) {
                toast.error("You don't have permission to update orders");
            } else {
                const errorMessage = error.response?.data?.message || error.message || 'Error updating order status';
                setApiError({
                    title: nextStatus === 'shipped' ? 'Steadfast Integration Error' : 'Update Failed',
                    message: errorMessage
                });
            }
        } finally {
            setUpdatingStatus(false);
        }
    };

    const handleAddToSteadfast = async () => {
        try {
            setAddingToSteadfast(true);
            const token = getCookie('token');
            const response = await orderAPI.addOrderToSteadfast(order._id, token);

            if (response.success) {
                toast.success('Order added to Steadfast successfully');
                // addOrderToSteadfast returns { order, steadfastResponse }
                const responseOrder = response.data?.order || response.data;
                const updatedOrder = responseOrder || { ...order, status: 'shipped' };
                setOrder({ ...order, ...updatedOrder });
                setIsPrintModalOpen(true);
            } else {
                setApiError({
                    title: 'Steadfast Integration Error',
                    message: response.message || 'Failed to add order to Steadfast'
                });
            }
        } catch (error) {
            console.error('Error adding to Steadfast:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Error adding order to Steadfast';
            setApiError({
                title: 'Steadfast Integration Error',
                message: errorMessage
            });
        } finally {
            setAddingToSteadfast(false);
        }
    };

    const handleReturnSubmit = async () => {
        // Check if any items are being returned
        const hasReturns = Object.values(returnQuantities).some(qty => qty > 0);
        if (!hasReturns) {
            toast.error('Please specify return quantities for at least one item');
            return;
        }

        try {
            setUpdatingStatus(true);

            // Prepare return data
            const returnData = {
                status: 'returned',
                returnQuantities: Object.entries(returnQuantities)
                    .filter(([index, qty]) => qty > 0)
                    .map(([index, qty]) => ({
                        itemIndex: parseInt(index),
                        quantity: qty
                    }))
            };

            const response = await orderAPI.updateOrderStatus(order._id, returnData);

            if (response.success) {
                toast.success('Order returned successfully');
                setOrder({ ...order, status: 'returned' });
                closeReturnModal();
            } else {
                setApiError({
                    title: 'Return Failed',
                    message: response.message || 'Failed to return order'
                });
            }
        } catch (error) {
            console.error('Error returning order:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Error returning order';
            setApiError({
                title: 'Return Failed',
                message: errorMessage
            });
        } finally {
            setUpdatingStatus(false);
        }
    };

    // Show permission denied if permission error exists
    if (permissionError && !loading) {
        return (
            <PermissionDenied
                title="Access Denied"
                message={permissionError.message}
                action={permissionError.action}
            />
        );
    }

    if (loading || contextLoading) {
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

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Top Header Bar */}
            <div className="bg-white border shadow rounded-lg border-slate-300  z-10">
                <div className=" mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between py-4 sm:py-0 sm:h-16 gap-4 sm:gap-0">
                        <div className="flex items-center space-x-4">
                            <Link
                                href="/admin/dashboard/orders"
                                className="inline-flex items-center px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all duration-200 shrink-0"
                            >
                                <ArrowLeft className="h-4 w-4 mr-1 sm:mr-2" />
                                <span className="hidden sm:inline">Orders</span>
                            </Link>
                            <div className="h-6 w-px bg-slate-300"></div>
                            <div>
                                <h1 className="text-base sm:text-xl font-bold text-slate-900 flex items-center flex-wrap gap-1">
                                    Order #{order?.orderId || "Order ID not found"}
                                    <button
                                        onClick={copyOrderId}
                                        className="p-1 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                                        title="Copy Order ID"
                                    >
                                        <Copy className="h-4 w-4 text-slate-500" />
                                    </button>
                                </h1>
                                <p className="text-xs sm:text-sm text-slate-500">
                                    {formatDateForTable(order.createdAt)}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                            <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold ${getStatusColor(order.status)}`}>
                                    {getStatusIcon(order.status)}
                                    <span className="ml-2">{order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
                                </span>
                            
                            {allActiveUsers.length > 0 && (
                                <div className="flex items-center -space-x-2 mr-2 pl-2 border-l border-slate-300" title="Active Viewers">
                                    {allActiveUsers.map((viewer, idx) => (
                                        <div 
                                            key={idx} 
                                            className="h-8 w-8 rounded-full border-2 border-white flex items-center justify-center bg-blue-100 text-blue-700 text-xs font-bold relative group shadow-sm ring-1 ring-blue-200"
                                        >
                                            {viewer.name ? viewer.name.charAt(0).toUpperCase() : '?'}
                                            <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-50 pointer-events-none transition-opacity">
                                                {viewer.name}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                {order.status === 'processing' && !order.isAddedIntoSteadfast && hasPermission('order', 'update') && (
                                    <button
                                        onClick={handleAddToSteadfast}
                                        disabled={addingToSteadfast}
                                        className="inline-flex items-center px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors text-sm font-medium disabled:opacity-50 cursor-pointer"
                                    >
                                        {addingToSteadfast ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Adding...
                                            </>
                                        ) : (
                                            <>
                                                <Truck className="h-4 w-4 mr-2" />
                                                Add to Steadfast
                                            </>
                                        )}
                                    </button>
                                )}
                                {hasPermission('order', 'update') && (
                                    <>
                                        {order.status !== 'returned' && (order.status !== 'cancelled' || roleDetails?.isSuperAdmin) ? (
                                            <Link
                                                href={`/admin/dashboard/orders/${orderId}/edit`}
                                                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                                            >
                                                <Edit3 className="h-4 w-4 mr-2" />
                                                Edit Order
                                            </Link>
                                        ) : (
                                            <button
                                                disabled
                                                className="inline-flex items-center px-4 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed text-sm font-medium"
                                                title={`Cannot edit ${order.status} orders`}
                                            >
                                                <Edit3 className="h-4 w-4 mr-2" />
                                                Edit Order
                                            </button>
                                        )}
                                        <button
                                            onClick={openStatusModal}
                                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                                        >
                                            <Edit3 className="h-4 w-4 mr-2" />
                                            Update Status
                                        </button>
                                    </>
                                )}
                                {hasPermission('order', 'read') && (
                                    <Link
                                        href={`/admin/dashboard/orders/${orderId}/invoice`}
                                        className="inline-flex items-center px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors text-sm font-medium"
                                    >
                                        <Download className="h-4 w-4 mr-2" />
                                        Invoice
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="mx-auto px-4 sm:px-6 lg:px-0 py-8">
                {/* Status Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <div className="flex items-center">
                            <div className="p-3 bg-blue-100 rounded-xl">
                                <DollarSign className="h-6 w-6 text-blue-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-slate-600">Total Amount</p>
                                <p className="text-2xl font-bold text-slate-900">
                                    ৳{order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0) + (order.shippingCost || 0) - (order.discount || 0) - (order.couponDiscount || 0) - (order.upsellDiscount || 0) - (order.loyaltyDiscount || 0) - (order.affiliateOrder?.affiliateDiscount || 0)}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <div className="flex items-center">
                            <div className="p-3 bg-emerald-100 rounded-xl">
                                <ShoppingBag className="h-6 w-6 text-emerald-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-slate-600">Items</p>
                                <p className="text-2xl font-bold text-slate-900">{order.items.length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <div className="flex items-center">
                            <div className={`p-3 rounded-xl ${order.paymentStatus === 'paid' ? 'bg-emerald-100' : 'bg-amber-100'}`}>
                                <CreditCard className={`h-6 w-6 ${order.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`} />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-slate-600">Payment</p>
                                <p className="text-lg font-bold text-slate-900 capitalize">{order.paymentStatus}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <div className="flex items-center">
                            <div className="p-3 bg-purple-100 rounded-xl">
                                {getStatusIcon(order.status)}
                                <div className="text-purple-600">{getStatusIcon(order.status)}</div>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-slate-600">Status</p>
                                <p className="text-lg font-bold text-slate-900 capitalize">{order.status}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
                    {/* Left Column - Main Content */}
                    <div className="xl:col-span-3 space-y-8">
                        {/* Order Progress Timeline */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-xl font-bold text-slate-900">Order Progress</h2>
                                <span className="text-sm text-slate-500">Track your order status</span>
                            </div>

                            <div className="relative">
                                <div className="absolute left-5 top-8 bottom-8 w-0.5 bg-slate-200"></div>
                                <div className="space-y-8">
                                    {getStatusTimeline(order.status).map((step, index) => (
                                        <div key={step.step} className="relative flex items-start">
                                            <div className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-4 ${step.completed
                                                ? 'bg-emerald-500 border-emerald-500'
                                                : 'bg-white border-slate-300'
                                                }`}>
                                                {step.completed ? (
                                                    <CheckCircle className="h-5 w-5 text-white" />
                                                ) : (
                                                    <div className="w-2 h-2 bg-slate-300 rounded-full"></div>
                                                )}
                                            </div>
                                            <div className="ml-6">
                                                <div className={`text-lg font-semibold ${step.completed ? 'text-slate-900' : 'text-slate-500'
                                                    }`}>
                                                    {step.label}
                                                </div>
                                                {step.completed && (
                                                    <div className="text-sm text-emerald-600 mt-1 font-medium">
                                                        ✓ Completed
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Order Items */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4 lg:gap-0">
                                <h2 className="text-xl font-bold text-slate-900 flex items-center">
                                    <ShoppingBag className="h-6 w-6 mr-3 text-blue-600" />
                                    Order Items
                                </h2>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                    <div className="bg-indigo-50 border-2 border-indigo-200 pl-4 pr-5 py-2.5 rounded-xl flex items-center shadow-md w-full sm:w-auto">
                                        <ScanBarcode className="h-6 w-6 text-indigo-600 mr-3 shrink-0" />
                                        <input
                                            ref={scanInputRef}
                                            type="text"
                                            value={scanInputValue}
                                            onChange={handleScanInputChange}
                                            onKeyDown={handleScanInputKeyDown}
                                            placeholder="Scan barcode..."
                                            className="bg-transparent border-none outline-none focus:ring-0 text-lg font-bold text-indigo-900 w-full sm:w-64 placeholder-indigo-300 p-0 min-w-0"
                                            autoFocus
                                        />
                                        <div className="relative flex h-3 w-3 ml-3 shrink-0">
                                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                          <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                                        </div>
                                    </div>
                                    <div className="bg-slate-100 px-4 py-2 rounded-xl w-fit">
                                        <span className="text-sm font-semibold text-slate-700">
                                            {order.items.length} item{order.items.length > 1 ? 's' : ''}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Packaging Selection Controls */}
                            <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center space-x-3">
                                        <Package className="h-5 w-5 text-blue-600" />
                                        <div>
                                            <h3 className="text-sm font-bold text-slate-900">Packaging Selection</h3>
                                            <p className="text-xs text-slate-600">Click items to mark as packed</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={selectAllItems}
                                            className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors"
                                        >
                                            Select All
                                        </button>
                                        <button
                                            onClick={clearAllItems}
                                            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                                        >
                                            Clear All
                                        </button>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <div className="flex-1 bg-white rounded-lg px-3 py-2 border border-blue-200">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-medium text-slate-600">Packed Items:</span>
                                            <span className={`text-sm font-bold ${selectedItems.size === order.items.length
                                                ? 'text-emerald-600'
                                                : selectedItems.size > 0
                                                    ? 'text-blue-600'
                                                    : 'text-slate-400'
                                                }`}>
                                                {selectedItems.size} / {order.items.length}
                                            </span>
                                        </div>
                                        <div className="mt-1 w-full bg-slate-200 rounded-full h-2">
                                            <div
                                                className={`h-2 rounded-full transition-all duration-300 ${selectedItems.size === order.items.length
                                                    ? 'bg-emerald-500'
                                                    : 'bg-blue-500'
                                                    }`}
                                                style={{ width: `${(selectedItems.size / order.items.length) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {order.items.map((item, index) => {
                                    const isSelected = selectedItems.has(index);
                                    
                                    // Determine if there is a variant image
                                    let variantImage = null;
                                    if (item.product && item.product.variants && item.variant?.sku) {
                                        const matchedVariant = item.product.variants.find(v => v.sku === item.variant.sku);
                                        if (matchedVariant) {
                                            variantImage = matchedVariant.images?.[0]?.url || matchedVariant.attributes?.find(a => a.image)?.image;
                                        }
                                    }
                                    const displayImage = variantImage || item.image;
                                    const imageType = variantImage ? 'Variant Image' : 'Featured Image';

                                    return (
                                        <div
                                            key={index}
                                            onClick={() => toggleItemSelection(index)}
                                            className={`group relative rounded-2xl p-6 transition-all duration-300 border-2 cursor-pointer ${isSelected
                                                ? 'bg-emerald-50 border-emerald-300 hover:bg-emerald-100'
                                                : 'bg-slate-50 border-slate-100 hover:bg-slate-100'
                                                }`}
                                        >
                                            <div className="flex items-center space-x-6">
                                                {/* Selection Checkbox */}
                                                <div className="flex-shrink-0">
                                                    <div className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-all ${isSelected
                                                        ? 'bg-emerald-500 border-emerald-600'
                                                        : 'bg-white border-slate-300 group-hover:border-blue-400'
                                                        }`}>
                                                        {isSelected ? (
                                                            <CheckSquare className="h-5 w-5 text-white" />
                                                        ) : (
                                                            <Square className="h-5 w-5 text-slate-400" />
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex flex-col items-center flex-shrink-0">
                                                    <div
                                                        className="relative"
                                                        onMouseEnter={() => setHoveredImage(displayImage)}
                                                        onMouseLeave={() => setHoveredImage(null)}
                                                    >
                                                        <img
                                                            src={displayImage}
                                                            alt={item.name}
                                                            className="h-24 w-24 rounded-xl object-cover border-2 border-white shadow-lg cursor-zoom-in"
                                                        />
                                                        <div className={`absolute -top-2 -right-2 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center z-10 ${isSelected ? 'bg-emerald-600' : 'bg-blue-600'
                                                            }`}>
                                                            {item.quantity}
                                                        </div>
                                                    </div>
                                                    <span className="mt-2 text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                                                        {imageType}
                                                    </span>
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center space-x-2 mb-2">
                                                        <h3 className="text-lg font-bold text-slate-900">
                                                            {item.name}
                                                        </h3>
                                                        {isSelected && (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500 text-white">
                                                                Packed
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="flex flex-wrap gap-3 mb-4">
                                                        <div className="flex items-center bg-blue-100 px-4 py-2 rounded-lg">
                                                            <span className="text-sm font-bold text-blue-800 mr-2">QTY:</span>
                                                            <span className="text-sm font-semibold text-blue-700">{item.quantity}</span>
                                                        </div>
                                                        <div className="flex items-center bg-emerald-100 px-4 py-2 rounded-lg">
                                                            <span className="text-sm font-bold text-emerald-800 mr-2">PRICE:</span>
                                                            <span className="text-sm font-semibold text-emerald-700">৳{item.price}</span>
                                                        </div>
                                                    </div>

                                                    {item.variant && (
                                                        <div className="flex flex-wrap gap-3">
                                                            {item.variant.size && (
                                                                <div className="flex items-center bg-purple-100 px-4 py-2 rounded-lg">
                                                                    <span className="text-sm font-bold text-purple-800 mr-2">SIZE:</span>
                                                                    <span className="text-sm font-semibold text-purple-700">{item.variant.size}</span>
                                                                </div>
                                                            )}
                                                            {item.variant.color && (
                                                                <div className="flex items-center bg-rose-100 px-4 py-2 rounded-lg">
                                                                    <span className="text-sm font-bold text-rose-800 mr-2">COLOR:</span>
                                                                    <div
                                                                        className="w-5 h-5 rounded-full border-2 border-white shadow-sm mr-2"
                                                                        style={{
                                                                            backgroundColor: item.variant.colorHexCode,
                                                                        }}
                                                                    ></div>
                                                                    <span className="text-sm font-semibold text-rose-700">{item.variant.color}</span>
                                                                </div>
                                                            )}
                                                            {item.variant.sku && (
                                                                <div className="flex items-center bg-slate-100 px-4 py-2 rounded-lg">
                                                                    <span className="text-sm font-bold text-slate-800 mr-2">SKU:</span>
                                                                    <span className="text-sm font-mono font-semibold text-slate-700">{item.variant.sku}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="text-right">
                                                    <p className="text-2xl font-bold text-slate-900">
                                                        ৳{item.subtotal}
                                                    </p>
                                                    <p className="text-sm text-slate-500 mt-1">Subtotal</p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Order Notes */}
                        {order.orderNotes && (
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                                <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
                                    <MessageSquare className="h-6 w-6 mr-3 text-blue-600" />
                                    Order Notes
                                </h2>
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 rounded-lg p-6">
                                    <div className="flex">
                                        <Info className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
                                        <p className="text-slate-800 leading-relaxed">
                                            {order.orderNotes}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Order Update History */}
                        <OrderUpdateHistory updateHistory={order.updateHistory} />
                    </div>

                    {/* Right Column - Sidebar */}
                    <div className="space-y-8 xl:col-span-2">
                        {/* Order Summary */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
                                <DollarSign className="h-6 w-6 mr-3 text-emerald-600" />
                                Order Summary
                            </h2>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center py-3 border-b border-slate-100">
                                    <span className="text-slate-600 font-medium">Subtotal</span>
                                    <span className="font-bold text-slate-900">৳{order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)}</span>
                                </div>
                                <div className="flex justify-between items-center py-3 border-b border-slate-100">
                                    <span className="text-slate-600 font-medium">Shipping</span>
                                    <span className="font-bold text-emerald-600">৳{order.shippingCost}</span>
                                </div>
                                {order.couponDiscount > 0 && (
                                    <div className="flex justify-between items-center py-3 border-b border-slate-100">
                                        <span className="text-slate-600 font-medium">Coupon Discount {order.coupon && `(${order.coupon})`}</span>
                                        <span className="font-bold text-blue-600">-৳{order.couponDiscount}</span>
                                    </div>
                                )}
                                {order.upsellDiscount > 0 && (
                                    <div className="flex justify-between items-center py-3 border-b border-slate-100">
                                        <span className="text-slate-600 font-medium">Upsell Discount</span>
                                        <span className="font-bold text-green-600">-৳{order.upsellDiscount}</span>
                                    </div>
                                )}
                                {order.discount > 0 && order.couponDiscount === 0 && (
                                    <div className="flex justify-between items-center py-3 border-b border-slate-100">
                                        <span className="text-slate-600 font-medium">Discount</span>
                                        <span className="font-bold text-red-600">-৳{order.discount}</span>
                                    </div>
                                )}
                                {order.loyaltyDiscount > 0 && (
                                    <div className="flex justify-between items-center py-3 border-b border-slate-100">
                                        <span className="text-slate-600 font-medium">Loyalty Points Discount</span>
                                        <span className="font-bold text-pink-600">-৳{order.loyaltyDiscount}</span>
                                    </div>
                                )}
                                {order.affiliateOrder?.affiliateDiscount > 0 && (
                                    <div className="flex justify-between items-center py-3 border-b border-slate-100">
                                        <span className="text-slate-600 font-medium">Affiliate Discount {order.affiliateOrder?.affiliateCode && `(${order.affiliateOrder.affiliateCode})`}</span>
                                        <span className="font-bold text-purple-600">-৳{order.affiliateOrder.affiliateDiscount}</span>
                                    </div>
                                )}
                                <div className="pt-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-lg font-bold text-slate-900">Total</span>
                                        <span className="text-2xl font-bold text-slate-900">৳{order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0) + order.shippingCost - (order.discount || 0) - (order.couponDiscount || 0) - (order.upsellDiscount || 0) - (order.loyaltyDiscount || 0) - (order.affiliateOrder?.affiliateDiscount || 0)}</span>
                                    </div>
                                </div>
                                {order.loyaltyPointsUsed > 0 && (
                                    <div className="mt-4 p-4 bg-pink-50 rounded-xl border border-pink-200">
                                        <div className="flex items-center justify-center">
                                            <Coins className="h-5 w-5 text-pink-600 mr-2" />
                                            <div className="text-center">
                                                <div className="text-sm font-bold text-pink-800">Paid with {order.loyaltyPointsUsed} coins</div>
                                                <div className="text-xs text-pink-600">No additional payment required</div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Customer Information */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
                                <User className="h-6 w-6 mr-3 text-purple-600" />
                                Customer Details
                            </h2>
                            <div className="space-y-4">
                                <div className="flex items-center p-4 bg-slate-50 rounded-xl">
                                    <div className="p-2 bg-purple-100 rounded-lg">
                                        <User className="h-4 w-4 text-purple-600" />
                                    </div>
                                    <div className="ml-4">
                                        <p className="font-semibold text-slate-900">
                                            {order.isGuestOrder && order.guestInfo?.name
                                                ? order.guestInfo.name
                                                : order.orderType === 'manual' && order.manualOrderInfo?.name
                                                    ? order.manualOrderInfo.name
                                                    : order.user ? (order.user.name || 'Registered User') : 'Guest User'}
                                        </p>
                                        <p className="text-xs text-slate-500 font-medium">Customer Name</p>
                                    </div>
                                </div>

                                {(order.isGuestOrder && order.guestInfo?.email) || order.user?.email ? (
                                    <div className="flex items-center p-4 bg-slate-50 rounded-xl">
                                        <div className="p-2 bg-blue-100 rounded-lg">
                                            <Mail className="h-4 w-4 text-blue-600" />
                                        </div>
                                        <div className="ml-4">
                                            <p className="font-semibold text-slate-900">
                                                {order.isGuestOrder && order.guestInfo?.email
                                                    ? order.guestInfo.email
                                                    : order.user?.email}
                                            </p>
                                            <p className="text-xs text-slate-500 font-medium">Email Address</p>
                                        </div>
                                    </div>
                                ) : null}

                                {(order.isGuestOrder && order.guestInfo?.phone) || order.user?.phone || (order.orderType === 'manual' && order.manualOrderInfo?.phone) ? (
                                    <div className="flex items-center p-4 bg-slate-50 rounded-xl">
                                        <div className="p-2 bg-emerald-100 rounded-lg">
                                            <Phone className="h-4 w-4 text-emerald-600" />
                                        </div>
                                        <div className="ml-4">
                                            <p className="font-semibold text-slate-900">
                                                {order.isGuestOrder && order.guestInfo?.phone
                                                    ? order.guestInfo.phone
                                                    : order.orderType === 'manual' && order.manualOrderInfo?.phone
                                                        ? order.manualOrderInfo.phone
                                                        : order.user?.phone}
                                            </p>
                                            <p className="text-xs text-slate-500 font-medium">Phone Number</p>
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        </div>

                        {/* Payment Information */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
                                <CreditCard className="h-6 w-6 mr-3 text-emerald-600" />
                                Payment Info
                            </h2>
                            <div className="space-y-4">
                                <div className="flex items-center p-4 bg-slate-50 rounded-xl">
                                    <div className="p-2 bg-emerald-100 rounded-lg">
                                        <CreditCard className="h-4 w-4 text-emerald-600" />
                                    </div>
                                    <div className="ml-4">
                                        <p className="font-semibold text-slate-900">
                                            {order.paymentMethod === 'cod' ? 'Cash on Delivery' : order.paymentMethod}
                                        </p>
                                        <p className="text-xs text-slate-500 font-medium">Payment Method</p>
                                    </div>
                                </div>

                                {!!order.loyaltyPointsUsed && order.loyaltyPointsUsed > 0 && (
                                    <div className="flex items-center p-4 bg-pink-50 rounded-xl border border-pink-200">
                                        <div className="p-2 bg-pink-100 rounded-lg">
                                            <Coins className="h-4 w-4 text-pink-600" />
                                        </div>
                                        <div className="ml-4">
                                            <p className="font-semibold text-pink-800">
                                                Paid with {order.loyaltyPointsUsed} coins (৳{order.loyaltyDiscount})
                                            </p>
                                            <p className="text-xs text-pink-600 font-medium">Loyalty Points Payment</p>
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center p-4 bg-slate-50 rounded-xl">
                                    <span className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-bold ${getPaymentStatusColor(order.paymentStatus)}`}>
                                        <DollarSign className="h-4 w-4 mr-1" />
                                        {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Shipping Details */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
                                <MapPin className="h-6 w-6 mr-3 text-red-600" />
                                Shipping Details
                            </h2>
                            <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl p-6 border border-slate-200">
                                <div className="space-y-4">
                                    <div className="flex items-center">
                                        <div className="p-2 bg-red-100 rounded-lg">
                                            <User className="h-4 w-4 text-red-600" />
                                        </div>
                                        <div className="ml-4">
                                            <p className="font-semibold text-slate-900">{order.shippingAddress?.name || 'N/A'}</p>
                                            <p className="text-xs text-slate-500 font-medium">Recipient Name</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="p-2 bg-red-100 rounded-lg">
                                            <Phone className="h-4 w-4 text-red-600" />
                                        </div>
                                        <div className="ml-4">
                                            <p className="font-semibold text-slate-900">{order.shippingAddress?.phone || 'N/A'}</p>
                                            <p className="text-xs text-slate-500 font-medium">Recipient Phone</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start">
                                        <div className="p-2 bg-red-100 rounded-lg">
                                            <MapPin className="h-4 w-4 text-red-600" />
                                        </div>
                                        <div className="ml-4">
                                            <div className="space-y-1">
                                                <p className="font-semibold text-slate-900">{order.shippingAddress?.street}</p>
                                                <p className="text-slate-700 text-sm font-medium">{order.shippingAddress?.city}, {order.shippingAddress?.state}</p>
                                                <p className="text-slate-600 text-sm">{order.shippingAddress?.country}</p>
                                            </div>
                                            <p className="text-xs text-slate-500 font-medium mt-1">Delivery Address</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Steadfast Tracking Information */}
                        {(order.status === 'shipped' || order.status === 'delivered') && order.isAddedIntoSteadfast && order.steadfastConsignmentId && (
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                                <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
                                    <Truck className="h-6 w-6 mr-3 text-pink-600" />
                                    Steadfast Courier Tracking
                                </h2>
                                <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl p-6 border border-pink-200">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <div className="p-2 bg-pink-100 rounded-lg">
                                                <Truck className="h-5 w-5 text-pink-600" />
                                            </div>
                                            <div className="ml-4">
                                                <p className="font-bold text-slate-900">Consignment ID: {order.steadfastConsignmentId}</p>
                                                <p className="text-xs text-slate-500 font-medium mt-1">Steadfast Tracking</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setIsPrintModalOpen(true)}
                                                className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors text-sm font-medium flex items-center"
                                            >
                                                <Printer className="h-4 w-4 mr-2" />
                                                Print Label
                                            </button>
                                            <a
                                                href={`https://steadfast.com.bd/user/consignment/${order.steadfastConsignmentId}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors text-sm font-medium flex items-center"
                                            >
                                                <Truck className="h-4 w-4 mr-2" />
                                                Track Order
                                            </a>
                                        </div>
                                    </div>
                                    {order.steadfastTrackingCode && (
                                        <div className="mt-4 pt-4 border-t border-pink-200">
                                            <p className="text-sm text-slate-600 mb-2">
                                                <span className="font-medium">Tracking Code:</span> {order.steadfastTrackingCode}
                                            </p>
                                            <a
                                                href={`https://steadfast.com.bd/t/${order.steadfastTrackingCode}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sm text-pink-600 hover:text-pink-700 hover:underline"
                                            >
                                                View Tracking Details →
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Quick Actions */}
                        {order.status !== 'shipped' && (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                            <h2 className="text-xl font-bold text-slate-900 mb-6">Quick Actions</h2>
                            <div className="grid grid-cols-1 gap-4">
                                {hasPermission('order', 'update') && getNextStatus(order.status) && (
                                    <>
                                        <button
                                            onClick={openNextStatusModal}
                                            disabled={order.status === 'confirmed' && selectedItems.size !== order.items.length}
                                            className={`group flex items-center justify-center px-6 py-3 rounded-xl transition-all duration-200 shadow-lg ${
                                                order.status === 'confirmed' && selectedItems.size !== order.items.length
                                                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                                                    : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 hover:shadow-xl cursor-pointer'
                                            }`}
                                        >
                                            <CheckCircle className={`h-5 w-5 mr-3 ${order.status === 'confirmed' && selectedItems.size !== order.items.length ? '' : 'group-hover:scale-110 transition-transform'}`} />
                                            <span className="font-semibold">
                                                Move to Next Status ({getNextStatus(order.status).charAt(0).toUpperCase() + getNextStatus(order.status).slice(1)})
                                            </span>
                                        </button>
                                        {order.status === 'confirmed' && selectedItems.size !== order.items.length && (
                                            <p className="text-xs text-red-500 font-medium text-center mt-2">
                                                Please pack all items ({selectedItems.size}/{order.items.length}) before processing the order.
                                            </p>
                                        )}
                                    </>
                                )}
                                {hasPermission('order', 'update') && !getNextStatus(order.status) && (
                                    <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-200 text-gray-500 text-sm">
                                        No further status progression available.
                                    </div>
                                )}
                            </div>
                        </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Tracking History (Full Width) */}
            {trackingHistory.length > 0 && (
                <div className="mt-8 bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                    <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
                        <Truck className="h-6 w-6 mr-3 text-blue-600" />
                        Tracking Updates
                    </h2>
                    <div className="space-y-4">
                        {trackingHistory.map((track, idx) => (
                            <div key={idx} className="relative pl-6 pb-4 border-l border-blue-200 last:border-0 last:pb-0">
                                <div className="absolute -left-1.5 top-0 w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-sm"></div>
                                <p className="text-sm font-semibold text-slate-900 mb-1">
                                    {track.tracking_message}
                                </p>
                                <div className="flex items-center text-xs text-slate-500 space-x-3">
                                    <span className="flex items-center">
                                        <Clock className="h-3 w-3 mr-1" />
                                        {(() => {
                                            const d = new Date(track.updated_at_steadfast);
                                            if (isNaN(d.getTime())) return 'Invalid Date';
                                            const day = d.getDate().toString().padStart(2, '0');
                                            const month = d.toLocaleString('en-US', { month: 'short' });
                                            const year = d.getFullYear();
                                            const time = d.toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
                                            return `${day}-${month}-${year}, ${time}`;
                                        })()}
                                    </span>
                                    {track.status && (
                                        <span className={`px-2 py-0.5 rounded-full font-medium capitalize ${getStatusColor(track.status)}`}>
                                            {track.status.replace('_', ' ')}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Status Update Modal */}
            {isStatusModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-medium text-gray-900">Update Order Status</h3>
                            <button
                                onClick={closeStatusModal}
                                className="text-gray-400 hover:text-gray-600 cursor-pointer"
                            >
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="mb-4">
                            <p className="text-sm text-gray-600 mb-2">
                                Order ID: <span className="font-medium">#{order._id.slice(-8).toUpperCase()}</span>
                            </p>
                            <p className="text-sm text-gray-600 mb-4">
                                Customer: <span className="font-medium">
                                    {order.isGuestOrder && order.guestInfo?.phone
                                        ? order.guestInfo.phone
                                        : order.orderType === 'manual' && order.manualOrderInfo?.phone
                                            ? order.manualOrderInfo.phone
                                            : order.user?.email || 'N/A'}
                                </span>
                            </p>

                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Current Status: <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                </span>
                            </label>

                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                New Status
                            </label>
                            <select
                                value={newStatus}
                                onChange={(e) => setNewStatus(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value={order.status}>
                                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)} (Current)
                                </option>
                                {getAvailableStatusOptions(order.status).map(status => (
                                    <option key={status} value={status}>
                                        {status === 'shipped' ? 'Shipped (Add to Steadfast)' : status.charAt(0).toUpperCase() + status.slice(1)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={closeStatusModal}
                                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    if (newStatus === 'returned') {
                                        closeStatusModal();
                                        openReturnModal();
                                    } else {
                                        handleStatusUpdate();
                                    }
                                }}
                                disabled={updatingStatus || newStatus === order.status}
                                className={`px-4 py-2 rounded-md text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${updatingStatus || newStatus === order.status
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700'
                                    }`}
                            >
                                {updatingStatus ? 'Updating...' : 'Update Status'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Next Status Confirmation Modal */}
            {isNextStatusModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-medium text-gray-900 flex items-center">
                                <CheckCircle className="h-5 w-5 text-blue-600 mr-2" />
                                Confirm Status Update
                            </h3>
                            <button
                                onClick={closeNextStatusModal}
                                className="text-gray-400 hover:text-gray-600 cursor-pointer"
                            >
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="mb-6">
                            <p className="text-gray-600">
                                Are you sure you want to move this order from <span className="font-semibold text-gray-900">{order.status}</span> to <span className="font-semibold text-blue-600">{getNextStatus(order.status)}</span>?
                            </p>
                            {getNextStatus(order.status) === 'shipped' && (
                                <p className="text-sm text-pink-600 mt-2 p-2 bg-pink-50 rounded border border-pink-100">
                                    This will also add the order to Steadfast Courier.
                                </p>
                            )}
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={closeNextStatusModal}
                                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleNextStatusConfirmAction}
                                disabled={updatingStatus}
                                className={`px-4 py-2 rounded-md text-sm font-medium text-white cursor-pointer ${updatingStatus ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                                    }`}
                            >
                                {updatingStatus ? 'Updating...' : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Return Items Modal */}
            {isReturnModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3">
                    <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                        {/* Header - Fixed */}
                        <div className="bg-gradient-to-r from-pink-600 to-red-500 px-4 py-3 flex-shrink-0">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <div className="bg-white/20 p-1.5 rounded-md">
                                        <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m5 14v-5a2 2 0 00-2-2H6a2 2 0 00-2 2v5a2 2 0 002 2h12a2 2 0 002-2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-white">Process Return</h3>
                                        <p className="text-pink-100 text-xs">Specify quantities for returned items</p>
                                    </div>
                                </div>
                                <button
                                    onClick={closeReturnModal}
                                    className="text-white/80 hover:text-white hover:bg-white/20 p-1.5 rounded-md transition-colors"
                                >
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Content - Scrollable */}
                        <div className="flex-1 overflow-y-auto">
                            <div className="p-3">
                                {/* Order Info */}
                                <div className="bg-gray-50 rounded-md p-3 mb-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">Order ID</p>
                                            <p className="font-semibold text-gray-900 text-sm">#{order._id.slice(-8).toUpperCase()}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">Customer</p>
                                            <p className="font-semibold text-gray-900 text-sm break-all">
                                                {order.isGuestOrder && order.guestInfo?.phone
                                                    ? order.guestInfo.phone
                                                    : order.orderType === 'manual' && order.manualOrderInfo?.phone
                                                        ? order.manualOrderInfo.phone
                                                        : order.user?.email || 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Instructions */}
                                <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-3">
                                    <div className="flex items-start space-x-2">
                                        <svg className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <div>
                                            <h4 className="text-xs font-semibold text-blue-900 mb-1">Instructions</h4>
                                            <p className="text-xs text-blue-700">
                                                Enter the quantity of each item being returned. Only the specified quantities will be added back to inventory.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2 mb-3">
                                    {order.items.map((item, index) => (
                                        <div key={index} className="border border-gray-200 rounded-md p-3 bg-gray-50 hover:bg-gray-100 transition-colors">
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex items-start space-x-3 flex-1">
                                                    <div
                                                        className="relative flex-shrink-0"
                                                        onMouseEnter={(e) => handleImageMouseEnter(e, item.featuredImage || item.image || '/images/placeholder.png')}
                                                        onMouseMove={handleImageMouseMove}
                                                        onMouseLeave={handleImageMouseLeave}
                                                    >
                                                        <img
                                                            src={item.featuredImage || item.image || '/images/placeholder.png'}
                                                            alt={item.name}
                                                            className="h-10 w-10 rounded-md object-cover border border-white shadow-sm cursor-zoom-in"
                                                            onError={(e) => {
                                                                e.target.src = '/images/placeholder.png';
                                                            }}
                                                        />
                                                        <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-medium z-10">
                                                            {item.quantity}
                                                        </div>
                                                        {/* Zoom Popup */}
                                                        {hoveredImage === (item.featuredImage || item.image || '/images/placeholder.png') && (
                                                            <div
                                                                className="fixed z-[9999] bg-white border-2 border-gray-300 rounded-lg shadow-2xl overflow-hidden pointer-events-none"
                                                                style={{
                                                                    width: '350px',
                                                                    height: '350px',
                                                                    left: `${imagePosition.x + 20}px`,
                                                                    top: `${imagePosition.y - 175}px`,
                                                                    maxWidth: 'calc(100vw - 40px)',
                                                                    maxHeight: 'calc(100vh - 40px)'
                                                                }}
                                                            >
                                                                <img
                                                                    src={item.featuredImage || item.image || '/images/placeholder.png'}
                                                                    alt={item.name}
                                                                    className="w-full h-full object-contain"
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-semibold text-gray-900 text-sm mb-1 break-words">{item.name}</h4>
                                                        <div className="space-y-1">
                                                            <p className="text-xs text-gray-600">
                                                                <span className="font-medium">Price:</span> ৳{item.price.toLocaleString()} × {item.quantity} = ৳{(item.price * item.quantity).toLocaleString()}
                                                            </p>
                                                            {item.variant && (
                                                                <p className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-md inline-block">
                                                                    <span className="font-medium">Variant:</span> {item.variant.name}
                                                                    <span className="text-gray-500 ml-1">(SKU: {item.variant.sku})</span>
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-white rounded-md p-2 border border-gray-200">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-2">
                                                        <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
                                                            Return Quantity:
                                                        </label>
                                                        <div className="relative">
                                                            <input
                                                                type="text"
                                                                value={returnQuantities[index] || 0}
                                                                onChange={(e) => {
                                                                    const value = e.target.value;
                                                                    // Allow only numbers
                                                                    if (value === '' || /^\d+$/.test(value)) {
                                                                        const numValue = parseInt(value) || 0;
                                                                        handleReturnQuantityChange(index, numValue);
                                                                    }
                                                                }}
                                                                className="w-16 px-2 py-1 border border-gray-300 rounded-md text-center font-medium text-gray-900 focus:ring-2 focus:ring-pink-600 focus:border-pink-600 transition-colors text-sm"
                                                                placeholder="0"
                                                            />
                                                        </div>
                                                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md whitespace-nowrap">
                                                            Max: {item.quantity}
                                                        </span>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xs text-gray-500">Ordered</p>
                                                        <p className="font-bold text-gray-900 text-sm">{item.quantity}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Footer - Fixed */}
                        <div className="bg-gray-50 px-3 py-2 border-t border-gray-200 flex-shrink-0">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
                                <div className="text-xs text-gray-600 text-center sm:text-left">
                                    <span className="font-medium">Total Items:</span> {order.items.length} |
                                    <span className="font-medium ml-2">Returning:</span> {Object.values(returnQuantities).filter(qty => qty > 0).length} items
                                </div>
                                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                                    <button
                                        onClick={closeReturnModal}
                                        className="w-full sm:w-auto px-4 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleReturnSubmit}
                                        disabled={updatingStatus}
                                        className={`w-full sm:w-auto px-4 py-1.5 rounded-md text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-600 transition-colors ${updatingStatus
                                            ? 'bg-gray-400 cursor-not-allowed'
                                            : 'bg-gradient-to-r from-pink-600 to-red-500 hover:from-pink-600 hover:to-red-600 shadow-lg'
                                            }`}
                                    >
                                        {updatingStatus ? (
                                            <div className="flex items-center justify-center space-x-2">
                                                <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                <span>Processing...</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-center space-x-2">
                                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m5 14v-5a2 2 0 00-2-2H6a2 2 0 00-2 2v5a2 2 0 002 2h12a2 2 0 002-2z" />
                                                </svg>
                                                <span>Process Return</span>
                                            </div>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Error Modal */}
            {apiError && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                        <div className="bg-red-50 p-6 flex flex-col items-center text-center border-b border-red-100">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 shadow-inner">
                                <AlertCircle className="h-8 w-8 text-red-600" />
                            </div>
                            <h3 className="text-xl font-bold text-red-900 mb-2">
                                {apiError.title}
                            </h3>
                            <p className="text-red-700 text-sm font-medium px-4">
                                {apiError.message}
                            </p>
                        </div>

                        <div className="p-6 bg-white flex flex-col space-y-4">
                            <p className="text-sm text-gray-600 text-center">
                                Please check your configuration or try again later. If the problem persists, contact support.
                            </p>
                            <button
                                onClick={() => setApiError(null)}
                                className="w-full py-3 px-4 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-medium transition-colors shadow-md shadow-gray-900/20 active:scale-[0.98]"
                            >
                                Close & Continue
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Print Label Modal */}
            {isPrintModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 overflow-y-auto">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md mx-auto my-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-gray-900">Print Shipping Label</h3>
                            <button
                                onClick={handleClosePrintModal}
                                className="text-gray-400 hover:text-gray-600 cursor-pointer"
                            >
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Printable Area */}
                        <div className="bg-gray-100 p-4 rounded-lg flex justify-center mb-6 overflow-x-auto relative">
                            {/* Hidden style for print layout specifically */}
                            <style type="text/css" media="print">
                                {`
                                    @page { size: 3in 3in; margin: 0; }
                                    body { margin: 0; padding: 0; background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                                    .print-container { width: 3in !important; height: 3in !important; margin: 0 !important; border: none !important; box-shadow: none !important; }
                                `}
                            </style>

                            <div
                                ref={printRef}
                                className="bg-white border border-gray-300 print-container"
                                style={{
                                    width: '300px', // Fallback for screen
                                    height: '300px', // Fallback for screen
                                    padding: '12px',
                                    fontFamily: 'Arial, sans-serif',
                                    color: '#000',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    boxSizing: 'border-box'
                                }}
                            >
                                {/* Header */}
                                <div style={{ borderBottom: '2px solid #000', paddingBottom: '5px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ fontWeight: 'bold', fontSize: '18px' }}>Pinkspot</div>
                                    <div style={{ fontSize: '10px', textAlign: 'right' }}>
                                        <div>Merchant ID</div>
                                        <div style={{ fontWeight: 'bold' }}>71701</div>
                                    </div>
                                </div>

                                {/* Barcode */}
                                <div style={{ textAlign: 'center', marginBottom: '8px', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Barcode
                                        value={order.steadfastConsignmentId || 'N/A'}
                                        width={1.5}
                                        height={45}
                                        fontSize={16}
                                        fontOptions="bold"
                                        margin={0}
                                        displayValue={true}
                                    />
                                </div>

                                {/* Customer Info */}
                                <div style={{ borderTop: '1px solid #ccc', paddingTop: '6px', fontSize: '11px', flex: 1 }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <tbody>
                                            <tr>
                                                <td style={{ width: '50px', color: '#555', verticalAlign: 'top', paddingBottom: '3px' }}>Name</td>
                                                <td style={{ fontWeight: 'bold', paddingBottom: '3px', color: '#000' }}>
                                                    {order.isGuestOrder && order.guestInfo?.name
                                                        ? order.guestInfo.name
                                                        : order.orderType === 'manual' && order.manualOrderInfo?.name
                                                            ? order.manualOrderInfo.name
                                                            : order.user ? (order.user.name || 'Registered User') : 'Guest User'}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style={{ color: '#555', verticalAlign: 'top', paddingBottom: '3px' }}>Phone</td>
                                                <td style={{ fontWeight: 'bold', paddingBottom: '3px', color: '#000' }}>
                                                    {order.isGuestOrder && order.guestInfo?.phone
                                                        ? order.guestInfo.phone
                                                        : order.orderType === 'manual' && order.manualOrderInfo?.phone
                                                            ? order.manualOrderInfo.phone
                                                            : order.user?.phone || 'N/A'}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style={{ color: '#555', verticalAlign: 'top' }}>Address</td>
                                                <td style={{ fontWeight: 'bold', lineHeight: '1.3', color: '#000' }}>
                                                    {order.shippingAddress?.street}, {order.shippingAddress?.city}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                {/* COD Amount */}
                                <div style={{ border: '2px solid #000', padding: '6px 10px', marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff' }}>
                                    <div style={{ fontSize: '11px', fontWeight: 'bold' }}>CASH ON DELIVERY</div>
                                    <div style={{ fontSize: '18px', fontWeight: 'bold' }}>৳ {
                                        order.paymentStatus === 'pending'
                                            ? Math.round(order.total || 0)
                                            : '0 (PAID)'
                                    }</div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={handleClosePrintModal}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                            >
                                Close
                            </button>
                            <button
                                onClick={handlePrint}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 cursor-pointer flex items-center shadow-sm"
                            >
                                <Printer className="h-4 w-4 mr-2" />
                                Print Now
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Hover Image Modal */}
            {hoveredImage && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none bg-black/10 backdrop-blur-[2px] transition-all duration-300">
                    <div className="bg-white p-3 rounded-2xl shadow-2xl animate-fade-in">
                        <img
                            src={hoveredImage}
                            alt="Product Preview"
                            className="max-w-[80vw] max-h-[80vh] w-auto h-auto object-contain rounded-lg"
                        />
                    </div>
                </div>
            )}

            {/* Barcode Scan Result Modal */}
            {scanResult && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-all duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-md w-full transform scale-100 animate-in fade-in zoom-in duration-200">
                        <div className={`h-2 w-full ${scanResult.status === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                        <div className="p-8 text-center">
                            <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full mb-6 shadow-inner ${
                                scanResult.status === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                            }`}>
                                {scanResult.status === 'success' ? (
                                    <CheckCircle className="h-10 w-10" />
                                ) : (
                                    <XCircle className="h-10 w-10" />
                                )}
                            </div>
                            <h3 className={`text-2xl font-bold mb-2 ${
                                scanResult.status === 'success' ? 'text-emerald-600' : 'text-red-600'
                            }`}>
                                {scanResult.message}
                            </h3>
                            <div className="bg-slate-50 rounded-2xl p-5 mt-6 border border-slate-100 shadow-sm text-left relative overflow-hidden">
                                <div className={`absolute top-0 right-0 w-16 h-16 transform translate-x-8 -translate-y-8 rounded-full ${
                                    scanResult.status === 'success' ? 'bg-emerald-100/50' : 'bg-red-100/50'
                                }`}></div>
                                <p className="text-xs text-slate-400 font-bold mb-1 uppercase tracking-wider relative z-10">Scanned SKU / Barcode</p>
                                <p className="text-xl font-mono font-bold text-slate-800 break-all relative z-10">{scanResult.sku}</p>
                                
                                {scanResult.itemName && (
                                    <div className="mt-4 pt-4 border-t border-slate-200 relative z-10">
                                        <p className="text-xs text-slate-400 font-bold mb-1 uppercase tracking-wider">Matched Item in Order</p>
                                        <p className="text-base font-semibold text-slate-700 leading-tight">{scanResult.itemName}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Presence Warning Modal */}
            {showPresenceWarning && otherActiveUsers.length > 0 && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-yellow-400"></div>
                        <div className="flex items-start mb-5">
                            <div className="flex-shrink-0 bg-yellow-100 rounded-full p-3 mr-4">
                                <AlertTriangle className="h-6 w-6 text-yellow-600" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-1">Staff Currently Viewing</h3>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    The following staff members are also currently viewing this order page:
                                </p>
                            </div>
                        </div>
                        
                        <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-100">
                            <ul className="space-y-3">
                                {otherActiveUsers.map((activeUser, idx) => (
                                    <li key={idx} className="flex items-center text-sm font-medium text-slate-800">
                                        <div className="w-2 h-2 rounded-full bg-yellow-500 mr-3 animate-pulse"></div>
                                        {activeUser.name} <span className="ml-2 px-2 py-0.5 rounded text-xs bg-slate-200 text-slate-600 capitalize">{activeUser.role}</span>
                                    </li>
                                ))}
                            </ul>
                            <p className="text-xs text-red-500 mt-4 font-semibold italic flex items-center">
                                <Info className="w-3 h-3 mr-1" />
                                Please coordinate to avoid conflicting updates!
                            </p>
                        </div>
                        
                        <div className="flex justify-end">
                            <button
                                onClick={() => setShowPresenceWarning(false)}
                                className="px-5 py-2.5 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors shadow-sm cursor-pointer"
                            >
                                Close & View Anyway
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
