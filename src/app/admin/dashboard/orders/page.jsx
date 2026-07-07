'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Eye, Trash2, Package, Calendar, User, MapPin, CreditCard, Mail, Edit, MoreVertical, Copy, Download, Truck, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { formatDateForTable } from '@/utils/formatDate';
import { orderAPI, settingsAPI } from '@/services/api';
import { getCookie } from 'cookies-next';
import PermissionDenied from '@/components/Common/PermissionDenied';
import { useAppContext } from '@/context/AppContext';
import DeleteConfirmationModal from '@/components/Common/DeleteConfirmationModal';

export default function AdminOrdersPage() {
    const { hasPermission, loading: contextLoading } = useAppContext();
    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [permissionError, setPermissionError] = useState(null);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [newStatus, setNewStatus] = useState('');
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [orderToDelete, setOrderToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [openDropdownId, setOpenDropdownId] = useState(null);
    const [dropdownPosition, setDropdownPosition] = useState({});
    const buttonRefs = useRef({});
    const [contextMenu, setContextMenu] = useState({ open: false, orderId: null, x: 0, y: 0, hasSelection: false });
    const [showExportModal, setShowExportModal] = useState(false);
    const [exportStartDate, setExportStartDate] = useState('');
    const [exportEndDate, setExportEndDate] = useState('');
    const [exporting, setExporting] = useState(false);
    const [addingToSteadfast, setAddingToSteadfast] = useState(false);
    const [orderAddingToSteadfast, setOrderAddingToSteadfast] = useState(null);
    const [showSteadfastModal, setShowSteadfastModal] = useState(false);
    const [orderToAddToSteadfast, setOrderToAddToSteadfast] = useState(null);
    const [showDuplicateModal, setShowDuplicateModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successData, setSuccessData] = useState(null);
    const [captchaValue, setCaptchaValue] = useState('');
    const [captchaMatch, setCaptchaMatch] = useState('');
    const [settings, setSettings] = useState(null);
    const [showColorModal, setShowColorModal] = useState(false);
    const [orderSourceColors, setOrderSourceColors] = useState({});

    // Filter states
    const [filters, setFilters] = useState({
        search: '', // Unified search for orderId, email, phone
        status: 'all',
        startDate: '', // Date range start
        endDate: '', // Date range end
        orderSource: 'all', // Order source filter
        dateRange: 'custom' // Quick date range
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

    // Check permission and fetch settings on mount
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

    // Refetch orders when filters or pagination changes (debounced)
    // This single useEffect handles all data fetching to prevent duplicate calls
    useEffect(() => {
        // Don't fetch if still loading context or no permission
        if (contextLoading || !hasPermission('order', 'read')) {
            return;
        }

        const timeoutId = setTimeout(() => {
            fetchOrders();
        }, 500); // 500ms debounce

        return () => clearTimeout(timeoutId);
    }, [filters.search, filters.status, filters.startDate, filters.endDate, filters.orderSource, pagination.currentPage, pagination.itemsPerPage, contextLoading, hasPermission]);

    const fetchOrders = async () => {
        try {
            const token = getCookie('token');
            setLoading(true);

            // Build query parameters - all filtering done server-side
            const params = new URLSearchParams({
                page: pagination.currentPage.toString(),
                limit: pagination.itemsPerPage.toString()
            });

            // Add status filter if not 'all'
            if (filters.status && filters.status !== 'all') {
                params.append('status', filters.status);
            }

            // Add order source filter if not 'all'
            if (filters.orderSource && filters.orderSource !== 'all') {
                params.append('orderSource', filters.orderSource);
            }

            // Add unified search filter (searches orderId, email, phone)
            if (filters.search && filters.search.trim()) {
                params.append('search', filters.search.trim());
            }

            // Add date range filters
            if (filters.startDate) {
                params.append('startDate', filters.startDate);
            }
            if (filters.endDate) {
                params.append('endDate', filters.endDate);
            }

            const data = await orderAPI.getAdminOrders(token, params.toString());

            if (data.success) {
                // Server-side filtering - directly use returned data
                setOrders(data.data);
                setFilteredOrders(data.data); // Server has already filtered
                setPermissionError(null);

                // Update pagination info
                if (data.pagination) {
                    setPagination(prev => ({
                        ...prev,
                        ...data.pagination
                    }));
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
                    toast.error('Failed to fetch orders');
                }
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
            // Check if it's a 403 error (permission denied)
            if (error.status === 403 || error.response?.status === 403) {
                const errorMessage = error.response?.data?.message || error.message || 'You don\'t have permission to access this resource.';
                setPermissionError({
                    message: errorMessage,
                    action: 'Read Orders'
                });
            } else {
                toast.error('Error fetching orders');
            }
        } finally {
            setLoading(false);
        }
    };

    // No client-side filtering needed - all filtering done server-side

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));

        // If status or orderSource filter changes, reset to page 1 and refetch
        if (key === 'status' || key === 'orderSource' || key === 'dateRange') {
            setPagination(prev => ({
                ...prev,
                currentPage: 1
            }));
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
            search: '',
            status: 'all',
            startDate: '',
            endDate: '',
            orderSource: 'all',
            dateRange: 'custom'
        });
        setPagination(prev => ({
            ...prev,
            currentPage: 1
        }));
    };

    const handlePageChange = (newPage) => {
        setPagination(prev => ({
            ...prev,
            currentPage: newPage
        }));
    };

    const handleItemsPerPageChange = (newItemsPerPage) => {
        setPagination(prev => ({
            ...prev,
            itemsPerPage: parseInt(newItemsPerPage),
            currentPage: 1
        }));
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'confirmed':
                return 'bg-blue-100 text-blue-800';
            case 'processing':
                return 'bg-purple-100 text-purple-800';
            case 'shipped':
                return 'bg-indigo-100 text-indigo-800';
            case 'delivered':
                return 'bg-green-100 text-green-800';
            case 'cancelled':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getPaymentStatusColor = (status) => {
        switch (status) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'paid':
                return 'bg-green-100 text-green-800';
            case 'failed':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getOrderSourceLabel = (source) => {
        if (!source) return 'N/A';
        const labels = {
            'website': 'Website',
            'facebook': 'Facebook',
            'whatsapp': 'WhatsApp',
            'phone': 'Phone Call',
            'email': 'Email',
            'walk-in': 'Walk-in',
            'instagram': 'Instagram',
            'manual': 'Manual',
            'other': 'Other'
        };
        return labels[source] || source;
    };

    // Calculate dropdown position based on available space (floating style - fixed positioning)
    const calculateDropdownPosition = (orderId) => {
        const buttonElement = buttonRefs.current[orderId];
        if (!buttonElement) return { top: 0, left: 0, position: 'fixed' };

        const rect = buttonElement.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        const dropdownHeight = 200; // Approximate height of dropdown
        const dropdownWidth = 192; // w-48 = 192px
        const gap = 8; // Gap between button and dropdown

        let position = {
            position: 'fixed',
            top: 0,
            left: 0,
            zIndex: 9999
        };

        // Vertical positioning: check if there's enough space below
        const spaceBelow = viewportHeight - rect.bottom;
        const spaceAbove = rect.top;

        if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
            // Open above - position from bottom of viewport
            position.bottom = `${viewportHeight - rect.top + gap}px`;
            position.top = 'auto';
        } else {
            // Open below (default) - position from top of viewport
            position.top = `${rect.bottom + gap}px`;
            position.bottom = 'auto';
        }

        // Horizontal positioning: align to right edge of button by default
        const spaceRight = viewportWidth - rect.right;

        if (spaceRight < dropdownWidth) {
            // Not enough space on right, align to left edge of button
            position.left = `${rect.left}px`;
            position.right = 'auto';
        } else {
            // Default: align to right edge of button
            position.right = `${viewportWidth - rect.right}px`;
            position.left = 'auto';
        }

        return position;
    };

    const handleDropdownToggle = (orderId) => {
        if (openDropdownId === orderId) {
            setOpenDropdownId(null);
        } else {
            setOpenDropdownId(orderId);
            setContextMenu({ open: false, orderId: null, x: 0, y: 0, hasSelection: false });
            // Calculate position after a small delay to ensure button is rendered
            setTimeout(() => {
                const position = calculateDropdownPosition(orderId);
                setDropdownPosition(prev => ({
                    ...prev,
                    [orderId]: position
                }));
            }, 0);
        }
    };

    // Handle right-click context menu
    const handleContextMenu = (e, orderId) => {
        e.preventDefault(); // Prevent browser default context menu

        // Check if text is selected
        const selection = window.getSelection();
        const hasSelection = selection && selection.toString().trim().length > 0;

        setContextMenu({
            open: true,
            orderId: orderId,
            x: e.clientX,
            y: e.clientY,
            hasSelection: hasSelection
        });

        // Close dropdown menu if open
        if (openDropdownId) {
            setOpenDropdownId(null);
        }
    };

    // Handle copy to clipboard
    const handleCopy = async () => {
        const selection = window.getSelection();
        if (selection && selection.toString().trim().length > 0) {
            try {
                await navigator.clipboard.writeText(selection.toString());
                toast.success('Copied to clipboard');
            } catch (err) {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = selection.toString();
                textArea.style.position = 'fixed';
                textArea.style.opacity = '0';
                document.body.appendChild(textArea);
                textArea.select();
                try {
                    document.execCommand('copy');
                    toast.success('Copied to clipboard');
                } catch (err) {
                    toast.error('Failed to copy');
                }
                document.body.removeChild(textArea);
            }
        }
        setContextMenu({ open: false, orderId: null, x: 0, y: 0, hasSelection: false });
    };

    // Calculate context menu position
    const getContextMenuPosition = () => {
        if (!contextMenu.open) return {};

        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const menuWidth = 240; // w-60 (15rem = 240px)
        const menuHeight = contextMenu.hasSelection ? 250 : 200; // Approximate

        let left = contextMenu.x;
        let top = contextMenu.y;

        // Adjust if menu would go off screen
        if (left + menuWidth > viewportWidth) {
            left = viewportWidth - menuWidth - 10;
        }
        if (top + menuHeight > viewportHeight) {
            top = viewportHeight - menuHeight - 10;
        }

        return {
            position: 'fixed',
            left: `${left}px`,
            top: `${top}px`,
            zIndex: 9999
        };
    };

    // Close dropdown and context menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (openDropdownId && !event.target.closest('.dropdown-menu-container')) {
                setOpenDropdownId(null);
            }
            if (contextMenu.open && !event.target.closest('.context-menu-container')) {
                setContextMenu({ open: false, orderId: null, x: 0, y: 0, hasSelection: false });
            }
        };
        // Use click instead of mousedown to allow link clicks to register first
        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [openDropdownId, contextMenu.open]);

    // Recalculate position on scroll or resize (for relative positioning, less critical but still useful)
    useEffect(() => {
        if (openDropdownId) {
            const handleResize = () => {
                const position = calculateDropdownPosition(openDropdownId);
                setDropdownPosition(prev => ({
                    ...prev,
                    [openDropdownId]: position
                }));
            };

            window.addEventListener('resize', handleResize);
            // For relative positioning, scroll is less critical but we'll keep it for vertical adjustment
            window.addEventListener('scroll', handleResize, true);

            return () => {
                window.removeEventListener('resize', handleResize);
                window.removeEventListener('scroll', handleResize, true);
            };
        }
    }, [openDropdownId]);

    const handleDeleteOrder = (orderId) => {
        const order = orders.find(o => o._id === orderId);
        setOrderToDelete(order);
        setShowDeleteModal(true);
    };

    // Generate random captcha
    const generateCaptcha = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let result = '';
        for (let i = 0; i < 5; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    };

    const handleAddToSteadfastClick = (orderId) => {
        if (!hasPermission('order', 'update')) {
            toast.error("You don't have permission to update orders");
            return;
        }

        const order = orders.find(o => o._id === orderId);
        if (!order) {
            toast.error('Order not found');
            return;
        }

        if (order.status !== 'processing') {
            toast.error('Only orders with "processing" status can be added to Steadfast');
            return;
        }

        // If already added, show duplicate modal
        if (order.isAddedIntoSteadfast) {
            setOrderToAddToSteadfast(order);
            setCaptchaMatch(generateCaptcha());
            setCaptchaValue('');
            setShowDuplicateModal(true);
            setOpenDropdownId(null);
            return;
        }

        setOrderToAddToSteadfast(order);
        setShowSteadfastModal(true);
        setOpenDropdownId(null);
    };

    const confirmAddToSteadfast = async () => {
        if (!orderToAddToSteadfast) return;

        const orderId = orderToAddToSteadfast._id;

        try {
            setAddingToSteadfast(true);
            setOrderAddingToSteadfast(orderId);
            const token = getCookie('token');
            const response = await orderAPI.addOrderToSteadfast(orderId, token);

            if (response.success) {
                // Update order in local state (status changes to shipped when added to Steadfast)
                const updatedOrders = orders.map(o =>
                    o._id === orderId
                        ? {
                            ...o,
                            isAddedIntoSteadfast: true,
                            status: 'shipped',
                            steadfastConsignmentId: response.data?.order?.steadfastConsignmentId,
                            steadfastTrackingCode: response.data?.order?.steadfastTrackingCode
                        }
                        : o
                );
                setOrders(updatedOrders);
                setFilteredOrders(updatedOrders);

                // Show success modal with tracking info
                setSuccessData({
                    consignmentId: response.data?.order?.steadfastConsignmentId || response.data?.steadfastResponse?.consignment?.consignment_id,
                    trackingCode: response.data?.order?.steadfastTrackingCode || response.data?.steadfastResponse?.consignment?.tracking_code
                });
                setShowSteadfastModal(false);
                setShowDuplicateModal(false);
                setOrderToAddToSteadfast(null);
                setShowSuccessModal(true);
            } else {
                toast.error(response.message || 'Failed to add order to Steadfast');
            }
        } catch (error) {
            console.error('Error adding order to Steadfast:', error);
            if (error.status === 403 || error.response?.status === 403) {
                toast.error("You don't have permission to update orders");
            } else {
                toast.error(error.response?.data?.message || 'Error adding order to Steadfast');
            }
        } finally {
            setAddingToSteadfast(false);
            setOrderAddingToSteadfast(null);
        }
    };

    // Handle Enter key press in modal
    useEffect(() => {
        const handleKeyPress = (event) => {
            if (showSteadfastModal && event.key === 'Enter' && !addingToSteadfast) {
                event.preventDefault();
                confirmAddToSteadfast();
            }
        };

        if (showSteadfastModal) {
            document.addEventListener('keydown', handleKeyPress);
        }

        return () => {
            document.removeEventListener('keydown', handleKeyPress);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showSteadfastModal, addingToSteadfast]);

    const confirmDeleteOrder = async () => {
        if (!orderToDelete) return;

        try {
            setDeleting(true);
            const token = getCookie('token');
            const data = await orderAPI.deleteOrder(orderToDelete._id, token);

            if (data.success) {
                toast.success('Order deleted successfully!');
                setShowDeleteModal(false);
                setOrderToDelete(null);
                // Refresh orders list
                fetchOrders();
            } else {
                toast.error(data.message || 'Failed to delete order');
            }
        } catch (error) {
            console.error('Error deleting order:', error);
            if (error.status === 403 || error.response?.status === 403) {
                toast.error("You don't have permission to delete orders");
            } else {
                toast.error('Error deleting order');
            }
        } finally {
            setDeleting(false);
        }
    };

    const openStatusModal = (order) => {
        setSelectedOrder(order);
        setNewStatus(order.status);
        setIsStatusModalOpen(true);
    };

    const closeStatusModal = () => {
        setIsStatusModalOpen(false);
        setSelectedOrder(null);
        setNewStatus('');
    };

    // Get valid status transitions based on current status
    const getValidStatusTransitions = (currentStatus) => {
        const validTransitions = {
            'pending': ['confirmed', 'cancelled'],
            'confirmed': ['processing', 'cancelled'],
            'processing': ['shipped', 'cancelled'],
            'shipped': ['delivered', 'returned'],
            'delivered': ['returned'],
            'cancelled': [], // No transitions from cancelled
            'returned': [] // No transitions from returned
        };
        return validTransitions[currentStatus] || [];
    };

    // Export orders to CSV - Fetches ALL orders by making multiple API calls
    const handleExportOrders = async () => {
        if (!exportStartDate || !exportEndDate) {
            toast.error('Please select both start and end dates');
            return;
        }

        if (new Date(exportStartDate) > new Date(exportEndDate)) {
            toast.error('Start date cannot be after end date');
            return;
        }

        try {
            setExporting(true);
            const token = getCookie('token');

            // Fetch all orders by making multiple API calls (handle pagination)
            let allOrders = [];
            let currentPage = 1;
            let hasMorePages = true;
            const itemsPerPage = 200; // Fetch 100 at a time for better performance

            toast.loading('Fetching orders...', { id: 'export-loading' });

            while (hasMorePages) {
                // Build query parameters for each page
                const params = new URLSearchParams({
                    page: currentPage.toString(),
                    limit: itemsPerPage.toString(),
                    startDate: exportStartDate,
                    endDate: exportEndDate
                });

                // Add status filter if not 'all'
                if (filters.status && filters.status !== 'all') {
                    params.append('status', filters.status);
                }

                // Add search filter if exists
                if (filters.search && filters.search.trim()) {
                    params.append('search', filters.search.trim());
                }

                const data = await orderAPI.getAdminOrders(token, params.toString());

                if (data.success && data.data && data.data.length > 0) {
                    allOrders = [...allOrders, ...data.data];

                    // Check if there are more pages
                    if (data.pagination) {
                        hasMorePages = data.pagination.hasNextPage;
                        currentPage++;

                        // Update loading message
                        toast.loading(
                            `Fetching orders... (${allOrders.length} orders loaded)`,
                            { id: 'export-loading' }
                        );
                    } else {
                        hasMorePages = false;
                    }
                } else {
                    hasMorePages = false;
                }
            }

            toast.dismiss('export-loading');

            if (allOrders.length > 0) {
                // Convert all orders to CSV
                const csv = convertOrdersToCSV(allOrders);

                // Create download link
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                const url = URL.createObjectURL(blob);

                link.setAttribute('href', url);
                link.setAttribute('download', `orders_${exportStartDate}_to_${exportEndDate}.csv`);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                toast.success(`Exported ${allOrders.length} orders successfully!`);
                setShowExportModal(false);
                setExportStartDate('');
                setExportEndDate('');
            } else {
                toast.error('No orders found for the selected date range');
            }
        } catch (error) {
            console.error('Error exporting orders:', error);
            toast.dismiss('export-loading');
            toast.error('Failed to export orders. Please try again.');
        } finally {
            setExporting(false);
        }
    };

    // Convert orders array to CSV format
    const convertOrdersToCSV = (orders) => {
        // CSV Headers
        const headers = [
            'Order ID',
            'Date',
            'Customer Email',
            'Customer Phone',
            'Customer Name',
            'Shipping Address',
            'City',
            'Postal Code',
            'Total Amount',
            'Subtotal',
            'Shipping Cost',
            'Coupon Discount',
            'Loyalty Discount',
            'Other Discount',
            'Status',
            'Payment Status',
            'Payment Method',
            'Order Source',
            'Items Count',
            'Items Details'
        ];

        // Create CSV rows
        const rows = orders.map(order => {
            const customerEmail = order.isGuestOrder && order.guestInfo?.email
                ? order.guestInfo.email
                : order.orderType === 'manual' && order.manualOrderInfo?.email
                    ? order.manualOrderInfo.email
                    : order.user?.email || 'N/A';

            const customerPhone = order.isGuestOrder && order.guestInfo?.phone
                ? order.guestInfo.phone
                : order.orderType === 'manual' && order.manualOrderInfo?.phone
                    ? order.manualOrderInfo.phone
                    : order.user?.phone || order.shippingAddress?.phone || 'N/A';

            const customerName = order.shippingAddress?.name || order.user?.name || 'N/A';

            const shippingAddress = order.shippingAddress
                ? `${order.shippingAddress.address || ''} ${order.shippingAddress.area || ''} ${order.shippingAddress.district || ''}`.trim()
                : 'N/A';

            const city = order.shippingAddress?.city || order.shippingAddress?.district || 'N/A';
            const postalCode = order.shippingAddress?.postalCode || 'N/A';

            // Format items details
            const itemsDetails = order.items && order.items.length > 0
                ? order.items.map(item => {
                    const variantInfo = item.variant?.attributes
                        ? ` (${item.variant.attributes.map(attr => `${attr.name}: ${attr.value}`).join(', ')})`
                        : '';
                    return `${item.product?.title || 'N/A'}${variantInfo} - Qty: ${item.quantity} - Price: ৳${item.price}`;
                }).join('; ')
                : 'N/A';

            return [
                order.orderId || order._id.slice(-8).toUpperCase(),
                formatDateForTable(order.createdAt),
                customerEmail,
                customerPhone,
                customerName,
                shippingAddress,
                city,
                postalCode,
                order.total || 0,
                order.subtotal || 0,
                order.shippingCost || 0,
                order.couponDiscount || 0,
                order.loyaltyDiscount || 0,
                order.discount || 0,
                order.status || 'N/A',
                order.paymentStatus || 'N/A',
                order.paymentMethod === 'cod' ? 'Cash on Delivery' : order.paymentMethod || 'N/A',
                getOrderSourceLabel(order.orderSource),
                order.items?.length || 0,
                itemsDetails
            ];
        });

        // Escape CSV values (handle commas, quotes, newlines)
        const escapeCSV = (value) => {
            if (value === null || value === undefined) return '';
            const stringValue = String(value);
            // If value contains comma, quote, or newline, wrap in quotes and escape quotes
            if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
        };

        // Combine headers and rows
        const csvContent = [
            headers.map(escapeCSV).join(','),
            ...rows.map(row => row.map(escapeCSV).join(','))
        ].join('\n');

        return csvContent;
    };

    const handleStatusUpdate = async () => {
        if (!selectedOrder || !newStatus) return;

        // Validate status transition
        const validTransitions = getValidStatusTransitions(selectedOrder.status);
        if (!validTransitions.includes(newStatus)) {
            toast.error(`Cannot change status from ${selectedOrder.status} to ${newStatus}`);
            return;
        }

        if (!hasPermission('order', 'update')) {
            toast.error("You don't have permission to update orders");
            closeStatusModal();
            return;
        }

        try {
            setUpdatingStatus(true);
            const token = getCookie('token');
            const response = await orderAPI.updateOrderStatus(selectedOrder._id, { status: newStatus }, token);

            if (response.success) {
                toast.success('Order status updated successfully');
                // Update the order in the local state with full response data (includes paymentStatus if updated)
                const updatedOrder = response.data || { ...selectedOrder, status: newStatus };
                const updatedOrders = orders.map(order =>
                    order._id === selectedOrder._id
                        ? { ...order, ...updatedOrder }
                        : order
                );
                setOrders(updatedOrders);
                setFilteredOrders(updatedOrders);
                closeStatusModal();
            } else {
                toast.error(response.message || 'Failed to update order status');
            }
        } catch (error) {
            console.error('Error updating order status:', error);
            if (error.status === 403 || error.response?.status === 403) {
                toast.error("You don't have permission to update orders");
            } else {
                toast.error('Error updating order status');
            }
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

    // Show loading only in table area, not full page

    return (
        <div className="space-y-6">


            {/* Orders Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <h2 className="text-lg font-medium text-gray-900">All Orders</h2>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowColorModal(true)}
                            className="flex items-center justify-center p-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors cursor-pointer"
                            title="Order Source Colors Settings"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        </button>
                        <button
                            onClick={() => setShowExportModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors cursor-pointer"
                        >
                            <Download className="h-4 w-4" />
                            Export
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                        {/* Unified Search Filter */}
                        <div className="lg:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Search (Order ID, Email, Phone)
                            </label>
                            <input
                                type="text"
                                placeholder="Search by Order ID, Email, or Phone..."
                                value={filters.search}
                                onChange={(e) => {
                                    handleFilterChange('search', e.target.value);
                                    setPagination(prev => ({ ...prev, currentPage: 1 }));
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            />
                        </div>

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

                {loading || contextLoading ? (
                    <div className="p-8 text-center">
                        <div className="flex items-center justify-center">
                            <div className="flex items-center space-x-2">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                <span className="text-gray-600">Loading orders...</span>
                            </div>
                        </div>
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="p-8 text-center">
                        <Package className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">
                            {orders.length === 0 ? 'No orders found' : 'No orders match your filters'}
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                            {orders.length === 0
                                ? 'Orders will appear here once customers place them.'
                                : 'Try adjusting your search criteria or clear the filters.'
                            }
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Order ID
                                    </th>

                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Email/Phone
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Date
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Total
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Discount
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Payment
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Order Source
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredOrders.map((order) => (
                                    <tr
                                        key={order._id}
                                        className="hover:bg-gray-50/50"
                                        style={{ backgroundColor: (orderSourceColors?.[order.orderSource] && orderSourceColors[order.orderSource] !== '#ffffff') ? orderSourceColors[order.orderSource] : undefined }}
                                        onContextMenu={(e) => handleContextMenu(e, order._id)}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                {!order.isReadByAdmin && (
                                                    <span className="h-2 w-2 bg-pink-500 rounded-full" title="Unread Order"></span>
                                                )}
                                                <div className="text-sm font-medium text-gray-900">
                                                    #{order.orderId || order._id.slice(-8).toUpperCase()}
                                                </div>
                                            </div>
                                            {(order.status === 'shipped' || order.status === 'delivered') && order.isAddedIntoSteadfast && order.steadfastConsignmentId && (
                                                <a
                                                    href={`https://steadfast.com.bd/user/consignment/${order.steadfastConsignmentId}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs font-medium text-pink-600 mt-1 hover:text-pink-700 hover:underline cursor-pointer block"
                                                >
                                                    Steadfast: {order.steadfastConsignmentId}
                                                </a>
                                            )}
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <Mail className="h-4 w-4 text-gray-400 mr-2" />
                                                <div className="text-sm text-gray-900">
                                                    {order.isGuestOrder && order.guestInfo?.phone
                                                        ? order.guestInfo.phone
                                                        : order.orderType === 'manual' && order.manualOrderInfo?.phone
                                                            ? order.manualOrderInfo.phone
                                                            : order.user?.email || 'N/A'}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                                                <div className="text-sm text-gray-900">
                                                    {formatDateForTable(order.createdAt)}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                ৳{order.total}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {(order.couponDiscount > 0 || order.loyaltyDiscount > 0 || order.discount > 0) ? (
                                                    <div className="space-y-1">
                                                        {order.couponDiscount > 0 && (
                                                            <div className="text-blue-600 font-medium">
                                                                -৳{order.couponDiscount} {order.coupon && `(${order.coupon})`}
                                                            </div>
                                                        )}
                                                        {order.loyaltyDiscount > 0 && (
                                                            <div className="text-pink-600 font-medium">
                                                                -৳{order.loyaltyDiscount} (Loyalty)
                                                            </div>
                                                        )}
                                                        {order.discount > 0 && order.couponDiscount === 0 && (
                                                            <div className="text-green-600 font-medium">
                                                                -৳{order.discount}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400">No discount</span>
                                                )}
                                            </div>
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
                                            <div className="relative dropdown-menu-container">
                                                <button
                                                    ref={(el) => (buttonRefs.current[order._id] = el)}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDropdownToggle(order._id);
                                                    }}
                                                    className="inline-flex items-center p-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-md"
                                                >
                                                    <MoreVertical className="h-5 w-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {filteredOrders.length > 0 && (
                    <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                        <div className="flex items-center justify-between">
                            {/* Items per page selector */}
                            <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-700">Show:</span>
                                <select
                                    value={pagination.itemsPerPage}
                                    onChange={(e) => handleItemsPerPageChange(e.target.value)}
                                    className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value={5}>5</option>
                                    <option value={10}>10</option>
                                    <option value={25}>25</option>
                                    <option value={50}>50</option>
                                </select>
                                <span className="text-sm text-gray-700">per page</span>
                            </div>

                            {/* Pagination info */}
                            <div className="text-sm text-gray-700">
                                Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to{' '}
                                {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of{' '}
                                {pagination.totalItems} results
                            </div>

                            {/* Pagination buttons */}
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                                    disabled={!pagination.hasPrevPage}
                                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>

                                {/* Page numbers */}
                                <div className="flex items-center space-x-1">
                                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                                        let pageNum;
                                        if (pagination.totalPages <= 5) {
                                            pageNum = i + 1;
                                        } else if (pagination.currentPage <= 3) {
                                            pageNum = i + 1;
                                        } else if (pagination.currentPage >= pagination.totalPages - 2) {
                                            pageNum = pagination.totalPages - 4 + i;
                                        } else {
                                            pageNum = pagination.currentPage - 2 + i;
                                        }

                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => handlePageChange(pageNum)}
                                                className={`px-3 py-1 text-sm border rounded ${pageNum === pagination.currentPage
                                                        ? 'bg-blue-600 text-white border-blue-600'
                                                        : 'border-gray-300 hover:bg-gray-50'
                                                    }`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}
                                </div>

                                <button
                                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                                    disabled={!pagination.hasNextPage}
                                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Status Update Modal */}
            {isStatusModalOpen && selectedOrder && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-medium text-gray-900">Update Order Status</h3>
                            <button
                                onClick={closeStatusModal}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="mb-4">
                            <p className="text-sm text-gray-600 mb-2">
                                Order ID: <span className="font-medium">#{selectedOrder.orderId || selectedOrder._id.slice(-8).toUpperCase()}</span>
                            </p>
                            <p className="text-sm text-gray-600 mb-4">
                                Customer: <span className="font-medium">{selectedOrder.user?.email || 'N/A'}</span>
                            </p>

                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Current Status: <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.status)}`}>
                                    {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
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
                                <option value={selectedOrder.status}>
                                    {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)} (Current)
                                </option>
                                {getValidStatusTransitions(selectedOrder.status).map(status => (
                                    <option key={status} value={status}>
                                        {status.charAt(0).toUpperCase() + status.slice(1)}
                                    </option>
                                ))}
                            </select>
                            {getValidStatusTransitions(selectedOrder.status).length === 0 && (
                                <p className="text-xs text-gray-500 mt-1">
                                    No status changes allowed from {selectedOrder.status}
                                </p>
                            )}
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={closeStatusModal}
                                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleStatusUpdate}
                                disabled={updatingStatus || newStatus === selectedOrder.status}
                                className={`px-4 py-2 rounded-md text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${updatingStatus || newStatus === selectedOrder.status
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

            {/* Delete Confirmation Modal */}
            <DeleteConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => {
                    setShowDeleteModal(false);
                    setOrderToDelete(null);
                }}
                onConfirm={confirmDeleteOrder}
                title="Delete Order"
                message="Are you sure you want to delete this order? This will soft delete the order (mark as deleted). It will not appear in any lists but will remain in the database."
                itemName={orderToDelete ? `Order #${orderToDelete.orderId || orderToDelete._id.slice(-8).toUpperCase()}` : ''}
                itemType="order"
                isLoading={deleting}
                confirmText="Delete Order"
                cancelText="Cancel"
                dangerLevel="high"
            />

            {/* Add to Steadfast Confirmation Modal */}
            <DeleteConfirmationModal
                isOpen={showSteadfastModal}
                onClose={() => {
                    setShowSteadfastModal(false);
                    setOrderToAddToSteadfast(null);
                }}
                onConfirm={confirmAddToSteadfast}
                title="Add Order to Steadfast"
                message="Are you sure you want to add this order to Steadfast Courier? The order will be sent to Steadfast for delivery."
                itemName={orderToAddToSteadfast ? `Order #${orderToAddToSteadfast.orderId || orderToAddToSteadfast._id.slice(-8).toUpperCase()}` : ''}
                itemType=""
                isLoading={addingToSteadfast}
                confirmText="Add to Steadfast"
                cancelText="Cancel"
                dangerLevel="medium"
            />

            {/* Duplicate Order Modal */}
            {showDuplicateModal && orderToAddToSteadfast && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-orange-100 rounded-full">
                                    <AlertTriangle className="h-6 w-6 text-orange-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Order Already Added to Steadfast
                                </h3>
                            </div>
                            <button
                                onClick={() => {
                                    setShowDuplicateModal(false);
                                    setOrderToAddToSteadfast(null);
                                    setCaptchaValue('');
                                    setCaptchaMatch('');
                                }}
                                disabled={addingToSteadfast}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50 cursor-pointer"
                            >
                                <X className="h-5 w-5 text-gray-500" />
                            </button>
                        </div>

                        <div className="p-6">
                            <p className="text-gray-600 mb-4">
                                This order has already been added to Steadfast Courier. The system detected a duplicate order.
                            </p>
                            <p className="text-gray-700 mb-4">
                                <strong>Order:</strong> #{orderToAddToSteadfast.orderId || orderToAddToSteadfast._id.slice(-8).toUpperCase()}
                            </p>
                            <p className="text-sm text-gray-600 mb-6">
                                If you delete or want to add as a new entry, then you can add from here. Please confirm by matching the captcha below.
                            </p>

                            {/* Captcha */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Match Captcha: <span className="font-mono text-lg font-bold text-orange-600">{captchaMatch}</span>
                                </label>
                                <input
                                    type="text"
                                    value={captchaValue}
                                    onChange={(e) => setCaptchaValue(e.target.value.toUpperCase())}
                                    placeholder="Enter captcha"
                                    disabled={addingToSteadfast}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 uppercase font-mono"
                                    maxLength={5}
                                />
                            </div>

                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowDuplicateModal(false);
                                        setOrderToAddToSteadfast(null);
                                        setCaptchaValue('');
                                        setCaptchaMatch('');
                                    }}
                                    disabled={addingToSteadfast}
                                    className="px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (captchaValue !== captchaMatch) {
                                            toast.error('Captcha does not match');
                                            return;
                                        }
                                        confirmAddToSteadfast();
                                    }}
                                    disabled={addingToSteadfast || captchaValue !== captchaMatch}
                                    className="px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer inline-flex items-center"
                                >
                                    {addingToSteadfast ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            Adding...
                                        </>
                                    ) : (
                                        <>
                                            <Truck className="h-4 w-4 mr-2" />
                                            Add to Steadfast
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Success Modal */}
            {showSuccessModal && successData && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-green-100 rounded-full">
                                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Order Added Successfully
                                </h3>
                            </div>
                            <button
                                onClick={() => {
                                    setShowSuccessModal(false);
                                    setSuccessData(null);
                                }}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
                            >
                                <X className="h-5 w-5 text-gray-500" />
                            </button>
                        </div>

                        <div className="p-6">
                            <p className="text-gray-600 mb-4">
                                Order has been successfully added to Steadfast Courier for delivery.
                            </p>

                            {/* Consignment ID */}
                            {successData.consignmentId && (
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Consignment ID:
                                    </label>
                                    <div className="flex items-center space-x-2">
                                        <span className="px-3 py-2 bg-gray-100 rounded-md font-mono text-sm flex-1">
                                            {successData.consignmentId}
                                        </span>
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(successData.consignmentId);
                                                toast.success('Consignment ID copied!');
                                            }}
                                            className="p-2 hover:bg-gray-200 rounded-md transition-colors cursor-pointer"
                                            title="Copy Consignment ID"
                                        >
                                            <Copy className="h-4 w-4 text-gray-600" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Tracking Code */}
                            {successData.trackingCode && (
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Tracking Code:
                                    </label>
                                    <div className="flex items-center space-x-2">
                                        <span className="px-3 py-2 bg-gray-100 rounded-md font-mono text-sm flex-1">
                                            {successData.trackingCode}
                                        </span>
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(successData.trackingCode);
                                                toast.success('Tracking code copied!');
                                            }}
                                            className="p-2 hover:bg-gray-200 rounded-md transition-colors cursor-pointer"
                                            title="Copy Tracking Code"
                                        >
                                            <Copy className="h-4 w-4 text-gray-600" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Tracking URL */}
                            {successData.trackingCode && (
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Tracking URL:
                                    </label>
                                    <div className="flex items-center space-x-2">
                                        <a
                                            href={`https://steadfast.com.bd/t/${successData.trackingCode}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-3 py-2 bg-blue-50 text-blue-600 rounded-md text-sm flex-1 hover:bg-blue-100 transition-colors break-all"
                                        >
                                            https://steadfast.com.bd/t/{successData.trackingCode}
                                        </a>
                                        <button
                                            onClick={() => {
                                                const url = `https://steadfast.com.bd/t/${successData.trackingCode}`;
                                                navigator.clipboard.writeText(url);
                                                toast.success('Tracking URL copied!');
                                            }}
                                            className="p-2 hover:bg-gray-200 rounded-md transition-colors cursor-pointer"
                                            title="Copy Tracking URL"
                                        >
                                            <Copy className="h-4 w-4 text-gray-600" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowSuccessModal(false);
                                        setSuccessData(null);
                                    }}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all cursor-pointer"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Floating Dropdown Menu (Portal) */}
            {openDropdownId && typeof window !== 'undefined' && createPortal(
                <div
                    className="dropdown-menu-container w-60 bg-white rounded-md shadow-lg border border-gray-200"
                    style={dropdownPosition[openDropdownId] || {}}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="py-1">
                        {hasPermission('order', 'read') && (
                            <Link
                                href={`/admin/dashboard/orders/${openDropdownId}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const order = orders.find(o => o._id === openDropdownId);
                                    if (order && !order.isReadByAdmin) {
                                        orderAPI.markNotificationRead(openDropdownId, getCookie('token')).catch(console.error);
                                        setOrders(prev => prev.map(o => o._id === openDropdownId ? { ...o, isReadByAdmin: true } : o));
                                        window.dispatchEvent(new CustomEvent('notificationRead', { detail: openDropdownId }));
                                    }
                                    setOpenDropdownId(null);
                                }}
                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                            >
                                <Eye className="h-4 w-4 mr-2" />
                                View
                            </Link>
                        )}
                        {hasPermission('order', 'update') && (
                            <>
                                <Link
                                    href={`/admin/dashboard/orders/${openDropdownId}/edit`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const order = orders.find(o => o._id === openDropdownId);
                                        if (order && !order.isReadByAdmin) {
                                            orderAPI.markNotificationRead(openDropdownId, getCookie('token')).catch(console.error);
                                            setOrders(prev => prev.map(o => o._id === openDropdownId ? { ...o, isReadByAdmin: true } : o));
                                            window.dispatchEvent(new CustomEvent('notificationRead', { detail: openDropdownId }));
                                        }
                                        setOpenDropdownId(null);
                                    }}
                                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                                >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                </Link>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const order = orders.find(o => o._id === openDropdownId);
                                        if (order) {
                                            if (!order.isReadByAdmin) {
                                                orderAPI.markNotificationRead(openDropdownId, getCookie('token')).catch(console.error);
                                                setOrders(prev => prev.map(o => o._id === openDropdownId ? { ...o, isReadByAdmin: true } : o));
                                                window.dispatchEvent(new CustomEvent('notificationRead', { detail: openDropdownId }));
                                            }
                                            setOpenDropdownId(null);
                                            openStatusModal(order);
                                        }
                                    }}
                                    className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                                >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Status
                                </button>
                            </>
                        )}
                        {hasPermission('order', 'update') && orders.find(o => o._id === openDropdownId)?.status === 'processing' && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleAddToSteadfastClick(openDropdownId);
                                }}
                                className="w-full flex items-center px-4 py-2 text-sm text-orange-700 hover:bg-orange-50 cursor-pointer"
                            >
                                <Truck className="h-4 w-4 mr-2" />
                                {orders.find(o => o._id === openDropdownId)?.isAddedIntoSteadfast
                                    ? 'Add to Steadfast (Duplicate)'
                                    : 'Add to Steadfast'}
                            </button>
                        )}
                        {hasPermission('order', 'delete') && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenDropdownId(null);
                                    handleDeleteOrder(openDropdownId);
                                }}
                                className="w-full flex items-center px-4 py-2 text-sm text-red-700 hover:bg-red-50 cursor-pointer"
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                            </button>
                        )}
                    </div>
                </div>,
                document.body
            )}

            {/* Right-Click Context Menu (Portal) */}
            {contextMenu.open && contextMenu.orderId && typeof window !== 'undefined' && createPortal(
                <div
                    className="context-menu-container w-60 bg-white rounded-md shadow-lg border border-gray-200"
                    style={getContextMenuPosition()}
                >
                    <div className="py-1">
                        {/* Copy option if text is selected */}
                        {contextMenu.hasSelection && (
                            <button
                                onClick={handleCopy}
                                className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                            >
                                <Copy className="h-4 w-4 mr-2" />
                                Copy
                            </button>
                        )}

                        {/* Divider if copy option is shown */}
                        {contextMenu.hasSelection && (
                            <div className="border-t border-gray-200 my-1"></div>
                        )}

                        {/* Order actions */}
                        {hasPermission('order', 'read') && (
                            <Link
                                href={`/admin/dashboard/orders/${contextMenu.orderId}`}
                                onClick={() => {
                                    const order = orders.find(o => o._id === contextMenu.orderId);
                                    if (order && !order.isReadByAdmin) {
                                        orderAPI.markNotificationRead(contextMenu.orderId, getCookie('token')).catch(console.error);
                                        setOrders(prev => prev.map(o => o._id === contextMenu.orderId ? { ...o, isReadByAdmin: true } : o));
                                        window.dispatchEvent(new CustomEvent('notificationRead', { detail: contextMenu.orderId }));
                                    }
                                    setContextMenu({ open: false, orderId: null, x: 0, y: 0, hasSelection: false });
                                }}
                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                            >
                                <Eye className="h-4 w-4 mr-2" />
                                View
                            </Link>
                        )}
                        {hasPermission('order', 'update') && (
                            <>
                                <Link
                                    href={`/admin/dashboard/orders/${contextMenu.orderId}/edit`}
                                    onClick={() => {
                                        const order = orders.find(o => o._id === contextMenu.orderId);
                                        if (order && !order.isReadByAdmin) {
                                            orderAPI.markNotificationRead(contextMenu.orderId, getCookie('token')).catch(console.error);
                                            setOrders(prev => prev.map(o => o._id === contextMenu.orderId ? { ...o, isReadByAdmin: true } : o));
                                            window.dispatchEvent(new CustomEvent('notificationRead', { detail: contextMenu.orderId }));
                                        }
                                        setContextMenu({ open: false, orderId: null, x: 0, y: 0, hasSelection: false });
                                    }}
                                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                                >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                </Link>
                                <button
                                    onClick={() => {
                                        const order = orders.find(o => o._id === contextMenu.orderId);
                                        if (order) {
                                            if (!order.isReadByAdmin) {
                                                orderAPI.markNotificationRead(contextMenu.orderId, getCookie('token')).catch(console.error);
                                                setOrders(prev => prev.map(o => o._id === contextMenu.orderId ? { ...o, isReadByAdmin: true } : o));
                                                window.dispatchEvent(new CustomEvent('notificationRead', { detail: contextMenu.orderId }));
                                            }
                                            setContextMenu({ open: false, orderId: null, x: 0, y: 0, hasSelection: false });
                                            openStatusModal(order);
                                        }
                                    }}
                                    className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                                >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Status
                                </button>
                            </>
                        )}
                        {hasPermission('order', 'update') && orders.find(o => o._id === contextMenu.orderId)?.status === 'processing' && (
                            <button
                                onClick={() => {
                                    setContextMenu({ open: false, orderId: null, x: 0, y: 0, hasSelection: false });
                                    handleAddToSteadfastClick(contextMenu.orderId);
                                }}
                                className="w-full flex items-center px-4 py-2 text-sm text-orange-700 hover:bg-orange-50 cursor-pointer"
                            >
                                <Truck className="h-4 w-4 mr-2" />
                                {orders.find(o => o._id === contextMenu.orderId)?.isAddedIntoSteadfast
                                    ? 'Add to Steadfast (Duplicate)'
                                    : 'Add to Steadfast'}
                            </button>
                        )}
                        {hasPermission('order', 'delete') && (
                            <button
                                onClick={() => {
                                    setContextMenu({ open: false, orderId: null, x: 0, y: 0, hasSelection: false });
                                    handleDeleteOrder(contextMenu.orderId);
                                }}
                                className="w-full flex items-center px-4 py-2 text-sm text-red-700 hover:bg-red-50 cursor-pointer"
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                            </button>
                        )}
                    </div>
                </div>,
                document.body
            )}

            {/* Export Modal */}
            {showColorModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4 pb-4 border-b">
                            <h3 className="text-lg font-medium text-gray-900">Order Source Settings</h3>
                            <button
                                onClick={() => setShowColorModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="mb-4 text-sm text-gray-500">
                            Set background colors for different order sources to highlight them in the orders table.
                        </div>

                        <div className="space-y-4">
                            {['website', 'facebook', 'whatsapp', 'phone', 'email', 'walk-in', 'instagram', 'manual', 'other'].map((source) => (
                                <div key={source} className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-700 capitalize">{source.replace('-', ' ')}</span>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="color"
                                            value={orderSourceColors?.[source] || '#ffffff'}
                                            onChange={(e) => setOrderSourceColors(prev => ({ ...prev, [source]: e.target.value }))}
                                            className="h-8 w-14 cursor-pointer rounded border border-gray-300"
                                        />
                                        <button
                                            onClick={() => setOrderSourceColors(prev => ({ ...prev, [source]: '' }))}
                                            className="text-xs text-red-500 hover:text-red-700 underline"
                                        >
                                            Clear
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                            <button
                                onClick={() => setShowColorModal(false)}
                                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={async () => {
                                    try {
                                        const token = getCookie('token');
                                        const toastId = toast.loading('Saving settings...');
                                        const response = await settingsAPI.updateSettings({ orderSourceColors }, token);
                                        if (response.success) {
                                            toast.success('Settings saved successfully', { id: toastId });
                                            setShowColorModal(false);
                                            fetchSettings();
                                        } else {
                                            toast.error(response.message || 'Failed to save settings', { id: toastId });
                                        }
                                    } catch (error) {
                                        toast.error('An error occurred', { id: toastId });
                                    }
                                }}
                                className="px-4 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                            >
                                Save Settings
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showExportModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-medium text-gray-900">Export Orders</h3>
                            <button
                                onClick={() => {
                                    setShowExportModal(false);
                                    setExportStartDate('');
                                    setExportEndDate('');
                                }}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Start Date <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={exportStartDate}
                                    onChange={(e) => setExportStartDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    End Date <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={exportEndDate}
                                    onChange={(e) => setExportEndDate(e.target.value)}
                                    min={exportStartDate || undefined}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                            </div>

                            <p className="text-sm text-gray-500">
                                Orders within the selected date range will be exported as a CSV file.
                            </p>
                        </div>

                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                onClick={() => {
                                    setShowExportModal(false);
                                    setExportStartDate('');
                                    setExportEndDate('');
                                }}
                                disabled={exporting}
                                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleExportOrders}
                                disabled={exporting || !exportStartDate || !exportEndDate}
                                className={`px-4 py-2 rounded-md text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${exporting || !exportStartDate || !exportEndDate
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-blue-600 hover:bg-blue-700'
                                    }`}
                            >
                                {exporting ? 'Exporting...' : 'Export CSV'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

