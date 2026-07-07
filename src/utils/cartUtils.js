import { toast } from 'react-hot-toast';

/**
 * Common utility function to add a product to cart with its first variant
 * @param {Object} product - The product object
 * @param {Function} addToCart - The addToCart function from AppContext
 * @param {number} quantity - Quantity to add (default: 1)
 */
export const addProductToCart = (product, addToCart, quantity = 1) => {
  try {
    // Get the first available variant or create a proper variant object
    let selectedVariant = null;
    
    if (product.variants && product.variants.length > 0) {
      // Find the first available variant (with stock > 0)
      let selectedVariantData = null;
      
      for (const variant of product.variants) {
        if ((variant.stockQuantity || 0) > 0) {
          selectedVariantData = variant;
          break;
        }
      }
      
      // If no variant has stock, show error
      if (!selectedVariantData) {
        toast.error('This product is out of stock');
        return;
      }
      
      // Extract size/color attributes from the selected variant
      const sizeAttr = selectedVariantData.attributes?.find(attr => attr.name === 'Size');
      const colorAttr = selectedVariantData.attributes?.find(attr => attr.name === 'Color');
      
      selectedVariant = {
        size: sizeAttr?.value || null, // Size is optional now
        color: colorAttr?.value || null, // Color is optional
        hexCode: colorAttr?.hexCode || null, // Only set if color exists
        currentPrice: selectedVariantData.currentPrice || product.price,
        originalPrice: selectedVariantData.originalPrice || product.originalPrice,
        sku: selectedVariantData.sku,
        stockQuantity: selectedVariantData.stockQuantity || 0,
        stockStatus: selectedVariantData.stockStatus || 'in_stock'
      };
    } else {
      // If no variants, create a default variant
      const isProductOutOfStock = (product.totalStock || 0) <= 0;
      
      if (isProductOutOfStock) {
        // If product is out of stock, show error and don't add to cart
        toast.error('This product is out of stock');
        return;
      }
      
      selectedVariant = {
        size: null, // Size is optional now
        color: null, // Color is optional
        hexCode: null, // No color by default
        currentPrice: product.price,
        originalPrice: product.originalPrice,
        sku: product.slug || 'default-sku',
        stockQuantity: product.totalStock || 0,
        stockStatus: (product.totalStock || 0) > 0 ? 'in_stock' : 'out_of_stock'
      };
    }

    // Create a proper product object for cart
    const cartProduct = {
      _id: product._id,
      title: product.title || product.name,
      slug: product.slug,
      featuredImage: product.featuredImage || product.image,
      basePrice: product.price,
      variants: product.variants || []
    };

    addToCart(cartProduct, selectedVariant, quantity);
  } catch (error) {
    console.error('Error adding to cart:', error);
    toast.error('Failed to add product to cart');
  }
};
