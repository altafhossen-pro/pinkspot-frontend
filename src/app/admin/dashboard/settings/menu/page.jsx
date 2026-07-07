'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, GripVertical, Save, X, Facebook, Twitter, Instagram, Linkedin, FolderOpen, Loader2 } from 'lucide-react';
import { menuAPI, categoryAPI } from '@/services/api';
import toast from 'react-hot-toast';
import { getCookie } from 'cookies-next';
import DeleteConfirmationModal from '@/components/Common/DeleteConfirmationModal';
import { useAppContext } from '@/context/AppContext';
import PermissionDenied from '@/components/Common/PermissionDenied';

export default function MenuSettings() {
    const { hasPermission, contextLoading } = useAppContext();
    const [activeTab, setActiveTab] = useState('categories');
    const [headerMenus, setHeaderMenus] = useState([]);
    const [footerMenus, setFooterMenus] = useState({});
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingMenu, setEditingMenu] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [menuToDelete, setMenuToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [socialMediaData, setSocialMediaData] = useState({
        facebook: { url: '', isActive: false, openInNewTab: true },
        twitter: { url: '', isActive: false, openInNewTab: true },
        instagram: { url: '', isActive: false, openInNewTab: true },
        linkedin: { url: '', isActive: false, openInNewTab: true }
    });
    const [contactData, setContactData] = useState({
        address: '',
        phone: '',
        email: '',
        callToAction: ''
    });
    const [formData, setFormData] = useState({
        name: '',
        href: '',
        isActive: false,
        order: 0,
        isVisible: true,
        target: '_self',
        icon: '',
        description: '',
        section: 'quickLinks',
        contactType: '',
        socialPlatform: ''
    });
    const [checkingPermission, setCheckingPermission] = useState(true);
    const [hasReadPermission, setHasReadPermission] = useState(false);
    const [permissionError, setPermissionError] = useState(null);
    const [hasUpdatePermission, setHasUpdatePermission] = useState(false);

    // Get admin token from localStorage
    const getAdminToken = () => {
        return getCookie('token');
    };

    // Fetch menus
    const fetchMenus = async () => {
        try {
            setLoading(true);
            const [headerResponse, footerResponse, categoriesResponse] = await Promise.all([
                menuAPI.getHeaderMenus(),
                menuAPI.getFooterMenus(),
                categoryAPI.getCategories()
            ]);

            if (categoriesResponse.success) {
                setCategories(categoriesResponse.data);
            }

            if (headerResponse.success) {
                setHeaderMenus(headerResponse.data);
            }

            if (footerResponse.success) {
                setFooterMenus(footerResponse.data);
                
                // Process social media data
                const socialData = footerResponse.data.socialMedia || [];
                const processedSocialData = {
                    facebook: { url: '', isActive: false, openInNewTab: true },
                    twitter: { url: '', isActive: false, openInNewTab: true },
                    instagram: { url: '', isActive: false, openInNewTab: true },
                    linkedin: { url: '', isActive: false, openInNewTab: true }
                };
                
                socialData.forEach(item => {
                    const platform = item.socialPlatform || item.name?.toLowerCase();
                    if (processedSocialData[platform]) {
                        processedSocialData[platform] = {
                            url: item.href,
                            isActive: item.isActive,
                            openInNewTab: item.target === '_blank'
                        };
                    }
                });
                
                setSocialMediaData(processedSocialData);
                
                // Process contact data
                const contactMenus = footerResponse.data.contact || [];
                const processedContactData = {
                    address: '',
                    phone: '',
                    email: '',
                    callToAction: ''
                };
                
                contactMenus.forEach(item => {
                    switch (item.contactType) {
                        case 'address':
                            processedContactData.address = item.href;
                            break;
                        case 'phone':
                            processedContactData.phone = item.href;
                            break;
                        case 'email':
                            processedContactData.email = item.href;
                            break;
                        case 'callToAction':
                            processedContactData.callToAction = item.description || item.href;
                            break;
                    }
                });
                
                setContactData(processedContactData);
            }
        } catch (error) {
            console.error('Error fetching menus:', error);
            toast.error('Failed to fetch menus');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (contextLoading) return;
        const canRead = hasPermission('settings', 'read');
        const canUpdate = hasPermission('settings', 'update');
        setHasReadPermission(canRead);
        setHasUpdatePermission(!!canUpdate);
        setCheckingPermission(false);
        if (canRead) {
            fetchMenus();
        } else {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [contextLoading]);

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!hasUpdatePermission) {
            toast.error("You don't have permission to update settings");
            return;
        }
        try {
            const token = getAdminToken();
            if (!token) {
                toast.error('Admin authentication required');
                return;
            }

            // Clean the form data - remove empty strings for optional fields
            const menuData = { ...formData };
            
            // Remove empty strings for optional fields that have enum validation
            if (!menuData.contactType || menuData.contactType === '') {
                delete menuData.contactType;
            }
            if (!menuData.socialPlatform || menuData.socialPlatform === '') {
                delete menuData.socialPlatform;
            }
            if (!menuData.icon || menuData.icon === '') {
                delete menuData.icon;
            }
            if (!menuData.description || menuData.description === '') {
                delete menuData.description;
            }
            
            
            if (activeTab === 'header') {
                if (editingMenu) {
                    const response = await menuAPI.updateHeaderMenu(editingMenu._id, menuData, token);
                    if (response.success) {
                        toast.success('Header menu updated successfully');
                        setHeaderMenus(prev => prev.map(menu => 
                            menu._id === editingMenu._id ? response.data : menu
                        ));
                    }
                } else {
                    const response = await menuAPI.createHeaderMenu(menuData, token);
                    if (response.success) {
                        toast.success('Header menu created successfully');
                        setHeaderMenus(prev => [...prev, response.data]);
                    }
                }
            } else {
                if (editingMenu) {
                    const response = await menuAPI.updateFooterMenu(editingMenu._id, menuData, token);
                    if (response.success) {
                        toast.success('Footer menu updated successfully');
                        setFooterMenus(prev => ({
                            ...prev,
                            [menuData.section]: prev[menuData.section]?.map(menu => 
                                menu._id === editingMenu._id ? response.data : menu
                            ) || []
                        }));
                    }
                } else {
                    const response = await menuAPI.createFooterMenu(menuData, token);
                    if (response.success) {
                        toast.success('Footer menu created successfully');
                        setFooterMenus(prev => ({
                            ...prev,
                            [menuData.section]: [...(prev[menuData.section] || []), response.data]
                        }));
                    }
                }
            }

            setShowForm(false);
            setEditingMenu(null);
            resetForm();
        } catch (error) {
            console.error('Error saving menu:', error);
            toast.error('Failed to save menu');
        }
    };

    // Handle edit
    const handleEdit = (menu) => {
        setEditingMenu(menu);
        setFormData({
            name: menu.name,
            href: menu.href,
            isActive: menu.isActive,
            order: menu.order,
            isVisible: menu.isVisible,
            target: menu.target,
            icon: menu.icon || '',
            description: menu.description || '',
            section: menu.section || 'quickLinks',
            contactType: menu.contactType || '',
            socialPlatform: menu.socialPlatform || ''
        });
        setShowForm(true);
    };

    // Handle delete button click
    const handleDeleteClick = (menu) => {
        setMenuToDelete(menu);
        setShowDeleteModal(true);
    };

    // Handle delete confirmation
    const handleDeleteConfirm = async () => {
        if (!menuToDelete) return;
        if (!hasUpdatePermission) {
            toast.error("You don't have permission to update settings");
            return;
        }

        try {
            setDeleting(true);
            const token = getAdminToken();
            if (!token) {
                toast.error('Admin authentication required');
                return;
            }

            let response;
            if (activeTab === 'header') {
                response = await menuAPI.deleteHeaderMenu(menuToDelete._id, token);
                if (response.success) {
                    setHeaderMenus(prev => prev.filter(m => m._id !== menuToDelete._id));
                    toast.success('Header menu deleted successfully');
                }
            } else {
                response = await menuAPI.deleteFooterMenu(menuToDelete._id, token);
                if (response.success) {
                    setFooterMenus(prev => ({
                        ...prev,
                        [menuToDelete.section]: prev[menuToDelete.section]?.filter(m => m._id !== menuToDelete._id) || []
                    }));
                    toast.success('Footer menu deleted successfully');
                }
            }
            
            setShowDeleteModal(false);
            setMenuToDelete(null);
        } catch (error) {
            console.error('Error deleting menu:', error);
            toast.error('Failed to delete menu');
        } finally {
            setDeleting(false);
        }
    };

    // Handle delete modal close
    const handleDeleteCancel = () => {
        setShowDeleteModal(false);
        setMenuToDelete(null);
    };

    // Handle contact data save
    const handleContactSave = async () => {
        try {
            if (!hasUpdatePermission) {
                toast.error("You don't have permission to update settings");
                return;
            }
            const token = getAdminToken();
            if (!token) {
                toast.error('Admin authentication required');
                return;
            }

            // Delete existing contact menus first
            const existingContactMenus = footerMenus.contact || [];
            for (const menu of existingContactMenus) {
                await menuAPI.deleteFooterMenu(menu._id, token);
            }

            // Create new contact menus
            const contactItems = [
                { type: 'address', value: contactData.address, description: contactData.address },
                { type: 'phone', value: contactData.phone, description: contactData.phone },
                { type: 'email', value: contactData.email, description: contactData.email },
                { type: 'callToAction', value: contactData.callToAction, description: contactData.callToAction }
            ];

            for (const item of contactItems) {
                if (item.value.trim()) {
                    await menuAPI.createFooterMenu({
                        section: 'contact',
                        name: item.type.charAt(0).toUpperCase() + item.type.slice(1),
                        href: item.value,
                        description: item.description,
                        isActive: true,
                        order: contactItems.indexOf(item),
                        isVisible: true,
                        target: '_self',
                        contactType: item.type
                    }, token);
                }
            }

            toast.success('Contact information updated successfully');
            fetchMenus(); // Refresh data
        } catch (error) {
            console.error('Error saving contact data:', error);
            toast.error('Failed to save contact information');
        }
    };

    // Handle social media save
    const handleSocialMediaSave = async () => {
        try {
            if (!hasUpdatePermission) {
                toast.error("You don't have permission to update settings");
                return;
            }
            const token = getAdminToken();
            if (!token) {
                toast.error('Admin authentication required');
                return;
            }

            // Validate URLs before saving
            const socialPlatforms = ['facebook', 'twitter', 'instagram', 'linkedin'];
            const validUrls = [];
            
            for (const platform of socialPlatforms) {
                const data = socialMediaData[platform];
                if (data.url.trim()) {
                    let validUrl = data.url.trim();
                    
                    // Add https:// if no protocol is present
                    if (!validUrl.startsWith('http://') && !validUrl.startsWith('https://')) {
                        validUrl = `https://${validUrl}`;
                    }
                    
                    // Basic URL validation
                    try {
                        new URL(validUrl);
                        validUrls.push({ platform, url: validUrl, isActive: data.isActive, openInNewTab: data.openInNewTab });
                    } catch (error) {
                        toast.error(`Invalid URL for ${platform}: ${data.url}`);
                        return;
                    }
                }
            }

            // Delete existing social media menus first
            const existingSocialMenus = footerMenus.socialMedia || [];
            for (const menu of existingSocialMenus) {
                await menuAPI.deleteFooterMenu(menu._id, token);
            }

            // Create new social media menus with validated URLs
            for (const { platform, url, isActive, openInNewTab } of validUrls) {
                await menuAPI.createFooterMenu({
                    section: 'socialMedia',
                    name: platform.charAt(0).toUpperCase() + platform.slice(1),
                    href: url,
                    isActive: isActive,
                    order: socialPlatforms.indexOf(platform),
                    isVisible: true,
                    target: openInNewTab ? '_blank' : '_self',
                    socialPlatform: platform
                }, token);
            }

            toast.success('Social media links updated successfully');
            fetchMenus(); // Refresh data
        } catch (error) {
            console.error('Error saving social media:', error);
            toast.error('Failed to save social media links');
        }
    };

    // Reset form
    const resetForm = () => {
        setFormData({
            name: '',
            href: '',
            isActive: false,
            order: 0,
            isVisible: true,
            target: '_self',
            icon: '',
            description: '',
            section: 'quickLinks',
            contactType: '',
            socialPlatform: ''
        });
    };

    // Handle new menu
    const handleNewMenu = () => {
        setEditingMenu(null);
        resetForm();
        setShowForm(true);
    };

    // Handle new menu for specific section
    const handleNewMenuForSection = (sectionKey) => {
        setEditingMenu(null);
        
        // Get the highest order in this section and increment by 1
        const sectionMenus = footerMenus[sectionKey] || [];
        const maxOrder = sectionMenus.length > 0 ? Math.max(...sectionMenus.map(menu => menu.order || 0)) : 0;
        const nextOrder = maxOrder + 1;
        
        setFormData({
            name: '',
            href: '',
            isActive: false,
            order: nextOrder,
            isVisible: true,
            target: '_self',
            icon: '',
            description: '',
            section: sectionKey,
            contactType: '',
            socialPlatform: ''
        });
        setShowForm(true);
    };

    // Handle cancel
    const handleCancel = () => {
        setShowForm(false);
        setEditingMenu(null);
        resetForm();
    };

    // Get current menus based on active tab
    const getCurrentMenus = () => {
        if (activeTab === 'header') {
            return headerMenus;
        } else {
            return footerMenus[formData.section] || [];
        }
    };

    // Handle category update
    const handleCategoryUpdate = async (id, field, value) => {
        try {
            if (!hasUpdatePermission) {
                toast.error("You don't have permission to update settings");
                return;
            }
            
            // Optimistic update
            setCategories(prev => prev.map(cat => 
                cat._id === id ? { ...cat, [field]: value } : cat
            ));
            
            const response = await categoryAPI.updateCategory(id, { [field]: value });
            if (response.success) {
                toast.success('Category updated successfully');
            } else {
                toast.error('Failed to update category');
                fetchMenus(); // Revert on failure
            }
        } catch (error) {
            console.error('Error updating category:', error);
            toast.error('Failed to update category');
            fetchMenus(); // Revert on failure
        }
    };

    // Get all footer sections for display (excluding social media and contact)
    const getFooterSections = () => {
        const sections = ['quickLinks', 'utilities', 'about'];
        return sections.map(section => ({
            key: section,
            name: section === 'quickLinks' ? 'Quick Links' : 
                  section === 'utilities' ? 'Utilities' :
                  section === 'about' ? 'About' : section,
            menus: footerMenus[section] || []
        }));
    };

    if (checkingPermission || contextLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
            </div>
        );
    }

    if (!hasReadPermission || permissionError) {
        return (
            <PermissionDenied
                title="Access Denied"
                message={permissionError || "You don't have permission to access menu settings"}
                action="Contact your administrator for access"
                showBackButton={true}
            />
        );
    }

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Menu Management</h1>
                <p className="text-gray-600">Manage header and footer navigation menus</p>
            </div>

            {/* Tabs */}
            <div className="mb-6">
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8">
                        <button
                            onClick={() => setActiveTab('categories')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                activeTab === 'categories'
                                    ? 'border-pink-500 text-pink-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            Header Categories
                        </button>
                        <button
                            onClick={() => setActiveTab('header')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                activeTab === 'header'
                                    ? 'border-pink-500 text-pink-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            Header Utilities Menus
                        </button>
                        <button
                            onClick={() => setActiveTab('footer')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                activeTab === 'footer'
                                    ? 'border-pink-500 text-pink-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            Footer Menu
                        </button>
                    </nav>
                </div>
            </div>


            {/* Add New Button */}
            <div className="mb-6">
                {activeTab === 'categories' ? (
                    <div className="text-sm text-gray-600">
                        Toggle the categories you want to display on the frontend header, and set their ordering.
                    </div>
                ) : activeTab === 'header' ? (
                    hasUpdatePermission && (
                        <button
                            onClick={handleNewMenu}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Add New Header Menu Item
                        </button>
                    )
                ) : (
                    <div className="flex flex-wrap gap-2">
                        <span className="text-sm text-gray-600 self-center mr-2">Add new menu item to:</span>
                        {hasUpdatePermission && getFooterSections().map((section) => (
                            <button
                                key={section.key}
                                onClick={() => handleNewMenuForSection(section.key)}
                                className="inline-flex items-center px-3 py-1.5 border border-pink-300 text-sm font-medium rounded-md text-pink-700 bg-pink-50 hover:bg-pink-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
                            >
                                <Plus className="w-3 h-3 mr-1" />
                                {section.name}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Menu List */}
            {loading ? (
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading menus...</p>
                </div>
            ) : activeTab === 'categories' ? (
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <ul className="divide-y divide-gray-200">
                        {categories.map((category) => (
                            <li key={category._id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0 h-10 w-10 mr-4">
                                        {category.image ? (
                                            <img className="h-10 w-10 rounded-lg object-cover" src={category.image} alt={category.name} />
                                        ) : (
                                            <div className="h-10 w-10 rounded-lg bg-gray-200 flex items-center justify-center">
                                                <FolderOpen className="h-5 w-5 text-gray-400" />
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{category.name}</p>
                                        <p className="text-xs text-gray-500">Slug: {category.slug}</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-6">
                                    <div className="flex flex-col items-center">
                                        <label className="text-xs text-gray-500 mb-1">Header Sort Order</label>
                                        <input 
                                            type="number" 
                                            value={category.headerSortOrder || 0}
                                            onChange={(e) => handleCategoryUpdate(category._id, 'headerSortOrder', parseInt(e.target.value) || 0)}
                                            className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-pink-500 focus:border-pink-500 text-center"
                                        />
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <label className="text-xs text-gray-500 mb-1">Show on Header</label>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                className="sr-only peer"
                                                checked={category.showOnHeader || false}
                                                onChange={(e) => handleCategoryUpdate(category._id, 'showOnHeader', e.target.checked)}
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
                                        </label>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            ) : activeTab === 'header' ? (
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <ul className="divide-y divide-gray-200">
                        {getCurrentMenus().map((menu, index) => (
                            <li key={menu._id} className="px-6 py-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <GripVertical className="w-5 h-5 text-gray-400 mr-3" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{menu.name}</p>
                                            <p className="text-sm text-gray-500">{menu.href}</p>
                                            <div className="flex items-center space-x-2 mt-1">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    menu.isVisible ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                }`}>
                                                    {menu.isVisible ? 'Visible' : 'Hidden'}
                                                </span>
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    menu.isActive ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {menu.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                                <span className="text-xs text-gray-500">Order: {menu.order}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        {hasUpdatePermission && (
                                        <button
                                            onClick={() => handleEdit(menu)}
                                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 border border-gray-300 hover:border-blue-300 rounded-full transition-all duration-200 cursor-pointer"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        )}
                                        {hasUpdatePermission && (
                                        <button
                                            onClick={() => handleDeleteClick(menu)}
                                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 border border-gray-300 hover:border-red-300 rounded-full transition-all duration-200 cursor-pointer"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                        )}
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            ) : (
                <div className="space-y-6">
                    {getFooterSections().map((section) => (
                        <div key={section.key} className="bg-white shadow overflow-hidden sm:rounded-md">
                            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                                <h3 className="text-lg font-medium text-gray-900">{section.name}</h3>
                                <p className="text-sm text-gray-500">
                                    {section.menus.length} menu item{section.menus.length !== 1 ? 's' : ''}
                                </p>
                            </div>
                            {section.menus.length > 0 ? (
                                <ul className="divide-y divide-gray-200">
                                    {section.menus.map((menu, index) => (
                                        <li key={menu._id} className="px-6 py-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center">
                                                    <GripVertical className="w-5 h-5 text-gray-400 mr-3" />
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">{menu.name}</p>
                                                        <p className="text-sm text-gray-500">{menu.href}</p>
                                                        <div className="flex items-center space-x-2 mt-1">
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                                menu.isVisible ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                            }`}>
                                                                {menu.isVisible ? 'Visible' : 'Hidden'}
                                                            </span>
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                                menu.isActive ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                                                            }`}>
                                                                {menu.isActive ? 'Active' : 'Inactive'}
                                                            </span>
                                                            <span className="text-xs text-gray-500">Order: {menu.order}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    {hasUpdatePermission && (
                                                    <button
                                                        onClick={() => {
                                                            setFormData(prev => ({ ...prev, section: section.key }));
                                                            handleEdit(menu);
                                                        }}
                                                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 border border-gray-300 hover:border-blue-300 rounded-full transition-all duration-200 cursor-pointer"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    )}
                                                    {hasUpdatePermission && (
                                                    <button
                                                        onClick={() => handleDeleteClick(menu)}
                                                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 border border-gray-300 hover:border-red-300 rounded-full transition-all duration-200 cursor-pointer"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                    )}
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="px-6 py-8 text-center text-gray-500">
                                    <p>No menu items in this section</p>
                                    {hasUpdatePermission && (
                                    <button
                                        onClick={() => handleNewMenuForSection(section.key)}
                                        className="mt-2 text-pink-600 hover:text-pink-700 text-sm font-medium"
                                    >
                                        Add first menu item
                                    </button>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Form Modal */}
            {showForm && hasUpdatePermission && (
                <div className="fixed inset-0 bg-gray-600/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
                    <div className="relative top-10 mx-auto p-6 border w-full max-w-md shadow-xl rounded-lg bg-white">
                        <div className="mt-3">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-900">
                                        {editingMenu ? 'Edit Menu Item' : 'Add New Menu Item'}
                                    </h3>
                                    {activeTab === 'footer' && (
                                        <p className="text-sm text-gray-600 mt-1">
                                            Adding to: <span className="font-medium text-pink-600">
                                                {formData.section === 'quickLinks' ? 'Quick Links' : 
                                                 formData.section === 'utilities' ? 'Utilities' :
                                                 formData.section === 'about' ? 'About' :
                                                 formData.section === 'contact' ? 'Contact' :
                                                 formData.section === 'socialMedia' ? 'Social Media' : formData.section}
                                            </span>
                                        </p>
                                    )}
                                </div>
                                <button
                                    onClick={handleCancel}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">URL</label>
                                    <input
                                        type="text"
                                        value={formData.href}
                                        onChange={(e) => setFormData(prev => ({ ...prev, href: e.target.value }))}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Order</label>
                                    <input
                                        type="number"
                                        value={formData.order}
                                        onChange={(e) => setFormData(prev => ({ ...prev, order: parseInt(e.target.value) }))}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
                                        placeholder="Menu display order"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">Lower numbers appear first</p>
                                </div>

                                {activeTab === 'footer' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Section</label>
                                        <select
                                            value={formData.section}
                                            onChange={(e) => setFormData(prev => ({ ...prev, section: e.target.value }))}
                                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm bg-gray-100"
                                            required
                                            disabled
                                        >
                                            <option value="quickLinks">Quick Links</option>
                                            <option value="utilities">Utilities</option>
                                            <option value="about">About</option>
                                            <option value="contact">Contact</option>
                                            <option value="socialMedia">Social Media</option>
                                        </select>
                                        <p className="mt-1 text-xs text-gray-500">Section is automatically set based on your selection</p>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Target</label>
                                    <select
                                        value={formData.target}
                                        onChange={(e) => setFormData(prev => ({ ...prev, target: e.target.value }))}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
                                    >
                                        <option value="_self">Same Window</option>
                                        <option value="_blank">New Window</option>
                                    </select>
                                </div>

                                <div className="flex items-center space-x-4">
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={formData.isVisible}
                                            onChange={(e) => setFormData(prev => ({ ...prev, isVisible: e.target.checked }))}
                                            className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                                        />
                                        <span className="ml-2 text-sm text-gray-700">Visible</span>
                                    </label>

                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={formData.isActive}
                                            onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                                            className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                                        />
                                        <span className="ml-2 text-sm text-gray-700">Active</span>
                                    </label>
                                </div>

                                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                                    <button
                                        type="button"
                                        onClick={handleCancel}
                                        className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-colors inline-flex items-center"
                                    >
                                        <Save className="w-4 h-4 mr-2" />
                                        {editingMenu ? 'Update Menu' : 'Create Menu'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Contact Information Management Section - Only for Footer Tab */}
            {activeTab === 'footer' && (
                <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-md">
                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">Contact Information</h3>
                        <p className="text-sm text-gray-500">Manage contact details for footer</p>
                    </div>
                    
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Address
                                    </label>
                                    <textarea
                                        value={contactData.address}
                                        onChange={(e) => setContactData(prev => ({
                                            ...prev,
                                            address: e.target.value
                                        }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
                                        placeholder="230 Park Avenue, Suite 210, New York, NY 10169, USA"
                                        rows={3}
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Phone
                                    </label>
                                    <input
                                        type="tel"
                                        value={contactData.phone}
                                        onChange={(e) => setContactData(prev => ({
                                            ...prev,
                                            phone: e.target.value
                                        }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
                                        placeholder="+8801XXXXXXXXX"
                                    />
                                </div>
                            </div>
                            
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        value={contactData.email}
                                        onChange={(e) => setContactData(prev => ({
                                            ...prev,
                                            email: e.target.value
                                        }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
                                        placeholder="forpink@gmail.com"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Call to Action
                                    </label>
                                    <input
                                        type="text"
                                        value={contactData.callToAction}
                                        onChange={(e) => setContactData(prev => ({
                                            ...prev,
                                            callToAction: e.target.value
                                        }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
                                        placeholder="Feel free to call & mail us anytime!"
                                    />
                                </div>
                            </div>
                        </div>
                        
                        {hasUpdatePermission && (
                            <div className="mt-6 flex justify-end">
                                <button
                                    onClick={handleContactSave}
                                    className="px-6 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-colors cursor-pointer"
                                >
                                    Save Contact Information
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Social Media Management Section - Only for Footer Tab */}
            {activeTab === 'footer' && (
                <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-md">
                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">Social Media Links</h3>
                        <p className="text-sm text-gray-500">Manage social media links for footer</p>
                    </div>
                    
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {Object.entries(socialMediaData).map(([platform, data]) => (
                                <div key={platform} className="space-y-3">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                            {platform === 'facebook' && <Facebook className="w-4 h-4 text-blue-600" />}
                                            {platform === 'twitter' && <Twitter className="w-4 h-4 text-blue-400" />}
                                            {platform === 'instagram' && <Instagram className="w-4 h-4 text-pink-600" />}
                                            {platform === 'linkedin' && <Linkedin className="w-4 h-4 text-blue-700" />}
                                        </div>
                                        <h4 className="text-sm font-medium text-gray-900 capitalize">{platform}</h4>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            URL
                                        </label>
                                    <input
                                        type="text"
                                        value={data.url}
                                        onChange={(e) => {
                                            setSocialMediaData(prev => ({
                                                ...prev,
                                                [platform]: { ...prev[platform], url: e.target.value }
                                            }));
                                        }}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
                                        placeholder={`${platform}.com/your-page`}
                                    />
                                    </div>
                                    
                                <div className="space-y-2">
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={data.isActive}
                                            onChange={(e) => setSocialMediaData(prev => ({
                                                ...prev,
                                                [platform]: { ...prev[platform], isActive: e.target.checked }
                                            }))}
                                            className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                                        />
                                        <label className="ml-2 text-sm text-gray-700">
                                            Show in footer
                                        </label>
                                    </div>
                                    
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={data.openInNewTab}
                                            onChange={(e) => setSocialMediaData(prev => ({
                                                ...prev,
                                                [platform]: { ...prev[platform], openInNewTab: e.target.checked }
                                            }))}
                                            className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                                        />
                                        <label className="ml-2 text-sm text-gray-700">
                                            Open in new tab
                                        </label>
                                    </div>
                                </div>
                                </div>
                            ))}
                        </div>
                        
                        {hasUpdatePermission && (
                            <div className="mt-6 flex justify-end">
                                <button
                                    onClick={handleSocialMediaSave}
                                    className="px-6 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-colors cursor-pointer"
                                >
                                    Save Social Media Links
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <DeleteConfirmationModal
                isOpen={showDeleteModal}
                onClose={handleDeleteCancel}
                onConfirm={handleDeleteConfirm}
                title={`Delete ${activeTab === 'header' ? 'Header' : 'Footer'} Menu`}
                message={`Are you sure you want to delete this ${activeTab === 'header' ? 'header' : 'footer'} menu item?`}
                itemName={menuToDelete?.name}
                itemType="menu item"
                isLoading={deleting}
                confirmText="Delete Menu"
                cancelText="Cancel"
                dangerLevel="high"
            />
        </div>
    );
}
