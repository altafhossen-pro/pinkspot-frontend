'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCookie } from 'cookies-next';
import { settingsAPI } from '@/services/api';
import { 
  ArrowLeft,
  Mail,
  MessageSquare,
  Save,
  AlertCircle,
  Settings as SettingsIcon
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAppContext } from '@/context/AppContext';
import PermissionDenied from '@/components/Common/PermissionDenied';

export default function EmailSMSSettingsPage() {
  const router = useRouter();
  const { hasPermission, contextLoading } = useAppContext();
  const [settings, setSettings] = useState({
    isSendOrderConfirmationEmail: true,
    isSendGuestOrderConfirmationSMS: true
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contextLoading]);

  const fetchSettings = async () => {
    try {
      const response = await settingsAPI.getEmailSMSSettings();
      if (response.success) {
        setSettings(response.data);
      } else {
        toast.error(response.message || 'Failed to load email & SMS settings');
      }
    } catch (error) {
      toast.error('Failed to load email & SMS settings');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (field) => {
    if (!hasUpdatePermission) {
      toast.error("You don't have permission to update settings");
      return;
    }
    setSettings(prev => ({
      ...prev,
      [field]: !prev[field]
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
      const response = await settingsAPI.updateEmailSMSSettings(settings, token);
      
      if (response.success) {
        toast.success('Email & SMS settings updated successfully');
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
        </div>
      </div>
    );
  }

  if (!hasReadPermission || permissionError) {
    return (
      <PermissionDenied
        title="Access Denied"
        message={permissionError || "You don't have permission to access email & SMS settings"}
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
            <div className="p-2 bg-green-100 rounded-lg">
              <Mail className="h-6 w-6 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Email & SMS Settings</h1>
          </div>
          <p className="text-gray-600">Manage order confirmation email and SMS notifications</p>
        </div>

        {/* Settings Cards */}
        <div className="space-y-6">
          {/* Email Confirmation Setting */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Mail className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Order Confirmation Email
                  </h3>
                </div>
                <p className="text-sm text-gray-600 ml-11 mb-4">
                  Send order confirmation emails to logged-in users when they place an order.
                </p>
                <div className="ml-11">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <AlertCircle className="h-4 w-4" />
                    <span>This applies to registered users only. Guest orders will not receive emails.</span>
                  </div>
                </div>
              </div>
              <div className="ml-4">
                <button
                  type="button"
                  onClick={() => handleToggle('isSendOrderConfirmationEmail')}
                  disabled={!hasUpdatePermission || saving}
                  className={`
                    relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                    ${settings.isSendOrderConfirmationEmail ? 'bg-green-500' : 'bg-gray-300'}
                    ${!hasUpdatePermission ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  <span
                    className={`
                      inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                      ${settings.isSendOrderConfirmationEmail ? 'translate-x-6' : 'translate-x-1'}
                    `}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* SMS Confirmation Setting */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <MessageSquare className="h-5 w-5 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Guest Order Confirmation SMS
                  </h3>
                </div>
                <p className="text-sm text-gray-600 ml-11 mb-4">
                  Send order confirmation SMS to guest users when they place an order.
                </p>
                <div className="ml-11">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <AlertCircle className="h-4 w-4" />
                    <span>This applies to guest orders only. Registered users receive email confirmations.</span>
                  </div>
                </div>
              </div>
              <div className="ml-4">
                <button
                  type="button"
                  onClick={() => handleToggle('isSendGuestOrderConfirmationSMS')}
                  disabled={!hasUpdatePermission || saving}
                  className={`
                    relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                    ${settings.isSendGuestOrderConfirmationSMS ? 'bg-green-500' : 'bg-gray-300'}
                    ${!hasUpdatePermission ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  <span
                    className={`
                      inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                      ${settings.isSendGuestOrderConfirmationSMS ? 'translate-x-6' : 'translate-x-1'}
                    `}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        {hasUpdatePermission && (
          <div className="mt-8 flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className={`
                flex items-center gap-2 px-6 py-3 bg-pink-600 text-white rounded-lg
                font-medium hover:bg-pink-700 transition-colors
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
            <SettingsIcon className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-blue-900 mb-1">How it works</h4>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• <strong>Email Confirmation:</strong> Sent to registered users after order creation</li>
                <li>• <strong>SMS Confirmation:</strong> Sent to guest users (checkout or manual orders) after order creation</li>
                <li>• Changes take effect immediately for new orders</li>
                <li>• Existing orders are not affected by these settings</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

