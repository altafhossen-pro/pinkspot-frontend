'use client';

import React, { useEffect } from 'react';
import { X, Heart, Trash2, ShoppingCart } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { moveWishlistItemToCart, removeProductFromWishlist } from '@/utils/wishlistUtils';
import toast from 'react-hot-toast';
    
export default function WishlistModal({ isOpen, onClose }) {
    const { wishlist, wishlistCount, removeFromWishlist, moveToCart, setWishlist, setWishlistCount } = useAppContext();
    const router = useRouter();

    // Body scroll lock when modal is open
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

    const handleMoveToCart = (wishlistItem) => {
        // Call moveToCart directly and check success
        const success = moveToCart(wishlistItem);
        if (success) {
            // Remove from wishlist after successful move to cart
            removeFromWishlist(wishlistItem.productId);
        }
    };

    const handleRemoveFromWishlist = (productId) => {
        removeProductFromWishlist(productId, removeFromWishlist);
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black z-[9999] transition-all duration-300 ease-out ${isOpen ? 'opacity-50' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
                style={{ display: isOpen ? 'block' : 'none' }}
            ></div>

            {/* Wishlist Modal */}
            <div className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-white z-[10000] transform transition-all duration-300 ease-out flex flex-col ${isOpen ? 'translate-x-0 shadow-2xl' : 'translate-x-full shadow-none'}`}>

                {/* Header */}
                <div className={`flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0 transition-all duration-300 ease-out ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}>
                    <div className="flex items-center gap-2">
                        <Heart className="w-6 h-6 text-[#EF3D6A]" />
                        <h2 className="text-lg font-semibold text-gray-800">Wishlist</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200 hover:scale-110"
                        aria-label="Close wishlist"
                    >
                        <X className="w-5 h-5 text-gray-600" />
                    </button>
                </div>

                {/* Wishlist Items - Scrollable */}
                <div className="flex-1 overflow-y-auto p-4">
                    {wishlist.length === 0 ? (
                        <div className={`text-center py-8 transition-all duration-300 ease-out ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-600 mb-2">Your wishlist is empty</h3>
                            <p className="text-sm text-gray-500">Add some products to your wishlist!</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {wishlist.map((item, index) => (
                                <div 
                                    key={item.id} 
                                    className={`flex gap-3 p-2 bg-gray-50 rounded-lg transition-all duration-300 ease-out ${isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}`}
                                    style={{ transitionDelay: `${index * 50}ms` }}
                                >
                                    {/* Product Image */}
                                    <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
                                        <Link href={`/product/${item.slug}`}>
                                            <img
                                                src={item.image}
                                                alt={item.name}
                                                className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                                            />
                                        </Link>
                                    </div>

                                    {/* Product Details */}
                                    <div className="flex-1 min-w-0">
                                        <Link href={`/product/${item.slug}`} className="block">
                                            <h3 className="font-medium text-gray-800 text-sm mb-1 truncate hover:text-[#EF3D6A] transition-colors">
                                                {item.name}
                                            </h3>
                                        </Link>

                                        <p className="text-sm text-[#EF3D6A] font-semibold mb-2">
                                            {item.price} ৳
                                        </p>

                                        {/* Action Buttons */}
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleMoveToCart(item)}
                                                className="flex items-center gap-1 bg-[#EF3D6A] text-white text-xs px-2 py-1 rounded hover:bg-[#D63447] transition-colors"
                                            >
                                                <ShoppingCart className="w-3 h-3" />
                                                Move to Cart
                                            </button>
                                        </div>
                                    </div>

                                    {/* Remove Button */}
                                    <div className='flex items-center justify-center'>
                                        <button
                                            onClick={() => handleRemoveFromWishlist(item.productId)}
                                            className="p-2 h-fit text-[#EF3D6A] hover:bg-[#EF3D6A] hover:text-white rounded-full transition-colors cursor-pointer"
                                            aria-label={`Remove ${item.title} from wishlist`}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                
            </div>
        </>
    );
}
