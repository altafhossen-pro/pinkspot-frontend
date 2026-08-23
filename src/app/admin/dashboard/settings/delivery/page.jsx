'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCookie } from 'cookies-next';
import { settingsAPI, categoryAPI, deliveryRuleAPI } from '@/services/api';
import { 
  ArrowLeft,
  Truck, 
  MapPin, 
  DollarSign, 
  Save,
  AlertCircle,
  Tag
} from 'lucide-react';
import toast from 'react-hot-toast';

import { useAppContext } from '@/context/AppContext';
import PermissionDenied from '@/components/Common/PermissionDenied';

export default function DeliverySettingsPage() {
  const router = useRouter();
  const { hasPermission, contextLoading } = useAppContext();
  
  const [settings, setSettings] = useState({
    insideDhaka: 80,
    subDhaka: 120,
    outsideDhaka: 150,
    shippingFreeRequiredAmount: 1500
  });
  
  const [excludedCategories, setExcludedCategories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [errors, setErrors] = useState({});
  const [checkingPermission, setCheckingPermission] = useState(true);
  const [hasReadPermission, setHasReadPermission] = useState(false);
  const [hasUpdatePermission, setHasUpdatePermission] = useState(false);

  useEffect(() => {
    if (contextLoading) return;
    const canRead = hasPermission('settings', 'read');
    const canUpdate = hasPermission('settings', 'update');
    setHasReadPermission(canRead);
    setHasUpdatePermission(!!canUpdate);
    setCheckingPermission(false);
    if (canRead) {
      fetchSettings();
    } else {
      setLoading(false);
    }
  }, [contextLoading, hasPermission]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const [settingsRes, categoriesRes, rulesRes] = await Promise.all([
        settingsAPI.getSettings(),
        categoryAPI.getCategories({ limit: 1000 }),
        deliveryRuleAPI.getRules()
      ]);

      if (settingsRes.success && settingsRes.data?.deliveryChargeSettings) {
        setSettings(prev => ({
            ...prev,
            ...settingsRes.data.deliveryChargeSettings
        }));
      }

      if (categoriesRes.success && categoriesRes.data) {
        setCategories(categoriesRes.data);
      }

      if (rulesRes.success && rulesRes.data) {
        setExcludedCategories(rulesRes.data.excludedCategoriesForFreeShipping || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setMessage({ type: 'error', text: 'Failed to load delivery settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryToggle = (categorySlug) => {
    setExcludedCategories(prev => {
      if (prev.includes(categorySlug)) {
        return prev.filter(c => c !== categorySlug);
      } else {
        return [...prev, categorySlug];
      }
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // Allow empty string for backspace, otherwise parse as float
    const newValue = value === '' ? '' : parseFloat(value);
    
    setSettings(prev => ({
      ...prev,
      [name]: newValue
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
    // Clear global message
    setMessage({ type: '', text: '' });
  };

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    if (settings.insideDhaka === '' || settings.insideDhaka < 0) {
      newErrors.insideDhaka = 'Valid charge is required';
      isValid = false;
    }
    if (settings.subDhaka === '' || settings.subDhaka < 0) {
      newErrors.subDhaka = 'Valid charge is required';
      isValid = false;
    }
    if (settings.outsideDhaka === '' || settings.outsideDhaka < 0) {
      newErrors.outsideDhaka = 'Valid charge is required';
      isValid = false;
    }
    if (settings.shippingFreeRequiredAmount === '' || settings.shippingFreeRequiredAmount < 0) {
      newErrors.shippingFreeRequiredAmount = 'Valid amount is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      setMessage({ type: 'error', text: 'Please check all fields and try again' });
      return;
    }

    try {
      setSaving(true);
      setMessage({ type: '', text: '' });
      const token = getCookie('token');

      const updateData = {
        deliveryChargeSettings: {
            insideDhaka: Number(settings.insideDhaka),
            subDhaka: Number(settings.subDhaka),
            outsideDhaka: Number(settings.outsideDhaka),
            shippingFreeRequiredAmount: Number(settings.shippingFreeRequiredAmount)
        }
      };

      const [settingsUpdate, rulesUpdate] = await Promise.all([
        settingsAPI.updateSettings(updateData, token),
        deliveryRuleAPI.updateRules({ excludedCategoriesForFreeShipping: excludedCategories }, token)
      ]);

      if (settingsUpdate.success && rulesUpdate.success) {
        toast.success('Delivery settings updated successfully');
        setMessage({ type: 'success', text: 'Settings updated successfully' });
      } else {
        throw new Error(response.message || 'Failed to update settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error(error.message || 'Failed to update settings');
      setMessage({ type: 'error', text: error.message || 'Failed to update settings' });
    } finally {
      setSaving(false);
    }
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
        message="You don't have permission to access delivery settings"
        action="Contact your administrator for access"
        showBackButton={true}
      />
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto pb-24">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button 
            onClick={() => router.push('/admin/dashboard/settings')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Settings
          </button>
          <div className="flex items-center space-x-3">
            <div className="bg-teal-100 p-2 rounded-lg">
              <Truck className="h-6 w-6 text-teal-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Delivery Settings</h1>
              <p className="text-sm text-gray-500">Manage delivery charges and free shipping threshold</p>
            </div>
          </div>
        </div>

        {hasUpdatePermission && (
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="flex items-center justify-center px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50 transition-colors shadow-sm"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </button>
        )}
      </div>

      {/* Global Message */}
      {message.text && (
        <div className={`mb-6 p-4 rounded-lg flex items-start ${
          message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'
        }`}>
          <AlertCircle className={`h-5 w-5 mr-3 shrink-0 ${message.type === 'error' ? 'text-red-400' : 'text-green-400'}`} />
          <p>{message.text}</p>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-4">
              <div className="h-12 bg-gray-100 rounded"></div>
              <div className="h-12 bg-gray-100 rounded"></div>
              <div className="h-12 bg-gray-100 rounded"></div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Main Delivery Charges */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-gray-500" />
                Delivery Charges by Zone
              </h2>
              <p className="text-sm text-gray-500 mt-1">Configure standard delivery fees for different areas.</p>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* Inside Dhaka */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Inside Dhaka (৳)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <DollarSign className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      name="insideDhaka"
                      value={settings.insideDhaka}
                      onChange={handleInputChange}
                      min="0"
                      disabled={!hasUpdatePermission}
                      className={`block w-full pl-10 pr-3 py-2 sm:text-sm border rounded-lg focus:ring-1 focus:ring-pink-500 focus:border-pink-500 transition-colors ${
                        errors.insideDhaka ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="e.g. 80"
                    />
                  </div>
                  {errors.insideDhaka && <p className="mt-1 text-sm text-red-600">{errors.insideDhaka}</p>}
                </div>

                {/* Sub Dhaka */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sub Dhaka (৳)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <DollarSign className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      name="subDhaka"
                      value={settings.subDhaka}
                      onChange={handleInputChange}
                      min="0"
                      disabled={!hasUpdatePermission}
                      className={`block w-full pl-10 pr-3 py-2 sm:text-sm border rounded-lg focus:ring-1 focus:ring-pink-500 focus:border-pink-500 transition-colors ${
                        errors.subDhaka ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="e.g. 120"
                    />
                  </div>
                  {errors.subDhaka && <p className="mt-1 text-sm text-red-600">{errors.subDhaka}</p>}
                </div>

                {/* Outside Dhaka */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Outside Dhaka (৳)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <DollarSign className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      name="outsideDhaka"
                      value={settings.outsideDhaka}
                      onChange={handleInputChange}
                      min="0"
                      disabled={!hasUpdatePermission}
                      className={`block w-full pl-10 pr-3 py-2 sm:text-sm border rounded-lg focus:ring-1 focus:ring-pink-500 focus:border-pink-500 transition-colors ${
                        errors.outsideDhaka ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="e.g. 150"
                    />
                  </div>
                  {errors.outsideDhaka && <p className="mt-1 text-sm text-red-600">{errors.outsideDhaka}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Free Shipping Settings */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <DollarSign className="h-5 w-5 mr-2 text-green-500" />
                  Free Shipping Configuration
                </h2>
                <p className="text-sm text-gray-500 mt-1">Set the minimum cart amount required for free shipping.</p>
              </div>
              <div className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide">
                Active Feature
              </div>
            </div>
            
            <div className="p-6">
              <div className="max-w-md">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Required Order Amount (৳)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    name="shippingFreeRequiredAmount"
                    value={settings.shippingFreeRequiredAmount}
                    onChange={handleInputChange}
                    min="0"
                    disabled={!hasUpdatePermission}
                    className={`block w-full pl-10 pr-3 py-2 sm:text-sm border rounded-lg focus:ring-1 focus:ring-green-500 focus:border-green-500 transition-colors ${
                      errors.shippingFreeRequiredAmount ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="e.g. 1500"
                  />
                </div>
                {errors.shippingFreeRequiredAmount && <p className="mt-1 text-sm text-red-600">{errors.shippingFreeRequiredAmount}</p>}
                <p className="mt-2 text-sm text-gray-500">
                  Customers whose total order amount equals or exceeds this value will automatically receive free shipping, provided no category discount is applied.
                </p>
              </div>

              {/* Category Exclusion Section */}
              <div className="mt-8 border-t border-gray-200 pt-6">
                <h3 className="text-md font-medium text-gray-900 mb-2 flex items-center">
                  <Tag className="h-4 w-4 mr-2 text-pink-500" />
                  Excluded Categories
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  If a user's cart ONLY contains products from the selected categories below, they will NOT receive free shipping. However, if they add at least one product from an unselected category, they will become eligible for free shipping.
                </p>

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  {categories.length === 0 ? (
                    <p className="text-sm text-gray-500">No categories found.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {categories.map((category) => {
                        // Assuming category has slug or name we can use. We will use lowercased name to match frontend cart logic.
                        const catSlug = category.name.toLowerCase();
                        const isChecked = excludedCategories.includes(catSlug);
                        
                        return (
                          <label key={category._id} className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                            isChecked ? 'bg-pink-50 border-pink-200' : 'bg-white border-gray-200 hover:border-pink-300'
                          }`}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleCategoryToggle(catSlug)}
                              disabled={!hasUpdatePermission}
                              className="h-4 w-4 text-pink-600 rounded border-gray-300 focus:ring-pink-500 cursor-pointer disabled:opacity-50"
                            />
                            <span className={`ml-3 text-sm font-medium ${isChecked ? 'text-pink-900' : 'text-gray-700'}`}>
                              {category.name}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
