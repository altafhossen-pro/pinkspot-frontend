'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCookie } from 'cookies-next';
import { settingsAPI } from '@/services/api';
import { 
  ArrowLeft,
  Users,
  Save,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAppContext } from '@/context/AppContext';
import PermissionDenied from '@/components/Common/PermissionDenied';

export default function AffiliateSettingsPage() {
  const router = useRouter();
  const { hasPermission, contextLoading } = useAppContext();
  const [settings, setSettings] = useState({
    isAffiliateEnabled: true,
    purchaserDiscountType: 'percentage',
    purchaserDiscountValue: '',
    referrerLoyaltyPointsPerPurchase: '',
    purchaserLoyaltyPointsPerPurchase: '',
    isConfirmationModalShowWhenUseAffiliateLink: true
  });
  const [signupBonusCoins, setSignupBonusCoins] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
  }, [contextLoading, hasPermission]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await settingsAPI.getAffiliateSettings();
      if (response.success) {
        const data = response.data || {
          isAffiliateEnabled: true,
          purchaserDiscountType: 'percentage',
          purchaserDiscountValue: 5,
          referrerLoyaltyPointsPerPurchase: 10,
          purchaserLoyaltyPointsPerPurchase: 5
        };
        setSettings({
          ...data,
          purchaserDiscountValue: data.purchaserDiscountValue?.toString() || '',
          referrerLoyaltyPointsPerPurchase: data.referrerLoyaltyPointsPerPurchase?.toString() || '',
          purchaserLoyaltyPointsPerPurchase: data.purchaserLoyaltyPointsPerPurchase?.toString() || ''
        });
      } else {
        toast.error(response.message || 'Failed to load affiliate settings');
      }
      
      // Fetch signup bonus coins from loyalty settings
      try {
        const loyaltyResponse = await settingsAPI.getLoyaltySettings();
        if (loyaltyResponse.success && loyaltyResponse.data) {
          setSignupBonusCoins(loyaltyResponse.data.signupBonusCoins?.toString() || '');
        }
      } catch (error) {
        console.error('Failed to load signup bonus coins:', error);
      }
    } catch (error) {
      toast.error('Failed to load affiliate settings');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    if (!hasUpdatePermission) {
      toast.error("You don't have permission to update settings");
      return;
    }
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!hasUpdatePermission) {
      toast.error("You don't have permission to update settings");
      return;
    }
    setSaving(true);

    try {
      const token = getCookie('token');
      
      // Convert string values to numbers for saving
      const processedSettings = {
        ...settings,
        purchaserDiscountValue: settings.purchaserDiscountValue === '' ? 0 : parseFloat(settings.purchaserDiscountValue) || 0,
        referrerLoyaltyPointsPerPurchase: settings.referrerLoyaltyPointsPerPurchase === '' ? 0 : parseInt(settings.referrerLoyaltyPointsPerPurchase) || 0,
        purchaserLoyaltyPointsPerPurchase: settings.purchaserLoyaltyPointsPerPurchase === '' ? 0 : parseInt(settings.purchaserLoyaltyPointsPerPurchase) || 0
      };
      
      // Update affiliate settings
      const response = await settingsAPI.updateAffiliateSettings(processedSettings, token);
      
      if (response.success) {
        const data = response.data;
        setSettings({
          ...data,
          purchaserDiscountValue: data.purchaserDiscountValue?.toString() || '',
          referrerLoyaltyPointsPerPurchase: data.referrerLoyaltyPointsPerPurchase?.toString() || '',
          purchaserLoyaltyPointsPerPurchase: data.purchaserLoyaltyPointsPerPurchase?.toString() || ''
        });
        
        // Update signup bonus coins in loyalty settings
        try {
          const loyaltyResponse = await settingsAPI.getLoyaltySettings();
          if (loyaltyResponse.success) {
            const loyaltyData = {
              ...loyaltyResponse.data,
              signupBonusCoins: signupBonusCoins === '' ? 0 : parseInt(signupBonusCoins) || 0
            };
            await settingsAPI.updateLoyaltySettings(loyaltyData, token);
          }
        } catch (error) {
          console.error('Failed to update signup bonus coins:', error);
          // Don't fail the whole save if this fails
        }
        
        toast.success('Settings updated successfully');
      } else {
        toast.error(response.message || 'Failed to update settings');
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (checkingPermission || contextLoading || loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (!hasReadPermission || permissionError) {
    return (
      <PermissionDenied
        title="Access Denied"
        message={permissionError || "You don't have permission to access affiliate settings"}
        action="Contact your administrator for access"
        showBackButton={true}
      />
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 cursor-pointer"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Settings</span>
          </button>
          
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Affiliate Settings</h1>
          </div>
          <p className="text-gray-600">Configure affiliate program rewards and discounts</p>
        </div>

        {/* Settings Form */}
        <div className="space-y-6">
          {/* Enable/Disable Affiliate */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Enable Affiliate System
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Turn the affiliate program on or off for all users.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.isAffiliateEnabled}
                  onChange={(e) => handleChange('isAffiliateEnabled', e.target.checked)}
                  className="sr-only peer"
                  disabled={!hasUpdatePermission}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>
          </div>

          {/* Show Confirmation Modal */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Show Confirmation Modal
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Show a confirmation modal when users click on an affiliate link.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.isConfirmationModalShowWhenUseAffiliateLink}
                  onChange={(e) => handleChange('isConfirmationModalShowWhenUseAffiliateLink', e.target.checked)}
                  className="sr-only peer"
                  disabled={!hasUpdatePermission}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>
          </div>

          {/* Purchaser Discount */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Purchaser Discount (Who Uses Affiliate Link)
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount Type
                </label>
                <select
                  value={settings.purchaserDiscountType}
                  onChange={(e) => handleChange('purchaserDiscountType', e.target.value)}
                  disabled={!hasUpdatePermission}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-100 disabled:cursor-not-allowed cursor-pointer"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (৳)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount Value
                </label>
                <input
                  type="text"
                  value={settings.purchaserDiscountValue}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Allow empty string or numbers with decimals
                    if (value === '' || /^\d*\.?\d*$/.test(value)) {
                      handleChange('purchaserDiscountValue', value);
                    }
                  }}
                  onKeyDown={(e) => {
                    // Allow: backspace, delete, tab, escape, enter, numbers, decimal point, and arrow keys
                    if (!/[0-9.]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  onWheel={(e) => {
                    // Prevent wheel scroll from changing input values
                    e.target.blur();
                  }}
                  disabled={!hasUpdatePermission}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder={settings.purchaserDiscountType === 'percentage' ? 'Enter percentage' : 'Enter amount'}
                />
                <p className="mt-1 text-xs text-gray-500">
                  {settings.purchaserDiscountType === 'percentage' 
                    ? 'Percentage discount on order total' 
                    : 'Fixed amount discount in ৳'}
                </p>
              </div>
            </div>
          </div>

          {/* Referrer Loyalty Points */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Referrer Rewards (Affiliate Owner)
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Loyalty Points Per Purchase
              </label>
              <input
                type="text"
                value={settings.referrerLoyaltyPointsPerPurchase}
                onChange={(e) => {
                  const value = e.target.value;
                  // Allow empty string or only numbers
                  if (value === '' || /^\d+$/.test(value)) {
                    handleChange('referrerLoyaltyPointsPerPurchase', value);
                  }
                }}
                onKeyDown={(e) => {
                  // Allow: backspace, delete, tab, escape, enter, and numbers
                  if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
                    e.preventDefault();
                  }
                }}
                onWheel={(e) => {
                  // Prevent wheel scroll from changing input values
                  e.target.blur();
                }}
                disabled={!hasUpdatePermission}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="Enter loyalty points"
              />
              <p className="mt-1 text-xs text-gray-500">
                Number of loyalty points the affiliate owner earns per successful purchase
              </p>
            </div>
          </div>

          {/* Purchaser Loyalty Points */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Purchaser Rewards (If Logged In User)
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Loyalty Points Per Purchase
              </label>
              <input
                type="text"
                value={settings.purchaserLoyaltyPointsPerPurchase}
                onChange={(e) => {
                  const value = e.target.value;
                  // Allow empty string or only numbers
                  if (value === '' || /^\d+$/.test(value)) {
                    handleChange('purchaserLoyaltyPointsPerPurchase', value);
                  }
                }}
                onKeyDown={(e) => {
                  // Allow: backspace, delete, tab, escape, enter, and numbers
                  if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
                    e.preventDefault();
                  }
                }}
                onWheel={(e) => {
                  // Prevent wheel scroll from changing input values
                  e.target.blur();
                }}
                disabled={!hasUpdatePermission}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="Enter loyalty points"
              />
              <p className="mt-1 text-xs text-gray-500">
                Number of loyalty points the purchaser earns (only if they are a logged-in user)
              </p>
            </div>
          </div>

          {/* Signup Bonus Coins */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Signup Bonus Coins
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Signup Bonus Coins
              </label>
              <input
                type="text"
                value={signupBonusCoins}
                onChange={(e) => {
                  const value = e.target.value;
                  // Allow empty string or only numbers
                  if (value === '' || /^\d+$/.test(value)) {
                    setSignupBonusCoins(value);
                  }
                }}
                onKeyDown={(e) => {
                  // Allow: backspace, delete, tab, escape, enter, and numbers
                  if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
                    e.preventDefault();
                  }
                }}
                onWheel={(e) => {
                  // Prevent wheel scroll from changing input values
                  e.target.blur();
                }}
                disabled={!hasUpdatePermission}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="Enter coins"
              />
              <p className="mt-1 text-xs text-gray-500">
                Coins given to new users when they sign up (0 = disabled)
              </p>
            </div>
          </div>

          {/* Save Button */}
          {hasUpdatePermission && (
            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center space-x-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {saving ? (
                  <>
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

