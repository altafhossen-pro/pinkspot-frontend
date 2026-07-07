'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Heart, ShoppingCart } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAppContext } from '@/context/AppContext';
import { productAPI, transformProductData } from '@/services/api';
import ProductCard from '@/components/Common/ProductCard';
import { addProductToCart } from '@/utils/cartUtils';
import { addProductToWishlist } from '@/utils/wishlistUtils';

const SimilarProducts = ({ currentProductId, currentProductCategory }) => {
  const { addToCart, addToWishlist, removeFromWishlist, wishlist } = useAppContext();
  const [similarProducts, setSimilarProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentProductId) {
      fetchSimilarProducts();
    }
  }, [currentProductId]);

  const fetchSimilarProducts = async () => {
    try {
      setLoading(true);
      // Use the new smart similar products API
      const response = await productAPI.getSimilarProducts(currentProductId, 10, 5);

      if (response.success) {
        // Transform products and keep original data for variants
        const products = response.data || [];
        const transformedProducts = products.map(product => ({
          ...transformProductData(product),
          variants: product.variants || [], // Keep original variants
          _id: product._id, // Keep original ID
          title: product.title, // Keep original title
          slug: product.slug, // Keep original slug
          featuredImage: product.featuredImage // Keep original image
        }));
        setSimilarProducts(transformedProducts || []);
      }
    } catch (error) {
      console.error('Error fetching similar products:', error);
    } finally {
      setLoading(false);
    }
  };

  // Update products wishlist state when global wishlist changes
  useEffect(() => {
    if (similarProducts.length > 0) {
      setSimilarProducts(prev => prev.map(product => ({
        ...product,
        isWishlisted: wishlist.some(item => item.productId === product._id)
      })));
    }
  }, [wishlist]);

  const handleAddToCart = useCallback((product) => {
    addProductToCart(product, addToCart, 1);
  }, [addToCart]);

  const handleWishlistToggle = useCallback((productId) => {
    const product = similarProducts.find(p => p.id === productId || p._id === productId);
    if (product) {
      // Check if product is already in wishlist
      const isInWishlist = wishlist.some(item => item.productId === product._id);

      if (isInWishlist) {
        // Remove from wishlist
        removeFromWishlist(product._id);
        toast.success('Removed from wishlist!');
      } else {
        // Add to wishlist
        const productForWishlist = {
          ...product,
          price: product.variants?.[0]?.currentPrice || product.basePrice || 0,
          category: product.category?.name || product.category || 'Other'
        };
        addProductToWishlist(productForWishlist, addToWishlist);
      }
    }
  }, [similarProducts, wishlist, addToWishlist, removeFromWishlist]);

  const handleAddToCartFromCard = useCallback((productId) => {
    const selectedProduct = similarProducts.find(p => p.id === productId || p._id === productId);
    if (selectedProduct) {
      handleAddToCart(selectedProduct);
    }
  }, [similarProducts, handleAddToCart]);

  if (loading) {
    return (
      <div className="py-12">
        <div className="max-w-screen-2xl  mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Similar Products</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="bg-gray-200 h-48 rounded-lg mb-4"></div>
                <div className="bg-gray-200 h-4 rounded mb-2"></div>
                <div className="bg-gray-200 h-4 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!currentProductId || similarProducts.length === 0) {
    return null;
  }

  return (
    <div className="py-12 ">
      <div className="max-w-screen-2xl  mx-auto px-0  lg:px-0">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">Similar Products</h2>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
          {similarProducts.map((product) => (
            <ProductCard
              key={product._id || product.id}
              product={{
                ...product,
                isWishlisted: wishlist.some(item => item.productId === product._id)
              }}
              onWishlistToggle={handleWishlistToggle}
              onAddToCart={handleAddToCartFromCard}
              showWishlistOnHover={true}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default SimilarProducts;
