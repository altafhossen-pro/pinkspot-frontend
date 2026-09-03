'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Menu, Home, ShoppingCart, User, Phone } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import CategorySidebar from './CategorySidebar';

export default function MobileBottomNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { cartCount, user, isCartOpen, setIsCartOpen, siteSettings } = useAppContext();
  const [isCategorySidebarOpen, setIsCategorySidebarOpen] = useState(false);
  // Get phone from global siteSettings — no extra API call needed
  const phoneNumber = siteSettings?.contact?.phone || '+8801519181818';

  // Routes that should not show bottom navigation
  const noNavRoutes = [
    '/admin',
    '/login',
    '/register',
    '/forgot-password'
  ];

  // Check if current path should not show navigation
  const shouldHideNav = noNavRoutes.some(route => pathname.startsWith(route));

  // Don't render navigation for these routes
  if (shouldHideNav) {
    return null;
  }

  // Check active state
  const isActive = (path) => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(path);
  };

  // Handle category click - open category sidebar
  const handleCategoryClick = (e) => {
    e.preventDefault();
    setIsCategorySidebarOpen(true);
  };

  // Handle cart click - open cart modal
  const handleCartClick = (e) => {
    e.preventDefault();
    if (setIsCartOpen) {
      setIsCartOpen(true);
    }
  };

  // Handle profile click - redirect to dashboard if logged in, else login
  const handleProfileClick = (e) => {
    e.preventDefault();
    if (user) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 lg:hidden pb-safe">
      <div className="flex items-center justify-between px-2 py-2">
        {/* Call Button */}
        <a
          href={`tel:${phoneNumber}`}
          className="flex flex-col items-center justify-center px-2 sm:px-4 py-2 rounded-lg transition-colors text-gray-600 hover:text-[#EF3D6A]"
          aria-label="Call Us"
        >
          <Phone className="w-5 h-5 mb-1" />
          <span className="text-[10px] sm:text-xs font-medium">Call</span>
        </a>

        {/* Category Menu */}
        <button
          onClick={handleCategoryClick}
          className={`flex flex-col items-center justify-center px-2 sm:px-4 py-2 rounded-lg transition-colors ${isCategorySidebarOpen
              ? 'text-[#EF3D6A]'
              : 'text-gray-600 hover:text-[#EF3D6A]'
            }`}
          aria-label="Categories"
        >
          <Menu className="w-5 h-5 mb-1" />
          <span className="text-[10px] sm:text-xs font-medium">Category</span>
        </button>

        {/* Home */}
        <Link
          href="/"
          className={`flex flex-col items-center justify-center px-2 sm:px-4 py-2 rounded-lg transition-colors ${isActive('/')
              ? 'text-[#EF3D6A]'
              : 'text-gray-600 hover:text-[#EF3D6A]'
            }`}
          aria-label="Home"
        >
          <Home className="w-5 h-5 mb-1" />
          <span className="text-[10px] sm:text-xs font-medium">Home</span>
        </Link>

        {/* Cart */}
        <button
          onClick={handleCartClick}
          className={`flex flex-col items-center justify-center px-2 sm:px-4 py-2 rounded-lg transition-colors relative ${isCartOpen
              ? 'text-[#EF3D6A]'
              : 'text-gray-600 hover:text-[#EF3D6A]'
            }`}
          aria-label="Shopping Cart"
        >
          <div className="relative">
            <ShoppingCart className="w-5 h-5 mb-1" />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-[#EF3D6A] text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </div>
          <span className="text-[10px] sm:text-xs font-medium">Cart</span>
        </button>

        {/* Profile */}
        <button
          onClick={handleProfileClick}
          className={`flex flex-col items-center justify-center px-2 sm:px-4 py-2 rounded-lg transition-colors ${isActive('/dashboard')
              ? 'text-[#EF3D6A]'
              : 'text-gray-600 hover:text-[#EF3D6A]'
            }`}
          aria-label={user ? 'Profile' : 'Login'}
        >
          <User className="w-5 h-5 mb-1" />
          <span className="text-[10px] sm:text-xs font-medium">{user ? 'Profile' : 'Login'}</span>
        </button>
      </div>

      {/* Category Sidebar */}
      <CategorySidebar
        isOpen={isCategorySidebarOpen}
        onClose={() => setIsCategorySidebarOpen(false)}
      />
    </nav>
  );
}

