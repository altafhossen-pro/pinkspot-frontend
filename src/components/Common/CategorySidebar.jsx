'use client';

import React, { useEffect, useState } from 'react';
import { X, Menu, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { categoryAPI } from '@/services/api';

export default function CategorySidebar({ isOpen, onClose }) {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch categories
  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await categoryAPI.getMainCategories();
      
      if (response.success) {
        setCategories(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle category click - navigate to shop with category filter
  const handleCategoryClick = (category) => {
    router.push(`/shop?category=${category.slug}`);
    onClose();
  };

  // Handle view all categories
  const handleViewAll = () => {
    router.push('/categories');
    onClose();
  };

  // Body scroll lock when sidebar is open
  useEffect(() => {
    let scrollY = 0;

    if (isOpen) {
      // Save current scroll position
      scrollY = window.scrollY;
      
      // Calculate scrollbar width to prevent layout shift
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

      // Disable body scroll and prevent layout shift
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollbarWidth}px`;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
    } else {
      // Restore body scroll and position
      const savedScrollY = parseInt(document.body.style.top || '0') * -1;
      
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';

      // Restore scroll position
      if (savedScrollY > 0) {
        window.scrollTo(0, savedScrollY);
      }
    }

    // Cleanup function
    return () => {
      const savedScrollY = parseInt(document.body.style.top || '0') * -1;
      
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';

      // Restore scroll position on cleanup
      if (savedScrollY > 0) {
        window.scrollTo(0, savedScrollY);
      }
    };
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black z-[9999] transition-all duration-300 ease-out ${isOpen ? 'opacity-50' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
        style={{ display: isOpen ? 'block' : 'none' }}
      ></div>

      {/* Category Sidebar */}
      <div className={`fixed top-0 left-0 h-full w-full sm:w-80 bg-white z-[10000] transform transition-all duration-300 ease-out flex flex-col ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full shadow-none'}`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0 transition-all duration-300 ease-out ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}>
          <div className="flex items-center gap-2">
            <Menu className="w-6 h-6 text-[#EF3D6A]" />
            <h2 className="text-lg font-semibold text-gray-800">Categories</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200 hover:scale-110"
            aria-label="Close categories"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Categories List - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            // Loading skeleton
            <div className="p-4 space-y-3">
              {Array.from({ length: 8 }).map((_, index) => (
                <div 
                  key={index} 
                  className={`h-12 bg-gray-100 rounded-lg animate-pulse transition-all duration-300 ease-out ${isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}
                  style={{ transitionDelay: `${index * 50}ms` }}
                ></div>
              ))}
            </div>
          ) : categories.length === 0 ? (
            <div className={`text-center py-8 px-4 transition-all duration-300 ease-out ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <Menu className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">No categories found</h3>
              <p className="text-sm text-gray-500">Categories will appear here</p>
            </div>
          ) : (
            <div className="p-2">
              {categories.map((category, index) => (
                <button
                  key={category._id || index}
                  onClick={() => handleCategoryClick(category)}
                  className={`w-full flex items-center justify-between p-4 rounded-lg hover:bg-pink-50 transition-all duration-200 group ${isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}
                  style={{ transitionDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* Category Image or Icon */}
                    {category.image ? (
                      <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={category.image}
                          alt={category.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-lg font-bold">
                          {category.name?.charAt(0)?.toUpperCase() || 'C'}
                        </span>
                      </div>
                    )}
                    
                    {/* Category Name */}
                    <div className="flex-1 min-w-0 text-left">
                      <h3 className="font-medium text-gray-800 group-hover:text-[#EF3D6A] transition-colors truncate">
                        {category.name}
                      </h3>
                      {category.productCount !== undefined && (
                        <p className="text-xs text-gray-500 mt-1">
                          {category.productCount} Products
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Chevron Icon */}
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#EF3D6A] transition-colors flex-shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer - View All Button */}
        {!loading && categories.length > 0 && (
          <div className={`border-t border-gray-200 p-4 flex-shrink-0 transition-all duration-300 ease-out ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <button
              onClick={handleViewAll}
              className="w-full bg-[#EF3D6A] text-white py-3 px-4 rounded-lg font-semibold hover:bg-[#D63447] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] hover:shadow-lg"
            >
              <Menu className="w-5 h-5" />
              <span>View All Categories</span>
            </button>
          </div>
        )}
      </div>
    </>
  );
}

