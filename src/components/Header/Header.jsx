'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { User, ShoppingCart, Heart, Truck, Menu, X, Search } from 'lucide-react';
import Image from 'next/image';
import { useAppContext } from '@/context/AppContext';
import CartModal from '@/components/Cart/CartModal';
import WishlistModal from '@/components/Wishlist/WishlistModal';
import { menuAPI, categoryAPI, settingsAPI } from '@/services/api';
import CategoryMegamenu from './CategoryMegamenu';
import SearchBar from './SearchBar';

// Fallback navigation menu
const fallbackNavigationMenu = [
  { id: 1, name: "Home", href: "/", isActive: true },
  { id: 3, name: "Shop", href: "/shop", isActive: false },
  { id: 4, name: "New Arrivals", href: "/shop?sort=new-arrivals", isActive: false },
  { id: 5, name: "Offers", href: "/offers", isActive: false },
  { id: 6, name: "Contact", href: "/contact-us", isActive: false },
];

function Header({ isTrackingShow = true, logoUrl }) {
  const { user, cartCount, cartLoading, wishlistCount, isCartOpen, setIsCartOpen } = useAppContext();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [videoMenuData, setVideoMenuData] = useState(null);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [navigationMenu, setNavigationMenu] = useState([]);
  const [utilityMenus, setUtilityMenus] = useState([]);
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
    const fetchHeaderData = async () => {
      try {
        setMenuLoading(true);
        const [categoriesResponse, menusResponse, settingsResponse] = await Promise.all([
          categoryAPI.getHeaderCategories(),
          menuAPI.getHeaderMenus(),
          settingsAPI.getSiteSettings()
        ]);

        if (settingsResponse.success && settingsResponse.data && settingsResponse.data.videoMenu) {
          setVideoMenuData(settingsResponse.data.videoMenu);
        }

        if (categoriesResponse.success && categoriesResponse.data) {
          const transformedCategories = categoriesResponse.data
            .map((cat) => ({
              id: cat._id,
              name: cat.name,
              href: `/categories/${cat.slug}`,
              isActive: true,
              target: '_self',
            }));
          setNavigationMenu(transformedCategories);
        }

        if (menusResponse.success && menusResponse.data) {
          const transformedMenus = menusResponse.data
            .filter(menu => menu.isVisible && menu.isActive)
            .sort((a, b) => a.order - b.order)
            .map(menu => ({
              id: menu._id,
              name: menu.name,
              href: menu.href,
              target: menu.target || '_self'
            }));
          setUtilityMenus(transformedMenus);
        }
      } catch (error) {
        console.error('Error fetching header data:', error);
      } finally {
        setMenuLoading(false);
      }
    };

    fetchHeaderData();
  }, []);

  return (
    <>
      {/* Top bar */}
      {/* {
        isTrackingShow && (
          <Link href="/tracking" className="bg-gray-700 text-white text-sm py-2 px-4 flex items-center justify-center hover:bg-gray-600 transition-colors">
            <Truck className="w-4 h-4 mr-2" />
            <span className="text-xs ">Track your order</span>
          </Link>
        )
      } */}


      {/* Main header */}
      <div className="bg-white shadow-sm sticky top-0 z-50">
        {/* Upper part: Logo, Search, Login/Wishlist/Cart */}
        <div className="px-4 py-3">
          <div className="max-w-screen-2xl mx-auto flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/">
                <Image
                  src={logoUrl || ""}
                  alt="Logo"
                  width={170}
                  height={70}
                  className="w-32 sm:w-40 "
                  priority
                  unoptimized={!!logoUrl}
                />
              </Link>
            </div>

            {/* Desktop Search - Center */}
            <div className="hidden md:flex flex-1 mx-8">
              <SearchBar className="w-full mx-5" />
            </div>

            {/* Right section - Login/Wishlist/Cart */}
            <div className="flex items-center space-x-2 sm:space-x-4">
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
                <div className="hidden lg:block">
                  {
                    user?._id ? user?.role === 'admin' ? (
                      <Link href={`/admin/dashboard`} className="p-1 block bg-gray-100 hover:bg-gray-200 cursor-pointer rounded-full transition-colors border border-gray-200" aria-label="Admin Dashboard">
                        {user?.avatar ? (
                          <img
                            src={user.avatar}
                            alt="Admin Profile"
                            className="w-6 h-6 sm:w-7 sm:h-7 rounded-full object-cover"
                          />
                        ) : (
                          <User className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
                        )}
                      </Link>
                    ) : (
                      <Link href={`/dashboard`} className="p-1 block  bg-gray-100 hover:bg-gray-200 cursor-pointer rounded-full transition-colors border border-gray-200" aria-label="User Dashboard">
                        {user?.avatar ? (
                          <img
                            src={user.avatar}
                            alt="User Profile"
                            className="w-6 h-6 sm:w-7 sm:h-7 rounded-full object-cover"
                          />
                        ) : (
                          <User className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
                        )}
                      </Link>
                    ) : (
                      <Link href="/login" className="p-2 block hover:bg-gray-100 rounded-full transition-colors" aria-label="Login">
                        <User className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
                      </Link>
                    )
                  }
                </div>

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

                {/* Cart with badge - Hidden on mobile, shown on desktop */}
                <button
                  onClick={() => setIsCartOpen(true)}
                  className="hidden lg:flex relative p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer items-center"
                  aria-label={`Shopping cart with ${cartCount} items`}
                >
                  <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
                  <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">
                    {cartLoading ? (
                      <div className="">0</div>
                    ) : (
                      Number(cartCount) || 0
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
        </div>

        {/* Lower part: Navigation Menu */}
        <div className="hidden lg:block border-t border-gray-100">
          <div className="px-4 py-3">
            <div className="max-w-screen-2xl mx-auto">
              <nav className="flex items-center justify-between">
                {/* Left side - Categories Megamenu and Main menu */}
                <div className="flex items-center space-x-8">
                  {/* Other navigation items */}
                  {menuLoading ? (
                    <div className="flex space-x-8">
                      {[...Array(6)].map((_, index) => (
                        <div key={index} className="h-4 bg-gray-200 rounded animate-pulse w-16"></div>
                      ))}
                    </div>
                  ) : (
                    <>
                      {navigationMenu.map((item) => (
                        item.name === "Categories" ? (
                          <CategoryMegamenu key={item.id} />
                        ) : (
                          <Link
                            key={item.id}
                            href={item.href}
                            className={`text-sm font-medium transition-colors hover:text-pink-600 ${isMenuItemActive(item.href) ? 'text-pink-600' : 'text-gray-700'
                              }`}
                          >
                            {item.name}
                          </Link>
                        )
                      ))}

                      {videoMenuData?.isEnabled && (
                        <Link
                          href={videoMenuData.url || '/videos'}
                          className={`text-sm font-medium px-3 py-1 rounded-full transition-transform hover:scale-105 ml-2 ${videoMenuData.tailwindClasses || ''}`}
                          style={{
                            backgroundColor: videoMenuData.backgroundColor || '#FF0000',
                            color: videoMenuData.textColor || '#FFFFFF'
                          }}
                        >
                          {videoMenuData.name || 'Videos'}
                        </Link>
                      )}
                    </>
                  )}
                </div>

                {/* Right side - Utility Menus */}
                <div className='flex items-center gap-x-6'>
                  {menuLoading ? (
                    <div className="flex space-x-4">
                      {[...Array(2)].map((_, index) => (
                        <div key={index} className="h-4 bg-gray-200 rounded animate-pulse w-16"></div>
                      ))}
                    </div>
                  ) : (
                    utilityMenus.map(menu => (
                      <Link
                        key={menu.id}
                        href={menu.href}
                        target={menu.target}
                        className="flex items-center space-x-2 text-gray-700 hover:text-[#f18daa] transition-colors"
                      >
                        <span className="font-medium">{menu.name}</span>
                      </Link>
                    ))
                  )}
                </div>
              </nav>
            </div>
          </div>
        </div>

        {/* Mobile Search Bar */}
        {isSearchOpen && (
          <div className="md:hidden mt-4 px-4 pb-4">
            <div className="max-w-screen-2xl mx-auto">
              <SearchBar
                isMobile={true}
                onSearchSubmit={() => setIsSearchOpen(false)}
              />
            </div>
          </div>
        )}

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 bg-white">
            <nav className="px-4 py-4 max-w-screen-2xl mx-auto">
              <div className="flex flex-col space-y-1">
                {menuLoading ? (
                  <div className="space-y-3">
                    {[...Array(6)].map((_, index) => (
                      <div key={index} className="h-8 bg-gray-200 rounded animate-pulse" style={{ width: `${60 + index * 10}%` }}></div>
                    ))}
                  </div>
                ) : (
                  navigationMenu.map((item, index) => {
                    const isActive = isMenuItemActive(item.href);
                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        target={item.target}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`mobile-menu-item px-4 py-3 rounded-lg font-medium transition-all duration-200 ${isActive
                          ? 'bg-[#EF3D6A] text-white shadow-sm'
                          : 'text-gray-700 hover:bg-pink-50 hover:text-[#EF3D6A]'
                          }`}
                        style={{
                          animationDelay: `${index * 0.05}s`
                        }}
                      >
                        {item.name}
                      </Link>
                    );
                  })
                )}
              </div>
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
export default function HeaderWithSuspense({ isTrackingShow = true, logoUrl }) {
  return (
    <Suspense fallback={<div className="h-16 bg-white"></div>}>
      <Header isTrackingShow={isTrackingShow} logoUrl={logoUrl} />
    </Suspense>
  );
}
