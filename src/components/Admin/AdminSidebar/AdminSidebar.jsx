'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
    LayoutDashboard,
    ShoppingBag,
    Users,
    Package,
    ShoppingCart,
    BarChart3,
    Settings,
    Store,
    Tag,
    Truck,
    Heart,
    MessageSquare,
    Star,
    Image,
    Grid3X3,
    Megaphone,
    Ticket,
    PlusCircle,
    Link2,
    ChevronDown,
    ChevronRight,
    Home,
    Gift,
    FileText,
    CreditCard,
    Shield,
    Palette,
    TrendingUp,
    Database,
    Bell,
    KeyRound,
    Printer,
    Presentation
} from 'lucide-react'

const navigation = [
    {
        name: 'Dashboard',
        href: '/admin/dashboard',
        icon: LayoutDashboard,
        type: 'single'
    },
    {
        name: 'Products',
        icon: Package,
        type: 'group',
        children: [
            { name: 'All Products', href: '/admin/dashboard/products', icon: Package },
            { name: 'Create Product', href: '/admin/dashboard/products/create', icon: PlusCircle },
        ]
    },
    {
        name: 'Orders',
        icon: ShoppingCart,
        type: 'group',
        children: [
            { name: 'All Orders', href: '/admin/dashboard/orders', icon: ShoppingCart },
            { name: 'Manual Orders', href: '/admin/dashboard/manual-orders', icon: PlusCircle },
        ]
    },
    {
        name: 'Categories',
        icon: Tag,
        type: 'group',
        children: [
            { name: 'All Categories', href: '/admin/dashboard/categories', icon: Tag },
            { name: 'Add Category', href: '/admin/dashboard/categories/create', icon: PlusCircle },
        ]
    },
    {
        name: 'Users',
        icon: Users,
        type: 'group',
        children: [
            { name: 'All Customers', href: '/admin/dashboard/customers', icon: Users },
            { name: 'All Staff', href: '/admin/dashboard/staff', icon: Shield },
        ]
    },
    {
        name: 'Homepage',
        icon: Home,
        type: 'group',
        children: [
            { name: 'Hero Banners', href: '/admin/dashboard/hero-banner', icon: Image },
            { name: 'Hero Products', href: '/admin/dashboard/hero-products', icon: Grid3X3 },
            { name: 'Offer Banners', href: '/admin/dashboard/offer-banner', icon: Megaphone },
            { name: 'Android Banners', href: '/admin/dashboard/android-banner', icon: Megaphone },
            { name: 'Testimonials', href: '/admin/dashboard/testimonials', icon: Star },
        ]
    },
    {
        name: 'Offers',
        icon: Gift,
        type: 'group',
        children: [
            { name: 'Coupons', href: '/admin/dashboard/coupons', icon: Ticket },
            { name: 'Upsells', href: '/admin/dashboard/upsells', icon: Link2 },
            { name: 'Own Products Ads', href: '/admin/dashboard/own-ads', icon: Presentation },
        ]
    },
    {
        name: 'Inventory',
        icon: Database,
        type: 'group',
        children: [
            { name: 'List Purchase', href: '/admin/dashboard/inventory', icon: ShoppingCart },
            { name: 'Stock Adjustment', href: '/admin/dashboard/inventory/stock-adjustment', icon: TrendingUp },
        ]
    },
    {
        name: 'Notifications',
        href: '/admin/dashboard/notifications',
        icon: Bell,
        type: 'single'
    },
    {
        name: 'Settings',
        icon: Settings,
        type: 'group',
        children: [
            { name: 'General Settings', href: '/admin/dashboard/settings', icon: Settings },
            { name: 'Role Based Access Control', href: '/admin/dashboard/settings/roles', icon: KeyRound },
            { name: 'Label Print', href: '/admin/dashboard/settings/label-print', icon: Printer },
        ]
    },
]

