'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Plus, Edit2, Trash2, Clock, Link2, 
  CheckCircle2, AlertCircle, ArrowLeft, Send, Eye, ShieldAlert, X
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getCookie } from 'cookies-next';
import toast from 'react-hot-toast';
import visitorAPI from '@/services/visitorApi';
import { useAppContext } from '@/context/AppContext';
import PermissionDenied from '@/components/Common/PermissionDenied';

export default function OfferTemplatesPage() {
  const router = useRouter();
  const { hasPermission } = useAppContext();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const [form, setForm] = useState({
    name: '',
    title: '',
    message: '',
    buttonText: 'অর্ডার সম্পন্ন করুন',
    buttonUrl: '/checkout',
    delaySeconds: 0,
    isActive: true
  });

  const token = getCookie('token') || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await visitorAPI.getOfferTemplates(token);
      if (res.success && Array.isArray(res.data)) {
        setTemplates(res.data);
      }
    } catch (err) {
      toast.error('Failed to load offer templates');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingTemplate(null);
    setForm({
      name: '',
      title: 'আপনার জন্য বিশেষ অফার!',
      message: 'এখনই আপনার পছন্দের প্রোডাক্টটি অর্ডার করুন আর উপভোগ করুন স্পেশাল ডিসকাউন্ট ও ফাস্ট ডেলিভারি!',
      buttonText: 'অর্ডার সম্পন্ন করুন',
      buttonUrl: '/checkout',
      delaySeconds: 0,
      isActive: true
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (t) => {
    setEditingTemplate(t);
    setForm({
      name: t.name || '',
      title: t.title || '',
      message: t.message || '',
      buttonText: t.buttonText || 'অর্ডার সম্পন্ন করুন',
      buttonUrl: t.buttonUrl || '/checkout',
      delaySeconds: t.delaySeconds || 0,
      isActive: t.isActive !== false
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.title.trim() || !form.message.trim()) {
      toast.error('Please fill in required fields');
      return;
    }

    setSaving(true);
    try {
      if (editingTemplate) {
        const res = await visitorAPI.updateOfferTemplate(editingTemplate._id, form, token);
        if (res.success) {
          toast.success('Template updated successfully');
          setIsModalOpen(false);
          fetchTemplates();
        } else {
          toast.error(res.message || 'Failed to update template');
        }
      } else {
        const res = await visitorAPI.createOfferTemplate(form, token);
        if (res.success) {
          toast.success('New template created successfully');
          setIsModalOpen(false);
          fetchTemplates();
        } else {
          toast.error(res.message || 'Failed to create template');
        }
      }
    } catch (err) {
      toast.error(err.message || 'Error saving template');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await visitorAPI.deleteOfferTemplate(id, token);
      if (res.success) {
        toast.success('Template removed');
        setDeleteConfirmId(null);
        fetchTemplates();
      } else {
        toast.error(res.message || 'Failed to delete template');
      }
    } catch (err) {
      toast.error('Failed to delete template');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <button
            onClick={() => router.push('/admin/dashboard/analytics/live-shoppers')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-pink-600 transition-colors mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Live Shoppers</span>
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 text-white flex items-center justify-center shadow-md shadow-pink-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Offer & Message Templates
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Pre-defined popups to dispatch to live shoppers with 1 click
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleOpenCreate}
          className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white font-bold text-xs shadow-md shadow-pink-600/20 hover:shadow-lg transition-all transform active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Template</span>
        </button>
      </div>

      {/* Templates Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mb-3"></div>
          <p className="text-xs text-slate-500">Loading offer templates...</p>
        </div>
      ) : templates.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-slate-200 p-8">
          <div className="w-12 h-12 rounded-2xl bg-pink-50 text-pink-600 flex items-center justify-center mx-auto mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">No Offer Templates Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            Create reusable offer messages with custom headlines and buttons to fire at live shoppers.
          </p>
          <button
            onClick={handleOpenCreate}
            className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs shadow"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Template</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {templates.map((t) => (
            <div
              key={t._id}
              className="bg-white rounded-3xl border border-slate-200/90 hover:border-pink-300 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between group"
            >
              <div className="space-y-3">
                {/* Header Badge */}
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-xs text-slate-900 group-hover:text-pink-600 transition-colors">
                    {t.name}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>{t.delaySeconds > 0 ? `${t.delaySeconds}s delay` : 'Instant 0s'}</span>
                  </span>
                </div>

                {/* Card Preview Body */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-pink-50/50 via-white to-rose-50/30 border border-pink-100/80 space-y-2">
                  <h4 className="font-extrabold text-xs text-slate-900 line-clamp-1">
                    {t.title}
                  </h4>
                  <p className="text-[11px] text-slate-600 line-clamp-3 leading-relaxed whitespace-pre-line font-medium">
                    {t.message}
                  </p>
                  <div className="pt-2 flex items-center justify-between text-[11px]">
                    <span className="px-2.5 py-1 rounded-lg bg-pink-600 text-white font-bold shadow-xs text-[10px]">
                      {t.buttonText || 'অর্ডার করুন'}
                    </span>
                    <span className="font-mono text-slate-400 text-[10px] flex items-center gap-0.5">
                      <Link2 className="w-3 h-3" />
                      <span>{t.buttonUrl || '/checkout'}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">
                  {t.createdByName ? `By ${t.createdByName}` : 'Ready to use'}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(t)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-pink-600 hover:bg-pink-50 transition-colors cursor-pointer"
                    title="Edit Template"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setDeleteConfirmId(t._id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Delete Template"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Delete this template?</h3>
              <p className="text-xs text-slate-500 mt-1">This template will be removed from the dropdown list.</p>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirmId)}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/20"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Template Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div 
            className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-pink-100 bg-gradient-to-r from-pink-50/80 to-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center font-bold">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {editingTemplate ? 'Edit Offer Template' : 'Create Offer Template'}
                  </h3>
                  <p className="text-[11px] text-slate-500">Save predefined pitch to reuse anytime</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Template Name (Admin Label) <span className="text-pink-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. ফ্রি ডেলিভারি অফার"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-pink-500 focus:bg-white outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Customer Popup Headline <span className="text-pink-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. আপনার জন্য বিশেষ ফ্রি হোম ডেলিভারি!"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-pink-500 focus:bg-white outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Offer Message / Pitch <span className="text-pink-600">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="অফার বিস্তারিত লিখুন..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-pink-500 focus:bg-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Button Text
                  </label>
                  <input
                    type="text"
                    value={form.buttonText}
                    onChange={(e) => setForm({ ...form, buttonText: e.target.value })}
                    placeholder="e.g. অর্ডার সম্পন্ন করুন"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-pink-500 focus:bg-white outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Button Redirect URL
                  </label>
                  <input
                    type="text"
                    value={form.buttonUrl}
                    onChange={(e) => setForm({ ...form, buttonUrl: e.target.value })}
                    placeholder="e.g. /checkout"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-pink-500 focus:bg-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Default Display Delay
                </label>
                <select
                  value={form.delaySeconds}
                  onChange={(e) => setForm({ ...form, delaySeconds: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-pink-500 focus:bg-white outline-none cursor-pointer"
                >
                  <option value={0}>⚡ Instant (0 seconds)</option>
                  <option value={5}>⏱️ 5 seconds delay</option>
                  <option value={10}>⏱️ 10 seconds delay (Recommended)</option>
                  <option value={20}>⏱️ 20 seconds delay</option>
                  <option value={30}>⏱️ 30 seconds delay</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold shadow-md shadow-pink-600/20 cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingTemplate ? 'Update Template' : 'Create Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

