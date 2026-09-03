'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCookie } from 'cookies-next';
import { settingsAPI } from '@/services/api';
import { 
  ArrowLeft,
  ShieldAlert,
  Save,
  AlertCircle,
  Settings as SettingsIcon,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAppContext } from '@/context/AppContext';
import PermissionDenied from '@/components/Common/PermissionDenied';

export default function FraudCheckerSettingsPage() {
  const router = useRouter();
  const { hasPermission, contextLoading } = useAppContext();
  const [settings, setSettings] = useState({
    isEnabled: false,
    cookieString: ''
  });
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
  }, [contextLoading]);

  const fetchSettings = async () => {
    try {
      const token = getCookie('token');
      const response = await settingsAPI.getFraudCheckerSettings(token);
      if (response.success) {
        setSettings({
          isEnabled: response.data?.isEnabled || false,
          cookieString: response.data?.cookieString || ''
        });
      } else {
        toast.error(response.message || 'Failed to load Fraud Checker settings');
      }
    } catch (error) {
      toast.error('Failed to load Fraud Checker settings');
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
      const response = await settingsAPI.updateFraudCheckerSettings(settings, token);
      
      if (response.success) {
        toast.success('Fraud Checker settings updated successfully');
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        </div>
      </div>
    );
  }

  if (!hasReadPermission || permissionError) {
    return (
      <PermissionDenied
        title="Access Denied"
        message={permissionError || "You don't have permission to access Fraud Checker settings"}
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
            <div className="p-2 bg-red-100 rounded-lg">
              <ShieldAlert className="h-6 w-6 text-red-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Fraud Checker Configuration</h1>
          </div>
          <p className="text-gray-600">Configure Steadfast Courier cookies to enable automatic fraud checking</p>
        </div>

        {/* Manual Fraud Checker Tool */}
        {hasReadPermission && settings.isEnabled && settings.cookieString && (
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-red-500" />
              Manual Fraud Check
            </h2>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Enter phone number (e.g., 018...)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  id="manual-phone-input"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      document.getElementById('manual-check-btn').click();
                    }
                  }}
                />
              </div>
              <button
                id="manual-check-btn"
                onClick={async () => {
                  const phoneInput = document.getElementById('manual-phone-input').value;
                  if (!phoneInput) {
                    toast.error('Please enter a phone number');
                    return;
                  }
                  
                  const btn = document.getElementById('manual-check-btn');
                  const originalText = btn.innerHTML;
                  btn.innerHTML = 'Checking...';
                  btn.disabled = true;
                  
                  const resultDiv = document.getElementById('manual-check-result');
                  resultDiv.classList.add('hidden');
                  
                  try {
                    const token = getCookie('token');
                    const response = await settingsAPI.checkFraudStatus(phoneInput, token);
                    if (response.success && response.data) {
                      const data = response.data;
                      document.getElementById('manual-del-count').innerText = data.total_delivered || 0;
                      document.getElementById('manual-can-count').innerText = data.total_cancelled || 0;
                      document.getElementById('manual-frd-count').innerText = data.frauds || 0;
                      resultDiv.classList.remove('hidden');
                    } else {
                      toast.error(response.message || 'Check failed');
                    }
                  } catch (error) {
                    toast.error(error?.response?.data?.message || 'Error checking fraud status');
                  } finally {
                    btn.innerHTML = originalText;
                    btn.disabled = false;
                  }
                }}
                className="px-6 py-2 bg-gray-900 text-white rounded-md font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                Check Status
              </button>
            </div>
            
            {/* Result display */}
            <div id="manual-check-result" className="hidden mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-white rounded shadow-sm border border-green-100">
                  <p className="text-xs text-gray-500 mb-1 uppercase font-semibold">Delivered</p>
                  <p id="manual-del-count" className="text-2xl font-bold text-green-600">0</p>
                </div>
                <div className="p-3 bg-white rounded shadow-sm border border-yellow-100">
                  <p className="text-xs text-gray-500 mb-1 uppercase font-semibold">Cancelled</p>
                  <p id="manual-can-count" className="text-2xl font-bold text-yellow-600">0</p>
                </div>
                <div className="p-3 bg-white rounded shadow-sm border border-red-100">
                  <p className="text-xs text-gray-500 mb-1 uppercase font-semibold">Frauds</p>
                  <p id="manual-frd-count" className="text-2xl font-bold text-red-600">0</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Settings Card */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 space-y-6">
          {/* Enable Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Enable Fraud Checker</h3>
              <p className="text-sm text-gray-500">
                Turn on the fraud checker tool in the admin panel to analyze customer order history.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={settings.isEnabled}
                onChange={(e) => handleChange('isEnabled', e.target.checked)}
                disabled={!hasUpdatePermission || saving}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
            </label>
          </div>

          {/* Cookie String */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <SettingsIcon className="h-4 w-4" />
                <span>Steadfast Cookie String</span>
              </div>
            </label>
            <textarea
              value={settings.cookieString}
              onChange={(e) => handleChange('cookieString', e.target.value)}
              disabled={!hasUpdatePermission || saving}
              placeholder="Paste the full cookie string from Steadfast here..."
              rows={4}
              className={`w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 font-mono text-sm ${
                !hasUpdatePermission ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
            />
            <p className="mt-1 text-xs text-gray-500">
              The full Cookie string copied from the Request Headers of a Steadfast dashboard network request. Includes steadfast_courier_session, XSRF-TOKEN, cf_clearance, etc.
            </p>
          </div>
        </div>

        {/* Save Button */}
        {hasUpdatePermission && (
          <div className="mt-8 flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className={`
                flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg
                font-medium hover:bg-red-700 transition-colors
                ${saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
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
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-blue-900 mb-1">How to get the Cookie</h4>
              <ul className="text-xs text-blue-800 space-y-2">
                <li>1. Log in to your Steadfast Courier Merchant account on your browser.</li>
                <li>2. Right-click anywhere on the page and select "Inspect" to open Developer Tools.</li>
                <li>3. Go to the "Network" tab and reload the page.</li>
                <li>4. Click on any network request (like <i>dashboard</i> or <i>profile</i>) in the list.</li>
                <li>5. Scroll down to the <b>Request Headers</b> section and look for <b>cookie</b>.</li>
                <li>6. Right-click the cookie value and select "Copy value", then paste it here.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Warning Box */}
        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-yellow-900 mb-1">Cookie Expiration</h4>
              <p className="text-xs text-yellow-800">
                Cookies (especially Cloudflare clearance cookies) may expire after a few days or hours. If the fraud checker stops working, you will need to log back into Steadfast and update the cookie string here.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
