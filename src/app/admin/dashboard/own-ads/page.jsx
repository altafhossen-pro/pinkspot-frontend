'use client';

import React, { useState, useEffect } from 'react';
import { getCookie } from 'cookies-next';
import { adsAPI } from '@/services/api';
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
  Package,
  Filter,
  Presentation,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { useRouter } from 'next/navigation';
import PermissionDenied from '@/components/Common/PermissionDenied';
import DeleteConfirmationModal from '@/components/Common/DeleteConfirmationModal';
import Link from 'next/link';

export default function OwnAdsPage() {
  const { hasPermission, contextLoading } = useAppContext();
  const router = useRouter();
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [positionFilter, setPositionFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pagination, setPagination] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [checkingPermission, setCheckingPermission] = useState(true);
  const [hasReadPermission, setHasReadPermission] = useState(false);
  const [hasCreatePermission, setHasCreatePermission] = useState(false);
  const [permissionError, setPermissionError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [adToDelete, setAdToDelete] = useState(null);

  useEffect(() => {
    if (contextLoading) return;
    const canRead = hasPermission('ads', 'read');
    const canCreate = hasPermission('ads', 'create');
    setHasReadPermission(canRead);
    setHasCreatePermission(canCreate);
    setCheckingPermission(false);
    if (canRead) {
      fetchAds();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contextLoading, currentPage, positionFilter, statusFilter, searchTerm]);

  const fetchAds = async () => {
    try {
      setLoading(true);
      const token = getCookie('token');
      const params = {
        page: currentPage,
        limit: 10,
        ...(positionFilter !== 'all' && { position: positionFilter }),
        ...(statusFilter !== 'all' && { isActive: statusFilter === 'active' }),
        ...(searchTerm && { search: searchTerm })
      };

      const response = await adsAPI.getAllAds(params, token);
      if (response.success) {
        setAds(response.data.ads);
        setPagination(response.data.pagination);
        setPermissionError(null);
      } else if (response.status === 403) {
        setPermissionError(response.message || "You don't have permission to read ads");
      }
    } catch (error) {
      if (error?.status === 403) {
        setPermissionError(error?.data?.message || "You don't have permission to read ads");
      } else {
        toast.error('Error fetching ads');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (adId) => {
    try {
      const token = getCookie('token');
      const response = await adsAPI.toggleAdStatus(adId, token);
      if (response.success) {
        toast.success(response.message || 'Ad status updated');
        fetchAds();
      } else {
        toast.error(response.message || 'Failed to update status');
      }
    } catch (error) {
      toast.error('Error updating ad status');
    }
  };

  const handleDeleteClick = (ad) => {
    setAdToDelete(ad);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!adToDelete) return;

    try {
      const token = getCookie('token');
      const response = await adsAPI.deleteAd(adToDelete._id, token);
      if (response.success) {
        toast.success('Ad deleted successfully');
        fetchAds();
        setShowDeleteModal(false);
        setAdToDelete(null);
      } else {
        toast.error(response.message || 'Failed to delete ad');
      }
    } catch (error) {
      toast.error('Error deleting ad');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const isExpired = (expireDate) => {
    return new Date(expireDate) < new Date();
  };

  if (checkingPermission || contextLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!hasReadPermission) {
    return <PermissionDenied message={permissionError || "You don't have permission to view ads"} />;
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Presentation className="w-7 h-7 text-blue-600" />
            Own Products Ads
          </h1>
          <p className="text-gray-500 mt-1">Manage your product advertisements</p>
        </div>
        {hasCreatePermission && (
          <Link
            href="/admin/dashboard/own-ads/create"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Ad
          </Link>
        )}
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search ads..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <select
            value={positionFilter}
            onChange={(e) => {
              setPositionFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Positions</option>
            <option value="homepage-banner">Homepage Banner</option>
            <option value="product-page">Product Page</option>
            <option value="category-page">Category Page</option>
            <option value="search-page">Search Page</option>
            <option value="shop-page">Shop Page</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <button
            onClick={() => {
              setSearchTerm('');
              setPositionFilter('all');
              setStatusFilter('all');
              setCurrentPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Filter className="w-4 h-4 inline mr-2" />
            Reset Filters
          </button>
        </div>
      </div>

      {/* Ads Table */}
      {loading ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
          <div className="text-center">
            <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading ads...</p>
          </div>
        </div>
      ) : ads.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
          <div className="text-center">
            <Presentation className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No ads found</h3>
            <p className="text-gray-500 mb-4">Get started by creating your first ad</p>
            {hasCreatePermission && (
              <Link
                href="/admin/dashboard/own-ads/create"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Ad
              </Link>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ad
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Position
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expires
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stats
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {ads.map((ad) => (
                    <tr key={ad._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-16 w-16">
                            <img
                              className="h-16 w-16 object-cover rounded-lg"
                              src={ad.image}
                              alt={ad.title}
                              onError={(e) => {
                                e.target.src = '/images/placeholder.png';
                              }}
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{ad.title}</div>
                            <div className="text-sm text-gray-500 truncate max-w-xs">{ad.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {ad.product?.title || 'N/A'}
                        </div>
                        {ad.product?.slug && (
                          <Link
                            href={`/product/${ad.product.slug}`}
                            target="_blank"
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            View Product →
                          </Link>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {ad.position?.replace('-', ' ') || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {isExpired(ad.expireDate) ? (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              Expired
                            </span>
                          ) : ad.isActive ? (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Active
                            </span>
                          ) : (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                              Inactive
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(ad.expireDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="space-y-1">
                          <div>Views: {ad.viewCount || 0}</div>
                          <div>Clicks: {ad.clickCount || 0}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggleStatus(ad._id)}
                            className="text-gray-600 hover:text-blue-600"
                            title={ad.isActive ? 'Deactivate' : 'Activate'}
                          >
                            {ad.isActive ? (
                              <ToggleRight className="w-5 h-5" />
                            ) : (
                              <ToggleLeft className="w-5 h-5" />
                            )}
                          </button>
                          <button
                            onClick={() => router.push(`/admin/dashboard/own-ads/${ad._id}/edit`)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Edit"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(ad)}
                            className="text-red-600 hover:text-red-800"
                            title="Delete"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalAds} total)
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={!pagination.hasPrev}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(p => p + 1)}
                  disabled={!pagination.hasNext}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setAdToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Ad"
        message={`Are you sure you want to delete "${adToDelete?.title}"? This action cannot be undone.`}
      />
    </div>
  );
}

