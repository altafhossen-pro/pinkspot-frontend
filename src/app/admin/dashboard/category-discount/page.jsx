'use client';

import React, { useState, useEffect } from 'react';
import { getCookie } from 'cookies-next';
import { categoryAPI } from '@/services/api';
import toast from 'react-hot-toast';
import { useAppContext } from '@/context/AppContext';
import PermissionDenied from '@/components/Common/PermissionDenied';
import { Tag, Save, Loader2, Search, ShieldOff } from 'lucide-react';
import Image from 'next/image';
import CategoryExclusionModal from '@/components/Admin/CategoryExclusionModal';

export default function CategoryDiscountPage() {
    const { hasPermission, contextLoading } = useAppContext();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [savingId, setSavingId] = useState(null);
    const [localDiscounts, setLocalDiscounts] = useState({});
    const [exclusionModal, setExclusionModal] = useState({ isOpen: false, categoryId: null, categoryName: '' });
    const [bulkToggleModal, setBulkToggleModal] = useState({ isOpen: false, targetStatus: false });
    const [bulkPercentageModal, setBulkPercentageModal] = useState({ isOpen: false, percentage: '' });
    const [isBulkSaving, setIsBulkSaving] = useState(false);
    // Permission checks
    const hasReadPermission = hasPermission('category', 'read');
    const hasUpdatePermission = hasPermission('category', 'update');

    useEffect(() => {
        if (contextLoading) return;
        if (hasReadPermission) {
            fetchCategories();
        } else {
            setLoading(false);
        }
    }, [contextLoading, hasReadPermission]);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const data = await categoryAPI.getCategories({ sort: 'sortOrder', limit: 1000 });

            if (data.success) {
                setCategories(data.data);

                // Initialize local state for edits
                const initialDiscounts = {};
                data.data.forEach(cat => {
                    initialDiscounts[cat._id] = {
                        percentage: cat.categoryDiscount?.percentage || 0,
                        isActive: cat.categoryDiscount?.isActive || false
                    };
                });
                setLocalDiscounts(initialDiscounts);
            } else {
                toast.error(data.message || 'Failed to fetch categories');
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
            toast.error('Error fetching categories');
        } finally {
            setLoading(false);
        }
    };

    const handleLocalChange = (id, field, value) => {
        setLocalDiscounts(prev => ({
            ...prev,
            [id]: {
                ...prev[id],
                [field]: value
            }
        }));
    };

    const openExclusionModal = (categoryId, categoryName) => {
        setExclusionModal({
            isOpen: true,
            categoryId,
            categoryName
        });
    };

    const closeExclusionModal = () => {
        setExclusionModal({
            isOpen: false,
            categoryId: null,
            categoryName: ''
        });
    };

    const handleSaveDiscount = async (categoryId) => {
        if (!hasUpdatePermission) {
            toast.error("You don't have permission to update categories");
            return;
        }

        const discountData = localDiscounts[categoryId];
        if (discountData.percentage < 0 || discountData.percentage > 100) {
            toast.error("Discount percentage must be between 0 and 100");
            return;
        }

        try {
            setSavingId(categoryId);
            const token = getCookie('token');
            const data = await categoryAPI.updateCategory(
                categoryId,
                { categoryDiscount: discountData },
                token
            );

            if (data.success) {
                toast.success('Category discount updated successfully');
                // Update the main categories state to reflect the saved changes
                setCategories(prev => prev.map(cat =>
                    cat._id === categoryId
                        ? { ...cat, categoryDiscount: discountData }
                        : cat
                ));
            } else {
                toast.error(data.message || 'Failed to update category discount');
            }
        } catch (error) {
            console.error('Error updating category discount:', error);
            toast.error('Error updating category discount');
        } finally {
            setSavingId(null);
        }
    };

    if (contextLoading || loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
            </div>
        );
    }

    if (!hasReadPermission) {
        return <PermissionDenied
            title="Access Denied"
            message="You don't have permission to view categories."
            action="Contact your administrator for access."
        />;
    }

    const handleBulkToggle = async () => {
        try {
            setIsBulkSaving(true);
            const token = getCookie('token');
            const data = await categoryAPI.bulkUpdateDiscounts({
                action: 'toggle_status',
                value: bulkToggleModal.targetStatus
            }, token);

            if (data.success) {
                toast.success(`Successfully turned ${bulkToggleModal.targetStatus ? 'ON' : 'OFF'} all category discounts`);
                setBulkToggleModal({ isOpen: false, targetStatus: false });
                fetchCategories(); // Refresh list to get updated states
            } else {
                toast.error(data.message || 'Failed to update categories');
            }
        } catch (error) {
            toast.error(error.message || 'Error updating categories');
        } finally {
            setIsBulkSaving(false);
        }
    };

    const handleBulkPercentage = async () => {
        if (bulkPercentageModal.percentage === '' || isNaN(bulkPercentageModal.percentage)) {
            return toast.error('Please enter a valid percentage');
        }

        try {
            setIsBulkSaving(true);
            const token = getCookie('token');
            const data = await categoryAPI.bulkUpdateDiscounts({
                action: 'set_percentage',
                value: Number(bulkPercentageModal.percentage)
            }, token);

            if (data.success) {
                toast.success(`Successfully set all category discounts to ${bulkPercentageModal.percentage}%`);
                setBulkPercentageModal({ isOpen: false, percentage: '' });
                fetchCategories();
            } else {
                toast.error(data.message || 'Failed to update categories');
            }
        } catch (error) {
            toast.error(error.message || 'Error updating categories');
        } finally {
            setIsBulkSaving(false);
        }
    };

    const filteredCategories = categories.filter(cat =>
        cat.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                        <Tag className="h-6 w-6 mr-2 text-pink-600" />
                        Category Discounts
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Set a discount percentage for all products within a specific category.
                    </p>
                </div>
                {hasUpdatePermission && (
                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            onClick={() => setBulkPercentageModal({ isOpen: true, percentage: '' })}
                            className="inline-flex items-center px-4 py-2 border border-pink-200 text-sm font-medium rounded-md text-pink-700 bg-pink-50 hover:bg-pink-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-colors"
                        >
                            Set % for All
                        </button>
                        <button
                            onClick={() => setBulkToggleModal({ isOpen: true, targetStatus: true })}
                            className="inline-flex items-center px-4 py-2 border border-green-200 text-sm font-medium rounded-md text-green-700 bg-green-50 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                        >
                            Turn All ON
                        </button>
                        <button
                            onClick={() => setBulkToggleModal({ isOpen: true, targetStatus: false })}
                            className="inline-flex items-center px-4 py-2 border border-red-200 text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                        >
                            Turn All OFF
                        </button>
                    </div>
                )}
            </div>

            {/* Search */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="relative max-w-md">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search categories..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
                    />
                </div>
            </div>

            {/* Categories List */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-auto max-h-[calc(100dvh-300px)]">
                <table className="min-w-full divide-y divide-gray-200 relative">
                    <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Category
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Discount Percentage (%)
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Action
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredCategories.length > 0 ? (
                            filteredCategories.map((category) => {
                                const isSaving = savingId === category._id;
                                const currentValues = localDiscounts[category._id] || { percentage: 0, isActive: false };

                                return (
                                    <tr key={category._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center text-left">
                                                <div className="flex-shrink-0 h-10 w-10 relative rounded-md overflow-hidden bg-gray-100 border border-gray-200">
                                                    {category.image ? (
                                                        <Image
                                                            src={category.image}
                                                            alt={category.name}
                                                            fill
                                                            className="object-cover"
                                                            sizes="40px"
                                                        />
                                                    ) : (
                                                        <div className="flex items-center justify-center h-full w-full text-gray-400">
                                                            <Tag className="h-5 w-5" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="ml-4 flex flex-col items-start">
                                                    <div className="text-sm font-bold text-gray-900">{category.name}</div>
                                                    {category.parent && (
                                                        <div className="text-xs text-gray-500">Child of: {category.parent.name}</div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <input
                                                    type="text"
                                                    value={currentValues.percentage}
                                                    onChange={(e) => {
                                                        const val = e.target.value.replace(/[^0-9]/g, '');
                                                        handleLocalChange(category._id, 'percentage', val === '' ? '' : Number(val));
                                                    }}
                                                    className="w-20 px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-pink-500"
                                                    disabled={!hasUpdatePermission || isSaving}
                                                />
                                                <span className="ml-2 text-gray-500 font-medium">%</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <label className="inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    checked={currentValues.isActive}
                                                    onChange={(e) => handleLocalChange(category._id, 'isActive', e.target.checked)}
                                                    disabled={!hasUpdatePermission || isSaving}
                                                />
                                                <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
                                                <span className="ms-3 text-sm font-medium text-gray-700">
                                                    {currentValues.isActive ? 'Active' : 'Disabled'}
                                                </span>
                                            </label>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end space-x-2">
                                                {hasUpdatePermission && (
                                                    <button
                                                        onClick={() => openExclusionModal(category._id, category.name)}
                                                        className="inline-flex items-center px-3 py-1.5 border border-orange-200 text-xs font-medium rounded shadow-sm text-orange-700 bg-orange-50 hover:bg-orange-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
                                                        title="Exclude Products from Discount"
                                                    >
                                                        <ShieldOff className="h-3.5 w-3.5 mr-1.5" />
                                                        Exclude
                                                    </button>
                                                )}
                                                {hasUpdatePermission && (
                                                    <button
                                                        onClick={() => handleSaveDiscount(category._id)}
                                                        disabled={isSaving}
                                                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                    >
                                                        {isSaving ? (
                                                            <>
                                                                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                                                                Saving
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Save className="h-3.5 w-3.5 mr-1.5" />
                                                                Save
                                                            </>
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan="4" className="px-6 py-10 text-center text-gray-500">
                                    No categories found matching your search.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Category Exclusion Modal */}
            <CategoryExclusionModal
                isOpen={exclusionModal.isOpen}
                onClose={closeExclusionModal}
                categoryId={exclusionModal.categoryId}
                categoryName={exclusionModal.categoryName}
            />
            {/* Bulk Toggle Modal */}
            {bulkToggleModal.isOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
                        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => !isBulkSaving && setBulkToggleModal({ isOpen: false, targetStatus: false })} />

                        <div className="relative inline-block w-full max-w-md p-6 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
                            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                                Confirm Action
                            </h3>
                            <p className="text-sm text-gray-500 mb-6">
                                Are you sure you want to turn {bulkToggleModal.targetStatus ? 'ON' : 'OFF'} the discount status for ALL categories? This will override any existing individual settings.
                            </p>
                            
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setBulkToggleModal({ isOpen: false, targetStatus: false })}
                                    disabled={isBulkSaving}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleBulkToggle}
                                    disabled={isBulkSaving}
                                    className={`inline-flex items-center px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md focus:outline-none disabled:opacity-50 ${bulkToggleModal.targetStatus ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'}`}
                                >
                                    {isBulkSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    Yes, Turn All {bulkToggleModal.targetStatus ? 'ON' : 'OFF'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Bulk Percentage Modal */}
            {bulkPercentageModal.isOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
                        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => !isBulkSaving && setBulkPercentageModal({ isOpen: false, percentage: '' })} />

                        <div className="relative inline-block w-full max-w-md p-6 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
                            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                                Set Percentage for All Categories
                            </h3>
                            <p className="text-sm text-gray-500 mb-4">
                                This will override the discount percentage for ALL categories. Categories that are currently inactive will remain inactive, but their percentage value will be updated.
                            </p>
                            
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Discount Percentage (%)</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={bulkPercentageModal.percentage}
                                        onChange={(e) => setBulkPercentageModal(prev => ({ ...prev, percentage: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                                        placeholder="e.g. 10"
                                        disabled={isBulkSaving}
                                    />
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                        <span className="text-gray-500">%</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setBulkPercentageModal({ isOpen: false, percentage: '' })}
                                    disabled={isBulkSaving}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleBulkPercentage}
                                    disabled={isBulkSaving || !bulkPercentageModal.percentage}
                                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-pink-600 border border-transparent rounded-md hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50"
                                >
                                    {isBulkSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    Apply to All
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
