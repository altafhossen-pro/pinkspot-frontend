'use client';

import React, { useState } from 'react';
import { 
  X, Copy, Check, ShoppingCart, User, Phone, MapPin, 
  FileText, History, ChevronDown, ChevronUp, Package, ShoppingBag, ExternalLink
} from 'lucide-react';
import OrderAsCustomerModal from './OrderAsCustomerModal';

export default function ShopperCartModal({ shopper, isOpen, onClose, onOrderCreated }) {
  const [copiedPhoneIndex, setCopiedPhoneIndex] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  if (!isOpen || !shopper) return null;

  const handleCopy = (text, index = 'current') => {
    if (!text) return;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
      setCopiedPhoneIndex(index);
      setTimeout(() => {
        setCopiedPhoneIndex(null);
      }, 2000);
    }
  };

  const cartItems = shopper.cartItems || [];
  const calculatedItemsTotal = cartItems.reduce((sum, item) => {
    const price = Number(item.price || item.currentPrice || 0);
    const qty = Number(item.quantity || 1);
    return sum + (price * qty);
  }, 0);

  const cartTotal = Number(shopper.cartTotal) > 0 ? Number(shopper.cartTotal) : calculatedItemsTotal;
  const deliveryCharge = Number(shopper.deliveryCharge || 0);
  const totalAmount = cartTotal + deliveryCharge;

  const orderNotes = shopper.customerNotes || shopper.notes || shopper.orderNotes || '';
  
  // Filter out invalid/incomplete entries (< 11-digit phones or empty addresses) and exclude current active info
  const history = (shopper.checkoutInfoHistory || []).filter(entry => {
    const rawDigits = entry.phone ? String(entry.phone).replace(/\D/g, '') : '';
    const hasValidPhone = /^01[3-9]\d{8}$/.test(rawDigits);
    const hasMeaningfulAddr = entry.address && entry.address.trim().length >= 6;
    const hasMeaningfulName = entry.name && entry.name.trim().length >= 2;

    if (!hasValidPhone && !hasMeaningfulAddr && !hasMeaningfulName) return false;

    // Discard if identical to current active customer profile
    const isCurrent = (entry.phone === shopper.customerPhone || (!entry.phone && !shopper.customerPhone)) &&
      (entry.name === shopper.customerName || (!entry.name && !shopper.customerName)) &&
      (entry.address === shopper.customerAddress || (!entry.address && !shopper.customerAddress));

    return !isCurrent;
  });

  const displaySerial = shopper.dailySerial || (shopper.visitorId ? shopper.visitorId.slice(-6) : 'Live');

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col my-auto max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Order #{displaySerial}
            </h2>
            {shopper.isOrderPlaced ? (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                Ordered
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                Pending
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Shipping Information / Customer Identity */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                Shipping Information
              </span>
              {history.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowHistory(prev => !prev)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-pink-600 hover:text-pink-700 transition-colors"
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Previous Checkout Info ({history.length})</span>
                  {showHistory ? (
                    <ChevronUp className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                </button>
              )}
            </div>

            <div className="bg-slate-50/90 rounded-2xl border border-slate-100 p-4 space-y-3">
              <div className="flex items-start justify-between gap-4 text-xs">
                <span className="text-slate-500 font-medium flex items-center gap-1.5 flex-shrink-0">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  Name:
                </span>
                <span className="font-bold text-slate-900 text-right truncate">
                  {shopper.customerName || 'N/A'}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4 text-xs">
                <span className="text-slate-500 font-medium flex items-center gap-1.5 flex-shrink-0">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  Phone:
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-900 font-mono">
                    {shopper.customerPhone || 'N/A'}
                  </span>
                  {shopper.customerPhone && (
                    <button
                      type="button"
                      onClick={() => handleCopy(shopper.customerPhone, 'current')}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all ${
                        copiedPhoneIndex === 'current'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-white border border-slate-200 text-slate-600 hover:text-pink-600 hover:border-pink-200 shadow-2xs'
                      }`}
                      title="Copy customer phone"
                    >
                      {copiedPhoneIndex === 'current' ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-start justify-between gap-4 text-xs">
                <span className="text-slate-500 font-medium flex items-center gap-1.5 flex-shrink-0">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  Address:
                </span>
                <span className="font-medium text-slate-800 text-right max-w-[280px] break-words">
                  {shopper.customerAddress || 'N/A'}
                </span>
              </div>
            </div>

            {/* Historical Submissions / Revisions Accordion */}
            {showHistory && history.length > 0 && (
              <div className="mt-3 p-3 bg-pink-50/40 rounded-2xl border border-pink-100 space-y-2.5 animate-in slide-in-from-top-2 duration-150">
                <div className="text-[11px] font-bold text-pink-700 flex items-center gap-1">
                  <History className="w-3 h-3" />
                  <span>Previous Typed Checkout Entries ({history.length}):</span>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {history.map((entry, idx) => {
                    const timeStr = entry.capturedAt 
                      ? new Date(entry.capturedAt).toLocaleTimeString('en-GB', {
                          timeZone: 'Asia/Dhaka',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        })
                      : `Entry #${idx + 1}`;

                    return (
                      <div 
                        key={idx}
                        className="bg-white rounded-xl p-2.5 border border-pink-100/80 text-xs space-y-1 shadow-2xs"
                      >
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium border-b border-slate-50 pb-1">
                          <span className="font-bold text-pink-600">Revision #{idx + 1}</span>
                          <span>{timeStr}</span>
                        </div>
                        {entry.name && (
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-400">Name:</span>
                            <span className="font-semibold text-slate-700">{entry.name}</span>
                          </div>
                        )}
                        {entry.phone && String(entry.phone).replace(/\D/g, '').length === 11 && (
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-400">Phone:</span>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-semibold text-slate-800">{entry.phone}</span>
                              <button
                                type="button"
                                onClick={() => handleCopy(entry.phone, idx)}
                                className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                                title="Copy"
                              >
                                {copiedPhoneIndex === idx ? (
                                  <Check className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                        {entry.address && (
                          <div className="text-[11px] text-slate-600 pt-0.5 border-t border-slate-50 break-words">
                            <span className="text-slate-400">Address: </span>{entry.address}
                          </div>
                        )}
                        {entry.notes && (
                          <div className="text-[10px] text-amber-700 bg-amber-50/60 px-2 py-0.5 rounded border border-amber-100">
                            Notes: {entry.notes}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Cart / Order Items */}
          <div>
            <div className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">
              Order Items ({cartItems.length})
            </div>

            {cartItems.length === 0 ? (
              <div className="bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-6 text-center text-slate-400 text-xs">
                <ShoppingCart className="w-6 h-6 mx-auto mb-1 text-slate-300" />
                <span>No items in cart currently</span>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200/80 divide-y divide-slate-100 overflow-hidden shadow-2xs">
                {cartItems.map((item, idx) => {
                  const itemPrice = Number(item.price || item.currentPrice || 0);
                  const itemQty = Number(item.quantity || 1);
                  const itemSubtotal = itemPrice * itemQty;

                  return (
                    <div key={idx} className="p-3.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.title || 'Product'}
                            className="w-12 h-12 rounded-xl object-cover bg-slate-100 border border-slate-200/60 flex-shrink-0"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200/60 flex items-center justify-center flex-shrink-0 text-slate-400">
                            <Package className="w-6 h-6" />
                          </div>
                        )}

                        <div className="min-w-0 space-y-0.5">
                          <h4 
                            className="text-xs sm:text-sm font-bold text-slate-800 truncate"
                            title={item.title || item.name}
                          >
                            {item.title || item.name || 'Product'}
                          </h4>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                            <span>
                              Qty: {itemQty} × ৳ {itemPrice.toLocaleString()}
                            </span>
                            {item.variant && (
                              <span className="px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded text-[10px]">
                                {item.variant}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="font-extrabold text-slate-900 text-xs sm:text-sm flex-shrink-0">
                        ৳ {itemSubtotal.toLocaleString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Order Notes */}
          {orderNotes ? (
            <div>
              <div className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">
                Order Notes
              </div>
              <div className="bg-amber-50/90 border border-amber-200/70 rounded-xl p-3 text-amber-900 text-xs font-medium leading-relaxed break-words">
                {orderNotes}
              </div>
            </div>
          ) : null}

          {/* Green Summary Box */}
          <div className="bg-emerald-50/70 border border-emerald-200/60 rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center justify-between text-xs text-emerald-800 font-medium">
              <span>Delivery Charge:</span>
              <span className="font-bold">৳ {deliveryCharge}</span>
            </div>
            <div className="border-t border-emerald-200/50 pt-2.5 flex items-center justify-between">
              <span className="text-emerald-950 font-extrabold text-sm sm:text-base">
                Total Amount:
              </span>
              <span className="text-emerald-900 font-extrabold text-base sm:text-lg">
                ৳ {totalAmount.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 flex-shrink-0">
          <div>
            {shopper.placedOrderId && (
              <a
                href={`/admin/dashboard/orders?search=${shopper.placedOrderId}`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold text-xs flex items-center gap-1.5 transition-colors"
                title="View completed order details"
              >
                <span>Order #{shopper.placedOrderId}</span>
                <ExternalLink className="w-3 h-3 text-emerald-700" />
              </a>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-sm transition-all"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => setIsOrderModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white font-bold text-xs shadow-md shadow-pink-200 hover:shadow-lg flex items-center gap-1.5 transition-all"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Order as Customer</span>
            </button>
          </div>
        </div>
      </div>

      {/* Nested OrderAsCustomerModal */}
      {isOrderModalOpen && (
        <OrderAsCustomerModal
          shopper={shopper}
          isOpen={isOrderModalOpen}
          onClose={() => setIsOrderModalOpen(false)}
          onOrderCreated={(order) => {
            setIsOrderModalOpen(false);
            if (onOrderCreated) onOrderCreated(order);
          }}
        />
      )}
    </div>
  );
}

