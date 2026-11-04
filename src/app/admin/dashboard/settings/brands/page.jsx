'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { 
    Tag, 
    Plus, 
    Trash2, 
    Check, 
    X, 
    Star, 
    ArrowLeft, 
    Save, 
    Building2,
    CheckCircle2,
    AlertCircle,
    Edit2
} from 'lucide-react';
import { settingsAPI } from '@/services/api';
import { useAppContext } from '@/context/AppContext';
import PermissionDenied from '@/components/Common/PermissionDenied';

export default function SystemBrandsPage() {
    const { token, hasPermission, contextLoading } = useAppContext();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [brands, setBrands] = useState([]);
    const [defaultBrand, setDefaultBrand] = useState('ForPink');
    const [newBrandName, setNewBrandName] = useState('');
    const [editingIndex, setEditingIndex] = useState(null);
    const [editingName, setEditingName] = useState('');

    useEffect(() => {
        fetchBrands();
    }, []);

    const fetchBrands = async () => {
        try {
            setFetching(true);
            const res = await settingsAPI.getSystemBrands();
            if (res.success && res.data) {
                const list = res.data.systemBrands && res.data.systemBrands.length > 0 
                    ? res.data.systemBrands 
                    : [{ name: 'ForPink', isDefault: true, isActive: true }];
                setBrands(list);
                setDefaultBrand(res.data.defaultBrand || list.find(b => b.isDefault)?.name || list[0]?.name || 'ForPink');
            }
        } catch (error) {
            console.error('Failed to load system brands:', error);
            toast.error('Failed to load system brands');
        } finally {
            setFetching(false);
        }
    };

    const handleAddBrand = (e) => {
        e.preventDefault();
        const trimmed = newBrandName.trim();
        if (!trimmed) {
            toast.error('Please enter a brand name');
            return;
        }

        const exists = brands.some(b => b.name.toLowerCase() === trimmed.toLowerCase());
        if (exists) {
            toast.error('A brand with this name already exists');
            return;
        }

        const isFirst = brands.length === 0;
        const newBrand = {
            name: trimmed,
            isDefault: isFirst,
            isActive: true
        };

        const updated = [...brands, newBrand];
        setBrands(updated);
        if (isFirst) {
            setDefaultBrand(trimmed);
        }
        setNewBrandName('');
        toast.success(`Brand "${trimmed}" added! Click "Save Changes" to apply.`);
    };

    const handleSetDefault = (brandName) => {
        setDefaultBrand(brandName);
        setBrands(prev => prev.map(b => ({
            ...b,
            isDefault: b.name.toLowerCase() === brandName.toLowerCase(),
            isActive: b.name.toLowerCase() === brandName.toLowerCase() ? true : b.isActive
        })));
        toast.success(`"${brandName}" set as default brand`);
    };

    const handleToggleActive = (index) => {
        const target = brands[index];
        if (target.name.toLowerCase() === defaultBrand.toLowerCase() && target.isActive) {
            toast.error('Default brand cannot be deactivated');
            return;
        }

        setBrands(prev => prev.map((b, i) => i === index ? { ...b, isActive: !b.isActive } : b));
    };

    const handleDeleteBrand = (index) => {
        const target = brands[index];
        if (target.name.toLowerCase() === defaultBrand.toLowerCase()) {
            toast.error('Cannot delete the default brand. Set another brand as default first.');
            return;
        }

        if (brands.length <= 1) {
            toast.error('At least one brand must remain in the system');
            return;
        }

        if (confirm(`Are you sure you want to delete brand "${target.name}"?`)) {
            setBrands(prev => prev.filter((_, i) => i !== index));
            toast.success(`Brand "${target.name}" removed`);
        }
    };

    const startEditing = (index) => {
        setEditingIndex(index);
        setEditingName(brands[index].name);
    };

    const saveEditing = (index) => {
        const trimmed = editingName.trim();
        if (!trimmed) {
            toast.error('Brand name cannot be empty');
            return;
        }

        const exists = brands.some((b, i) => i !== index && b.name.toLowerCase() === trimmed.toLowerCase());
        if (exists) {
            toast.error('A brand with this name already exists');
            return;
        }

        const oldName = brands[index].name;
        const wasDefault = oldName.toLowerCase() === defaultBrand.toLowerCase();

        setBrands(prev => prev.map((b, i) => {
            if (i === index) {
                return { ...b, name: trimmed };
            }
            return b;
        }));

        if (wasDefault) {
            setDefaultBrand(trimmed);
        }

        setEditingIndex(null);
        setEditingName('');
        toast.success('Brand name updated');
    };

    const cancelEditing = () => {
        setEditingIndex(null);
        setEditingName('');
    };

    const handleSaveAll = async () => {
        if (!hasPermission('settings', 'update')) {
            toast.error('You do not have permission to update settings');
            return;
        }

        if (brands.length === 0) {
            toast.error('You must have at least one brand');
            return;
        }

        try {
            setLoading(true);
            const payload = {
                systemBrands: brands.map(b => ({
                    name: b.name,
                    isDefault: b.name.toLowerCase() === defaultBrand.toLowerCase(),
                    isActive: b.isActive !== false
                })),
                defaultBrand: defaultBrand
            };

            const res = await settingsAPI.updateSystemBrands(payload, token);
            if (res.success) {
                toast.success('System brand settings saved successfully!');
                if (res.data?.systemBrands) {
                    setBrands(res.data.systemBrands);
                    setDefaultBrand(res.data.defaultBrand || defaultBrand);
                }
            } else {
                toast.error(res.message || 'Failed to save settings');
            }
        } catch (error) {
            console.error('Error saving brands:', error);
            toast.error('Error saving system brands');
        } finally {
            setLoading(false);
        }
    };

    if (contextLoading || fetching) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
            </div>
        );
    }

    if (!hasPermission('settings', 'read')) {
        return <PermissionDenied message="You do not have permission to view brand settings." />;
    }

    const activeBrandsCount = brands.filter(b => b.isActive !== false).length;

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <Link
                        href="/admin/dashboard/settings"
                        className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 mb-2 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-1.5" />
                        Back to Settings
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
                            <Tag className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">System Brand Settings</h1>
                            <p className="text-sm text-slate-500">
                                Manage store brands and configure the default brand for manual order creation.
                            </p>
                        </div>
                    </div>
                </div>

                {hasPermission('settings', 'update') && (
                    <button
                        onClick={handleSaveAll}
                        disabled={loading}
                        className="inline-flex items-center justify-center px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium shadow-sm hover:shadow transition-all disabled:opacity-50 cursor-pointer"
                    >
                        {loading ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                        ) : (
                            <Save className="w-4 h-4 mr-2" />
                        )}
                        Save Changes
                    </button>
                )}
            </div>

            {/* Overview Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Brands</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{brands.length}</p>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Brands</p>
                    <p className="text-2xl font-bold text-emerald-600 mt-1">{activeBrandsCount}</p>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Default Brand</p>
                    <div className="flex items-center gap-1.5 mt-1">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0" />
                        <p className="text-lg font-bold text-slate-900 truncate">{defaultBrand || 'None'}</p>
                    </div>
                </div>
            </div>

            {/* Add Brand Form */}
            {hasPermission('settings', 'update') && (
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                    <h2 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
                        <Plus className="w-4 h-4 text-emerald-600" />
                        Add New Brand
                    </h2>
                    <form onSubmit={handleAddBrand} className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                value={newBrandName}
                                onChange={(e) => setNewBrandName(e.target.value)}
                                placeholder="Enter brand name (e.g. ForPink, PinkStyle, etc.)"
                                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                            />
                        </div>
                        <button
                            type="submit"
                            className="inline-flex items-center justify-center px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer"
                        >
                            <Plus className="w-4 h-4 mr-1.5" />
                            Add Brand
                        </button>
                    </form>
                </div>
            )}

            {/* Brands List */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-base font-bold text-slate-900">Brand List</h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Select which brand will be pre-selected by default on manual order creation.
                        </p>
                    </div>
                    <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                        {brands.length} {brands.length === 1 ? 'brand' : 'brands'}
                    </span>
                </div>

                <div className="divide-y divide-slate-100">
                    {brands.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">
                            No brands found. Please add a brand above.
                        </div>
                    ) : (
                        brands.map((brand, index) => {
                            const isDefault = brand.name.toLowerCase() === defaultBrand.toLowerCase();
                            const isEditing = editingIndex === index;

                            return (
                                <div
                                    key={brand.name + index}
                                    className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                                        isDefault ? 'bg-emerald-50/40' : 'hover:bg-slate-50/60'
                                    }`}
                                >
                                    {/* Left: Brand info & edit */}
                                    <div className="flex items-center gap-3.5 flex-1 min-w-0">
                                        <div className={`p-2.5 rounded-xl shrink-0 ${
                                            isDefault ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                                        }`}>
                                            <Building2 className="w-5 h-5" />
                                        </div>

                                        {isEditing ? (
                                            <div className="flex items-center gap-2 flex-1 max-w-md">
                                                <input
                                                    type="text"
                                                    value={editingName}
                                                    onChange={(e) => setEditingName(e.target.value)}
                                                    className="w-full px-3 py-1.5 border border-emerald-400 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                                                    autoFocus
                                                />
                                                <button
                                                    onClick={() => saveEditing(index)}
                                                    className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors cursor-pointer"
                                                    title="Save"
                                                >
                                                    <Check className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={cancelEditing}
                                                    className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition-colors cursor-pointer"
                                                    title="Cancel"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="text-base font-bold text-slate-900 truncate">
                                                        {brand.name}
                                                    </span>
                                                    {isDefault && (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                                            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                                                            Default Brand
                                                        </span>
                                                    )}
                                                    {!brand.isActive && (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-500">
                                                            Inactive
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-500 mt-0.5">
                                                    {isDefault 
                                                        ? 'Pre-selected automatically on manual order form' 
                                                        : brand.isActive ? 'Available in manual order dropdown' : 'Hidden from dropdown'}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Right: Actions */}
                                    <div className="flex items-center gap-2 sm:gap-3 shrink-0 self-end sm:self-center">
                                        {/* Set Default Button */}
                                        {!isDefault && hasPermission('settings', 'update') && (
                                            <button
                                                onClick={() => handleSetDefault(brand.name)}
                                                className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 hover:border-emerald-500 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 transition-colors cursor-pointer"
                                            >
                                                <Star className="w-3.5 h-3.5 mr-1 text-slate-400 group-hover:text-emerald-500" />
                                                Set as Default
                                            </button>
                                        )}

                                        {/* Active Toggle */}
                                        {hasPermission('settings', 'update') && !isDefault && (
                                            <button
                                                onClick={() => handleToggleActive(index)}
                                                className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                                                    brand.isActive 
                                                        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' 
                                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                }`}
                                            >
                                                {brand.isActive ? 'Active' : 'Inactive'}
                                            </button>
                                        )}

                                        {/* Edit Button */}
                                        {!isEditing && hasPermission('settings', 'update') && (
                                            <button
                                                onClick={() => startEditing(index)}
                                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                                title="Rename Brand"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                        )}

                                        {/* Delete Button */}
                                        {!isDefault && hasPermission('settings', 'update') && (
                                            <button
                                                onClick={() => handleDeleteBrand(index)}
                                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                                title="Delete Brand"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Note & Guidelines */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5 flex items-start gap-3 text-slate-600">
                <AlertCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm space-y-1">
                    <p className="font-semibold text-slate-900">How Brand Settings work:</p>
                    <ul className="list-disc list-inside space-y-1 text-slate-600">
                        <li>The <strong>Default Brand</strong> will automatically be selected in the Brand dropdown whenever an admin opens the Manual Order creation page.</li>
                        <li>Admin can change the brand dropdown to any other active brand when placing a manual order.</li>
                        <li>Every manual order records the selected brand so you can track and filter orders by brand.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

