'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCookie } from 'cookies-next';
import { settingsAPI } from '@/services/api';
import { 
  ArrowLeft,
  Truck,
  Save,
  AlertCircle,
  Settings as SettingsIcon,
  Key,
  Lock
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAppContext } from '@/context/AppContext';
import PermissionDenied from '@/components/Common/PermissionDenied';

export default function SteadfastSettingsPage() {
  const router = useRouter();
  const { hasPermission, contextLoading } = useAppContext();
  const [settings, setSettings] = useState({
    apiKey: '',
    apiSecret: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [checkingPermission, setCheckingPermission] = useState(true);
  const [hasReadPermission, setHasReadPermission] = useState(false);
  const [permissionError, setPermissionError] = useState(null);
  const [hasUpdatePermission, setHasUpdatePermission] = useState(false);
  const [showApiSecret, setShowApiSecret] = useState(false);

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
      const response = await settingsAPI.getSteadfastSettings();
      if (response.success) {
        setSettings({
          apiKey: response.data?.apiKey || '',
          apiSecret: response.data?.apiSecret || ''
        });
      } else {
        toast.error(response.message || 'Failed to load Steadfast settings');
      }
    } catch (error) {
      toast.error('Failed to load Steadfast settings');
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

    if (!settings.apiKey || !settings.apiSecret) {
      toast.error('Please provide both API Key and API Secret');
      return;
    }

    setSaving(true);

    try {
      const token = getCookie('token');
      const response = await settingsAPI.updateSteadfastSettings(settings, token);
      
      if (response.success) {
        toast.success('Steadfast settings updated successfully');
        setSettings(response.data);
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
        </div>
      </div>
    );
  }

  if (!hasReadPermission || permissionError) {
    return (
      <PermissionDenied
        title="Access Denied"
        message={permissionError || "You don't have permission to access Steadfast settings"}
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
            <div className="p-2 bg-orange-100 rounded-lg">
              <Truck className="h-6 w-6 text-orange-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Steadfast Configuration</h1>
          </div>
          <p className="text-gray-600">Configure Steadfast Courier API credentials for order integration</p>
        </div>

        {/* Settings Card */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 space-y-6">
          {/* API Key */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                <span>API Key</span>
                <span className="text-red-500">*</span>
              </div>
            </label>
            <input
              type="text"
              value={settings.apiKey}
              onChange={(e) => handleChange('apiKey', e.target.value)}
              disabled={!hasUpdatePermission || saving}
              placeholder="Enter your Steadfast API Key"
              className={`w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                !hasUpdatePermission ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
            />
            <p className="mt-1 text-xs text-gray-500">
              Your Steadfast API Key provided by Steadfast Courier Ltd.
            </p>
          </div>

          {/* API Secret */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                <span>API Secret</span>
                <span className="text-red-500">*</span>
              </div>
            </label>
            <div className="relative">
              <input
                type={showApiSecret ? 'text' : 'password'}
                value={settings.apiSecret}
                onChange={(e) => handleChange('apiSecret', e.target.value)}
                disabled={!hasUpdatePermission || saving}
                placeholder="Enter your Steadfast API Secret"
                className={`w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 pr-10 ${
                  !hasUpdatePermission ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
              />
              <button
                type="button"
                onClick={() => setShowApiSecret(!showApiSecret)}
                disabled={!hasUpdatePermission || saving}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
              >
                {showApiSecret ? (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Your Steadfast Secret Key provided by Steadfast Courier Ltd.
            </p>
          </div>
        </div>

        {/* Save Button */}
        {hasUpdatePermission && (
          <div className="mt-8 flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving || !settings.apiKey || !settings.apiSecret}
              className={`
                flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg
                font-medium hover:bg-orange-700 transition-colors
                ${saving || !settings.apiKey || !settings.apiSecret ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
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

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <SettingsIcon className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-blue-900 mb-1">How it works</h4>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• Enter your Steadfast API credentials to enable order integration</li>
                <li>• Orders can be sent to Steadfast Courier from the Orders page</li>
                <li>• You'll receive consignment ID and tracking code after order creation</li>
                <li>• Contact Steadfast Courier Ltd. to obtain your API Key and Secret Key</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Security Warning */}
        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-yellow-900 mb-1">Security Notice</h4>
              <p className="text-xs text-yellow-800">
                Your API credentials are stored securely. Never share your API Secret with anyone.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

