'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCookie } from 'cookies-next';
import { settingsAPI } from '@/services/api';
import { 
  ArrowLeft,
  Coins, 
  Percent, 
  DollarSign, 
  Save,
  AlertCircle,
  Settings as SettingsIcon
} from 'lucide-react';

import { useAppContext } from '@/context/AppContext';
import PermissionDenied from '@/components/Common/PermissionDenied';

export default function LoyaltySettingsPage() {
  const router = useRouter();
  const { hasPermission, contextLoading } = useAppContext();
  const [settings, setSettings] = useState({
    coinPerItem: 1,
    coinValue: 1,
    isLoyaltyEnabled: true,
    earnOnDelivery: true,
    earnOnPaymentSuccess: true,
    minRedeemAmount: 10,
    isActive: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [errors, setErrors] = useState({});
  const [checkingPermission, setCheckingPermission] = useState(true);
  const [hasReadPermission, setHasReadPermission] = useState(false);
  const [permissionError, setPermissionError] = useState(null);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contextLoading]);

  const fetchSettings = async () => {
    try {
      const response = await settingsAPI.getLoyaltySettings();
      if (response.success) {
        setSettings(response.data);
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to load loyalty settings' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load loyalty settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!hasUpdatePermission) {
      setMessage({ type: 'error', text: "You don't have permission to update settings" });
      return;
    }
    setSaving(true);
    setMessage({ type: '', text: '' });
    setErrors({});

    try {
      // Process settings to handle empty values
      const processedSettings = {
        ...settings,
        coinPerItem: settings.coinPerItem === '' ? 0 : parseInt(settings.coinPerItem) || 0,
        coinValue: settings.coinValue === '' ? 0 : parseFloat(settings.coinValue) || 0,
        minRedeemAmount: settings.minRedeemAmount === '' ? 0 : parseInt(settings.minRedeemAmount) || 0,
      };

      // Validate settings
      const validationErrors = validateSettings(processedSettings);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        setMessage({ type: 'error', text: 'Please fix the validation errors below' });
        setSaving(false);
        return;
      }

      const token = getCookie('token');
      const response = await settingsAPI.updateLoyaltySettings(processedSettings, token);
      
      if (response.success) {
        setMessage({ type: 'success', text: 'Settings saved successfully!' });
        setSettings(response.data);
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to save settings' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  // Reset functionality removed per requirements

  const validateSettings = (settings) => {
    const newErrors = {};

    // Validate coinPerItem
    if (!settings.coinPerItem || settings.coinPerItem === '' || settings.coinPerItem < 0) {
      newErrors.coinPerItem = 'Coins per item is required and must be 0 or greater';
    }

    // Validate coinValue
    if (!settings.coinValue || settings.coinValue === '' || settings.coinValue < 0.1) {
      newErrors.coinValue = 'Coin value is required and must be at least 0.1';
    }

    // Validate minRedeemAmount
    if (!settings.minRedeemAmount || settings.minRedeemAmount === '' || settings.minRedeemAmount < 1) {
      newErrors.minRedeemAmount = 'Minimum redeem amount is required and must be at least 1';
    }

    // Validate maxRedeemPercentage

    return newErrors;
  };

  const handleInputChange = (field, value) => {
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
    
    // Only allow numbers and decimal point
    const numericValue = value.replace(/[^0-9.]/g, '');
    
    // Prevent multiple decimal points
    const parts = numericValue.split('.');
    const finalValue = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : numericValue;
    
    setSettings(prev => ({
      ...prev,
      [field]: finalValue
    }));
  };

  // Toggle handlers removed; earning rules are informational only.

  const handleWheel = (e) => {
    // Prevent wheel scroll from changing input values
    e.target.blur();
  };

  if (checkingPermission || contextLoading || loading) {
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
        message={permissionError || "You don't have permission to access settings"}
        action="Contact your administrator for access"
        showBackButton={true}
      />
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back</span>
            </button>
            <div className="flex items-center space-x-3">
              <Coins className="h-8 w-8 text-pink-500" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Loyalty Settings</h1>
                <p className="text-gray-600">Configure coins, points and rewards system</p>
              </div>
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleSave}
              disabled={saving || !hasUpdatePermission}
              className="flex items-center space-x-2 px-6 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </div>

        {/* Message */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg flex items-center space-x-2 ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            <AlertCircle className="h-5 w-5" />
            <span>{message.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Loyalty System Settings */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center space-x-2">
              <Coins className="h-5 w-5 text-pink-500" />
              <span>Loyalty System</span>
            </h2>

            <div className="space-y-6">
              {/* Coins per Item */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Coins per Item <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="0"
                    value={settings.coinPerItem}
                    onChange={(e) => handleInputChange('coinPerItem', e.target.value)}
                    onWheel={handleWheel}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent ${
                      errors.coinPerItem ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                  <span className="absolute right-3 top-2 text-sm text-gray-500">coins</span>
                </div>
                {errors.coinPerItem ? (
                  <p className="text-xs text-red-500 mt-1">{errors.coinPerItem}</p>
                ) : (
                  <p className="text-xs text-gray-500 mt-1">How many coins user earns per item</p>
                )}
              </div>

              {/* Coin Value */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Coin Value (৳) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="1.0"
                    value={settings.coinValue}
                    onChange={(e) => handleInputChange('coinValue', e.target.value)}
                    onWheel={handleWheel}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent ${
                      errors.coinValue ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                  <span className="absolute right-3 top-2 text-sm text-gray-500">৳</span>
                </div>
                {errors.coinValue ? (
                  <p className="text-xs text-red-500 mt-1">{errors.coinValue}</p>
                ) : (
                  <p className="text-xs text-gray-500 mt-1">1 coin = ৳{settings.coinValue}</p>
                )}
              </div>
            </div>
          </div>

          {/* Earning Rules */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-pink-500" />
              <span>Earning Rules</span>
            </h2>

            <div className="space-y-6">
              {/* Earn on Delivery */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Earn on Delivery (COD)</label>
                  <p className="text-xs text-gray-500">Earn coins when COD order is delivered</p>
                </div>
              </div>

              {/* Earn on Payment Success */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Earn on Payment Success</label>
                  <p className="text-xs text-gray-500">Earn coins when online payment is successful</p>
                </div>
              </div>
            </div>
          </div>

          {/* Redemption Rules */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center space-x-2">
              <Percent className="h-5 w-5 text-pink-500" />
              <span>Redemption Rules</span>
            </h2>

            <div className="space-y-6">
              {/* Minimum Redeem Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Redeem Amount (৳) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="10"
                    value={settings.minRedeemAmount}
                    onChange={(e) => handleInputChange('minRedeemAmount', e.target.value)}
                    onWheel={handleWheel}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent ${
                      errors.minRedeemAmount ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                  <span className="absolute right-3 top-2 text-sm text-gray-500">৳</span>
                </div>
                {errors.minRedeemAmount ? (
                  <p className="text-xs text-red-500 mt-1">{errors.minRedeemAmount}</p>
                ) : (
                  <p className="text-xs text-gray-500 mt-1">Minimum amount to redeem coins</p>
                )}
              </div>

            </div>
          </div>

          {/* Summary */}
          <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Current Settings Summary</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Loyalty System:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  settings.isLoyaltyEnabled 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {settings.isLoyaltyEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Coins per Item:</span>
                <span className="font-medium">{settings.coinPerItem} coins</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Coin Value:</span>
                <span className="font-medium">৳{settings.coinValue}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Min Redeem:</span>
                <span className="font-medium">৳{settings.minRedeemAmount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
