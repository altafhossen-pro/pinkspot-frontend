/**
 * Product SEO and Google Merchant Listing Structured Data Generator
 * Formatted in strict compliance with Schema.org and Google Merchant Center specifications.
 */

// Helper to strip HTML tags from rich text descriptions
export function stripHtml(html) {
  if (!html || typeof html !== 'string') return '';
  return html
    .replace(/<[^>]*>?/gm, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Helper to get base site URL
export function getSiteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
  }
  return 'https://forpink.com';
}

/**
 * Generate full metadata for Next.js App Router generateMetadata
 */
export function buildProductMetadata(product, productSlug) {
  const siteUrl = getSiteUrl();
  const canonicalUrl = `${siteUrl}/product/${productSlug}`;

  if (!product) {
    return {
      title: 'Product Not Found | ForPink',
      description: 'The requested product could not be found.',
      robots: { index: false, follow: false }
    };
  }

  const brandName = product.brand || 'ForPink';
  const metaTitle = product.seo?.metaTitle?.trim() 
    ? product.seo.metaTitle 
    : `${product.title} - Best Price in BD | ${brandName}`;

  let metaDescription = product.seo?.metaDescription?.trim();
  if (!metaDescription) {
    const rawDesc = stripHtml(product.shortDescription || product.description || '');
    if (rawDesc) {
      metaDescription = rawDesc.length > 160 ? rawDesc.substring(0, 157) + '...' : rawDesc;
    } else {
      metaDescription = `Buy authentic ${product.title} online at the best price in Bangladesh from ${brandName}. Fast home delivery and secure payment.`;
    }
  }

  const ogImage = product.seo?.ogImage || product.featuredImage || product.gallery?.[0]?.url || `${siteUrl}/images/logo.png`;

  const keywords = Array.isArray(product.seo?.metaKeywords) && product.seo.metaKeywords.length > 0
    ? product.seo.metaKeywords
    : [
        product.title,
        brandName,
        product.category?.name || 'Jewelry',
        ...(product.tags || []),
        'online shopping Bangladesh',
        'best price in BD'
      ].filter(Boolean);

  return {
    title: metaTitle,
    description: metaDescription,
    keywords,
    alternates: {
      canonical: product.seo?.canonicalUrl || canonicalUrl
    },
    openGraph: {
      title: product.seo?.ogTitle || metaTitle,
      description: product.seo?.ogDescription || metaDescription,
      url: canonicalUrl,
      siteName: brandName,
      type: 'website',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: product.title
        }
      ],
      locale: 'en_US'
    },
    twitter: {
      card: 'summary_large_image',
      title: metaTitle,
      description: metaDescription,
      images: [ogImage],
      site: '@forpink'
    },
    robots: {
      index: product.isActive !== false && product.status !== 'draft',
      follow: true,
      googleBot: {
        index: product.isActive !== false && product.status !== 'draft',
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1
      }
    }
  };
}

/**
 * Generate Google Merchant Listing & Rich Results JSON-LD Structured Data
 */
