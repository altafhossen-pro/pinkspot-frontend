'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  Edit, 
  Trash2, 
  ExternalLink, 
  Search, 
  Layers, 
  Tag, 
  Eye, 
  CheckCircle2, 
  XCircle,
  RefreshCw,
  Package
} from 'lucide-react';
import { comboAPI } from '@/services/api';
import toast from 'react-hot-toast';
import { getCookie } from 'cookies-next';
import DeleteConfirmationModal from '@/components/Common/DeleteConfirmationModal';

export default function CombosAdminPage() {
  const router = useRouter();
  const [combos, setCombos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [comboToDelete, setComboToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });

  const getAdminToken = () => getCookie('token');

  const fetchCombos = async (page = 1) => {
    try {
      setLoading(true);
      const token = getAdminToken();
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      });

      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }
      if (statusFilter) {
        params.append('status', statusFilter);
      }

      const response = await comboAPI.getAllCombos(params.toString(), token);

      if (response.success) {
        setCombos(response.data || []);
        if (response.pagination) {
          setPagination(response.pagination);
        }
      } else {
        toast.error(response.message || 'Failed to fetch combos');
      }
    } catch (error) {
      console.error('Error fetching combos:', error);
      toast.error('Failed to load combos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCombos(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, statusFilter]);

  const handleToggleStatus = async (comboId, currentActive) => {
    try {
      const token = getAdminToken();
      const response = await comboAPI.toggleComboStatus(comboId, token);
      if (response.success) {
        toast.success(response.message || 'Status updated');
        setCombos(prev =>
          prev.map(c => (c._id === comboId ? { ...c, isActive: !currentActive } : c))
        );
      } else {
        toast.error(response.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error('Failed to toggle status');
    }
  };

  const openDeleteModal = (combo) => {
    setComboToDelete(combo);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!comboToDelete) return;
    try {
      setDeleting(true);
      const token = getAdminToken();
      const response = await comboAPI.deleteCombo(comboToDelete._id, token);

      if (response.success) {
        toast.success('Combo deleted successfully');
        setShowDeleteModal(false);
        setComboToDelete(null);
        fetchCombos(pagination.page);
      } else {
        toast.error(response.message || 'Failed to delete combo');
      }
    } catch (error) {
      console.error('Error deleting combo:', error);
      toast.error('Failed to delete combo');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-pink-100 rounded-xl">
              <Layers className="h-6 w-6 text-pink-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Combo Products</h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Create bundled packages where customers get curated sets with special discounts
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchCombos(pagination.page)}
            className="p-2.5 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-pink-600' : ''}`} />
          </button>
          <Link
            href="/admin/dashboard/upsells/create"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-pink-600 hover:bg-pink-700 text-white rounded-xl font-semibold text-sm shadow-sm transition-all active:scale-98 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Combo</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search combos by title or slug..."
            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto px-3.5 py-2 text-xs md:text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-700 font-medium focus:ring-2 focus:ring-pink-500 cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>

      {/* Combos Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Combo</th>
                <th className="py-3.5 px-4">Included Products</th>
                <th className="py-3.5 px-4">Pricing & Discount</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-center">Active</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-pink-600" />
                      <span>Loading combo products...</span>
                    </div>
                  </td>
                </tr>
              ) : combos.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-3 max-w-sm mx-auto">
                      <div className="w-14 h-14 bg-pink-50 rounded-full flex items-center justify-center">
                        <Package className="w-7 h-7 text-pink-500" />
                      </div>
                      <h3 className="font-semibold text-slate-800 text-base">No Combos Found</h3>
                      <p className="text-xs text-slate-500 text-center">
                        {searchQuery
                          ? `No combos matched "${searchQuery}". Try different keywords.`
                          : 'You haven’t created any combo deals yet. Start bundling products to boost sales!'}
                      </p>
                      <Link
                        href="/admin/dashboard/upsells/create"
                        className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-pink-600 text-white rounded-xl text-xs font-semibold hover:bg-pink-700 transition-colors shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Create First Combo</span>
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                combos.map((combo) => {
                  const productsCount = combo.products?.length || 0;
                  const discountSavings = Math.max(0, (combo.defaultTotalPrice || 0) - (combo.comboPrice || 0));
                  const percentSavings = combo.defaultTotalPrice > 0
                    ? Math.round((discountSavings / combo.defaultTotalPrice) * 100)
                    : 0;

                  return (
                    <tr key={combo._id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Combo Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={combo.featuredImage || '/images/placeholder.png'}
                            alt={combo.title}
                            className="w-14 h-14 object-cover rounded-xl border border-slate-200 shadow-xs shrink-0 bg-slate-100"
                            onError={(e) => {
                              e.currentTarget.src = 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=200&auto=format&fit=crop&q=60';
                            }}
                          />
                          <div className="space-y-0.5">
                            <p className="font-bold text-slate-900 line-clamp-1 hover:text-pink-600 transition-colors">
                              {combo.title}
                            </p>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-xs text-slate-500">
                                /combo/{combo.slug}
                              </span>
                              <a
                                href={`/combo/${combo.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-pink-600 hover:text-pink-700"
                                title="Open public view"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Included Products */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center -space-x-2">
                            {combo.products?.slice(0, 4).map((item, idx) => (
                              <img
                                key={idx}
                                src={item.product?.featuredImage || '/images/placeholder.png'}
                                alt={item.product?.title || 'Product'}
                                title={item.product?.title || 'Product'}
                                className="w-8 h-8 rounded-full border-2 border-white object-cover bg-slate-100 shadow-xs"
                                onError={(e) => {
                                  e.currentTarget.src = 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=100&auto=format&fit=crop&q=60';
                                }}
                              />
                            ))}
                            {productsCount > 4 && (
                              <span className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-600">
                                +{productsCount - 4}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 font-medium">
                            {productsCount} product{productsCount === 1 ? '' : 's'} assigned
                          </p>
                        </div>
                      </td>

                      {/* Pricing */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="flex items-baseline gap-2">
                            <span className="font-bold text-slate-900 text-base">
                              ৳{combo.comboPrice?.toLocaleString() || 0}
                            </span>
                            {(combo.defaultTotalPrice > combo.comboPrice || combo.oldPrice > combo.comboPrice) && (
                              <span className="text-xs text-slate-400 line-through">
                                ৳{(combo.oldPrice || combo.defaultTotalPrice)?.toLocaleString()}
                              </span>
                            )}
                          </div>

                          {discountSavings > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-700">
                              <Tag className="w-3 h-3" />
                              Save ৳{discountSavings} ({percentSavings}% OFF)
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400">Regular total</span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                            combo.status === 'published'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {combo.status}
                        </span>
                      </td>

                      {/* Active Toggle */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(combo._id, combo.isActive)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            combo.isActive ? 'bg-pink-600' : 'bg-slate-200'
                          }`}
                          title={combo.isActive ? 'Deactivate' : 'Activate'}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                              combo.isActive ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <a
                            href={`/combo/${combo.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="View Public Page"
                          >
                            <Eye className="w-4 h-4" />
                          </a>

                          <Link
                            href={`/admin/dashboard/upsells/edit/${combo._id}`}
                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Combo"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>

                          <button
                            type="button"
                            onClick={() => openDeleteModal(combo)}
                            className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Combo"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 bg-slate-50/50">
            <span>
              Showing {combos.length} of {pagination.total} combos
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => fetchCombos(pagination.page - 1)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white disabled:opacity-40 hover:bg-slate-50 transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="font-semibold text-slate-800">
                {pagination.page} / {pagination.totalPages}
              </span>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchCombos(pagination.page + 1)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white disabled:opacity-40 hover:bg-slate-50 transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && comboToDelete && (
        <DeleteConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setComboToDelete(null);
          }}
          onConfirm={handleDeleteConfirm}
          title="Delete Combo"
          message={`Are you sure you want to delete "${comboToDelete.title}"? This combo offer will be permanently removed.`}
          loading={deleting}
        />
      )}
    </div>
  );
}
