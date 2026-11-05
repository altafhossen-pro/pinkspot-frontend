'use client';

import React from 'react';
import { Sparkles, Gift, ArrowRight, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function VisitorOfferModal({ offer, onClose, onAction }) {
    const router = useRouter();

    if (!offer) return null;

    const handleActionClick = () => {
        if (onAction) onAction(offer._id);
        if (offer.buttonUrl) {
            router.push(offer.buttonUrl);
        }
    };

    const handleCloseClick = () => {
        if (onClose) onClose(offer._id);
    };

    return (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xs animate-in fade-in duration-200">
            <div 
                className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-pink-100 transform transition-all duration-300 animate-in zoom-in-95"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Top Ambient Glow / Header */}
                <div className="relative bg-gradient-to-br from-pink-600 via-rose-600 to-pink-700 px-6 pt-8 pb-7 text-white text-center">
                    {/* Close Icon Button */}
                    <button
                        type="button"
                        onClick={handleCloseClick}
                        className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer"
                        aria-label="Close"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    {/* Floating Gift Icon */}
                    <div className="mx-auto w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg border border-white/30 mb-3 animate-bounce">
                        <Gift className="w-7 h-7 text-white" />
                    </div>

                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-extrabold tracking-wider uppercase mb-2 border border-white/25">
                        <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                        <span>Exclusive Offer</span>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-snug">
                        {offer.title}
                    </h2>
                </div>

                {/* Body Content */}
                <div className="p-6 sm:p-7 text-center space-y-5">
                    <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-medium whitespace-pre-line">
                        {offer.message}
                    </p>

                    {/* Action Button */}
                    <div className="space-y-2.5 pt-1">
                        <button
                            type="button"
                            onClick={handleActionClick}
                            className="w-full group cursor-pointer inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white font-bold text-base shadow-xl shadow-pink-600/25 hover:shadow-pink-600/40 transform active:scale-[0.98] transition-all"
                        >
                            <span>{offer.buttonText || 'অর্ডার সম্পন্ন করুন'}</span>
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>

                        <button
                            type="button"
                            onClick={handleCloseClick}
                            className="text-xs font-semibold text-slate-400 hover:text-slate-600 py-1 transition-colors cursor-pointer"
                        >
                            পরে দেখব
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

