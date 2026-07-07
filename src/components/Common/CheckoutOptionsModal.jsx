'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, ArrowRight, User, UserCheck, X } from 'lucide-react';

export default function CheckoutOptionsModal({ isOpen, onClose, onGuestCheckout }) {
  const router = useRouter();

  const handleLoginRedirect = () => {
    // Add redirect parameter to login URL
    const currentPath = window.location.pathname;
    router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
  };

  const handleGuestCheckout = () => {
    onGuestCheckout();
    onClose();
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
          onKeyDown={handleKeyDown}
        >
          <div className="bg-white rounded-lg shadow-2xl max-w-xl w-full mx-4 p-4 max-h-[95vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-pink-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Choose Checkout Option
              </h3>
            </div>

            {/* Content */}
            <div className="mb-4">
              <p className="text-gray-600 mb-4 text-center text-sm">
                How would you like to proceed with your checkout?
              </p>
              
              {/* Login Option */}
              <div className="mb-3">
                <button
                  onClick={handleLoginRedirect}
                  className="w-full p-3 border-2 border-pink-200 rounded-lg hover:border-pink-300 hover:bg-pink-50 transition-all duration-200 group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center group-hover:bg-pink-200 transition-colors">
                      <UserCheck className="w-5 h-5 text-pink-600" />
                    </div>
                    <div className="text-left flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-gray-900 text-sm">Login to Account</h4>
                        <span className="bg-pink-100 text-pink-600 text-xs px-2 py-1 rounded-full font-medium">
                          Recommended
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">
                        Access order history, loyalty points, faster checkout
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-pink-500 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              </div>

              {/* Guest Checkout Option */}
              <div className="mb-4">
                <button
                  onClick={handleGuestCheckout}
                  className="w-full p-3 border-2 border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                      <User className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="text-left flex-1">
                      <h4 className="font-semibold text-gray-900 text-sm">Continue as Guest</h4>
                      <p className="text-xs text-gray-600">
                        Complete order without creating account
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-500 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              </div>

              {/* Benefits Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <h5 className="font-semibold text-blue-800 mb-2 text-sm">Benefits of Creating an Account:</h5>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• Track orders and delivery status</li>
                  <li>• Earn loyalty points with purchases</li>
                  <li>• Save addresses for faster checkout</li>
                  <li>• Access exclusive deals and offers</li>
                </ul>
              </div>
            </div>

            {/* Footer Note */}
            <div className="text-center mt-3">
              <p className="text-xs text-gray-500">
                You can create an account later if you choose guest checkout
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
