'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, ArrowRight, X } from 'lucide-react';

export default function LoginRequiredModal({ isOpen, onClose }) {
  const router = useRouter();

  const handleLoginRedirect = () => {
    // Add redirect parameter to login URL
    const currentPath = window.location.pathname;
    router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
  };

  // Prevent modal from closing when clicking outside or pressing escape
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      // Do nothing - prevent closing
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      // Do nothing - prevent closing
    }
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[9999]"
          onClick={handleBackdropClick}
        >
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Login Required
                </h3>
              </div>
            </div>

            {/* Content */}
            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                You must be logged in to proceed with checkout. Please login to continue with your order.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Why login is required?</strong><br />
                  • Secure order processing<br />
                  • Order tracking and history<br />
                  • Faster checkout experience
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleLoginRedirect}
                className="flex-1 bg-pink-500 hover:bg-pink-600 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                Go to Login
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div >
        </div >
      )
      }
    </>
  );
}
