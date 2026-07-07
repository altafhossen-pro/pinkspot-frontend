import toast from 'react-hot-toast';

/**
 * Common utility function to add a product to wishlist
 * @param {Object} product - The product object
 * @param {Function} addToWishlist - The addToWishlist function from AppContext
 */
export const addProductToWishlist = (product, addToWishlist) => {
  try {
    addToWishlist(product);
    toast.success('Added to wishlist!');
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    toast.error('Failed to add to wishlist');
  }
};

/**
 * Common utility function to remove a product from wishlist
 * @param {string} productId - The product ID to remove
 * @param {Function} removeFromWishlist - The removeFromWishlist function from AppContext
 */
export const removeProductFromWishlist = (productId, removeFromWishlist) => {
  try {
    removeFromWishlist(productId);
    toast.success('Removed from wishlist!');
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    toast.error('Failed to remove from wishlist');
  }
};

/**
 * Common utility function to move a product from wishlist to cart
 * @param {Object} wishlistItem - The wishlist item to move
 * @param {Function} moveToCart - The moveToCart function from AppContext
 */
export const moveWishlistItemToCart = (wishlistItem, moveToCart) => {
  try {
    const success = moveToCart(wishlistItem);
    if (success) {
      toast.success('Moved to cart successfully!');
      return true;
    } else {
      toast.error('Failed to move to cart');
      return false;
    }
  } catch (error) {
    console.error('Error moving to cart:', error);
    toast.error('Failed to move to cart');
    return false;
  }
};
