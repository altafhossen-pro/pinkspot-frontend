'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAppContext } from '@/context/AppContext'
import { io } from 'socket.io-client'
import { orderAPI } from '@/services/api'
import { getCookie } from 'cookies-next'
import {
    Search,
    Bell,
    Menu,
    X,
    ChevronDown,
    LogOut,
    User,
    Settings,
    Package
} from 'lucide-react'

export default function AdminHeader({ onMobileMenuToggle }) {
    const [isSearchFocused, setIsSearchFocused] = useState(false)
    const [isProfileOpen, setIsProfileOpen] = useState(false)
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
    const [notifications, setNotifications] = useState([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [page, setPage] = useState(1)
    const [hasMore, setHasMore] = useState(false)
    const [loadingNotifications, setLoadingNotifications] = useState(false)

    const { user, logout } = useAppContext()
    const router = useRouter()
    const profileDropdownRef = useRef(null)
    const notificationDropdownRef = useRef(null)

    const handleLogout = () => {
        logout()
        router.push('/login')
    }

    // Fetch initial notifications
    const fetchNotifications = async (pageNumber = 1) => {
        try {
            setLoadingNotifications(true);
            const token = getCookie('token');
            const data = await orderAPI.getAdminNotifications(pageNumber, 10, token);
            if (data.success) {
                if (pageNumber === 1) {
                    setNotifications(data.data.notifications);
                } else {
                    setNotifications(prev => [...prev, ...data.data.notifications]);
                }
                setUnreadCount(data.data.unreadCount);
                setHasMore(data.data.hasMore);
                setPage(pageNumber);
            }
        } catch (err) {
            console.error('Failed to fetch notifications', err);
        } finally {
            setLoadingNotifications(false);
        }
    };

    // Fetch notifications on mount
    useEffect(() => {
        fetchNotifications(1);
    }, []);

    // Listen for custom read events from other components (like orders table)
    useEffect(() => {
        const handleNotificationRead = (event) => {
            const orderId = event.detail;
            
            // Re-calculate unread count based on the updated notifications array
            // Since we can't reliably know if it was ALREADY read in this context's state before the event,
            // we safely decrement it, but ensure it doesn't go below 0. 
            // We only decrement if we find it in our current state as unread.
            setNotifications(currentNotifications => {
                const isPresentAndUnread = currentNotifications.some(n => n._id === orderId && !n.isReadByAdmin);
                if (isPresentAndUnread) {
                    setUnreadCount(prev => Math.max(0, prev - 1));
                    return currentNotifications.map(o => o._id === orderId ? { ...o, isReadByAdmin: true } : o);
                }
                return currentNotifications;
            });
        };

        window.addEventListener('notificationRead', handleNotificationRead);
        return () => window.removeEventListener('notificationRead', handleNotificationRead);
    }, []);

    // Socket.io integration
    useEffect(() => {
        const socketUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace('/api/v1', '');
        const socket = io(socketUrl, {
            transports: ['websocket', 'polling']
        });

        socket.on('connect', () => {
            console.log('Connected to socket server for notifications');
        });

        socket.on('new-order', (orderData) => {
            // New socket events are unread by default
            orderData.isReadByAdmin = false;
            setNotifications(prev => [orderData, ...prev]);
            setUnreadCount(prev => prev + 1);
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
                setIsProfileOpen(false)
            }
            if (notificationDropdownRef.current && !notificationDropdownRef.current.contains(event.target)) {
                setIsNotificationsOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [])

    const handleNotificationClick = async (order) => {
        try {
            // Only API call if it's currently unread
            if (!order.isReadByAdmin) {
                const token = getCookie('token');
                await orderAPI.markNotificationRead(order._id, token);
                
                // Update local state to mark as read without removing
                setNotifications(prev => prev.map(o => 
                    o._id === order._id ? { ...o, isReadByAdmin: true } : o
                ));
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
            
            setIsNotificationsOpen(false);
            // Navigate to order details
            router.push(`/admin/dashboard/orders/${order._id}`);
        } catch (err) {
            console.error('Failed to mark order as read', err);
            router.push(`/admin/dashboard/orders/${order._id}`);
        }
    }

    return (
        <header className="bg-white border-b border-gray-200 shadow-sm">
            <div className="flex items-center justify-between h-16 px-6">
                {/* Left Side - Mobile Menu + Search */}
                <div className="flex items-center flex-1">
                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                        onClick={onMobileMenuToggle}
                    >
                        <Menu className="h-6 w-6" />
                    </button>

                    {/* Search Bar */}
                    <div className="max-w-lg mx-4 w-full">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className={`h-5 w-5 transition-colors ${isSearchFocused ? 'text-blue-500' : 'text-gray-400'
                                    }`} />
                            </div>
                            <input
                                type="text"
                                className={`block w-full pl-10 pr-3 py-2 border rounded-lg text-sm placeholder-gray-500 transition-all duration-200 ${isSearchFocused
                                    ? 'border-blue-300 ring-2 ring-blue-100'
                                    : 'border-gray-300 hover:border-gray-400'
                                    } focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100`}
                                placeholder="Search products, orders, customers..."
                                onFocus={() => setIsSearchFocused(true)}
                                onBlur={() => setIsSearchFocused(false)}
                            />
                        </div>
                    </div>
                </div>

                {/* Right Side - Notifications + Profile */}
                <div className="flex items-center space-x-4">
                    {/* Notifications */}
                    {/* Notifications */}
                    <div className="relative" ref={notificationDropdownRef}>
                        <button
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors relative cursor-pointer"
                            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                        >
                            <Bell className="h-6 w-6" />
                            {/* Notification Badge */}
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </span>
                            )}
                        </button>

                        {/* Notifications Dropdown */}
                        {isNotificationsOpen && (
                            <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
                                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                                    <h3 className="text-sm font-semibold text-gray-800">Notifications</h3>
                                    {unreadCount > 0 && (
                                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">{unreadCount} New</span>
                                    )}
                                </div>
                                <div className="max-h-96 overflow-y-auto">
                                    {notifications.length > 0 ? (
                                        <>
                                            {notifications.map((order) => {
                                                const totalWithShipping = order.total + (order.shippingCost || 0);
                                                const customerPhone = order.phone || (order.user?.phone || order.guestInfo?.phone || '');
                                                return (
                                                <div
                                                    key={order._id}
                                                    onClick={() => handleNotificationClick(order)}
                                                    className={`px-4 py-3 border-b border-gray-100 cursor-pointer transition-colors relative ${order.isReadByAdmin ? 'hover:bg-gray-50' : 'bg-blue-50/50 hover:bg-blue-100'}`}
                                                >
                                                    {!order.isReadByAdmin && (
                                                        <div className="absolute top-4 right-4 w-2 h-2 bg-pink-500 rounded-full"></div>
                                                    )}
                                                    <div className="flex items-start gap-3">
                                                        <div className={`p-2 rounded-full ${order.isReadByAdmin ? 'bg-gray-100 text-gray-500' : 'bg-blue-100 text-blue-600'}`}>
                                                            <Package className="h-4 w-4" />
                                                        </div>
                                                        <div className="flex-1 pr-4">
                                                            <p className={`text-sm font-medium ${order.isReadByAdmin ? 'text-gray-600' : 'text-gray-800'}`}>New Order #{order.orderId}</p>
                                                            <p className="text-xs text-gray-500 mt-1 truncate">
                                                                From: {order.customerName || (order.user?.name || order.guestInfo?.name || 'Customer')}
                                                            </p>
                                                            {customerPhone && (
                                                                <p className="text-xs text-gray-400 mt-0.5">{customerPhone}</p>
                                                            )}
                                                            <p className={`text-xs font-semibold mt-1 ${order.isReadByAdmin ? 'text-gray-500' : 'text-blue-600'}`}>
                                                                ৳{totalWithShipping}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )})}
                                            
                                            {hasMore && (
                                                <div className="p-3 text-center border-t border-gray-100 bg-gray-50">
                                                    <button 
                                                        onClick={() => fetchNotifications(page + 1)}
                                                        disabled={loadingNotifications}
                                                        className="text-xs text-blue-600 font-medium hover:text-blue-800 disabled:opacity-50"
                                                    >
                                                        {loadingNotifications ? 'Loading...' : 'Load More'}
                                                    </button>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="px-4 py-6 text-center text-gray-500 text-sm">
                                            No notifications found
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Profile Dropdown */}
                    <div className="relative" ref={profileDropdownRef}>
                        <button
                            className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                        >
                            <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                                <span className="text-white text-sm font-medium">
                                    {user?.name?.charAt(0)?.toUpperCase() || 'A'}
                                </span>
                            </div>
                            <span className="hidden md:block text-sm font-medium text-gray-700">
                                {user?.name || 'Admin User'}
                            </span>
                            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''
                                }`} />
                        </button>

                        {/* Profile Dropdown Menu */}
                        {isProfileOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
                                <a
                                    href="#"
                                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                    <User className="h-4 w-4 mr-2" />
                                    Profile
                                </a>
                                <a
                                    href="#"
                                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                    <Settings className="h-4 w-4 mr-2" />
                                    Settings
                                </a>
                                <hr className="my-1" />
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                >
                                    <LogOut className="h-4 w-4 mr-2" />
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

        </header>
    )
}