'use client';

import React, { useState, useEffect } from 'react';
import { getCookie } from 'cookies-next';
import { couponAPI } from '@/services/api';
import toast from 'react-hot-toast';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  ToggleLeft, 
  ToggleRight,
  Calendar,
  Users,
  Percent,
  DollarSign,
  Ticket,
  Filter,
  MoreVertical
} from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import PermissionDenied from '@/components/Common/PermissionDenied';
import DeleteConfirmationModal from '@/components/Common/DeleteConfirmationModal';

export default function CouponsPage() {
  const { hasPermission, contextLoading } = useAppContext();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [pagination, setPagination] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [checkingPermission, setCheckingPermission] = useState(true);
  const [hasReadPermission, setHasReadPermission] = useState(false);
  const [permissionError, setPermissionError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [couponToDelete, setCouponToDelete] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    discountType: 'percentage',
    discountValue: '',
    maxUsage: '',
    startDate: '',
    endDate: '',
    minOrderAmount: '',
    description: '',
    isActive: true,
    isShowOnPublicly: false
  });

  useEffect(() => {
    if (contextLoading) return;
    const canRead = hasPermission('coupon', 'read');
    setHasReadPermission(canRead);
    setCheckingPermission(false);
    if (canRead) {
      fetchCoupons();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contextLoading, currentPage, statusFilter, searchTerm]);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const token = getCookie('token');
      const params = {
        page: currentPage,
        limit: 10,
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm })
      };

      const response = await couponAPI.getAllCoupons(params, token);
      if (response.success) {
        setCoupons(response.data.coupons);
        setPagination(response.data.pagination);
        setPermissionError(null);
      } else if (response.status === 403) {
        setPermissionError(response.message || "You don't have permission to read coupons");
      }
    } catch (error) {
      if (error?.status === 403) {
        setPermissionError(error?.data?.message || "You don't have permission to read coupons");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const token = getCookie('token');
      const response = await couponAPI.createCoupon(formData, token);
      if (response.success) {
        toast.success('Coupon created successfully!');
        setShowCreateModal(false);
        resetForm();
        fetchCoupons();
      } else if (response.status === 403) {
        setPermissionError(response.message || "You don't have permission to create coupons");
      } else {
        toast.error(response.message || 'Failed to create coupon');
      }
    } catch (error) {
      if (error?.status === 403) {
        setPermissionError(error?.data?.message || "You don't have permission to create coupons");
      } else {
        toast.error('Failed to create coupon. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateCoupon = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const token = getCookie('token');
      const response = await couponAPI.updateCoupon(selectedCoupon._id, formData, token);
      if (response.success) {
        toast.success('Coupon updated successfully!');
        setShowEditModal(false);
        resetForm();
        fetchCoupons();
      } else if (response.status === 403) {
        setPermissionError(response.message || "You don't have permission to update coupons");
      } else {
        toast.error(response.message || 'Failed to update coupon');
      }
    } catch (error) {
      if (error?.status === 403) {
        setPermissionError(error?.data?.message || "You don't have permission to update coupons");
      } else {
        toast.error('Failed to update coupon. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCoupon = async () => {
    if (!couponToDelete) return;
    try {
      const token = getCookie('token');
      const response = await couponAPI.deleteCoupon(couponToDelete._id, token);
      if (response.success) {
        toast.success('Coupon deleted successfully!');
        setShowDeleteModal(false);
        setCouponToDelete(null);
        fetchCoupons();
      } else if (response.status === 403) {
        setPermissionError(response.message || "You don't have permission to delete coupons");
      } else {
        toast.error(response.message || 'Failed to delete coupon');
      }
    } catch (error) {
      if (error?.status === 403) {
        setPermissionError(error?.data?.message || "You don't have permission to delete coupons");
      } else {
        toast.error('Failed to delete coupon. Please try again.');
      }
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      const token = getCookie('token');
      const response = await couponAPI.toggleCouponStatus(id, token);
      if (response.success) {
        toast.success(response.message || 'Coupon status updated successfully!');
        fetchCoupons();
      } else if (response.status === 403) {
        setPermissionError(response.message || "You don't have permission to update coupons");
      } else {
        toast.error(response.message || 'Failed to update coupon status');
      }
    } catch (error) {
      if (error?.status === 403) {
        setPermissionError(error?.data?.message || "You don't have permission to update coupons");
      } else {
        toast.error('Failed to update coupon status. Please try again.');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      discountType: 'percentage',
      discountValue: '',
      maxUsage: '',
      startDate: '',
      endDate: '',
      minOrderAmount: '',
      description: '',
      isActive: true,
      isShowOnPublicly: false
    });
    setSelectedCoupon(null);
  };

  const openEditModal = (coupon) => {
    setSelectedCoupon(coupon);
    setFormData({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      maxUsage: coupon.maxUsage || '',
      startDate: coupon.startDate ? new Date(coupon.startDate).toISOString().split('T')[0] : '',
      endDate: coupon.endDate ? new Date(coupon.endDate).toISOString().split('T')[0] : '',
      minOrderAmount: coupon.minOrderAmount || '',
      description: coupon.description || '',
      isActive: coupon.isActive,
      isShowOnPublicly: coupon.isShowOnPublicly || false
    });
    setShowEditModal(true);
  };

  const getStatusBadge = (coupon) => {
    if (!coupon.isActive) return { text: 'Inactive', color: 'bg-gray-100 text-gray-800' };
    if (new Date(coupon.endDate) <= new Date()) return { text: 'Expired', color: 'bg-red-100 text-red-800' };
    if (coupon.maxUsage && coupon.usedCount >= coupon.maxUsage) return { text: 'Used Up', color: 'bg-orange-100 text-orange-800' };
    return { text: 'Active', color: 'bg-green-100 text-green-800' };
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (checkingPermission || contextLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!hasReadPermission || permissionError) {
    return (
      <PermissionDenied
        title="Access Denied"
        message={permissionError || "You don't have permission to access coupons"}
        action="Contact your administrator for access"
        showBackButton={true}
      />
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Coupon Management</h1>
          <p className="text-gray-600">Manage discount coupons and promotional codes</p>
        </div>
        {hasPermission('coupon','create') && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Coupon
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search coupons..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Coupons Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading coupons...</p>
          </div>
        ) : coupons.length === 0 ? (
          <div className="p-8 text-center">
            <Ticket className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No coupons found</h3>
            <p className="text-gray-600 mb-4">Get started by creating your first coupon.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Coupon
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usage</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Validity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Show Publicly</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {coupons.map((coupon) => {
                    const status = getStatusBadge(coupon);
                    return (
                      <tr key={coupon._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{coupon.code}</div>
                            {coupon.description && (
                              <div className="text-sm text-gray-500">{coupon.description}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {coupon.discountType === 'percentage' ? (
                              <Percent className="h-4 w-4 text-gray-400 mr-1" />
                            ) : (
                              <DollarSign className="h-4 w-4 text-gray-400 mr-1" />
                            )}
                            <span className="text-sm text-gray-900">
                              {coupon.discountValue}
                              {coupon.discountType === 'percentage' ? '%' : '৳'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {coupon.usedCount} / {coupon.maxUsage || '∞'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatDate(coupon.endDate)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${status.color}`}>
                            {status.text}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            coupon.isShowOnPublicly 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {coupon.isShowOnPublicly ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            {hasPermission('coupon','update') && (
                            <button
                              onClick={() => handleToggleStatus(coupon._id)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              {coupon.isActive ? (
                                <ToggleRight className="h-5 w-5" />
                              ) : (
                                <ToggleLeft className="h-5 w-5" />
                              )}
                            </button>
                            )}
                            {hasPermission('coupon','update') && (
                            <button
                              onClick={() => openEditModal(coupon)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            )}
                            {hasPermission('coupon','delete') && (
                            <button
                              onClick={() => { setCouponToDelete(coupon); setShowDeleteModal(true); }}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, pagination.totalCoupons)} of {pagination.totalCoupons} results
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={!pagination.hasPrev}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={!pagination.hasNext}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Coupon Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex-shrink-0 p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Create New Coupon</h2>
            </div>
            
            {/* Modal Body - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6">
              <form onSubmit={handleCreateCoupon} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Code</label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., SAVE20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type</label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({...formData, discountType: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discount Value</label>
                  <input
                    type="number"
                    required
                    min="0"
                    max={formData.discountType === 'percentage' ? 100 : undefined}
                    value={formData.discountValue}
                    onChange={(e) => setFormData({...formData, discountValue: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={formData.discountType === 'percentage' ? '20' : '100'}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Usage (leave empty for unlimited)</label>
                <input
                  type="number"
                  min="1"
                  value={formData.maxUsage}
                  onChange={(e) => setFormData({...formData, maxUsage: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Order Amount (৳)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.minOrderAmount}
                  onChange={(e) => setFormData({...formData, minOrderAmount: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  required
                  value={formData.endDate}
                  onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="2"
                  placeholder="Optional description"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                  Active
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isShowOnPublicly"
                  checked={formData.isShowOnPublicly}
                  onChange={(e) => setFormData({...formData, isShowOnPublicly: e.target.checked})}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isShowOnPublicly" className="ml-2 block text-sm text-gray-900">
                  Show on Publicly
                </label>
              </div>
              </form>
            </div>
            
            {/* Modal Footer */}
            <div className="flex-shrink-0 p-6 border-t border-gray-200">
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  disabled={saving}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  onClick={handleCreateCoupon}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    'Create Coupon'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Coupon Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex-shrink-0 p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Edit Coupon</h2>
            </div>
            
            {/* Modal Body - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6">
              <form onSubmit={handleUpdateCoupon} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Code</label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type</label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({...formData, discountType: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discount Value</label>
                  <input
                    type="number"
                    required
                    min="0"
                    max={formData.discountType === 'percentage' ? 100 : undefined}
                    value={formData.discountValue}
                    onChange={(e) => setFormData({...formData, discountValue: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Usage (leave empty for unlimited)</label>
                <input
                  type="number"
                  min="1"
                  value={formData.maxUsage}
                  onChange={(e) => setFormData({...formData, maxUsage: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Order Amount (৳)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.minOrderAmount}
                  onChange={(e) => setFormData({...formData, minOrderAmount: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  required
                  value={formData.endDate}
                  onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="2"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActiveEdit"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isActiveEdit" className="ml-2 block text-sm text-gray-900">
                  Active
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isShowOnPubliclyEdit"
                  checked={formData.isShowOnPublicly}
                  onChange={(e) => setFormData({...formData, isShowOnPublicly: e.target.checked})}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isShowOnPubliclyEdit" className="ml-2 block text-sm text-gray-900">
                  Show on Publicly
                </label>
              </div>
              </form>
            </div>
            
            {/* Modal Footer */}
            <div className="flex-shrink-0 p-6 border-t border-gray-200">
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    resetForm();
                  }}
                  disabled={saving}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  onClick={handleUpdateCoupon}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Updating...
                    </>
                  ) : (
                    'Update Coupon'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <DeleteConfirmationModal
          isOpen={showDeleteModal}
          title="Delete Coupon"
          message={`Are you sure you want to delete ${couponToDelete?.code}? This action cannot be undone.`}
          confirmText="Delete"
          onClose={() => { setShowDeleteModal(false); setCouponToDelete(null); }}
          onConfirm={handleDeleteCoupon}
          isLoading={false}
        />
      )}
    </div>
  );
}
