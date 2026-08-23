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
  Settings as SettingsIcon,
  Server,
  X,
  Smartphone
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAppContext } from '@/context/AppContext';
import PermissionDenied from '@/components/Common/PermissionDenied';

export default function EmailSMSSettingsPage() {
  const router = useRouter();
  const { hasPermission, contextLoading } = useAppContext();
  const [settings, setSettings] = useState({
    isSendGuestOrderEmail: true,
    isSendGuestOrderSMS: true,
    isSendUserOrderEmail: true,
    isSendUserOrderSMS: true,
    isSendManualOrderEmail: true,
    isSendManualOrderSMS: true,
    isSendOrderStatusConfirmedEmail: true,
    isSendOrderStatusConfirmedSMS: true,
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPass: '',
    emailFrom: '',
    emailFromName: '',
    smsApiKey: '',
    smsSenderId: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [testEmailAddress, setTestEmailAddress] = useState('');
  const [testingSms, setTestingSms] = useState(false);
  const [showTestSmsModal, setShowTestSmsModal] = useState(false);
  const [testPhoneNumber, setTestPhoneNumber] = useState('');
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
        setSettings(prev => ({ ...prev, ...response.data }));
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

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
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
        setSettings(prev => ({ ...prev, ...response.data }));
      } else {
        toast.error(response.message || 'Failed to update settings');
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = () => {
    if (!hasUpdatePermission) {
      toast.error("You don't have permission to test email configuration");
      return;
    }
    setShowTestModal(true);
  };

  const submitTestEmail = async (e) => {
    e.preventDefault();
    if (!testEmailAddress) {
      toast.error('Please enter an email address');
      return;
    }

    setTestingEmail(true);
    const loadingToast = toast.loading('Sending test email...');

    try {
      const token = getCookie('token');
      const payload = {
        ...settings,
        testEmailAddress
      };
      const response = await settingsAPI.testEmailConfig(payload, token);

      if (response.success) {
        toast.success(response.message || 'Test email sent successfully', { id: loadingToast });
        setShowTestModal(false);
        setTestEmailAddress('');
      } else {
        toast.error(response.message || 'Failed to send test email', { id: loadingToast });
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to send test email', { id: loadingToast });
    } finally {
      setTestingEmail(false);
    }
  };

  const handleTestSms = () => {
    if (!hasUpdatePermission) {
      toast.error("You don't have permission to test SMS configuration");
      return;
    }
    setShowTestSmsModal(true);
  };

  const submitTestSms = async (e) => {
    e.preventDefault();
    if (!testPhoneNumber) {
      toast.error('Please enter a phone number');
      return;
    }

    setTestingSms(true);
    const loadingToast = toast.loading('Sending test SMS...');

    try {
      const token = getCookie('token');
      const payload = {
        ...settings,
        testPhoneNumber
      };
      const response = await settingsAPI.testSmsConfig(payload, token);
      
      if (response.success) {
        toast.success(response.message || 'Test SMS sent successfully', { id: loadingToast });
        setShowTestSmsModal(false);
        setTestPhoneNumber('');
      } else {
        toast.error(response.message || 'Failed to send test SMS', { id: loadingToast });
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to send test SMS', { id: loadingToast });
    } finally {
      setTestingSms(false);
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
          <p className="text-gray-600">Manage email SMTP credentials, SMS API configurations and toggles</p>
        </div>

        {/* Settings Cards */}
        <div className="space-y-6">
          {/* SMTP Credentials Setting */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Server className="h-5 w-5 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                SMTP Configuration (Email)
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-11">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Host</label>
                <input
                  type="text"
                  name="smtpHost"
                  value={settings.smtpHost || ''}
                  onChange={handleInputChange}
                  disabled={!hasUpdatePermission}
                  placeholder="e.g. smtp.gmail.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Port</label>
                <input
                  type="number"
                  name="smtpPort"
                  value={settings.smtpPort || ''}
                  onChange={handleInputChange}
                  disabled={!hasUpdatePermission}
                  placeholder="e.g. 587"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Email (User)</label>
                <input
                  type="email"
                  name="smtpUser"
                  value={settings.smtpUser || ''}
                  onChange={handleInputChange}
                  disabled={!hasUpdatePermission}
                  placeholder="your-email@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Password</label>
                <input
                  type="password"
                  name="smtpPass"
                  value={settings.smtpPass || ''}
                  onChange={handleInputChange}
                  disabled={!hasUpdatePermission}
                  placeholder="App Password or Email Password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From Email</label>
                <input
                  type="email"
                  name="emailFrom"
                  value={settings.emailFrom || ''}
                  onChange={handleInputChange}
                  disabled={!hasUpdatePermission}
                  placeholder="info@yourstore.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From Name</label>
                <input
                  type="text"
                  name="emailFromName"
                  value={settings.emailFromName || ''}
                  onChange={handleInputChange}
                  disabled={!hasUpdatePermission}
                  placeholder="e.g. Pinkspot Store"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 disabled:bg-gray-100"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 ml-11 mt-6 border-t border-gray-100 pt-4">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <AlertCircle className="h-4 w-4" />
                <span>If left blank, the system will fall back to the environment variables (.env file).</span>
              </div>

              <button
                type="button"
                onClick={handleTestEmail}
                disabled={testingEmail || !hasUpdatePermission}
                className={`flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg border border-blue-200 font-medium hover:bg-blue-100 transition-colors whitespace-nowrap ${testingEmail ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {testingEmail ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4" />
                    <span>Test Configuration</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* SMS Configuration Setting */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <MessageSquare className="h-5 w-5 text-yellow-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                BulkSMS BD Configuration
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-11">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                <input
                  type="password"
                  name="smsApiKey"
                  value={settings.smsApiKey || ''}
                  onChange={handleInputChange}
                  disabled={!hasUpdatePermission}
                  placeholder="Your BulkSMS BD API Key"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sender ID</label>
                <input
                  type="text"
                  name="smsSenderId"
                  value={settings.smsSenderId || ''}
                  onChange={handleInputChange}
                  disabled={!hasUpdatePermission}
                  placeholder="e.g. 8809648904634"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 disabled:bg-gray-100"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 ml-11 mt-6 border-t border-gray-100 pt-4">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <AlertCircle className="h-4 w-4" />
                <span>If left blank, the system will fall back to the environment variables (.env file).</span>
              </div>
              <button
                type="button"
                onClick={handleTestSms}
                disabled={testingSms || !hasUpdatePermission}
                className={`flex items-center justify-center gap-2 px-4 py-2 bg-yellow-50 text-yellow-600 rounded-lg border border-yellow-200 font-medium hover:bg-yellow-100 transition-colors cursor-pointer ${testingSms ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {testingSms ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Smartphone className="h-4 w-4" />
                    <span>Test Configuration</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Guest Checkout Notifications Setting */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Mail className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Guest Checkout Notifications
                  </h3>
                </div>
                <p className="text-sm text-gray-600 ml-11 mb-4">
                  Send notifications to guest users when they place an order.
                </p>
                <div className="ml-11 flex flex-col gap-4">
                  <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Email Notification</span>
                    <button
                      type="button"
                      onClick={() => handleToggle('isSendGuestOrderEmail')}
                      disabled={!hasUpdatePermission || saving}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.isSendGuestOrderEmail ? 'bg-green-500' : 'bg-gray-300'} ${!hasUpdatePermission ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.isSendGuestOrderEmail ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">SMS Notification</span>
                    <button
                      type="button"
                      onClick={() => handleToggle('isSendGuestOrderSMS')}
                      disabled={!hasUpdatePermission || saving}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.isSendGuestOrderSMS ? 'bg-green-500' : 'bg-gray-300'} ${!hasUpdatePermission ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.isSendGuestOrderSMS ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Registered User Checkout Notifications Setting */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Mail className="h-5 w-5 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Registered User Notifications
                  </h3>
                </div>
                <p className="text-sm text-gray-600 ml-11 mb-4">
                  Send notifications to logged-in users when they place an order.
                </p>
                <div className="ml-11 flex flex-col gap-4">
                  <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Email Notification</span>
                    <button
                      type="button"
                      onClick={() => handleToggle('isSendUserOrderEmail')}
                      disabled={!hasUpdatePermission || saving}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.isSendUserOrderEmail ? 'bg-green-500' : 'bg-gray-300'} ${!hasUpdatePermission ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.isSendUserOrderEmail ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">SMS Notification</span>
                    <button
                      type="button"
                      onClick={() => handleToggle('isSendUserOrderSMS')}
                      disabled={!hasUpdatePermission || saving}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.isSendUserOrderSMS ? 'bg-green-500' : 'bg-gray-300'} ${!hasUpdatePermission ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.isSendUserOrderSMS ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Manual Order Notifications Setting */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Mail className="h-5 w-5 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Manual Order Notifications
                  </h3>
                </div>
                <p className="text-sm text-gray-600 ml-11 mb-4">
                  Send notifications when an admin creates a manual order.
                </p>
                <div className="ml-11 flex flex-col gap-4">
                  <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Email Notification</span>
                    <button
                      type="button"
                      onClick={() => handleToggle('isSendManualOrderEmail')}
                      disabled={!hasUpdatePermission || saving}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.isSendManualOrderEmail ? 'bg-green-500' : 'bg-gray-300'} ${!hasUpdatePermission ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.isSendManualOrderEmail ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">SMS Notification</span>
                    <button
                      type="button"
                      onClick={() => handleToggle('isSendManualOrderSMS')}
                      disabled={!hasUpdatePermission || saving}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.isSendManualOrderSMS ? 'bg-green-500' : 'bg-gray-300'} ${!hasUpdatePermission ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.isSendManualOrderSMS ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Order Confirmed Notifications Setting */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <MessageSquare className="h-5 w-5 text-yellow-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Order Confirmed Notifications
                  </h3>
                </div>
                <p className="text-sm text-gray-600 ml-11 mb-4">
                  Send notifications when an order status is changed to 'Confirmed'.
                </p>
                <div className="ml-11 flex flex-col gap-4">
                  <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Email Notification</span>
                    <button
                      type="button"
                      onClick={() => handleToggle('isSendOrderStatusConfirmedEmail')}
                      disabled={!hasUpdatePermission || saving}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.isSendOrderStatusConfirmedEmail ? 'bg-green-500' : 'bg-gray-300'} ${!hasUpdatePermission ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.isSendOrderStatusConfirmedEmail ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">SMS Notification</span>
                    <button
                      type="button"
                      onClick={() => handleToggle('isSendOrderStatusConfirmedSMS')}
                      disabled={!hasUpdatePermission || saving}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.isSendOrderStatusConfirmedSMS ? 'bg-green-500' : 'bg-gray-300'} ${!hasUpdatePermission ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.isSendOrderStatusConfirmedSMS ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                </div>
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
                <li>• <strong>Guest Orders:</strong> Triggered when unauthenticated users checkout.</li>
                <li>• <strong>Registered Users:</strong> Triggered when logged-in users checkout.</li>
                <li>• <strong>Manual Orders:</strong> Triggered when an admin creates a manual order.</li>
                <li>• <strong>Order Confirmed:</strong> Triggered only when an order status is changed to 'Confirmed'.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Test Email Modal */}
      {showTestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Send Test Email</h3>
              <button
                onClick={() => setShowTestModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={submitTestEmail} className="p-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Email Address
                </label>
                <input
                  type="email"
                  value={testEmailAddress}
                  onChange={(e) => setTestEmailAddress(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-2">
                  A test email will be sent to this address using the current SMTP configuration shown on the page.
                </p>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowTestModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={testingEmail || !testEmailAddress}
                  className={`
                    flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg font-medium transition-colors cursor-pointer
                    ${testingEmail || !testEmailAddress ? 'opacity-50 cursor-not-allowed' : 'hover:bg-pink-700'}
                  `}
                >
                  {testingEmail ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4" />
                      <span>Send Test</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Test SMS Modal */}
      {showTestSmsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Send Test SMS</h3>
              <button
                onClick={() => setShowTestSmsModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={submitTestSms} className="p-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Phone Number
                </label>
                <input
                  type="text"
                  value={testPhoneNumber}
                  onChange={(e) => setTestPhoneNumber(e.target.value)}
                  placeholder="e.g. 01700000000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-2">
                  A test SMS will be sent to this number using the current BulkSMS BD configuration shown on the page.
                </p>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowTestSmsModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={testingSms || !testPhoneNumber}
                  className={`
                    flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg font-medium transition-colors cursor-pointer
                    ${testingSms || !testPhoneNumber ? 'opacity-50 cursor-not-allowed' : 'hover:bg-pink-700'}
                  `}
                >
                  {testingSms ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Smartphone className="h-4 w-4" />
                      <span>Send Test</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
