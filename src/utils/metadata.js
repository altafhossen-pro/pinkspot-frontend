import { siteConfig, getPageMetadata, getFullPageTitle } from '../config/siteConfig';

// Generate Next.js metadata object for a page
export const generateMetadata = (pageKey, dynamicData = {}) => {
  const pageMeta = getPageMetadata(pageKey, dynamicData);
  const fullTitle = getFullPageTitle(pageMeta.title);
  
  return {
    metadataBase: new URL(siteConfig.url),
    title: fullTitle,
    description: pageMeta.description,
    keywords: siteConfig.seo.keywords,
    authors: [{ name: siteConfig.seo.author }],
    creator: siteConfig.seo.author,
    publisher: siteConfig.name,
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      type: 'website',
      locale: siteConfig.social.openGraph.locale,
      url: `${siteConfig.url}${dynamicData.path || ''}`,
      title: fullTitle,
      description: pageMeta.description,
      siteName: siteConfig.social.openGraph.siteName,
      images: [
        {
          url: dynamicData.image || siteConfig.defaults.image,
          width: 1200,
          height: 630,
          alt: fullTitle,
        },
      ],
    },
    twitter: {
      card: siteConfig.social.twitter.card,
      site: siteConfig.social.twitter.site,
      creator: siteConfig.social.twitter.creator,
      title: fullTitle,
      description: pageMeta.description,
      images: [dynamicData.image || siteConfig.defaults.image],
    },
    icons: {
      icon: siteConfig.defaults.favicon,
      shortcut: siteConfig.defaults.favicon,
      apple: siteConfig.defaults.favicon,
    },
    verification: {
      google: 'your-google-verification-code',
      yandex: 'your-yandex-verification-code',
      yahoo: 'your-yahoo-verification-code',
    },
  };
};

// Generate metadata for dynamic pages (like product pages)
export const generateDynamicMetadata = (pageKey, dynamicData = {}) => {
  return generateMetadata(pageKey, dynamicData);
};

// Generate metadata for static pages
export const generateStaticMetadata = (pageKey) => {
  return generateMetadata(pageKey);
};

// Generate viewport configuration
export const generateViewport = () => {
  return {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
    themeColor: siteConfig.defaults.themeColor,
  };
};

// Get site configuration
export const getSiteConfig = () => {
  return siteConfig;
};
