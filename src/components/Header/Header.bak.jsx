'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { User, ShoppingCart, Heart, Truck, Menu, X, Search } from 'lucide-react';
import Image from 'next/image';
import { useAppContext } from '@/context/AppContext';
import CartModal from '@/components/Cart/CartModal';
import WishlistModal from '@/components/Wishlist/WishlistModal';
import SearchBar from './SearchBar';
import { menuAPI } from '@/services/api';

// Fallback navigation menu
const fallbackNavigationMenu = [
  { id: 1, name: "Home", href: "/", isActive: true },
  { id: 2, name: "Categories", href: "/categories", isActive: false },
  { id: 3, name: "Shop", href: "/shop", isActive: false },
  { id: 4, name: "New Arrivals", href: "/shop?sort=new-arrivals", isActive: false },
  { id: 5, name: "Offers", href: "/offers", isActive: false },
  { id: 6, name: "Contact", href: "/contact-us", isActive: false }
];

function Header({ isTrackingShow = true }) {
  const { user, cartCount, cartLoading, wishlistCount, isCartOpen, setIsCartOpen } = useAppContext();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [navigationMenu, setNavigationMenu] = useState(fallbackNavigationMenu);
  const [menuLoading, setMenuLoading] = useState(true);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
  };

  // Function to check if a menu item is active based on current pathname
  const isMenuItemActive = (href) => {
    // Handle exact match for home page
    if (href === '/' && pathname === '/') {
      return true;
    }
    
    // Handle New Arrivals - check for specific shop sort parameter
    if (href === '/shop?sort=new-arrivals') {
      if (pathname === '/shop') {
        // Use searchParams to get the sort parameter
        return searchParams.get('sort') === 'new-arrivals';
      }
      return false;
    }
    
    // Handle regular Shop - only active when on /shop without sort parameter
    if (href === '/shop') {
      if (pathname === '/shop') {
        // Only active if there's no sort parameter or sort is not new-arrivals
        const sortParam = searchParams.get('sort');
        return !sortParam || sortParam !== 'new-arrivals';
      }
      return false;
    }
    
    // Handle other routes - check if current pathname starts with the href
    if (href !== '/' && pathname.startsWith(href)) {
      return true;
    }
    
    // Handle categories route
    if (href === '/categories' && pathname.startsWith('/categories')) {
      return true;
    }
    
    // Handle offers route
    if (href === '/offers' && pathname.startsWith('/offers')) {
      return true;
    }
    
    // Handle contact route
    if (href === '/contact-us' && pathname.startsWith('/contact-us')) {
      return true;
    }
    
    return false;
  };

  // Fetch header menus from API
  useEffect(() => {
    const fetchHeaderMenus = async () => {
      try {
        setMenuLoading(true);
        const response = await menuAPI.getHeaderMenus();

        if (response.success && response.data && response.data.length > 0) {
          // Transform API data to match component format
          const transformedMenus = response.data
            .filter(menu => menu.isVisible) // Only show visible menus
            .sort((a, b) => a.order - b.order) // Sort by order
            .map((menu, index) => ({
              id: menu._id,
              name: menu.name,
              href: menu.href,
              isActive: menu.isActive,
              target: menu.target || '_self',
              order: menu.order
            }));

          setNavigationMenu(transformedMenus);
        } else {
          // Use fallback menu if API fails or no data
          setNavigationMenu(fallbackNavigationMenu);
        }
      } catch (error) {
        console.error('Error fetching header menus:', error);
        // Use fallback menu on error
        setNavigationMenu(fallbackNavigationMenu);
      } finally {
        setMenuLoading(false);
      }
    };

    fetchHeaderMenus();
  }, []);

  return (
    <>
      {/* Top bar */}
      {
        isTrackingShow && (
          <Link href="/tracking" className="bg-gray-700 text-white text-sm py-2 px-4 flex items-center justify-center hover:bg-gray-600 transition-colors">
            <Truck className="w-4 h-4 mr-2" />
            <span className="text-xs sm:text-sm">Track your order</span>
          </Link>
        )
      }


      {/* Main header */}
      <div className="bg-white shadow-sm px-4 py-4 sticky top-0 z-50">
        <div className="xl:2xl:max-w-7xl xl:max-w-6xl   max-w-xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/">
              <Image
                src="/images/logo.png"
                alt="Logo"
                width={170}
                height={70}
                className="w-32 sm:w-40  -mt-3"
                priority
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-5">
            {menuLoading ? (
              <div className="flex space-x-5">
                {[...Array(6)].map((_, index) => (
                  <div key={index} className="h-4 bg-gray-200 rounded animate-pulse w-16"></div>
                ))}
              </div>
            ) : (
              navigationMenu.map((item) => {
                const isActive = isMenuItemActive(item.href);
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    target={item.target}
                    className={`font-medium transition-colors ${isActive
                      ? 'text-pink-500'
                      : 'text-gray-700 hover:text-pink-500'
                      }`}
                  >
                    {item.name}
                  </Link>
                );
              })
            )}
          </nav>

          {/* Right section */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Desktop Search */}
            <div className="hidden md:flex">
              <SearchBar className="" />
            </div>

            {/* Mobile Search Toggle */}
            <button
              onClick={toggleSearch}
              className="md:hidden p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label={isSearchOpen ? "Close search" : "Open search"}
            >
              <Search className="w-5 h-5 text-gray-700" />
            </button>

            {/* Icons */}
            <div className="flex items-center space-x-1 sm:space-x-3">
              {/* User */}
              {
                user?.email ? user?.role === 'admin' ? (
                  <Link href={`/admin/dashboard`} className="p-2 bg-gray-100 hover:bg-gray-200 cursor-pointer rounded-full transition-colors border border-gray-200" aria-label="Admin Dashboard">
                    <User className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
                  </Link>
                ) : (
                  <Link href={`/dashboard`} className="p-2 bg-gray-100 hover:bg-gray-200 cursor-pointer rounded-full transition-colors border border-gray-200" aria-label="User Dashboard">
                    <User className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
                  </Link>
                ) : (
                  <Link href="/login" className="p-2 hover:bg-gray-100 rounded-full transition-colors" aria-label="Login">
                    <User className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
                  </Link>
                )
              }


              {/* Wishlist with badge */}
              <button
                onClick={() => setIsWishlistOpen(true)}
                className="relative p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
                aria-label={`Wishlist with ${wishlistCount} items`}
              >
                <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
                <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">
                  {wishlistCount}
                </span>
              </button>

              {/* Cart with badge */}
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
                aria-label={`Shopping cart with ${cartCount} items`}
              >
                <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
                <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">
                  {cartLoading ? (
                    <div className="">0</div>
                  ) : (
                    cartCount
                  )}
                </span>
              </button>

              {/* Mobile Menu Toggle */}
              <button
                onClick={toggleMobileMenu}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label={isMobileMenuOpen ? "Close mobile menu" : "Open mobile menu"}
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5 text-gray-700" />
                ) : (
                  <Menu className="w-5 h-5 text-gray-700" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Search Bar */}
        {isSearchOpen && (
          <div className="md:hidden mt-4">
            <SearchBar
              isMobile={true}
              onSearchSubmit={() => setIsSearchOpen(false)}
            />
          </div>
        )}

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden mt-4 border-t border-gray-200 pt-4">
            <nav className="flex flex-col space-y-3">
              {menuLoading ? (
                <div className="space-y-3">
                  {[...Array(6)].map((_, index) => (
                    <div key={index} className="h-6 bg-gray-200 rounded animate-pulse w-24"></div>
                  ))}
                </div>
              ) : (
                navigationMenu.map((item) => {
                  const isActive = isMenuItemActive(item.href);
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      target={item.target}
                      className={`font-medium py-2 transition-colors ${isActive
                        ? 'text-pink-500'
                        : 'text-gray-700 hover:text-pink-500'
                        }`}
                    >
                      {item.name}
                    </Link>
                  );
                })
              )}
            </nav>
          </div>
        )}
      </div>

      {/* Cart Modal */}
      <CartModal
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
      />

      {/* Wishlist Modal */}
      <WishlistModal
        isOpen={isWishlistOpen}
        onClose={() => setIsWishlistOpen(false)}
      />
    </>
  );
}

// Wrapper component with Suspense boundary
export default function HeaderWithSuspense({ isTrackingShow = true }) {
  return (
    <Suspense fallback={<div className="h-16 bg-white"></div>}>
      <Header isTrackingShow={isTrackingShow} />
    </Suspense>
  );
}
