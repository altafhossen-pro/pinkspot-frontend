'use client'

import { useContext, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { deleteCookie } from 'cookies-next'
import toast from 'react-hot-toast'
import {
    LayoutDashboard,
    ShoppingCart,
    Heart,
    User,
    Star,
    Coins,
    Users,
    LogOut,
    ChevronDown,
    ChevronUp,
    Menu
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

export default function MobileDashboardMenu() {
    const pathname = usePathname()
    const router = useRouter()
    const { logout } = useContext(AppContext)
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    const handleLogout = () => {
        try {
            deleteCookie('token')
            logout()
            toast.success('Logged out successfully!')
            router.push('/')
        } catch (error) {
            console.error('Logout error:', error)
            toast.error('Failed to logout. Please try again.')
        }
    }

    return (
        <div className="md:hidden bg-white rounded-lg shadow-sm mb-6">
            {/* Toggle Button */}
            <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors cursor-pointer"
            >
                <div className="flex items-center gap-3">
                    <Menu className="h-5 w-5 text-gray-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
                </div>
                {isMenuOpen ? (
                    <ChevronUp className="h-5 w-5 text-gray-600" />
                ) : (
                    <ChevronDown className="h-5 w-5 text-gray-600" />
                )}
            </button>

            {/* Menu Items - Collapsible */}
            {isMenuOpen && (
                <nav className="px-4 pb-4 space-y-1 border-t border-gray-200 pt-4">
                {navigation.map((item) => {
                    const isActive = item.href === '/dashboard/my-orders' 
                        ? pathname.startsWith(item.href)
                        : pathname === item.href
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                                isActive
                                    ? 'bg-pink-50 text-pink-700 border-r-2 border-pink-600'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                        >
                            <item.icon
                                className={`mr-3 h-5 w-5 transition-colors ${
                                    isActive ? 'text-pink-600' : 'text-gray-400 group-hover:text-gray-500'
                                }`}
                            />
                            {item.name}
                        </Link>
                    )
                })}
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 cursor-pointer"
                >
                    <LogOut className="mr-3 h-5 w-5" />
                    Logout
                </button>
                </nav>
            )}
        </div>
    )
}

