'use client'

import { useAppContext } from '@/context/AppContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import AdminHeader from "@/components/Admin/AdminHeader";
import AdminSidebar from "@/components/Admin/AdminSidebar/AdminSidebar";

export default function RootLayout({ children }) {
    const { user, isAuthenticated, loading } = useAppContext()
    const router = useRouter();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        // Wait for loading to complete
        if (!loading) {
            // Check if user is not authenticated
            if (!isAuthenticated) {
                router.push('/login')
                return
            }
            
            // Check if user is not admin
            if (user?.role !== 'admin') {
                router.push('/')
                return
            }
        }
    }, [user, isAuthenticated, loading, router])

    // Show loading while checking authentication
    if (loading) {
        return (
            <div className="flex h-screen bg-gray-50">
                {/* Desktop Sidebar Skeleton */}
                <div className="hidden md:flex md:w-64 md:flex-col h-screen bg-white border-r border-gray-200">
                    <div className="p-4 border-b border-gray-200 flex items-center justify-center h-[72px]">
                        <div className="h-8 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                    </div>
                    <div className="p-4 space-y-4 flex-1 mt-4">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="flex items-center space-x-3">
                                <div className="h-6 w-6 bg-gray-200 rounded-md animate-pulse"></div>
                                <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex flex-col flex-1 h-screen overflow-hidden">
                    {/* Header Skeleton */}
                    <div className="h-[72px] bg-white border-b border-gray-200 flex items-center justify-between px-6">
                        <div className="h-6 w-6 bg-gray-200 rounded md:hidden animate-pulse"></div>
                        <div className="hidden md:block h-6 bg-gray-200 rounded w-1/4 animate-pulse"></div>
                        <div className="flex items-center space-x-4">
                            <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse"></div>
                            <div className="h-8 w-10 bg-gray-200 rounded-full animate-pulse"></div>
                            <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse"></div>
                        </div>
                    </div>

                    {/* Content Skeleton */}
                    <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
                        <div className="mx-auto space-y-6">
                            {/* Header Area */}
                            <div className="flex justify-between items-center">
                                <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse"></div>
                                <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
                            </div>

                            {/* Stats Row */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                                        <div className="flex justify-between items-center mb-4">
                                            <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                                            <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse"></div>
                                        </div>
                                        <div className="h-8 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                                    </div>
                                ))}
                            </div>
                            
                            {/* Chart/Table Area */}
                            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm h-96">
                                <div className="h-6 bg-gray-200 rounded w-1/4 mb-6 animate-pulse"></div>
                                <div className="space-y-4">
                                    {[...Array(5)].map((_, i) => (
                                        <div key={i} className="h-12 bg-gray-100 rounded animate-pulse"></div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        )
    }

    // Don't render admin panel if user is not admin
    if (!isAuthenticated || user?.role !== 'admin') {
        return null
    }

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Desktop Sidebar - Fixed height with scroll */}
            <div className="hidden md:flex md:w-64 md:flex-col h-screen">
                <AdminSidebar />
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
                    <div className="md:hidden fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 shadow-lg z-50">
                        <AdminSidebar onMobileMenuClose={() => setIsMobileMenuOpen(false)} />
                    </div>
                </>
            )}

            {/* Main Content Area - Fixed height */}
            <div className="flex flex-col flex-1 h-screen overflow-hidden">
                {/* Header - Fixed height */}
                <AdminHeader onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />

                {/* Main Content - Scrollable within remaining height */}
                <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
                    <div className=" mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}