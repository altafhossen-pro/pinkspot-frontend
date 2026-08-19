'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    MapPin,
    Search,
    Edit2,
    Save,
    X,
    ChevronLeft,
    Filter,
    Trash2,
    AlertTriangle,
    Database,
    Download,
    Plus
} from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { addressAPI } from '@/services/api';
import { getCookie } from 'cookies-next';
import toast from 'react-hot-toast';
import PermissionDenied from '@/components/Common/PermissionDenied';

const TABS = [
    { id: 'divisions', label: 'Divisions', key: 'division' },
    { id: 'districts', label: 'Districts', key: 'district' },
    { id: 'upazilas', label: 'Upazilas', key: 'upazila' },
    { id: 'dhaka-city', label: 'Dhaka City Areas', key: 'dhakaCity' }
];

export default function AddressSettingsPage() {
    const router = useRouter();
    const { hasPermission, contextLoading } = useAppContext();
    const [checkingPermission, setCheckingPermission] = useState(true);
    const [hasReadPermission, setHasReadPermission] = useState(false);
    const [hasWritePermission, setHasWritePermission] = useState(false);

    const [activeTab, setActiveTab] = useState('divisions');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [editData, setEditData] = useState({});
    const [saving, setSaving] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingItem, setDeletingItem] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
    const [deleteAllType, setDeleteAllType] = useState(null);
    const [deletingAll, setDeletingAll] = useState(false);
    
    const [showSeedModal, setShowSeedModal] = useState(false);
    const [seeding, setSeeding] = useState(false);

    // Pagination
    const [page, setPage] = useState(1);
    const [limit] = useState(20);
    const [total, setTotal] = useState(0);
    const [pages, setPages] = useState(0);

    // Filters
    const [search, setSearch] = useState('');
    const [isActiveFilter, setIsActiveFilter] = useState('');
    const [divisionFilter, setDivisionFilter] = useState('');
    const [districtFilter, setDistrictFilter] = useState('');

    // For filters dropdowns
    const [divisions, setDivisions] = useState([]);
    const [districts, setDistricts] = useState([]);

    useEffect(() => {
        if (contextLoading) return;
        const canRead = hasPermission('settings', 'read');
        const canWrite = hasPermission('settings', 'write');
        setHasReadPermission(canRead);
        setHasWritePermission(canWrite);
        setCheckingPermission(false);
    }, [contextLoading, hasPermission]);

    // Load divisions for filter dropdown
    useEffect(() => {
        if (activeTab === 'districts' || activeTab === 'upazilas' || activeTab === 'dhaka-city') {
            loadDivisions();
        }
    }, [activeTab]);

    // Load districts for filter dropdown
    useEffect(() => {
        if ((activeTab === 'upazilas' || activeTab === 'dhaka-city') && divisionFilter) {
            loadDistricts(divisionFilter);
        } else {
            setDistricts([]);
        }
    }, [activeTab, divisionFilter]);

    // Load data when filters or page changes
    useEffect(() => {
        if (!checkingPermission && hasReadPermission) {
            loadData();
        }
    }, [activeTab, page, search, isActiveFilter, divisionFilter, districtFilter, checkingPermission, hasReadPermission]);

    const loadDivisions = async () => {
        try {
            const response = await addressAPI.getDivisions();
            if (response.success) {
                setDivisions(response.data);
            }
        } catch (error) {
            console.error('Error loading divisions:', error);
        }
    };

    const loadDistricts = async (divisionId) => {
        try {
            const response = await addressAPI.getDistrictsByDivision(divisionId);
            if (response.success) {
                setDistricts(response.data);
            }
        } catch (error) {
            console.error('Error loading districts:', error);
        }
    };

    const loadData = async () => {
        try {
            setLoading(true);
            const token = getCookie('token');
            if (!token) {
                toast.error('Authentication required');
                return;
            }

            const params = {
                page: page.toString(),
                limit: limit.toString(),
            };

            if (search) params.search = search;
            if (isActiveFilter) params.isActive = isActiveFilter;
            if (divisionFilter && (activeTab === 'districts' || activeTab === 'upazilas' || activeTab === 'dhaka-city')) {
                params.divisionId = divisionFilter;
            }
            if (districtFilter && (activeTab === 'upazilas' || activeTab === 'dhaka-city')) {
                params.districtId = districtFilter;
            }

            let response;
            switch (activeTab) {
                case 'divisions':
                    response = await addressAPI.adminGetDivisions(params, token);
                    break;
                case 'districts':
                    response = await addressAPI.adminGetDistricts(params, token);
                    break;
                case 'upazilas':
                    response = await addressAPI.adminGetUpazilas(params, token);
                    break;
                case 'dhaka-city':
                    response = await addressAPI.adminGetDhakaCityAreas(params, token);
                    break;
                default:
                    return;
            }

            if (response.success) {
                setData(response.data.data);
                setTotal(response.data.pagination.total);
                setPages(response.data.pagination.pages);
            } else {
                toast.error(response.message || 'Failed to load data');
            }
        } catch (error) {
            console.error('Error loading data:', error);
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (item) => {
        setIsCreating(false);
        setEditingItem(item);
        setEditData({
            name: item.name,
            bn_name: item.bn_name,
            isActive: item.isActive,
            ...(activeTab === 'dhaka-city' && { city_corporation: item.city_corporation })
        });
        setShowModal(true);
    };

    const handleAdd = () => {
        setIsCreating(true);
        setEditingItem(null);
        setEditData({ isActive: true });
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingItem(null);
        setEditData({});
        setIsCreating(false);
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const token = getCookie('token');
            if (!token) {
                toast.error('Authentication required');
                return;
            }

            let response;
            
            if (isCreating) {
                if (activeTab === 'dhaka-city') {
                    response = await addressAPI.adminCreateDhakaCityArea(editData, token);
                }
            } else {
                if (!editingItem) return;
                switch (activeTab) {
                    case 'divisions':
                        response = await addressAPI.adminUpdateDivision(editingItem._id, editData, token);
                        break;
                    case 'districts':
                        response = await addressAPI.adminUpdateDistrict(editingItem._id, editData, token);
                        break;
                    case 'upazilas':
                        response = await addressAPI.adminUpdateUpazila(editingItem._id, editData, token);
                        break;
                    case 'dhaka-city':
                        response = await addressAPI.adminUpdateDhakaCityArea(editingItem._id, editData, token);
                        break;
                    default:
                        return;
                }
            }

            if (response?.success) {
                toast.success(isCreating ? 'Created successfully' : 'Updated successfully');
                handleCloseModal();
                loadData();
            } else {
                toast.error(response?.message || 'Failed to save');
            }
        } catch (error) {
            console.error('Error saving:', error);
            toast.error('Failed to save');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteClick = (item) => {
        setDeletingItem(item);
        setShowDeleteModal(true);
    };

    const handleCloseDeleteModal = () => {
        setShowDeleteModal(false);
        setDeletingItem(null);
    };

    const handleDelete = async () => {
        if (!deletingItem) return;

        try {
            setDeleting(true);
            const token = getCookie('token');
            if (!token) {
                toast.error('Authentication required');
                return;
            }

            const response = await addressAPI.adminDeleteDhakaCityArea(deletingItem._id, token);

            if (response.success) {
                toast.success('Deleted successfully');
                handleCloseDeleteModal();
                loadData();
            } else {
                toast.error(response.message || 'Failed to delete');
            }
        } catch (error) {
            console.error('Error deleting:', error);
            toast.error('Failed to delete');
        } finally {
            setDeleting(false);
        }
    };

    const handleDeleteAllClick = () => {
        setShowDeleteAllModal(true);
    };

    const confirmDeleteAll = async () => {
        try {
            setDeletingAll(true);
            const token = getCookie('token');
            const response = await addressAPI.deleteAllAddressData(token);

            if (response.success) {
                toast.success(response.message || 'All address data cleared successfully');
                setShowDeleteAllModal(false);
                loadData();
            } else {
                toast.error(response.message || 'Failed to delete');
            }
        } catch (error) {
            toast.error('Failed to delete all items');
        } finally {
            setDeletingAll(false);
        }
    };

    const confirmSeedData = async () => {
        try {
            setSeeding(true);
            const token = getCookie('token');
            const response = await addressAPI.seedAddressData(token);

            if (response.success) {
                toast.success(response.message || 'Data imported successfully');
                setShowSeedModal(false);
                loadData();
            } else {
                toast.error(response.message || 'Failed to import data');
            }
        } catch (error) {
            toast.error('Failed to import data');
        } finally {
            setSeeding(false);
        }
    };

    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
        setPage(1);
        setSearch('');
        setIsActiveFilter('');
        setDivisionFilter('');
        setDistrictFilter('');
        setShowModal(false);
        setEditingItem(null);
        setEditData({});
    };

    const handleFilterReset = () => {
        setSearch('');
        setIsActiveFilter('');
        setDivisionFilter('');
        setDistrictFilter('');
        setPage(1);
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

    if (!hasReadPermission) {
        return (
            <PermissionDenied
                title="Access Denied"
                message="You don't have permission to access address settings"
                action="Contact your administrator for access"
                showBackButton={true}
            />
        );
    }

    return (
        <div className="p-6">
            <div className=" mx-auto">
                {/* Header */}
                <div className="mb-6 flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div>
                        <button
                            onClick={() => router.push('/admin/dashboard/settings')}
                            className="flex items-center text-gray-600 hover:text-gray-900 mb-4 cursor-pointer"
                        >
                            <ChevronLeft className="h-5 w-5 mr-1" />
                            Back to Settings
                        </button>
                        <div className="flex items-center space-x-3 mb-2">
                            <MapPin className="h-8 w-8 text-blue-500" />
                            <h1 className="text-3xl font-bold text-gray-900">Address Settings</h1>
                        </div>
                        <p className="text-gray-600">Manage divisions, districts, upazilas, and Dhaka city areas</p>
                    </div>
                    {hasWritePermission && (
                        <div className="flex items-center gap-3 bg-white p-3 rounded-lg shadow-sm border border-gray-200">
                            <div className="flex flex-col gap-2">
                                <span className="text-xs font-semibold text-gray-500 uppercase">Data Management</span>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={handleDeleteAllClick}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-md text-sm font-medium hover:bg-red-100 transition-colors cursor-pointer"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        Clear All Data
                                    </button>
                                    <button
                                        onClick={() => setShowSeedModal(true)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-md text-sm font-medium hover:bg-green-100 transition-colors cursor-pointer"
                                    >
                                        <Database className="h-4 w-4" />
                                        Import All Data
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
                    <div className="flex flex-wrap border-b border-gray-200 justify-between items-center">
                        <div className="flex flex-wrap">
                            {TABS.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => handleTabChange(tab.id)}
                                    className={`px-6 py-3 text-sm font-medium transition-colors cursor-pointer ${activeTab === tab.id
                                            ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                        {hasWritePermission && activeTab === 'dhaka-city' && (
                            <div className="p-2">
                                <button
                                    onClick={handleAdd}
                                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors cursor-pointer"
                                >
                                    <Plus className="h-4 w-4" />
                                    Add New Area
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Filters */}
                    <div className="p-4 bg-gray-50 border-b border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Search */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    value={search}
                                    onChange={(e) => {
                                        setSearch(e.target.value);
                                        setPage(1);
                                    }}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            {/* Division Filter (for districts, upazilas, dhaka-city) */}
                            {(activeTab === 'districts' || activeTab === 'upazilas' || activeTab === 'dhaka-city') && (
                                <select
                                    value={divisionFilter}
                                    onChange={(e) => {
                                        setDivisionFilter(e.target.value);
                                        setDistrictFilter('');
                                        setPage(1);
                                    }}
                                    className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">All Divisions</option>
                                    {divisions.map((div) => (
                                        <option key={div._id} value={div.id}>
                                            {div.name}
                                        </option>
                                    ))}
                                </select>
                            )}

                            {/* District Filter (for upazilas, dhaka-city) */}
                            {(activeTab === 'upazilas' || activeTab === 'dhaka-city') && (
                                <select
                                    value={districtFilter}
                                    onChange={(e) => {
                                        setDistrictFilter(e.target.value);
                                        setPage(1);
                                    }}
                                    disabled={!divisionFilter}
                                    className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                >
                                    <option value="">All Districts</option>
                                    {districts.map((dist) => (
                                        <option key={dist._id} value={dist.id}>
                                            {dist.name}
                                        </option>
                                    ))}
                                </select>
                            )}

                            {/* Active Status Filter */}
                            <select
                                value={isActiveFilter}
                                onChange={(e) => {
                                    setIsActiveFilter(e.target.value);
                                    setPage(1);
                                }}
                                className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">All Status</option>
                                <option value="true">Active</option>
                                <option value="false">Inactive</option>
                            </select>

                            {/* Reset Filter Button */}
                            {(search || isActiveFilter || divisionFilter || districtFilter) && (
                                <button
                                    onClick={handleFilterReset}
                                    className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors cursor-pointer"
                                >
                                    <X className="h-4 w-4" />
                                    Reset
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Data Table */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    {loading ? (
                        <div className="p-12 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                            <p className="text-gray-600">Loading...</p>
                        </div>
                    ) : data.length === 0 ? (
                        <div className="p-12 text-center">
                            <p className="text-gray-600">No data found</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                ID
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Name (EN)
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Name (BN)
                                            </th>
                                            {activeTab === 'dhaka-city' && (
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    City Corporation
                                                </th>
                                            )}
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                            {hasWritePermission && (
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {data.map((item, index) => (
                                            <tr key={item._id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                                                    {(page - 1) * limit + index + 1}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-sm text-gray-900">{item.name}</span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-sm text-gray-900">{item.bn_name}</span>
                                                </td>
                                                {activeTab === 'dhaka-city' && (
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="text-sm text-gray-900">{item.city_corporation}</span>
                                                    </td>
                                                )}
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span
                                                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${item.isActive
                                                                ? 'bg-green-100 text-green-800'
                                                                : 'bg-red-100 text-red-800'
                                                            }`}
                                                    >
                                                        {item.isActive ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                {hasWritePermission && (
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                        <div className="flex items-center gap-3">
                                                            <button
                                                                onClick={() => handleEdit(item)}
                                                                className="text-blue-600 hover:text-blue-900 flex items-center gap-1 cursor-pointer"
                                                            >
                                                                <Edit2 className="h-4 w-4" />
                                                                Edit
                                                            </button>
                                                            {activeTab === 'dhaka-city' && (
                                                                <button
                                                                    onClick={() => handleDeleteClick(item)}
                                                                    className="text-red-600 hover:text-red-900 flex items-center gap-1 cursor-pointer"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                    Delete
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {pages > 1 && (
                                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                                    <div className="text-sm text-gray-700">
                                        Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} results
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setPage(p => Math.max(1, p - 1))}
                                            disabled={page === 1}
                                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                        >
                                            Previous
                                        </button>
                                        <span className="px-4 py-2 text-sm text-gray-700">
                                            Page {page} of {pages}
                                        </span>
                                        <button
                                            onClick={() => setPage(p => Math.min(pages, p + 1))}
                                            disabled={page === pages}
                                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Edit/Create Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-900">
                                {isCreating ? `Add New ${TABS.find(t => t.id === activeTab)?.label}` : `Edit ${TABS.find(t => t.id === activeTab)?.label}`}
                            </h2>
                            <button
                                onClick={handleCloseModal}
                                className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-4">
                            {/* ID (Read-only) */}
                            {!isCreating && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        ID (Read-only)
                                    </label>
                                    <input
                                        type="text"
                                        value={editingItem?.id || editingItem?._id || ''}
                                        disabled
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
                                    />
                                </div>
                            )}

                            {/* Name (EN) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Name (English) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={editData.name || ''}
                                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Enter name in English"
                                />
                            </div>

                            {/* Name (BN) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Name (Bangla) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={editData.bn_name || ''}
                                    onChange={(e) => setEditData({ ...editData, bn_name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Enter name in Bangla"
                                />
                            </div>

                            {/* City Corporation (for Dhaka City only) */}
                            {activeTab === 'dhaka-city' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        City Corporation <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={editData.city_corporation || ''}
                                        onChange={(e) => setEditData({ ...editData, city_corporation: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Enter city corporation"
                                    />
                                </div>
                            )}

                            {/* Status */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Status
                                </label>
                                <select
                                    value={editData.isActive ? 'true' : 'false'}
                                    onChange={(e) => setEditData({ ...editData, isActive: e.target.value === 'true' })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="true">Active</option>
                                    <option value="false">Inactive</option>
                                </select>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
                            <button
                                onClick={handleCloseModal}
                                disabled={saving}
                                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving || !editData.name || !editData.bn_name || (activeTab === 'dhaka-city' && !editData.city_corporation)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 cursor-pointer"
                            >
                                {saving ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4" />
                                        Save Changes
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && deletingItem && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-red-100 rounded-full">
                                    <AlertTriangle className="h-5 w-5 text-red-600" />
                                </div>
                                <h2 className="text-xl font-semibold text-gray-900">Delete Confirmation</h2>
                            </div>
                            <button
                                onClick={handleCloseDeleteModal}
                                disabled={deleting}
                                className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6">
                            <p className="text-gray-700 mb-4">
                                Are you sure you want to delete this Dhaka City area? This action cannot be undone.
                            </p>
                            <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                <div className="space-y-2">
                                    <div>
                                        <span className="text-sm font-medium text-gray-600">ID:</span>
                                        <span className="ml-2 text-sm text-gray-900 font-mono">{deletingItem.id}</span>
                                    </div>
                                    <div>
                                        <span className="text-sm font-medium text-gray-600">Name (EN):</span>
                                        <span className="ml-2 text-sm text-gray-900">{deletingItem.name}</span>
                                    </div>
                                    <div>
                                        <span className="text-sm font-medium text-gray-600">Name (BN):</span>
                                        <span className="ml-2 text-sm text-gray-900">{deletingItem.bn_name}</span>
                                    </div>
                                    {deletingItem.city_corporation && (
                                        <div>
                                            <span className="text-sm font-medium text-gray-600">City Corporation:</span>
                                            <span className="ml-2 text-sm text-gray-900">{deletingItem.city_corporation}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <p className="text-sm text-red-600 font-medium">
                                ⚠️ This action is permanent and cannot be reversed.
                            </p>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
                            <button
                                onClick={handleCloseDeleteModal}
                                disabled={deleting}
                                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 cursor-pointer"
                            >
                                {deleting ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        Deleting...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="h-4 w-4" />
                                        Delete
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete All Modal */}
            {showDeleteAllModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-red-100 rounded-full">
                                    <AlertTriangle className="h-5 w-5 text-red-600" />
                                </div>
                                <h2 className="text-xl font-semibold text-gray-900">Clear All Address Data</h2>
                            </div>
                            <button
                                onClick={() => setShowDeleteAllModal(false)}
                                disabled={deletingAll}
                                className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="p-6">
                            <p className="text-gray-700 mb-4">
                                Are you sure you want to delete <span className="font-bold text-red-600">ALL</span> Divisions, Districts, Upazilas, and Dhaka City areas globally? 
                            </p>
                            <p className="text-sm text-red-600 font-medium bg-red-50 p-3 rounded border border-red-100">
                                ⚠️ This action will completely wipe all address data in the system and cannot be undone.
                            </p>
                        </div>
                        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
                            <button
                                onClick={() => setShowDeleteAllModal(false)}
                                disabled={deletingAll}
                                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDeleteAll}
                                disabled={deletingAll}
                                className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition-colors flex items-center gap-2 cursor-pointer"
                            >
                                {deletingAll ? (
                                    <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> Clearing...</>
                                ) : (
                                    <><Trash2 className="h-4 w-4" /> Yes, Clear All</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Seed Modal */}
            {showSeedModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 rounded-full">
                                    <Download className="h-5 w-5 text-blue-600" />
                                </div>
                                <h2 className="text-xl font-semibold text-gray-900">Import Address Data</h2>
                            </div>
                            <button
                                onClick={() => setShowSeedModal(false)}
                                disabled={seeding}
                                className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="p-6">
                            <p className="text-gray-700 mb-4">
                                This will import predefined Divisions, Districts, Upazilas, and Dhaka City areas from the system's seed files.
                            </p>
                            <p className="text-sm text-yellow-700 font-medium bg-yellow-50 p-3 rounded border border-yellow-200">
                                ⚠️ Important: This process will <span className="font-bold">REPLACE</span> your current address data. Any custom additions will be lost.
                            </p>
                        </div>
                        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
                            <button
                                onClick={() => setShowSeedModal(false)}
                                disabled={seeding}
                                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmSeedData}
                                disabled={seeding}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 cursor-pointer"
                            >
                                {seeding ? (
                                    <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> Importing...</>
                                ) : (
                                    <><Download className="h-4 w-4" /> Start Import</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

