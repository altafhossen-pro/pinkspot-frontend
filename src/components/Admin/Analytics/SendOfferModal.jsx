'use client';

import React, { useState, useEffect } from 'react';
import { 
  Zap, X, Sparkles, Send, Clock, Link2, 
  ShoppingBag, Phone, User, Eye, CheckCircle2 
} from 'lucide-react';
import toast from 'react-hot-toast';
import visitorAPI from '@/services/visitorApi';

export default function SendOfferModal({ isOpen, onClose, targetVisitor, token, onSuccess }) {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [sending, setSending] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const [form, setForm] = useState({
    title: '',
    message: '',
    buttonText: 'অর্ডার সম্পন্ন করুন',
    buttonUrl: '/checkout',
    delaySeconds: 0
  });

  // Fetch templates on open
  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
      // Reset form or set defaults
      setForm({
        title: 'আপনার জন্য বিশেষ অফার!',
        message: 'এখনই আপনার পছন্দের প্রোডাক্টটি অর্ডার করুন আর উপভোগ করুন স্পেশাল ডিসকাউন্ট ও ফাস্ট ডেলিভারি!',
        buttonText: 'অর্ডার সম্পন্ন করুন',
        buttonUrl: targetVisitor?.hasCart ? '/checkout' : (targetVisitor?.lastUrl || '/shop'),
        delaySeconds: 0
      });
      setSelectedTemplateId('');
      setShowPreview(false);
    }
  }, [isOpen, targetVisitor]);

  const fetchTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const res = await visitorAPI.getOfferTemplates(token);
      if (res.success && Array.isArray(res.data)) {
        setTemplates(res.data);
      }
    } catch (err) {
      console.error('Failed to load templates:', err);
    } finally {
      setLoadingTemplates(false);
    }
  };

  const handleTemplateSelect = (e) => {
    const tId = e.target.value;
    setSelectedTemplateId(tId);
    if (!tId) return;

    const selected = templates.find((t) => t._id === tId);
    if (selected) {
      setForm({
        title: selected.title || '',
        message: selected.message || '',
        buttonText: selected.buttonText || 'অর্ডার সম্পন্ন করুন',
        buttonUrl: selected.buttonUrl || '/checkout',
        delaySeconds: selected.delaySeconds !== undefined ? selected.delaySeconds : 0
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!targetVisitor?.visitorId) {
      toast.error('Visitor ID is missing');
      return;
    }
    if (!form.title.trim() || !form.message.trim()) {
      toast.error('Please enter headline and message');
      return;
    }

    setSending(true);
    try {
      const payload = {
        visitorId: targetVisitor.visitorId,
        customerPhone: targetVisitor.customerPhone || null,
        customerName: targetVisitor.customerName || null,
        title: form.title.trim(),
        message: form.message.trim(),
        buttonText: form.buttonText.trim() || 'অর্ডার সম্পন্ন করুন',
        buttonUrl: form.buttonUrl.trim() || '/checkout',
        delaySeconds: Number(form.delaySeconds) || 0,
        templateId: selectedTemplateId || null
      };

      const res = await visitorAPI.sendCustomOffer(payload, token);
      if (res.success) {
        toast.success(
          form.delaySeconds > 0 
            ? `Offer scheduled to show in ${form.delaySeconds}s!` 
            : 'Offer dispatched instantly to visitor screen!'
        );
        if (onSuccess) onSuccess(res.data);
        onClose();
      } else {
        toast.error(res.message || 'Failed to dispatch offer');
      }
    } catch (err) {
      toast.error(err.message || 'Error sending custom offer');
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-pink-100 bg-gradient-to-r from-pink-50/80 via-white to-rose-50/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center shadow-sm">
              <Zap className="w-5 h-5 fill-pink-500" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <span>Send Custom Screen Offer</span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-pink-100 text-pink-700">
                  REALTIME
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Pops up instantly on the customer's browser screen
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {/* Target Shopper Badge */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-pink-100/80 text-pink-700 flex items-center justify-center font-bold text-xs">
                #{targetVisitor?.dailySerial || '1'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800 text-xs">
                    {targetVisitor?.customerName || (targetVisitor?.customerPhone ? `Shopper (${targetVisitor.customerPhone})` : 'Guest Shopper')}
                  </span>
                  <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                    Live Active
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                  ID: {targetVisitor?.visitorId?.substring(0, 16)}... {targetVisitor?.lastUrl && `• on ${targetVisitor.lastUrl}`}
                </div>
              </div>
            </div>

            {targetVisitor?.hasCart && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-50 text-amber-700 font-bold border border-amber-200 text-[11px]">
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Cart: ৳{targetVisitor?.cartTotal || 0}</span>
              </span>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Template Selector */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-pink-600" />
                  <span>Choose Template (Optional)</span>
                </label>
                {loadingTemplates && <span className="text-slate-400 text-[10px]">Loading templates...</span>}
              </div>
              <select
                value={selectedTemplateId}
                onChange={handleTemplateSelect}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-pink-500 focus:bg-white outline-none transition-all cursor-pointer"
              >
                <option value="">-- Choose a pre-defined template or write custom --</option>
                {templates.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name} ({t.delaySeconds}s delay)
                  </option>
                ))}
              </select>
            </div>

            {/* Headline */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Popup Headline / Title <span className="text-pink-600">*</span>
              </label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="যেমন: আপনার জন্য বিশেষ ফ্রি ডেলিভারি অফার!"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-pink-500 focus:bg-white outline-none transition-all"
              />
            </div>

            {/* Message */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Offer Message / Pitch <span className="text-pink-600">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="অফার মেসেজ লিখুন..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-pink-500 focus:bg-white outline-none transition-all"
              />
            </div>

            {/* Action Button Text & URL */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Button Text
                </label>
                <input
                  type="text"
                  value={form.buttonText}
                  onChange={(e) => setForm({ ...form, buttonText: e.target.value })}
                  placeholder="e.g. অর্ডার সম্পন্ন করুন"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-pink-500 focus:bg-white outline-none transition-all"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Link2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Button Redirect URL</span>
                </label>
                <input
                  type="text"
                  value={form.buttonUrl}
                  onChange={(e) => setForm({ ...form, buttonUrl: e.target.value })}
                  placeholder="e.g. /checkout"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-pink-500 focus:bg-white outline-none transition-all"
                />
              </div>
            </div>

            {/* Delay Selector */}
            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Popup Display Delay</span>
              </label>
              <select
                value={form.delaySeconds}
                onChange={(e) => setForm({ ...form, delaySeconds: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-pink-500 focus:bg-white outline-none transition-all cursor-pointer"
              >
                <option value={0}>⚡ Instant (0 seconds - Show immediately)</option>
                <option value={5}>⏱️ 5 seconds delay</option>
                <option value={10}>⏱️ 10 seconds delay (Recommended)</option>
                <option value={20}>⏱️ 20 seconds delay</option>
                <option value={30}>⏱️ 30 seconds delay</option>
              </select>
              <p className="text-[10px] text-slate-400 mt-1">
                ভিজিটরের স্ক্রিনে অফারটি কত সেকেন্ড পর পপআপ হয়ে ভেসে উঠবে তা নির্বাচন করুন।
              </p>
            </div>

            {/* Live Customer Preview Toggle */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="text-pink-600 hover:text-pink-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{showPreview ? 'Hide Customer Screen Preview' : 'Show Customer Screen Preview'}</span>
              </button>

              {showPreview && (
                <div className="mt-3 p-4 rounded-2xl bg-slate-900/90 text-white border border-slate-800 space-y-3 animate-in fade-in">
                  <div className="text-[10px] uppercase tracking-wider text-pink-400 font-bold flex items-center justify-between">
                    <span>Customer Popup Preview</span>
                    <span>Delay: {form.delaySeconds}s</span>
                  </div>
                  <div className="bg-white rounded-2xl p-4 text-slate-800 text-center shadow-lg border border-pink-100">
                    <h3 className="font-extrabold text-sm text-pink-700 mb-1">{form.title || 'Headline'}</h3>
                    <p className="text-xs text-slate-600 whitespace-pre-line mb-3 font-medium">{form.message || 'Message content...'}</p>
                    <div className="py-2 px-4 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 text-white font-bold text-xs inline-block shadow-md">
                      {form.buttonText || 'অর্ডার সম্পন্ন করুন'} →
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={sending}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white font-bold text-xs shadow-lg shadow-pink-600/25 flex items-center gap-1.5 transition-all transform active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{sending ? 'Dispatching...' : 'Fire Instant Offer'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