export function buildProductJsonLd(product, productSlug, deliveryCharge = 80) {
  if (!product) return null;

  const siteUrl = getSiteUrl();
  const productUrl = `${siteUrl}/product/${productSlug}`;
  const brandName = product.brand || 'ForPink';

  // 1. Gather all product images
  const schemaImages = [];
  if (product.featuredImage) {
    schemaImages.push(product.featuredImage);
  }
  if (Array.isArray(product.gallery)) {
    product.gallery.forEach(img => {
      const url = typeof img === 'string' ? img : img?.url;
      if (url && !schemaImages.includes(url)) {
        schemaImages.push(url);
      }
    });
  }
  if (schemaImages.length === 0) {
    schemaImages.push(`${siteUrl}/images/logo.png`);
  }

  // 2. Determine stock and inventory status
  const inStock = !product.isForceOutOfStock && (
    (product.totalStock > 0) || 
    (Array.isArray(product.variants) && product.variants.some(v => (v.stockQuantity || 0) > 0))
  );
  const availability = inStock 
    ? 'https://schema.org/InStock' 
    : 'https://schema.org/OutOfStock';

  // 3. Clean description
  const cleanDescription = stripHtml(
    product.seo?.metaDescription || 
    product.shortDescription || 
    product.description || 
    `Buy ${product.title} from ${brandName}`
  );

  const sku = product.variants?.[0]?.sku || product.slug || String(product._id);
  const nextYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // 4. Standard Merchant Listing Shipping & Return Details
  const shippingDetails = {
    '@type': 'OfferShippingDetails',
    shippingRate: {
      '@type': 'MonetaryAmount',
      value: String(deliveryCharge),
      currency: 'BDT'
    },
    shippingDestination: {
      '@type': 'DefinedRegion',
      addressCountry: 'BD'
    },
    deliveryTime: {
      '@type': 'ShippingDeliveryTime',
      handlingTime: {
        '@type': 'QuantitativeValue',
        minValue: 1,
        maxValue: 2,
        unitCode: 'd'
      },
      transitTime: {
        '@type': 'QuantitativeValue',
        minValue: 1,
        maxValue: 3,
        unitCode: 'd'
      }
    }
  };

  const hasMerchantReturnPolicy = {
    '@type': 'MerchantReturnPolicy',
    applicableCountry: 'BD',
    returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
    merchantReturnDays: 7,
    returnMethod: 'https://schema.org/ReturnByMail',
    returnFees: 'https://schema.org/FreeReturn'
  };

  // 5. Build Offers (AggregateOffer for variable products, Offer for simple)
  let offers;
  const variants = Array.isArray(product.variants) ? product.variants : [];

  if (variants.length > 1) {
    const prices = variants.map(v => Number(v.currentPrice || v.price || 0)).filter(p => p > 0);
    const minPrice = prices.length > 0 ? Math.min(...prices) : (product.basePrice || 0);
    const maxPrice = prices.length > 0 ? Math.max(...prices) : (product.basePrice || 0);

    offers = {
      '@type': 'AggregateOffer',
      url: productUrl,
      priceCurrency: 'BDT',
      lowPrice: String(minPrice),
      highPrice: String(maxPrice),
      offerCount: String(variants.length),
      itemCondition: 'https://schema.org/NewCondition',
      availability,
      priceValidUntil: nextYear,
      shippingDetails,
      hasMerchantReturnPolicy,
      offers: variants.map(v => ({
        '@type': 'Offer',
        sku: v.sku || sku,
        name: `${product.title} - ${v.attributes?.map(a => a.value).join(' / ') || 'Variant'}`,
        url: productUrl,
        price: String(v.currentPrice || minPrice),
        priceCurrency: 'BDT',
        itemCondition: 'https://schema.org/NewCondition',
        availability: (v.stockQuantity > 0 && !product.isForceOutOfStock)
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
        priceValidUntil: nextYear
      }))
    };
  } else {
    const basePrice = variants[0]?.currentPrice || product.basePrice || product.priceRange?.min || 0;
    const origPrice = variants[0]?.originalPrice || product.originalPrice || 0;

    offers = {
      '@type': 'Offer',
      url: productUrl,
      price: String(basePrice),
      priceCurrency: 'BDT',
      priceValidUntil: nextYear,
      itemCondition: 'https://schema.org/NewCondition',
      availability,
      shippingDetails,
      hasMerchantReturnPolicy
    };

    if (origPrice && origPrice > basePrice) {
      offers.priceSpecification = {
        '@type': 'UnitPriceSpecification',
        priceType: 'https://schema.org/StrikethroughPrice',
        price: String(origPrice),
        priceCurrency: 'BDT'
      };
    }
  }

  // 6. Main Product Schema
  const productSchema = {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: product.title,
    image: schemaImages,
    description: cleanDescription,
    sku,
    mpn: sku,
    brand: {
      '@type': 'Brand',
      name: brandName
    },
    category: product.category?.name || 'Jewelry',
    offers
  };

  // 7. Aggregate Rating & Reviews if available
  if (product.averageRating > 0 && product.totalReviews > 0) {
    productSchema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: String(product.averageRating),
      reviewCount: String(product.totalReviews),
      bestRating: '5',
      worstRating: '1'
    };
  }

  if (Array.isArray(product.reviews) && product.reviews.length > 0) {
    const approvedReviews = product.reviews.filter(r => r.isApproved !== false).slice(0, 10);
    if (approvedReviews.length > 0) {
      productSchema.review = approvedReviews.map(r => ({
        '@type': 'Review',
        reviewRating: {
          '@type': 'Rating',
          ratingValue: String(r.rating || 5),
          bestRating: '5'
        },
        author: {
          '@type': 'Person',
          name: r.user?.name || r.userName || 'Customer'
        },
        reviewBody: r.comment || r.title || 'Verified review'
      }));
    }
  }

  // 8. BreadcrumbList Schema for Google Search Hierarchy
  const breadcrumbSchema = {
    '@context': 'https://schema.org/',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: siteUrl
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: product.category?.name || 'Shop',
        item: product.category?.slug ? `${siteUrl}/shop?category=${product.category.slug}` : `${siteUrl}/shop`
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: product.title,
        item: productUrl
      }
    ]
  };

  return { productSchema, breadcrumbSchema };
}

/**
 * Generate Breadcrumb & CollectionPage schema for Category / Shop pages
 */
export function buildCategoryJsonLd(categoryName, categorySlug) {
  const siteUrl = getSiteUrl();
  const categoryUrl = categorySlug ? `${siteUrl}/shop?category=${categorySlug}` : `${siteUrl}/shop`;
  const name = categoryName || 'All Products';

  const collectionSchema = {
    '@context': 'https://schema.org/',
    '@type': 'CollectionPage',
    name: `${name} | ForPink`,
    url: categoryUrl,
    description: `Explore our collection of ${name} at ForPink. Best quality and competitive prices in Bangladesh.`
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org/',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: siteUrl
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Shop',
        item: `${siteUrl}/shop`
      },
      ...(categorySlug ? [{
        '@type': 'ListItem',
        position: 3,
        name: name,
        item: categoryUrl
      }] : [])
    ]
  };

  return { collectionSchema, breadcrumbSchema };
}
