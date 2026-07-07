'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Search } from 'lucide-react';
import { productAPI } from '@/services/api';
import Link from 'next/link';

export default function SearchBar({ isMobile = false, onSearchSubmit, className = "" }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false); // Track if search has been performed
  const router = useRouter();
  const pathname = usePathname();
  const searchRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Debounced search function
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim().length >= 1) {
        fetchSuggestions(searchQuery.trim());
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target) &&
          suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close suggestions when route changes
  useEffect(() => {
    setShowSuggestions(false);
    setSuggestions([]);
  }, [pathname]);

  const fetchSuggestions = async (query) => {
    if (query.length < 1) return;
    
    setIsLoading(true);
    setHasSearched(true); // Mark that search has been performed
    try {
      const response = await productAPI.searchProducts(query, { limit: 5 });
      if (response.success && response.data) {
        setSuggestions(response.data.products || response.data || []);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?query=${encodeURIComponent(searchQuery.trim())}`);
      setShowSuggestions(false);
      if (onSearchSubmit) {
        onSearchSubmit();
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch(e);
    }
  };

  const handleSuggestionClick = (product) => {
    // Close suggestions immediately before navigation
    setShowSuggestions(false);
    setSuggestions([]);
    setSearchQuery(product.title || product.name);
    // Navigate to product page
    router.push(`/product/${product.slug}`);
    // Call onSearchSubmit if provided (for mobile search)
    if (onSearchSubmit) {
      onSearchSubmit();
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (value.trim().length < 1) {
      setSuggestions([]);
      setShowSuggestions(false);
      setHasSearched(false); // Reset search state when query is cleared
    } else {
      // Keep suggestions open even when no results to show "No products found" message
      setShowSuggestions(true);
    }
  };

  return (
    <div className={`relative ${className}`} ref={searchRef}>
      <form onSubmit={handleSearch}>
        <div className="flex items-center bg-gray-100 rounded-full px-4 py-2">
          <input
            type="text"
            placeholder="Search here"
            value={searchQuery}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            onFocus={() => {
              if (suggestions.length > 0) {
                setShowSuggestions(true);
              }
            }}
            className="bg-transparent outline-none text-sm flex-1 placeholder-gray-500"
            autoFocus={isMobile}
          />
          <button 
            type="submit"
            className="bg-pink-500 text-white rounded-full p-2 ml-2 hover:bg-pink-600 transition-colors cursor-pointer"
            aria-label="Search products"
            title="Search products"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>
      </form>

             {/* Search Suggestions */}
       {showSuggestions && (isLoading || hasSearched) && (
         <div 
           ref={suggestionsRef}
           className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto"
         >
           {isLoading ? (
             <div className="p-4 text-center text-gray-500">
               <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-500 mx-auto"></div>
               <p className="mt-2">Searching...</p>
             </div>
           ) : suggestions.length > 0 ? (
             <div>
               {suggestions.map((product, index) => (
                 <div
                   key={product._id || product.id || index}
                   onClick={() => handleSuggestionClick(product)}
                   className="flex items-center p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                 >
                   <div className="w-12 h-12 flex-shrink-0 mr-3">
                     <img
                       src={product.featuredImage || product.image || '/images/placeholder.png'}
                       alt={product.title || product.name}
                       className="w-full h-full object-cover rounded-md"
                       onError={(e) => {
                         e.target.src = '/images/placeholder.png';
                       }}
                     />
                   </div>
                   <div className="flex-1 min-w-0">
                     <h4 className="text-sm font-medium text-gray-900 truncate">
                       {product.title || product.name}
                     </h4>
                     <p className="text-xs text-gray-500 truncate">
                       {product.category?.name || 'Category'}
                     </p>
                     <p className="text-sm font-semibold text-pink-600">
                       ৳{product.variants?.[0]?.currentPrice || product.basePrice || product.price || 0}
                     </p>
                   </div>
                 </div>
               ))}
               
               {/* Show all results link */}
               <div className="p-3 bg-gray-50 border-t border-gray-200">
                 <Link
                   href={`/search?query=${encodeURIComponent(searchQuery.trim())}`}
                   className="text-sm text-pink-600 hover:text-pink-700 font-medium block text-center"
                   onClick={() => setShowSuggestions(false)}
                 >
                   View all results for "{searchQuery}"
                 </Link>
               </div>
             </div>
           ) : (
             /* No products found message - only show after search has been performed */
             hasSearched && (
               <div className="p-6 text-center">
                 <div className="w-16 h-16 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                   <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                   </svg>
                 </div>
                 <h3 className="text-sm font-medium text-gray-900 mb-1">No products found</h3>
                 <p className="text-xs text-gray-500 mb-3">
                   Try searching with different keywords
                 </p>
                 <Link
                   href={`/search?query=${encodeURIComponent(searchQuery.trim())}`}
                   className="text-xs text-pink-600 hover:text-pink-700 font-medium"
                   onClick={() => setShowSuggestions(false)}
                 >
                   View search page
                 </Link>
               </div>
             )
           )}
         </div>
       )}
    </div>
  );
}
