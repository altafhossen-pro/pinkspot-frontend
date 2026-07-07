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
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
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