export default function AdminSidebar({ onMobileMenuClose }) {
    const pathname = usePathname()
    const isChildActive = (child) => {
        // Exact match for specific routes
        if (child.href === '/admin/dashboard/products') {
            return pathname === '/admin/dashboard/products' || pathname === '/admin/dashboard/products/'
        }
        if (child.href === '/admin/dashboard/products/create') {
            return pathname === '/admin/dashboard/products/create'
        }
        if (child.href === '/admin/dashboard/orders') {
            return pathname === '/admin/dashboard/orders' || pathname === '/admin/dashboard/orders/'
        }
        if (child.href === '/admin/dashboard/customers') {
            return pathname === '/admin/dashboard/customers' || pathname === '/admin/dashboard/customers/'
        }
        if (child.href === '/admin/dashboard/staff') {
            return pathname === '/admin/dashboard/staff' || pathname === '/admin/dashboard/staff/'
        }
        if (child.href === '/admin/dashboard/categories') {
            return pathname === '/admin/dashboard/categories' || pathname === '/admin/dashboard/categories/'
        }
        if (child.href === '/admin/dashboard/settings') {
            return pathname === '/admin/dashboard/settings' || pathname.startsWith('/admin/dashboard/settings/')
        }
        if (child.href === '/admin/dashboard/settings/roles') {
            return pathname === '/admin/dashboard/settings/roles' || pathname.startsWith('/admin/dashboard/settings/roles/')
        }
        if (child.href === '/admin/dashboard/settings/label-print') {
            return pathname === '/admin/dashboard/settings/label-print' || pathname.startsWith('/admin/dashboard/settings/label-print/')
        }
        if (child.href === '/admin/dashboard/own-ads') {
            return pathname === '/admin/dashboard/own-ads' || pathname.startsWith('/admin/dashboard/own-ads/')
        }
        if (child.href === '/admin/dashboard/inventory') {
            return pathname === '/admin/dashboard/inventory' || pathname === '/admin/dashboard/inventory/'
        }
        if (child.href === '/admin/dashboard/inventory/stock-adjustment') {
            return pathname === '/admin/dashboard/inventory/stock-adjustment' || pathname.startsWith('/admin/dashboard/inventory/stock-adjustment/')
        }
        // For other routes, use exact match or startsWith for sub-routes
        return pathname === child.href || pathname.startsWith(child.href + '/')
    }

    const [expandedItems, setExpandedItems] = useState(() => {
        // Auto-expand groups that contain the current active page
        const initialExpanded = {}
        navigation.forEach(item => {
            if (item.type === 'group' && item.children) {
                const hasActiveChild = item.children.some(child => {
                    // Use the same logic as isChildActive function
                    if (child.href === '/admin/dashboard/products') {
                        return pathname === '/admin/dashboard/products' || pathname === '/admin/dashboard/products/'
                    }
                    if (child.href === '/admin/dashboard/products/create') {
                        return pathname === '/admin/dashboard/products/create'
                    }
                    if (child.href === '/admin/dashboard/orders') {
                        return pathname === '/admin/dashboard/orders' || pathname === '/admin/dashboard/orders/'
                    }
                    if (child.href === '/admin/dashboard/customers') {
                        return pathname === '/admin/dashboard/customers' || pathname === '/admin/dashboard/customers/'
                    }
                    if (child.href === '/admin/dashboard/categories') {
                        return pathname === '/admin/dashboard/categories' || pathname === '/admin/dashboard/categories/'
                    }
                    if (child.href === '/admin/dashboard/settings') {
                        return pathname === '/admin/dashboard/settings' || pathname.startsWith('/admin/dashboard/settings/')
                    }
                    if (child.href === '/admin/dashboard/settings/roles') {
                        return pathname === '/admin/dashboard/settings/roles' || pathname.startsWith('/admin/dashboard/settings/roles/')
                    }
                    if (child.href === '/admin/dashboard/settings/label-print') {
                        return pathname === '/admin/dashboard/settings/label-print' || pathname.startsWith('/admin/dashboard/settings/label-print/')
                    }
                    if (child.href === '/admin/dashboard/own-ads') {
                        return pathname === '/admin/dashboard/own-ads' || pathname.startsWith('/admin/dashboard/own-ads/')
                    }
                    if (child.href === '/admin/dashboard/inventory') {
                        return pathname === '/admin/dashboard/inventory' || pathname === '/admin/dashboard/inventory/'
                    }
                    if (child.href === '/admin/dashboard/inventory/stock-adjustment') {
                        return pathname === '/admin/dashboard/inventory/stock-adjustment' || pathname.startsWith('/admin/dashboard/inventory/stock-adjustment/')
                    }
                    return pathname === child.href || pathname.startsWith(child.href + '/')
                })
                if (hasActiveChild) {
                    initialExpanded[item.name] = true
                }
            }
        })
        return initialExpanded
    })

    const toggleExpanded = (itemName) => {
        setExpandedItems(prev => {
            // If clicking on the same item, toggle it
            if (prev[itemName]) {
                return {
                    ...prev,
                    [itemName]: false
                }
            } else {
                // If clicking on a different item, close all others and open this one
                const newExpanded = {}
                newExpanded[itemName] = true
                return newExpanded
            }
        })
    }

    const isItemActive = (item) => {
        if (item.type === 'single') {
            return pathname === item.href
        } else if (item.type === 'group') {
            return item.children?.some(child => isChildActive(child))
        }
        return false
    }

    return (
        <div className="flex flex-col w-64 h-screen bg-white border-r border-gray-200 shadow-sm">
            {/* Logo - Fixed height */}
            <div className="flex items-center justify-center h-16 px-6 border-b border-gray-200 flex-shrink-0">
                <div className="flex items-center space-x-2">
                    <ShoppingBag className="h-8 w-8 text-blue-600" />
                    <span className="text-xl font-bold text-gray-900"> Admin Panel</span>
                </div>
            </div>

            {/* Navigation - Scrollable */}
            <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto min-h-0">
                {navigation.map((item) => {
                    const isActive = isItemActive(item)
                    const isExpanded = expandedItems[item.name]

                    if (item.type === 'single') {
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                onClick={() => {
                                    // Only update state if there are expanded menus
                                    if (Object.keys(expandedItems).length > 0) {
                                        setExpandedItems({})
                                    }
                                    onMobileMenuClose?.()
                                }}
                                className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${isActive
                                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                            >
                                <item.icon
                                    className={`mr-3 h-5 w-5 transition-colors ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'
                                        }`}
                                />
                                {item.name}
                            </Link>
                        )
                    } else if (item.type === 'group') {
                        return (
                            <div key={item.name}>
                                {/* Group Header */}
                                <button
                                    onClick={() => toggleExpanded(item.name)}
                                    className={`group w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${isActive
                                        ? 'bg-blue-50 text-blue-700'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                        }`}
                                >
                                    <div className="flex items-center">
                                        <item.icon
                                            className={`mr-3 h-5 w-5 transition-colors ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'
                                                }`}
                                        />
                                        {item.name}
                                    </div>
                                    {isExpanded ? (
                                        <ChevronDown className="h-4 w-4 text-gray-400" />
                                    ) : (
                                        <ChevronRight className="h-4 w-4 text-gray-400" />
                                    )}
                                </button>

                                {/* Group Children */}
                                {isExpanded && (
                                    <div className="ml-6 mt-1 space-y-1">
                                        {item.children?.map((child) => {
                                            const childIsActive = isChildActive(child)
                                            return (
                                                <Link
                                                    key={child.name}
                                                    href={child.href}
                                                    onClick={() => onMobileMenuClose?.()}
                                                    className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${childIsActive
                                                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                                                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                                                        }`}
                                                >
                                                    <child.icon
                                                        className={`mr-3 h-4 w-4 transition-colors ${childIsActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'
                                                            }`}
                                                    />
                                                    {child.name}
                                                </Link>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        )
                    }
                })}
            </nav>
        </div>
    )
}