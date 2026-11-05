'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import { getCookie, setCookie, deleteCookie } from 'cookies-next'
import { userAPI, settingsAPI } from '@/services/api'

// Create context
const AppContext = createContext()

// Custom hook to use the context
export const useAppContext = () => {
    const context = useContext(AppContext)
    if (!context) {
        throw new Error('useAppContext must be used within an AppProvider')
    }
    return context
}

// Provider component
export const AppProvider = ({ children }) => {
    // User state
    const [user, setUser] = useState(null)
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [token, setToken] = useState(null)

    // Permissions state
    const [permissions, setPermissions] = useState([])
    const [roleDetails, setRoleDetails] = useState(null)

    // Cart state
    const [cart, setCart] = useState([])
    const [cartCount, setCartCount] = useState(0)
    const [cartTotal, setCartTotal] = useState(0)
    const [cartLoading, setCartLoading] = useState(true)

    // Wishlist state
    const [wishlist, setWishlist] = useState([])
    const [wishlistCount, setWishlistCount] = useState(0)

    // UI state
    const [loading, setLoading] = useState(true)
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [isCartOpen, setIsCartOpen] = useState(false)

    // Search state
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState([])

    // Filter state
    const [filters, setFilters] = useState({
        category: '',
        priceRange: [0, 10000],
        sortBy: 'newest',
        inStock: false
    })

    // Delivery charge settings state
    const [deliveryChargeSettings, setDeliveryChargeSettings] = useState(null)
    const [deliverySettingsLoading, setDeliverySettingsLoading] = useState(true)

    // Site settings state — globally loaded once, shared across all components
    const [siteSettings, setSiteSettings] = useState(null)
    const [siteSettingsLoading, setSiteSettingsLoading] = useState(true)

    // Affiliate code state
    const [affiliateCode, setAffiliateCode] = useState(null)
    const [affiliateCodeExpireTime, setAffiliateCodeExpireTime] = useState(null)
    const [isAvailableAffiliateCode, setIsAvailableAffiliateCode] = useState(false)

    // Helper to dynamically calculate combo bundle discounts across cart items
    const recalculateCartPrices = (items) => {
        if (!Array.isArray(items) || items.length === 0) return [];

        // Group items by comboId
        const comboGroups = {};
        items.forEach(item => {
            if (item.comboId && Array.isArray(item.comboRequiredItems) && item.comboRequiredItems.length > 0) {
                if (!comboGroups[item.comboId]) {
                    comboGroups[item.comboId] = [];
                }
                comboGroups[item.comboId].push(item);
            }
        });

        // For each comboId, calculate valid complete bundles
        const comboStats = {};
        Object.keys(comboGroups).forEach(comboId => {
            const groupItems = comboGroups[comboId];
            const requiredKeys = groupItems[0].comboRequiredItems;

            // Sum quantities for each required item in cart
            const itemKeyQtyMap = {};
            groupItems.forEach(item => {
                const key = item.comboItemKey || item.variantKey || item.productId;
                itemKeyQtyMap[key] = (itemKeyQtyMap[key] || 0) + (Number(item.quantity) || 0);
            });

            // A combo bundle is valid ONLY if all required items exist with qty >= 1
            let validBundles = Infinity;
            for (const reqKey of requiredKeys) {
                const currentQty = itemKeyQtyMap[reqKey] || 0;
                if (currentQty < validBundles) {
                    validBundles = currentQty;
                }
            }
            if (validBundles === Infinity || validBundles < 0) {
                validBundles = 0;
            }

            comboStats[comboId] = {
                validBundles,
                requiredKeys,
                isFullyValid: validBundles > 0
            };
        });

        // Now recalculate each item's price, total, and status
        return items.map(item => {
            const qty = Number(item.quantity) || 1;
            const regularPrice = Number(item.regularPrice) || Number(item.originalPrice) || Number(item.price) || 0;

            if (!item.comboId || !comboStats[item.comboId]) {
                const unitPrice = Number(item.price) || regularPrice;
                return {
                    ...item,
                    price: unitPrice,
                    total: unitPrice * qty,
                    isComboActive: false,
                    comboValidBundles: 0,
                    comboDiscountedQty: 0,
                    comboRegularQty: qty
                };
            }

            const stats = comboStats[item.comboId];
            const validBundles = stats.validBundles;
            const comboDiscountedPrice = typeof item.comboDiscountedPrice === 'number'
                ? item.comboDiscountedPrice
                : regularPrice;

            if (validBundles > 0) {
                // Bundle units receive combo discount; extra units revert to regular price
                const discountedQty = Math.min(qty, validBundles);
                const regularQty = Math.max(0, qty - discountedQty);

                const totalItemCost = (discountedQty * comboDiscountedPrice) + (regularQty * regularPrice);
                const effectiveUnitPrice = qty > 0 ? Math.round(totalItemCost / qty) : comboDiscountedPrice;

                return {
                    ...item,
                    price: effectiveUnitPrice,
                    total: totalItemCost,
                    isComboActive: true,
                    comboValidBundles: validBundles,
                    comboDiscountedQty: discountedQty,
                    comboRegularQty: regularQty,
                    comboStatusText: regularQty > 0
                        ? `${discountedQty} in combo (৳${comboDiscountedPrice}), ${regularQty} regular (৳${regularPrice})`
                        : `Combo discount applied (৳${comboDiscountedPrice})`,
                    comboDeliveryType: item.originalComboDeliveryType || item.comboDeliveryType || 'default',
                    comboCustomDeliveryCharge: typeof item.originalComboCustomDeliveryCharge === 'number'
                        ? item.originalComboCustomDeliveryCharge
                        : (item.comboCustomDeliveryCharge || 0)
                };
            } else {
                // Combo broken: 0 complete bundles. All revert to regular price.
                const totalItemCost = qty * regularPrice;
                return {
                    ...item,
                    price: regularPrice,
                    total: totalItemCost,
                    isComboActive: false,
                    comboValidBundles: 0,
                    comboDiscountedQty: 0,
                    comboRegularQty: qty,
                    comboStatusText: 'Combo incomplete - regular price applied',
                    comboDeliveryType: 'default',
                    comboCustomDeliveryCharge: 0
                };
            }
        });
    };

    // Cart functions
    const addToCart = (product, selectedVariant, quantity = 1) => {
        if (product.isForceOutOfStock) {
            import('react-hot-toast').then(({ default: toast }) => toast.error(`Product "${product.title}" is currently out of stock`));
            return;
        }

        // Create variant key for unique identification (size is optional now)
        const variantSku = selectedVariant?.sku;
        const variantKey = selectedVariant ?
            (variantSku ? `${product._id}-${variantSku}` : `${product._id}-${(selectedVariant.size || selectedVariant.attributes?.find(a => a.name?.toLowerCase() === 'size')?.value) || 'no-size'}-${(selectedVariant.color || selectedVariant.attributes?.find(a => a.name?.toLowerCase() === 'color')?.value) || 'no-color'}`) :
            product._id;

        // Create variant display string (size is optional now)
        const variantDisplay = selectedVariant ? (() => {
            const parts = [];
            if (selectedVariant.size) parts.push(`Size: ${selectedVariant.size}`);
            if (selectedVariant.color) parts.push(`Color: ${selectedVariant.color}`);
            if (parts.length === 0 && Array.isArray(selectedVariant.attributes)) {
                const real = selectedVariant.attributes.filter(a => a.name?.toLowerCase() !== 'default' && a.value?.toLowerCase() !== 'standard');
                if (real.length > 0) return real.map(a => `${a.name}: ${a.value}`).join(', ');
            }
            return parts.length > 0 ? parts.join(', ') : 'Default';
        })() : 'Default';

        const activeSubtitle = (product.isGlobalSubtitleOn && product.globalSubtitle)
            ? product.globalSubtitle
            : (!product.isGlobalSubtitleOn && product.customSubtitle && !product.customSubtitle.startsWith('$'))
                ? product.customSubtitle
                : null;

        const cartItem = {
            id: Date.now(), // Unique cart item ID
            productId: product._id,
            productInfo: {
                _id: product._id,
                title: product.title,
                slug: product.slug,
                featuredImage: product.featuredImage,
                category: product.category
            },
            variantKey: variantKey,
            name: product.name || (activeSubtitle ? `${product.title} ${activeSubtitle}` : product.title),
            variant: variantDisplay,
            price: Number(selectedVariant?.currentPrice ?? product.price ?? product.currentPrice ?? product.salePrice ?? product.basePrice ?? (product.priceRange?.min) ?? (product.variants && product.variants[0]?.currentPrice) ?? 0),
            originalPrice: selectedVariant?.originalPrice || null,
            categoryDiscountApplied: product.categoryDiscountApplied || false,
            image: selectedVariant?.image || product.featuredImage || '/images/placeholder.png',
            quantity,
            total: Number(selectedVariant?.currentPrice ?? product.price ?? product.currentPrice ?? product.salePrice ?? product.basePrice ?? (product.priceRange?.min) ?? (product.variants && product.variants[0]?.currentPrice) ?? 0) * quantity,
            size: selectedVariant?.size || null,
            color: selectedVariant?.color || null, // Can be null if no color
            colorHexCode: selectedVariant?.hexCode || null, // Can be null if no color
            sku: selectedVariant?.sku || product.slug,
            stockQuantity: selectedVariant?.stockQuantity || product.totalStock || 0,
            stockStatus: selectedVariant?.stockStatus || 'in_stock',
            // Add proper variant data for stock checking
            variantData: selectedVariant ? {
                size: selectedVariant.size,
                color: selectedVariant.color,
                hexCode: selectedVariant.hexCode,
                sku: selectedVariant.sku,
                stockQuantity: selectedVariant.stockQuantity,
                stockStatus: selectedVariant.stockStatus,
                currentPrice: selectedVariant.currentPrice,
                originalPrice: selectedVariant.originalPrice
            } : null
        }

        const existingItemIndex = cart.findIndex(item => item.variantKey === variantKey);

        if (existingItemIndex !== -1) {
            // Update quantity if same variant exists
            const updatedCart = [...cart];
            const currentItem = updatedCart[existingItemIndex];
            const newQuantity = currentItem.quantity + quantity;
            
            // Check stock limit
            if (newQuantity > currentItem.stockQuantity) {
                toast.error(`Cannot add more. Only ${currentItem.stockQuantity} available.`);
                return;
            }
            
            currentItem.quantity = newQuantity;
            currentItem.total = currentItem.price * currentItem.quantity;
            setCart(recalculateCartPrices(updatedCart));
            toast.success(`Quantity updated! Total: ${currentItem.quantity}`);
        } else {
            // Add new item
            if (quantity > cartItem.stockQuantity) {
                toast.error(`Cannot add. Only ${cartItem.stockQuantity} available.`);
                return;
            }
            setCart(recalculateCartPrices([...cart, cartItem]));
            toast.success('Added to cart successfully!');
        }

        // Auto-open cart modal after adding to cart
        setIsCartOpen(true);
    }

    // Batch add multiple items to cart
    const addMultipleToCart = (items) => {
        if (!items || items.length === 0) return;

        const newCartItems = [];
        const updatedCart = [...cart];

        items.forEach(({ product, selectedVariant, quantity = 1 }) => {
            if (product.isForceOutOfStock) {
                import('react-hot-toast').then(({ default: toast }) => toast.error(`Product "${product.title}" is currently out of stock`));
                return;
            }

            const variantSku = selectedVariant?.sku;
            const comboTag = product.comboId ? `-combo-${product.comboId}-${product.comboItemKey || ''}` : '';
            const variantKey = selectedVariant ?
                (variantSku ? `${product._id}-${variantSku}${comboTag}` : `${product._id}-${(selectedVariant.size || selectedVariant.attributes?.find(a => a.name?.toLowerCase() === 'size')?.value) || 'no-size'}-${(selectedVariant.color || selectedVariant.attributes?.find(a => a.name?.toLowerCase() === 'color')?.value) || 'no-color'}${comboTag}`) :
                `${product._id}${comboTag}`;

            // Create variant display string (size is optional now)
            const variantDisplay = selectedVariant ? (() => {
                const parts = [];
                if (selectedVariant.size) parts.push(`Size: ${selectedVariant.size}`);
                if (selectedVariant.color) parts.push(`Color: ${selectedVariant.color}`);
                if (parts.length === 0 && Array.isArray(selectedVariant.attributes)) {
                const real = selectedVariant.attributes.filter(a => a.name?.toLowerCase() !== 'default' && a.value?.toLowerCase() !== 'standard');
                if (real.length > 0) return real.map(a => `${a.name}: ${a.value}`).join(', ');
            }
            return parts.length > 0 ? parts.join(', ') : 'Default';
            })() : 'Default';

            const batchActiveSubtitle = (product.isGlobalSubtitleOn && product.globalSubtitle)
                ? product.globalSubtitle
                : (!product.isGlobalSubtitleOn && product.customSubtitle && !product.customSubtitle.startsWith('$'))
                    ? product.customSubtitle
                    : null;

            const cartItem = {
                id: Date.now() + Math.random(), // Unique cart item ID
                productId: product._id,
                productInfo: {
                    _id: product._id,
                    title: product.title,
                    slug: product.slug,
                    featuredImage: product.featuredImage,
                    category: product.category
                },
                variantKey: variantKey,
                name: product.name || (batchActiveSubtitle ? `${product.title} ${batchActiveSubtitle}` : product.title),
                variant: variantDisplay,
                price: typeof product.comboDiscountedPrice === 'number' ? product.comboDiscountedPrice : Number(selectedVariant?.currentPrice ?? product.price ?? product.currentPrice ?? product.salePrice ?? product.basePrice ?? (product.priceRange?.min) ?? 0),
                regularPrice: Number(product.regularPrice || selectedVariant?.originalPrice || product.price || product.basePrice || 0),
                comboDiscountedPrice: typeof product.comboDiscountedPrice === 'number' ? product.comboDiscountedPrice : Number(selectedVariant?.currentPrice ?? product.price ?? product.currentPrice ?? product.salePrice ?? product.basePrice ?? (product.priceRange?.min) ?? 0),
                comboId: product.comboId || null,
                comboSlug: product.comboSlug || null,
                comboTitle: product.comboTitle || null,
                comboItemKey: product.comboItemKey || null,
                comboRequiredItems: Array.isArray(product.comboRequiredItems) ? product.comboRequiredItems : [],
                comboDeliveryType: product.comboDeliveryType || 'default',
                comboCustomDeliveryCharge: Number(product.comboCustomDeliveryCharge) || 0,
                originalComboDeliveryType: product.originalComboDeliveryType || product.comboDeliveryType || 'default',
                originalComboCustomDeliveryCharge: Number(product.originalComboCustomDeliveryCharge) || Number(product.comboCustomDeliveryCharge) || 0,
                isComboActive: !!product.isComboActive,
                originalPrice: selectedVariant?.originalPrice || null,
                categoryDiscountApplied: product.categoryDiscountApplied || false,
                image: selectedVariant?.image || product.featuredImage || '/images/placeholder.png',
                quantity,
                total: Number(selectedVariant?.currentPrice ?? product.price ?? product.currentPrice ?? product.salePrice ?? product.basePrice ?? (product.priceRange?.min) ?? (product.variants && product.variants[0]?.currentPrice) ?? 0) * quantity,
                size: selectedVariant?.size || null,
                color: selectedVariant?.color || null,
                colorHexCode: selectedVariant?.hexCode || null,
                sku: selectedVariant?.sku || product.slug,
                stockQuantity: typeof selectedVariant?.stockQuantity === 'number' ? selectedVariant.stockQuantity : (product.totalStock || 999),
                stockStatus: selectedVariant?.stockStatus || 'in_stock',
                // Add proper variant data for stock checking
                variantData: selectedVariant ? {
                    size: selectedVariant.size,
                    color: selectedVariant.color,
                    hexCode: selectedVariant.hexCode,
                    sku: selectedVariant.sku,
                    stockQuantity: selectedVariant.stockQuantity,
                    stockStatus: selectedVariant.stockStatus,
                    currentPrice: selectedVariant.currentPrice,
                    originalPrice: selectedVariant.originalPrice
                } : null
            };

            const existingItemIndex = updatedCart.findIndex(item => item.variantKey === variantKey);

            if (existingItemIndex !== -1) {
                // Update quantity if same variant exists
                const currentItem = updatedCart[existingItemIndex];
                const newQuantity = currentItem.quantity + quantity;
                if (!currentItem.stockQuantity || newQuantity <= currentItem.stockQuantity) {
                    currentItem.quantity = newQuantity;
                    currentItem.total = currentItem.price * currentItem.quantity;
                } else {
                    toast.error(`Stock limit reached for ${currentItem.name}`);
                }
            } else {
                // Add new item
                if (!cartItem.stockQuantity || quantity <= cartItem.stockQuantity) {
                    newCartItems.push(cartItem);
                } else {
                    toast.error(`Stock limit reached for ${cartItem.name}`);
                }
            }
        });

        // Update cart with all new items at once
        setCart(recalculateCartPrices([...updatedCart, ...newCartItems]));

        // Show success message
        toast.success(`${items.length} product(s) added to cart`);

        // Auto-open cart modal after adding to cart
        setIsCartOpen(true);
    }

    const removeFromCart = (cartItemId) => {
        setCart(recalculateCartPrices(cart.filter(item => item.id !== cartItemId)));
        toast.success('Item removed from cart');
    }

    const updateCartItem = (cartItemId, quantity) => {
        // Don't allow quantity less than 1
        if (quantity < 1) {
            toast.error('Quantity cannot be less than 1');
            return;
        }
        
        const item = cart.find(i => i.id === cartItemId);
        if (item && quantity > item.stockQuantity) {
            toast.error(`Only ${item.stockQuantity} items available.`);
            return;
        }

        const updatedItems = cart.map(item =>
            item.id === cartItemId
                ? { ...item, quantity, total: item.price * quantity }
                : item
        );
        setCart(recalculateCartPrices(updatedItems));
    }

    const clearCart = () => {
        setCart([])
        setCartCount(0)
        setCartTotal(0)
    }

    // Wishlist functions
    const addToWishlist = (product) => {
        const wishlistItem = {
            id: Date.now(), // Unique wishlist item ID
            productId: product._id,
            _id: product._id,
            name: product.title || product.name,
            title: product.title || product.name,
            price: product.price,
            image: product.featuredImage || product.image,
            slug: product.slug,
            category: product.category,
            variants: product.variants || [] // Preserve variants for moveToCart
        }

        if (!wishlist.find(item => item.productId === product._id)) {
            const updatedWishlist = [...wishlist, wishlistItem];
            setWishlist(updatedWishlist);
            setWishlistCount(updatedWishlist.length);
            // Save to localStorage
            localStorage.setItem('wishlist', JSON.stringify(updatedWishlist));
        }
    }

    const removeFromWishlist = (productId) => {
        const updatedWishlist = wishlist.filter(item => item.productId !== productId)
        setWishlist(updatedWishlist)
        setWishlistCount(updatedWishlist.length)
        // Save to localStorage
        localStorage.setItem('wishlist', JSON.stringify(updatedWishlist));
    }

    const moveToCart = (wishlistItem) => {
        try {
            // Create a product object for cart
            const cartProduct = {
                _id: wishlistItem._id,
                title: wishlistItem.title || wishlistItem.name,
                slug: wishlistItem.slug,
                featuredImage: wishlistItem.image,
                basePrice: wishlistItem.price,
                variants: wishlistItem.variants || [] // Keep original variants if available
            };

            // Try to get original variant data from the product
            let selectedVariant = null;

            if (wishlistItem.variants && wishlistItem.variants.length > 0) {
                // Use the first original variant
                const firstVariant = wishlistItem.variants[0];
                const sizeAttr = firstVariant.attributes?.find(attr => attr.name === 'Size');
                const colorAttr = firstVariant.attributes?.find(attr => attr.name === 'Color');

                selectedVariant = {
                    size: sizeAttr?.value || null, // Size is optional now
                    color: colorAttr?.value || null, // Color is optional
                    hexCode: colorAttr?.hexCode || null, // Only set if color exists
                    currentPrice: firstVariant.currentPrice || wishlistItem.price,
                    originalPrice: firstVariant.originalPrice || null,
                    sku: firstVariant.sku || wishlistItem.slug,
                    stockQuantity: firstVariant.stockQuantity || 10,
                    stockStatus: firstVariant.stockStatus || 'in_stock'
                };
            } else {
                // If no variants, create a default variant
                selectedVariant = {
                    size: null, // Size is optional now
                    color: null, // Color is optional
                    hexCode: null, // No color by default
                    currentPrice: wishlistItem.price,
                    originalPrice: null,
                    sku: wishlistItem.slug,
                    stockQuantity: 10,
                    stockStatus: 'in_stock'
                };
            }

            // Add to cart
            addToCart(cartProduct, selectedVariant, 1);

            return true;
        } catch (error) {
            console.error('Error moving to cart:', error);
            return false;
        }
    }

    const clearWishlist = () => {
        setWishlist([])
        setWishlistCount(0)
    }

    // User functions
    const login = (userData, userToken) => {
        setUser(userData)
        setToken(userToken)
        setIsAuthenticated(true)

        // Set permissions and role details if present in login response
        if (userData?.permissions) {
            setPermissions(userData.permissions)
        }
        if (userData?.roleDetails) {
            setRoleDetails(userData.roleDetails)
        }

        setCookie('token', userToken, {
            maxAge: 5 * 365 * 24 * 60 * 60, // 5 years (5 * 365 days)
            path: '/',
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        })
        // Reload affiliate code from cookie after login
        loadAffiliateCode()
    }

    // Fetch user profile from backend
    const fetchUserProfile = useCallback(async () => {
        try {
            setLoading(true)
            const savedToken = getCookie('token')
            if (!savedToken) {
                return
            }

            const data = await userAPI.getProfile(savedToken)

            if (data.success) {
                setUser(data.data)
                setIsAuthenticated(true)
                setToken(savedToken)

                // Reload affiliate code from cookie after user profile is loaded
                loadAffiliateCode()

                // Set permissions and role details
                if (data.data.permissions) {
                    setPermissions(data.data.permissions)
                }
                if (data.data.roleDetails) {
                    setRoleDetails(data.data.roleDetails)
                }
            } else {
                // Token is invalid, clear everything
                logout()
            }
        } catch (error) {
            console.error('Error fetching user profile:', error)
            // If there's an error, clear everything
            logout()
        } finally {
            setLoading(false)
        }
    }, [])

    // Fetch delivery charge settings from backend
    const fetchDeliveryChargeSettings = useCallback(async () => {
        try {
            setDeliverySettingsLoading(true)
            const data = await settingsAPI.getDeliveryChargeSettings()

            if (data.success) {
                setDeliveryChargeSettings(data.data)
            } else {
                console.error('Failed to fetch delivery settings:', data.message)
            }
        } catch (error) {
            console.error('Error fetching delivery settings:', error)
        } finally {
            setDeliverySettingsLoading(false)
        }
    }, [])

    // Fetch site settings from backend — called once globally, shared via context
    const fetchSiteSettings = useCallback(async () => {
        try {
            setSiteSettingsLoading(true)
            const data = await settingsAPI.getSiteSettings()
            if (data.success) {
                setSiteSettings(data.data)
            }
        } catch (error) {
            console.error('Error fetching site settings:', error)
        } finally {
            setSiteSettingsLoading(false)
        }
    }, [])

    const logout = () => {
        setUser(null)
        setToken(null)
        setIsAuthenticated(false)
        setCart([])
        setCartCount(0)
        setCartTotal(0)
        setWishlist([])
        setWishlistCount(0)
        deleteCookie('token')
        localStorage.removeItem('cart')
        localStorage.removeItem('wishlist')
    }

    const updateUser = (userData) => {
        setUser(userData)
        // Update permissions and role if present
        if (userData?.permissions) {
            setPermissions(userData.permissions)
        }
        if (userData?.roleDetails) {
            setRoleDetails(userData.roleDetails)
        }
    }

    // Check if user has permission
    const hasPermission = (module, action) => {
        if (!permissions || permissions.length === 0) return false

        // Super admin has all permissions
        if (roleDetails?.isSuperAdmin) return true

        // Check if permission exists
        return permissions.some(p =>
            p.module === module && p.action === action
        )
    }

    // UI functions
    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen)
    }

    // Search functions
    const updateSearchQuery = (query) => {
        setSearchQuery(query)
    }

    const updateSearchResults = (results) => {
        setSearchResults(results)
    }

    // Filter functions
    const updateFilters = (newFilters) => {
        setFilters({ ...filters, ...newFilters })
    }

    const clearFilters = () => {
        setFilters({
            category: '',
            priceRange: [0, 10000],
            sortBy: 'newest',
            inStock: false
        })
    }

    // Load wishlist from localStorage on mount
    useEffect(() => {
        const savedWishlist = localStorage.getItem('wishlist');
        if (savedWishlist) {
            try {
                const parsedWishlist = JSON.parse(savedWishlist);
                setWishlist(parsedWishlist);
                setWishlistCount(parsedWishlist.length);
            } catch (error) {
                console.error('Error parsing wishlist from localStorage:', error);
            }
        }
    }, []);

    // Update cart totals when cart changes
    const updateCartTotals = () => {
        const total = cart.reduce((sum, item) => {
            const price = Number(item.price) || 0
            const quantity = Number(item.quantity) || 0
            const itemTotal = typeof item.total === 'number' ? item.total : (price * quantity)
            return sum + itemTotal
        }, 0)
        const count = cart.reduce((sum, item) => {
            const quantity = Number(item.quantity) || 0
            return sum + quantity
        }, 0)
        setCartTotal(Math.round(total))
        setCartCount(count)
    }

    // Update wishlist count when wishlist changes
    const updateWishlistCount = () => {
        setWishlistCount(wishlist.length)
    }

    // Load affiliate code from cookie
    const loadAffiliateCode = useCallback(() => {
        if (typeof window === 'undefined') return;

        try {
            const code = getCookie('affiliateCode');

            if (code) {
                // Set affiliate code and mark as available
                setAffiliateCode(code);
                setIsAvailableAffiliateCode(true);

                // Get expiry timestamp from cookie (stored when cookie was set)
                const expiryTimestamp = getCookie('affiliateCodeExpiry');
                let expiryDate = null;

                if (expiryTimestamp) {
                    expiryDate = new Date(parseInt(expiryTimestamp));
                    // Check if expired
                    if (expiryDate < new Date()) {
                        deleteCookie('affiliateCode');
                        deleteCookie('affiliateCodeExpiry');
                        setAffiliateCode(null);
                        setIsAvailableAffiliateCode(false);
                        setAffiliateCodeExpireTime(null);
                        return;
                    }
                } else {
                    // If no expiry cookie, set default 15 minutes from now
                    // This handles old cookies that were set before we started storing expiry
                    expiryDate = new Date();
                    expiryDate.setMinutes(expiryDate.getMinutes() + 15);
                    setCookie('affiliateCodeExpiry', expiryDate.getTime().toString(), {
                        expires: expiryDate,
                        sameSite: 'lax',
                        path: '/'
                    });
                }

                setAffiliateCodeExpireTime(expiryDate);
            } else {
                // No affiliate code in cookie, clear state and expiry cookie
                deleteCookie('affiliateCodeExpiry');
                setAffiliateCode(null);
                setIsAvailableAffiliateCode(false);
                setAffiliateCodeExpireTime(null);
            }
        } catch (error) {
            console.error('AppContext: Error loading affiliate code from cookie:', error);
            setAffiliateCode(null);
            setIsAvailableAffiliateCode(false);
            setAffiliateCodeExpireTime(null);
        }
    }, []);

    // Effect to update totals when cart/wishlist changes
    useEffect(() => {
        updateCartTotals()
    }, [cart])

    useEffect(() => {
        updateWishlistCount()
    }, [wishlist])

    // Load affiliate code on mount
    useEffect(() => {
        loadAffiliateCode();
    }, [loadAffiliateCode])

    // Reload affiliate code when user logs in (isAuthenticated changes)
    useEffect(() => {
        if (isAuthenticated) {
            loadAffiliateCode();
        }
    }, [isAuthenticated, loadAffiliateCode])

    // Initialize from localStorage on mount
    useEffect(() => {
        const initializeApp = async () => {
            const savedToken = getCookie('token')
            const savedCart = localStorage.getItem('cart')
            const savedWishlist = localStorage.getItem('wishlist')

            // Fetch delivery charge settings and site settings in parallel (no auth required)
            await Promise.all([
                fetchDeliveryChargeSettings(),
                fetchSiteSettings()
            ])

            if (savedToken) {
                setToken(savedToken)
                // Fetch user profile from backend
                await fetchUserProfile()
            } else {
                setLoading(false)
            }

            if (savedCart) {
                try {
                    const parsedCart = JSON.parse(savedCart)
                    setCart(recalculateCartPrices(Array.isArray(parsedCart) ? parsedCart : []))
                } catch (e) {
                    setCart([])
                }
            }
            if (savedWishlist) {
                try {
                    const parsedWishlist = JSON.parse(savedWishlist)
                    setWishlist(Array.isArray(parsedWishlist) ? parsedWishlist : [])
                } catch (e) {
                    setWishlist([])
                }
            }

            // Set cart loading to false after initialization
            setCartLoading(false)
        }

        initializeApp()
    }, [fetchUserProfile, fetchDeliveryChargeSettings, fetchSiteSettings])

    // Save to localStorage when state changes
    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cart))
        localStorage.setItem('wishlist', JSON.stringify(wishlist))
    }, [cart, wishlist])

    const value = {
        // State
        user,
        isAuthenticated,
        token,
        cart,
        cartCount,
        cartTotal,
        cartLoading,
        wishlist,
        wishlistCount,
        loading,
        sidebarOpen,
        isCartOpen,
        searchQuery,
        searchResults,
        filters,
        deliveryChargeSettings,
        deliverySettingsLoading,

        // Site settings — loaded once, shared everywhere
        siteSettings,
        siteSettingsLoading,

        permissions,
        roleDetails,

        // Affiliate state
        affiliateCode,
        affiliateCodeExpireTime,
        isAvailableAffiliateCode,
        setAffiliateCode,
        setAffiliateCodeExpireTime,
        setIsAvailableAffiliateCode,
        loadAffiliateCode,

        // Actions
        setUser,
        setIsAuthenticated,
        setToken,
        setCart,
        setCartCount,
        setCartTotal,
        setWishlist,
        setWishlistCount,
        setLoading,
        setSidebarOpen,
        setIsCartOpen,
        setSearchQuery,
        setSearchResults,
        setFilters,

        // Functions
        login,
        logout,
        updateUser,
        fetchUserProfile,
        addToCart,
        addMultipleToCart,
        removeFromCart,
        updateCartItem,
        clearCart,
        addToWishlist,
        removeFromWishlist,
        clearWishlist,
        toggleSidebar,
        updateSearchQuery,
        updateSearchResults,
        updateFilters,
        clearFilters,
        moveToCart,
        fetchDeliveryChargeSettings,
        hasPermission
    }

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    )
}

export default AppContext

