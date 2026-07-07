'use client';

import { usePathname } from 'next/navigation';
import HeaderWithSuspense from '@/components/Header/Header';

export default function ConditionalHeader() {
  const pathname = usePathname();
  
  // Routes that should not show header at all
  const noHeaderRoutes = [
    '/admin',
    '/login',
    '/register',
    '/forgot-password'
  ];
  
  // Check if current path should not show header
  const shouldHideHeader = noHeaderRoutes.some(route => pathname.startsWith(route));
  
  // Don't render header for these routes
  if (shouldHideHeader) {
    return null;
  }
  
  // Routes that should show header but without tracking bar
  const noTrackingRoutes = [
    '/dashboard',
    '/order-confirmation'
  ];
  
  // Check if current path should not show tracking
  const shouldHideTracking = noTrackingRoutes.some(route => pathname.startsWith(route));
  
  // Render header with appropriate tracking setting
  return <HeaderWithSuspense isTrackingShow={!shouldHideTracking} />;
}
