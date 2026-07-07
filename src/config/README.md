# Site Configuration System

This directory contains the configuration system for the Forpink ecommerce website. It provides centralized management of site metadata, SEO settings, and page-specific information.

## Files

- `siteConfig.js` - Main configuration file with all site settings
- `../hooks/useSiteConfig.js` - React hooks for using configuration in components
- `../utils/metadata.js` - Utility functions for generating Next.js metadata

## Usage

### 1. Basic Site Configuration

The `siteConfig.js` file contains all the site-wide settings:

```javascript
import { siteConfig } from '@/config/siteConfig';

// Access site information
console.log(siteConfig.name); // "Forpink"
console.log(siteConfig.url); // "https://forpink.com"
console.log(siteConfig.contact.email); // "info@forpink.com"
```

### 2. Using in Pages

For static pages, use the `generateStaticMetadata` function:

```javascript
// In your page file (e.g., src/app/shop/page.jsx)
import { generateStaticMetadata } from '@/utils/metadata';

export const metadata = generateStaticMetadata('shop');
```

For dynamic pages, use the `generateDynamicMetadata` function:

```javascript
// In your dynamic page file (e.g., src/app/product/[slug]/page.jsx)
import { generateDynamicMetadata } from '@/utils/metadata';

export async function generateMetadata({ params }) {
  const product = await getProduct(params.slug);
  
  return generateDynamicMetadata('product', {
    productName: product.title,
    productDescription: product.description,
    image: product.featuredImage,
    path: `/product/${params.slug}`
  });
}
```

### 3. Using in Components

Use the custom hooks in your React components:

```javascript
import { useSiteConfig, usePageMetadata } from '@/hooks/useSiteConfig';

function MyComponent() {
  const siteConfig = useSiteConfig();
  const pageMeta = usePageMetadata('home');
  
  return (
    <div>
      <h1>{siteConfig.name}</h1>
      <p>{pageMeta.description}</p>
    </div>
  );
}
```

### 4. Available Page Keys

The following page keys are available in the configuration:

- `home` - Homepage
- `shop` - Shop page
- `categories` - Categories page
- `product` - Product detail page (requires dynamic data)
- `checkout` - Checkout page
- `login` - Login page
- `register` - Registration page
- `dashboard` - User dashboard
- `admin` - Admin dashboard
- `contact` - Contact page
- `faq` - FAQ page
- `offers` - Offers page
- `privacy` - Privacy policy
- `terms` - Terms and conditions

### 5. Dynamic Data for Product Pages

For product pages, you can pass dynamic data:

```javascript
const dynamicData = {
  productName: "Gold Ring",
  productDescription: "Beautiful gold ring with diamonds",
  image: "/images/product.jpg",
  path: "/product/gold-ring"
};

const metadata = generateDynamicMetadata('product', dynamicData);
```

### 6. Customizing Configuration

To customize the site configuration:

1. Edit `siteConfig.js` to update site information
2. Add new page configurations in the `pages` object
3. Update contact information, social media handles, etc.
4. Modify theme colors and branding

### 7. SEO Features

The configuration includes:

- Page titles and descriptions
- Open Graph meta tags
- Twitter Card meta tags
- Keywords and author information
- Robots and indexing settings
- Canonical URLs
- Theme colors and favicons

### 8. PWA Support

The configuration includes a `manifest.json` file for Progressive Web App features:

- App name and description
- Icons and theme colors
- Display mode and orientation
- Categories and language settings

## Example: Adding a New Page

1. Add the page configuration to `siteConfig.js`:

```javascript
pages: {
  // ... existing pages
  about: {
    title: "About Us - Forpink",
    description: "Learn more about Forpink and our jewelry business.",
  },
}
```

2. Use it in your page:

```javascript
export const metadata = generateStaticMetadata('about');
```

## Example: Dynamic Product Page

```javascript
export async function generateMetadata({ params }) {
  const product = await getProduct(params.slug);
  
  return generateDynamicMetadata('product', {
    productName: product.title,
    productDescription: product.description,
    image: product.featuredImage,
    path: `/product/${params.slug}`
  });
}
```

This system ensures consistent metadata across all pages and makes it easy to maintain and update site information.
