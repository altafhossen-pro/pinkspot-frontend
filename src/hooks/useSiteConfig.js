import { useMemo } from 'react';
import { siteConfig, getPageMetadata, getFullPageTitle, getSEOMetaTags } from '../config/siteConfig';

// Custom hook to use site configuration
export const useSiteConfig = () => {
  return useMemo(() => siteConfig, []);
};

// Custom hook to get page-specific metadata
export const usePageMetadata = (pageKey, dynamicData = {}) => {
  return useMemo(() => {
    return getPageMetadata(pageKey, dynamicData);
  }, [pageKey, dynamicData]);
};

// Custom hook to get SEO meta tags for a page
export const useSEOMetaTags = (pageKey, dynamicData = {}) => {
  return useMemo(() => {
    return getSEOMetaTags(pageKey, dynamicData);
  }, [pageKey, dynamicData]);
};

// Custom hook to get full page title
export const usePageTitle = (pageTitle) => {
  return useMemo(() => {
    return getFullPageTitle(pageTitle);
  }, [pageTitle]);
};
