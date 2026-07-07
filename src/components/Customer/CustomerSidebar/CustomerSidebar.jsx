'use client'

import { useState, useContext } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { deleteCookie } from 'cookies-next'
import toast from 'react-hot-toast'
import {
    LayoutDashboard,
    ShoppingBag,
    Package,
    ShoppingCart,
    Heart,
    MessageSquare,
    User,
    Settings,
    CreditCard,
    Truck,
    Star,
    FileText,
    Menu,
    X,
    LogOut,
    Coins,
    Users
} from 'lucide-react'
import AppContext from '@/context/AppContext'

const navigation = [
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { name: 'My Orders', href: '/dashboard/my-orders', icon: ShoppingCart },
    { name: 'Loyalty Points', href: '/dashboard/loyalty', icon: Coins },
    { name: 'Affiliate', href: '/dashboard/affiliate', icon: Users },
    { name: 'My Reviews', href: '/dashboard/my-reviews', icon: Star },
    { name: 'Wishlist', href: '/dashboard/wishlist', icon: Heart },
    { name: 'Profile', href: '/dashboard/profile', icon: User }
]

export default function CustomerSidebar() {
    const pathname = usePathname()
    const router = useRouter()
    const [isMobileOpen, setIsMobileOpen] = useState(false)
    const { logout } = useContext(AppContext)

    const handleLogout = () => {
        try {
            // Clear token from cookies
            deleteCookie('token')
            
            // Call logout from context
            logout()
            
            // Show success message
            toast.success('Logged out successfully!')
            
            // Redirect to home page
            router.push('/')
            
            // Close mobile menu if open
            setIsMobileOpen(false)
        } catch (error) {
            console.error('Logout error:', error)
            toast.error('Failed to logout. Please try again.')
        }
    }

    return (
        <>
            {/* Mobile Menu Button */}
            <div className="md:hidden fixed top-4 left-4 z-50">
                <button
                    onClick={() => setIsMobileOpen(!isMobileOpen)}
                    className="p-2 bg-white rounded-lg shadow-lg border border-gray-200"
                >
                    {isMobileOpen ? (
                        <X className="h-6 w-6 text-gray-600" />
                    ) : (
                        <Menu className="h-6 w-6 text-gray-600" />
                    )}
                </button>
            </div>

            {/* Sidebar */}
            <div className={`
                fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out flex flex-col
                ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0
            `}>
                {/* Logo - Fixed height */}
                <div className="flex items-center justify-center h-16 px-6 border-b border-gray-200 flex-shrink-0">
                    <div className="flex items-center space-x-2">
                        <ShoppingBag className="h-8 w-8 text-pink-600" />
                        <span className="text-xl font-bold text-gray-900">My Account</span>
                    </div>
                </div>

                {/* Navigation - Scrollable */}
                <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                    {navigation.map((item) => {
                        // Special handling for orders page to stay active on order details
                        const isActive = item.href === '/dashboard/my-orders' 
                            ? pathname.startsWith(item.href)
                            : pathname === item.href
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                onClick={() => setIsMobileOpen(false)}
                                className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${isActive
                                        ? 'bg-pink-50 text-pink-700 border-r-2 border-pink-600'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                            >
                                <item.icon
                                    className={`mr-3 h-5 w-5 transition-colors ${isActive ? 'text-pink-600' : 'text-gray-400 group-hover:text-gray-500'
                                        }`}
                                />
                                {item.name}
                            </Link>
                        )
                    })}
                </nav>

                {/* Logout Button - Fixed at bottom */}
                <div className="p-4 border-t border-gray-200 flex-shrink-0">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 cursor-pointer"
                    >
                        <LogOut className="mr-3 h-5 w-5" />
                        Logout
                    </button>
                </div>
            </div>

            {/* Mobile Overlay */}
            {isMobileOpen && (
                <div 
                    className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-30"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}
        </>
    )
}
