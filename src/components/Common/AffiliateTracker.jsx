'use client';

import { useEffect, useState } from 'react';
import { setCookie, deleteCookie } from 'cookies-next';
import { X, CheckCircle, Gift, AlertCircle } from 'lucide-react';
import { settingsAPI, affiliateAPI } from '@/services/api';
import { useAppContext } from '@/context/AppContext';
import toast from 'react-hot-toast';

export default function AffiliateTracker() {
  const [showModal, setShowModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { 
    setAffiliateCode, 
    setIsAvailableAffiliateCode, 
    setAffiliateCodeExpireTime,
    token,
    isAuthenticated
  } = useAppContext();

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    // Get affiliate code from URL query params
    const urlParams = new URLSearchParams(window.location.search);
    const affiliateCode = urlParams.get('affiliate');

    if (!affiliateCode) return; // No affiliate code in URL, exit early

    // First check if user has already used this affiliate code
    const checkAndProcessAffiliate = async () => {
      try {
        // Check if user has already used this code (only for logged in users)
        // Guest users will be checked on checkout page
        if (isAuthenticated && token) {
          const checkResponse = await affiliateAPI.checkAffiliateCodeUsage(affiliateCode, token);
          
          if (checkResponse.success && checkResponse.data) {
            // If user is trying to use their own affiliate code
            if (!checkResponse.data.canUse && checkResponse.data.reason === 'own_code') {
              setErrorMessage(checkResponse.data.message || 'You cannot use your own affiliate link');
              setShowErrorModal(true);
              toast.error(checkResponse.data.message || 'You cannot use your own affiliate link');
              
              // Clear any previous affiliate code from state and cookie
              deleteCookie('affiliateCode');
              deleteCookie('affiliateCodeExpiry');
              setAffiliateCode(null);
              setIsAvailableAffiliateCode(false);
              setAffiliateCodeExpireTime(null);
              
              // Clean URL - remove affiliate parameter
              urlParams.delete('affiliate');
              const newQueryString = urlParams.toString();
              const pathname = window.location.pathname;
              const newUrl = newQueryString 
                ? `${pathname}?${newQueryString}` 
                : pathname;
              window.history.replaceState({}, '', newUrl);
              return; // Don't proceed with setting cookie/state
            }

            // If user has already used this code, show error and clear any previous code
            if (!checkResponse.data.canUse && checkResponse.data.reason === 'already_used') {
              setErrorMessage('You have already used this affiliate code earlier. Each affiliate code can only be used once per user.');
              setShowErrorModal(true);
              toast.error('You have already used this affiliate code');
              
              // Clear any previous affiliate code from state and cookie
              deleteCookie('affiliateCode');
              deleteCookie('affiliateCodeExpiry');
              setAffiliateCode(null);
              setIsAvailableAffiliateCode(false);
              setAffiliateCodeExpireTime(null);
              
              // Clean URL - remove affiliate parameter
              urlParams.delete('affiliate');
              const newQueryString = urlParams.toString();
              const pathname = window.location.pathname;
              const newUrl = newQueryString 
                ? `${pathname}?${newQueryString}` 
                : pathname;
              window.history.replaceState({}, '', newUrl);
              return; // Don't proceed with setting cookie/state
            }
            
            // If code is invalid
            if (!checkResponse.data.canUse || checkResponse.data.reason !== 'valid') {
              setErrorMessage('Invalid affiliate code');
              setShowErrorModal(true);
              toast.error('Invalid affiliate code');
              
              // Clear any previous affiliate code from state and cookie
              deleteCookie('affiliateCode');
              deleteCookie('affiliateCodeExpiry');
              setAffiliateCode(null);
              setIsAvailableAffiliateCode(false);
              setAffiliateCodeExpireTime(null);
              
              // Clean URL
              urlParams.delete('affiliate');
              const newQueryString = urlParams.toString();
              const pathname = window.location.pathname;
              const newUrl = newQueryString 
                ? `${pathname}?${newQueryString}` 
                : pathname;
              window.history.replaceState({}, '', newUrl);
              return;
            }
            
          } else if (!checkResponse.success) {
            // If API call failed, show error and clear any previous affiliate code
            setErrorMessage(checkResponse.message || 'Invalid affiliate code');
            setShowErrorModal(true);
            toast.error(checkResponse.message || 'Invalid affiliate code');
            
            // Clear any previous affiliate code from state and cookie
            deleteCookie('affiliateCode');
            deleteCookie('affiliateCodeExpiry');
            setAffiliateCode(null);
            setIsAvailableAffiliateCode(false);
            setAffiliateCodeExpireTime(null);
            
            // Clean URL
            urlParams.delete('affiliate');
            const newQueryString = urlParams.toString();
            const pathname = window.location.pathname;
            const newUrl = newQueryString 
              ? `${pathname}?${newQueryString}` 
              : pathname;
            window.history.replaceState({}, '', newUrl);
            return;
          }
        }
        // For guest users, we don't check here - will be checked on checkout page

        // If check passed or user is guest, proceed with setting cookie and state
        // Store in cookie with 15 minutes expiry
        const expiryMinutes = 15;
        const expiryDate = new Date();
        expiryDate.setMinutes(expiryDate.getMinutes() + expiryMinutes);
        
        setCookie('affiliateCode', affiliateCode, {
          expires: expiryDate,
          sameSite: 'lax',
          path: '/'
        });

        // Store expiry timestamp in a separate cookie for accurate countdown
        setCookie('affiliateCodeExpiry', expiryDate.getTime().toString(), {
          expires: expiryDate,
          sameSite: 'lax',
          path: '/'
        });

        // Update global state immediately
        setAffiliateCode(affiliateCode);
        setIsAvailableAffiliateCode(true);
        setAffiliateCodeExpireTime(expiryDate);
        
        // Fetch affiliate settings to check if modal should be shown
        try {
          const response = await settingsAPI.getAffiliateSettings();
          if (response.success && response.data) {
            const shouldShow = response.data.isConfirmationModalShowWhenUseAffiliateLink !== false;
            if (shouldShow) {
              setShowModal(true);
            }
          } else {
            // Default to showing modal if API fails
            setShowModal(true);
          }
        } catch (error) {
          // If API fails, default to showing modal
          setShowModal(true);
        }
        
        // Clean URL - remove affiliate parameter
        urlParams.delete('affiliate');
        const newQueryString = urlParams.toString();
        const pathname = window.location.pathname;
        const newUrl = newQueryString 
          ? `${pathname}?${newQueryString}` 
          : pathname;
        
        // Replace URL without page reload
        window.history.replaceState({}, '', newUrl);
      } catch (error) {
        console.error('AffiliateTracker: Error checking affiliate code:', error);
        setErrorMessage('Failed to validate affiliate code');
        setShowErrorModal(true);
        toast.error('Failed to validate affiliate code');
        
        // Clean URL
        urlParams.delete('affiliate');
        const newQueryString = urlParams.toString();
        const pathname = window.location.pathname;
        const newUrl = newQueryString 
          ? `${pathname}?${newQueryString}` 
          : pathname;
        window.history.replaceState({}, '', newUrl);
      }
    };

    // Wait a bit for auth to be ready if user is logged in
    if (isAuthenticated && !token) {
      // Auth is being loaded, wait a bit and retry
      const timer = setTimeout(() => {
        checkAndProcessAffiliate();
      }, 500);
      return () => clearTimeout(timer);
    } else {
      // Auth is ready or user is guest, proceed immediately
      checkAndProcessAffiliate();
    }
  }, [isAuthenticated, token, setAffiliateCode, setIsAvailableAffiliateCode, setAffiliateCodeExpireTime]); // Re-run if auth status changes

  return (
    <>
      {showModal && (
        <div 
          onClick={() => setShowModal(false)}
          className="fixed inset-0 z-99 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative animate-in fade-in zoom-in duration-300"
          >
            {/* Close Button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Content */}
            <div className="text-center">
              {/* Success Icon */}
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>

              {/* Title */}
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                You Successfully Used Affiliate Link!
              </h3>

              {/* Message */}
              <p className="text-gray-600 mb-4">
                This link is valid for <span className="font-semibold text-pink-600">15 minutes</span>.
              </p>

              {/* CTA */}
              <div className="flex items-center justify-center gap-2 bg-pink-50 rounded-lg p-3 mb-4">
                <Gift className="h-5 w-5 text-pink-600" />
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Purchase and enjoy</span> discount or rewards!
                </p>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setShowModal(false)}
                className="w-full px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors font-medium cursor-pointer"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}

      {showErrorModal && (
        <div 
          onClick={() => setShowErrorModal(false)}
          className="fixed inset-0 z-99 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative animate-in fade-in zoom-in duration-300"
          >
            {/* Close Button */}
            <button
              onClick={() => setShowErrorModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Content */}
            <div className="text-center">
              {/* Error Icon */}
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                <AlertCircle className="h-10 w-10 text-red-600" />
              </div>

              {/* Title */}
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Invalid Affiliate Code
              </h3>

              {/* Message */}
              <p className="text-gray-600 mb-4">
                {errorMessage || 'This affiliate code cannot be used.'}
              </p>

              {/* Close Button */}
              <button
                onClick={() => setShowErrorModal(false)}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
