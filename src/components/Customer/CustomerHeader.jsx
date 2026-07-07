'use client'

import { useState } from 'react'
import { useAppContext } from '@/context/AppContext'
import Link from 'next/link'
import {
    Search,
    Bell,
    Menu,
    X,
    ChevronDown,
    LogOut,
    User,
    Settings,
    ShoppingCart,
    Heart
} from 'lucide-react'

export default function CustomerHeader() {
    const { user, logout, cartCount, wishlistCount } = useAppContext()
    const [isSearchFocused, setIsSearchFocused] = useState(false)
    const [isProfileOpen, setIsProfileOpen] = useState(false)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    const handleLogout = () => {
        logout()
        // Redirect to home page after logout
        window.location.href = '/'
    }

    return (
        <header className="bg-white border-b border-gray-200 shadow-sm">
            <div className="flex items-center justify-between h-16 px-6">
                {/* Left Side - Mobile Menu + Search */}
                <div className="flex items-center flex-1">
                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? (
                            <X className="h-6 w-6" />
                        ) : (
                            <Menu className="h-6 w-6" />
                        )}
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
                                placeholder="Search products..."
                                onFocus={() => setIsSearchFocused(true)}
                                onBlur={() => setIsSearchFocused(false)}
                            />
                        </div>
                    </div>
                </div>

                {/* Right Side - Cart + Wishlist + Notifications + Profile */}
                <div className="flex items-center space-x-4">
                    {/* Cart */}
                    <Link href="/cart" className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                        <ShoppingCart className="h-6 w-6" />
                        {cartCount > 0 && (
                            <span className="absolute -top-1 -right-1 h-5 w-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
                                {cartCount}
                            </span>
                        )}
                    </Link>

                    {/* Wishlist */}
                    <Link href="/wishlist" className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                        <Heart className="h-6 w-6" />
                        {wishlistCount > 0 && (
                            <span className="absolute -top-1 -right-1 h-5 w-5 bg-pink-500 text-white text-xs rounded-full flex items-center justify-center">
                                {wishlistCount}
                            </span>
                        )}
                    </Link>

                    {/* Notifications */}
                    <div className="relative">
                        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                            <Bell className="h-6 w-6" />
                            {/* Notification Badge */}
                            <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                                2
                            </span>
                        </button>
                    </div>

                    {/* Profile Dropdown */}
                    <div className="relative">
                        <button
                            className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                        >
                            <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                                <span className="text-white text-sm font-medium">
                                    {user?.name?.charAt(0) || 'U'}
                                </span>
                            </div>
                            <span className="hidden md:block text-sm font-medium text-gray-700">
                                {user?.name || 'User'}
                            </span>
                            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''
                                }`} />
                        </button>

                        {/* Profile Dropdown Menu */}
                        {isProfileOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
                                <Link
                                    href="/dashboard/profile"
                                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    onClick={() => setIsProfileOpen(false)}
                                >
                                    <User className="h-4 w-4 mr-2" />
                                    Profile
                                </Link>
                                <Link
                                    href="/dashboard/settings"
                                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    onClick={() => setIsProfileOpen(false)}
                                >
                                    <Settings className="h-4 w-4 mr-2" />
                                    Settings
                                </Link>
                                <hr className="my-1" />
                                <button
                                    onClick={handleLogout}
                                    className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                >
                                    <LogOut className="h-4 w-4 mr-2" />
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Overlay */}
            {isMobileMenuOpen && (
                <div className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                    onClick={() => setIsMobileMenuOpen(false)} />
            )}
        </header>
    )
}
