'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, ChevronRight } from 'lucide-react';
import { categoryAPI } from '@/services/api';

// Fallback categories data
const fallbackCategories = [
  {
    _id: '1',
    name: 'Automotive',
    slug: 'automotive',
    image: null,
    childCategories: [
      { _id: '1-1', name: 'Motorcycle Riding Gear', slug: 'motorcycle-riding-gear' },
      { _id: '1-2', name: 'Oil & Fluids', slug: 'oil-fluids' },
      { _id: '1-3', name: 'Vehicle Care', slug: 'vehicle-care' },
      { _id: '1-4', name: 'Vehicle Fluids & Lubricants', slug: 'vehicle-fluids-lubricants' },
    ]
  },
  {
    _id: '2',
    name: 'Books',
    slug: 'books',
    image: null,
    childCategories: []
  },
  {
    _id: '3',
    name: 'Electronic Accessories',
    slug: 'electronic-accessories',
    image: null,
    childCategories: []
  },
  {
    _id: '4',
    name: 'Electronics Device',
    slug: 'electronics-device',
    image: null,
    childCategories: []
  },
  {
    _id: '5',
    name: 'Groceries',
    slug: 'groceries',
    image: null,
    childCategories: []
  },
  {
    _id: '6',
    name: 'Health & Beauty',
    slug: 'health-beauty',
    image: null,
    childCategories: []
  },
];

export default function CategoryMegamenu() {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const menuRef = useRef(null);
  const timeoutRef = useRef(null);

  // Fetch categories with children
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await categoryAPI.getCategoriesForMegamenu();
        if (response.success && response.data && response.data.length > 0) {
          setCategories(response.data);
        } else {
          // Use fallback data if API fails or returns empty
          setCategories(fallbackCategories);
        }
      } catch (error) {
        console.error('Error fetching categories for megamenu:', error);
        // Use fallback data on error
        setCategories(fallbackCategories);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Handle mouse enter on menu button
  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsOpen(true);
  };

  // Handle mouse leave from menu
  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
      setHoveredCategory(null);
    }, 200);
  };

  // Handle category click
  const handleCategoryClick = (category) => {
    router.push(`/shop?category=${category.slug}`);
    setIsOpen(false);
    setHoveredCategory(null);
  };

  // Handle subcategory click
  const handleSubcategoryClick = (subcategory) => {
    router.push(`/shop?category=${subcategory.slug}`);
    setIsOpen(false);
    setHoveredCategory(null);
  };

  return (
    <div
      className="relative"
      ref={menuRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Menu Button */}
      <button
        className="flex items-center gap-2 px-4 py-2 font-medium text-gray-700 hover:text-[#f18daa] transition-colors cursor-pointer"
      >
        <Menu className="w-5 h-5 -mb-[1px]" />
        <span>Categories</span>
      </button>

      {/* Megamenu Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 w-[600px] overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f18daa] mx-auto"></div>
            </div>
          ) : categories.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No categories available
            </div>
          ) : (
            <div className="flex">
              {/* Left Column - Main Categories */}
              <div className="w-1/2 border-r border-gray-200 max-h-[400px] overflow-y-auto">
                {categories.map((category) => (
                  <div
                    key={category._id}
                    className={`group cursor-pointer border-b border-gray-100 ${hoveredCategory?._id === category._id
                      ? 'bg-[#f18daa]'
                      : 'hover:bg-gray-50'
                      } transition-colors`}
                    onMouseEnter={() => setHoveredCategory(category)}
                    onClick={() => handleCategoryClick(category)}
                  >
                    <div className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {/* Category Icon/Image */}
                        {category.image ? (
                          <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-[#f18daa]">
                            <img
                              src={category.image}
                              alt={category.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-[#f18daa] flex items-center justify-center flex-shrink-0">
                            <span className="text-pink-600 text-sm font-semibold">
                              {category.name?.charAt(0)?.toUpperCase() || 'C'}
                            </span>
                          </div>
                        )}

                        {/* Category Name */}
                        <span
                          className={`font-medium text-sm ${hoveredCategory?._id === category._id
                            ? 'text-pink-600'
                            : 'text-gray-700'
                            } group-hover:text-pink-600 transition-colors`}
                        >
                          {category.name}
                        </span>
                      </div>

                      {/* Chevron Icon */}
                      {category.childCategories && category.childCategories.length > 0 && (
                        <ChevronRight
                          className={`w-4 h-4 flex-shrink-0 ${hoveredCategory?._id === category._id
                            ? 'text-[#f18daa]'
                            : 'text-gray-400'
                            } transition-colors`}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Right Column - Subcategories */}
              <div className="w-1/2 max-h-[400px] overflow-y-auto bg-white">
                {hoveredCategory && hoveredCategory.childCategories && hoveredCategory.childCategories.length > 0 ? (
                  <div className="p-4">
                    {hoveredCategory.childCategories.map((subcategory, index) => (
                      <div
                        key={subcategory._id || index}
                        className="group cursor-pointer py-2 px-3 rounded-lg hover:bg-[#f18daa] transition-colors mb-1"
                        onClick={() => handleSubcategoryClick(subcategory)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700 group-hover:text-[#f18daa] transition-colors">
                            {subcategory.name}
                          </span>
                          {subcategory.childCategories && subcategory.childCategories.length > 0 && (
                            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#f18daa] transition-colors" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : hoveredCategory ? (
                  <div className="p-8 text-center text-gray-500">
                    <p className="text-sm">No subcategories available</p>
                    <button
                      onClick={() => handleCategoryClick(hoveredCategory)}
                      className="mt-4 px-4 py-2 bg-[#f18daa] text-white rounded-lg hover:bg-[#f18daa] transition-colors text-sm font-medium cursor-pointer"
                    >
                      View All Products
                    </button>
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-400">
                    <p className="text-sm">Select a category to view subcategories</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
