'use client'

import { useEffect, useState, useContext, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { getCookie } from 'cookies-next'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import AppContext from '@/context/AppContext'
import { userAPI } from '@/services/api'
import MobileDashboardMenu from '@/components/Customer/MobileDashboardMenu/MobileDashboardMenu'

// Dynamic import for CustomerSidebar to avoid SSR issues
const CustomerSidebar = dynamic(() => import("@/components/Customer/CustomerSidebar/CustomerSidebar"), {
    ssr: false,
    loading: () => (
        <div className="hidden md:block md:w-64 bg-white border-r border-gray-200 shadow-sm">
            <div className="p-6">
                <div className="h-8 bg-gray-200 rounded animate-pulse mb-6"></div>
                <div className="space-y-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="h-10 bg-gray-200 rounded animate-pulse"></div>
                    ))}
                </div>
            </div>
        </div>
    )
})

function CustomerDashboardLayoutContent({ children }) {
    const router = useRouter()
    const { user, setUser, setLoading: setContextLoading } = useContext(AppContext)
    const [isLoading, setIsLoading] = useState(true)
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    useEffect(() => {
        const checkAuth = async () => {
            try {
                setIsLoading(true)
                
                // Get token from cookies
                const token = getCookie('token')
                
                if (!token) {
                    // No token, redirect to login
                    router.push('/login')
                    return
                }

                // Token exists, verify with backend
                const response = await userAPI.getProfile(token)
                
                if (response.success && response.data) {
                    // User data found, set user and allow access
                    setUser(response.data)
                    setIsAuthenticated(true)
                } else {
                    // Invalid token or user not found, redirect to login
                    router.push('/login')
                }
            } catch (error) {
                console.error('Auth check error:', error)
                // Error occurred, redirect to login
                router.push('/login')
            } finally {
                setIsLoading(false)
                setContextLoading(false)
            }
        }

        checkAuth()
    }, [router, setUser, setContextLoading])

    // Show loading spinner while checking authentication
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="h-12 w-12 border-4 border-pink-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        )
    }

    // If not authenticated, don't render anything (redirect will happen)
    if (!isAuthenticated) {
        return null
    }

    // If authenticated, render the dashboard
    return (
        <div className="min-h-[calc(100vh-121px)] bg-gray-50">
            {/* Mobile Menu Button - Fixed position bottom right */}
            <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden fixed bottom-6 right-6 z-50 bg-blue-600 text-white rounded-full p-3 shadow-lg hover:shadow-xl hover:bg-blue-700 transition-all duration-200"
                aria-label="Toggle mobile menu"
            >
                {isMobileMenuOpen ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                ) : (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                )}
            </button>

            {/* Main Content with Sidebar */}
            <div className="flex h-[calc(100vh-121px)]">
                {/* Desktop Sidebar - Fixed width, scrollable if needed */}
                <div className="hidden md:block md:w-64 bg-white border-r border-gray-200 shadow-sm">
                    <CustomerSidebar />
                </div>

                {/* Mobile Sidebar - Overlay */}
                {isMobileMenuOpen && (
                    <>
                        {/* Backdrop */}
                        <div 
                            className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                            onClick={() => setIsMobileMenuOpen(false)}
                        />
                        {/* Mobile Sidebar */}
                        <div className="md:hidden fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 shadow-lg z-50 flex flex-col">
                            {/* Logo - Fixed height */}
                            <div className="flex items-center justify-center h-16 px-6 border-b border-gray-200 flex-shrink-0">
                                <div className="flex items-center space-x-2">
                                    <svg className="h-8 w-8 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                    </svg>
                                    <span className="text-xl font-bold text-gray-900">My Account</span>
                                </div>
                            </div>

                            {/* Navigation - Scrollable */}
                            <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                                <Link 
                                    href="/dashboard" 
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                >
                                    <svg className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                                    </svg>
                                    Overview
                                </Link>
                                <Link 
                                    href="/dashboard/my-orders" 
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                >
                                    <svg className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6" />
                                    </svg>
                                    My Orders
                                </Link>
                                <Link 
                                    href="/dashboard/loyalty" 
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                >
                                    <svg className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                    </svg>
                                    Loyalty Points
                                </Link>
                                <Link 
                                    href="/dashboard/affiliate" 
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                >
                                    <svg className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                    Affiliate
                                </Link>
                                <Link 
                                    href="/dashboard/my-reviews" 
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                >
                                    <svg className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                    </svg>
                                    My Reviews
                                </Link>
                                <Link 
                                    href="/dashboard/wishlist" 
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                >
                                    <svg className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                    Wishlist
                                </Link>
                                <Link 
                                    href="/dashboard/profile" 
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                >
                                    <svg className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    Profile
                                </Link>
                            </nav>

                            {/* Logout Button - Fixed at bottom */}
                            <div className="p-4 border-t border-gray-200 flex-shrink-0">
                                <button
                                    onClick={() => {
                                        // Add logout logic here
                                        setIsMobileMenuOpen(false);
                                    }}
                                    className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 cursor-pointer"
                                >
                                    <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                    Logout
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {/* Main Content Area - Scrollable */}
                <div className="flex-1 overflow-y-auto">
                    <main className="p-6">
                        <div className="mx-auto">
                            {/* Mobile Menu - Only visible on mobile, appears at top of content */}
                            <MobileDashboardMenu />
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    )
}

export default function CustomerDashboardLayout({ children }) {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="h-12 w-12 border-4 border-pink-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        }>
            <CustomerDashboardLayoutContent children={children} />
        </Suspense>
    )
}
