'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCookie } from 'cookies-next';
import { ArrowLeft, Save, Play, Bot, MessageSquare } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { settingsAPI } from '@/services/api';
import { useAppContext } from '@/context/AppContext';
import PermissionDenied from '@/components/Common/PermissionDenied';

export default function TelegramSettingsPage() {
  const router = useRouter();
  const { hasPermission, contextLoading } = useAppContext();
  const [checkingPermission, setCheckingPermission] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [token, setToken] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  
  const [settings, setSettings] = useState({
    botToken: '',
    chatId: '',
    enableSuccessMsgOnSteadfastCallback: false,
    enableDebugLogOnSteadfastCallback: false,
    notifyNewOrderExistingUser: false,
    notifyNewOrderGuestUser: false,
    notifyNewUserSignup: false,
    notifyPasswordChange: false
  });

  useEffect(() => {
    if (contextLoading) return;
    
    // Admin needs write permission to settings to access this page
    const canAccess = hasPermission('settings', 'write');
    setHasAccess(canAccess);
    setCheckingPermission(false);

    if (canAccess) {
      const storedToken = getCookie('token');
      setToken(storedToken);
      fetchSettings(storedToken);
    }
  }, [contextLoading, hasPermission]);

  const fetchSettings = async (authToken) => {
    try {
      setIsLoading(true);
      const response = await settingsAPI.getTelegramSettings(authToken);
      
      if (response.success && response.data) {
        setSettings({
          botToken: response.data.botToken || '',
          chatId: response.data.chatId || '',
          enableSuccessMsgOnSteadfastCallback: response.data.enableSuccessMsgOnSteadfastCallback || false,
          enableDebugLogOnSteadfastCallback: response.data.enableDebugLogOnSteadfastCallback || false,
          notifyNewOrderExistingUser: response.data.notifyNewOrderExistingUser || false,
          notifyNewOrderGuestUser: response.data.notifyNewOrderGuestUser || false,
          notifyNewUserSignup: response.data.notifyNewUserSignup || false,
          notifyPasswordChange: response.data.notifyPasswordChange || false
        });
      }
    } catch (error) {
      console.error('Error fetching Telegram settings:', error);
      toast.error('Failed to load Telegram settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setIsSaving(true);
      
      const payload = {
        botToken: settings.botToken.trim(),
        chatId: settings.chatId.trim(),
        enableSuccessMsgOnSteadfastCallback: settings.enableSuccessMsgOnSteadfastCallback,
        enableDebugLogOnSteadfastCallback: settings.enableDebugLogOnSteadfastCallback,
        notifyNewOrderExistingUser: settings.notifyNewOrderExistingUser,
        notifyNewOrderGuestUser: settings.notifyNewOrderGuestUser,
        notifyNewUserSignup: settings.notifyNewUserSignup,
        notifyPasswordChange: settings.notifyPasswordChange
      };

      const response = await settingsAPI.updateTelegramSettings(payload, token);
      
      if (response.success) {
        toast.success('Telegram settings updated successfully');
      } else {
        toast.error(response.message || 'Failed to update settings');
      }
    } catch (error) {
      console.error('Error updating Telegram settings:', error);
      toast.error(error.message || 'Error updating settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConfig = async () => {
    if (!settings.botToken || !settings.chatId) {
      toast.error('Bot Token and Chat ID are required for testing');
      return;
    }

    try {
      setIsTesting(true);
      
      const payload = {
        botToken: settings.botToken.trim(),
        chatId: settings.chatId.trim()
      };

      const response = await settingsAPI.testTelegramConfig(payload, token);
      
      if (response.success) {
        toast.success(response.message || 'Test message sent successfully! Please check your Telegram chat.');
      } else {
        toast.error(response.message || 'Failed to send test message');
      }
    } catch (error) {
      console.error('Error testing Telegram config:', error);
      toast.error(error.message || 'Error sending test message');
    } finally {
      setIsTesting(false);
    }
  };

  if (checkingPermission || contextLoading || isLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <PermissionDenied
        title="Access Denied"
        message="You don't have permission to modify settings"
        action="Contact your administrator for access"
        showBackButton={true}
      />
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-8">
        <button
          onClick={() => router.push('/admin/dashboard/settings')}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Telegram Configuration</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your Telegram bot for store alerts and notifications</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Bot Token */}
            <div className="md:col-span-2">
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <Bot className="w-4 h-4 text-blue-500" />
                <span>Bot Token (Bot ID)</span>
              </label>
              <input
                type="text"
                value={settings.botToken}
                onChange={(e) => setSettings({ ...settings, botToken: e.target.value })}
                placeholder="e.g. 1234567890:ABCdefGHIjklmNOPqrstUVWxyz"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                required
              />
              <p className="text-xs text-gray-500 mt-2">
                Create a bot via BotFather on Telegram and get the HTTP API token.
              </p>
            </div>

            {/* Chat ID */}
            <div className="md:col-span-2">
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <MessageSquare className="w-4 h-4 text-blue-500" />
                <span>Chat ID</span>
              </label>
              <input
                type="text"
                value={settings.chatId}
                onChange={(e) => setSettings({ ...settings, chatId: e.target.value })}
                placeholder="e.g. 123456789 or -1001234567890"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                required
              />
              <p className="text-xs text-gray-500 mt-2">
                The ID of the chat or channel where you want to receive notifications.
              </p>
            </div>
            
            {/* Steadfast Callback Toggles */}
            <div className="md:col-span-2 pt-4 border-t border-gray-100">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Steadfast Webhook Alerts</h3>
              
              <div className="space-y-4">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={settings.enableSuccessMsgOnSteadfastCallback}
                      onChange={(e) => setSettings({ ...settings, enableSuccessMsgOnSteadfastCallback: e.target.checked })}
                    />
                    <div className={`block w-10 h-6 rounded-full transition-colors ${settings.enableSuccessMsgOnSteadfastCallback ? 'bg-pink-500' : 'bg-gray-300'}`}></div>
                    <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${settings.enableSuccessMsgOnSteadfastCallback ? 'transform translate-x-4' : ''}`}></div>
                  </div>
                  <div className="text-sm font-medium text-gray-700">Enable success message on Steadfast callback</div>
                </label>

                <label className="flex items-center space-x-3 cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={settings.enableDebugLogOnSteadfastCallback}
                      onChange={(e) => setSettings({ ...settings, enableDebugLogOnSteadfastCallback: e.target.checked })}
                    />
                    <div className={`block w-10 h-6 rounded-full transition-colors ${settings.enableDebugLogOnSteadfastCallback ? 'bg-pink-500' : 'bg-gray-300'}`}></div>
                    <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${settings.enableDebugLogOnSteadfastCallback ? 'transform translate-x-4' : ''}`}></div>
                  </div>
                  <div className="text-sm font-medium text-gray-700">Enable debug log on Steadfast callback</div>
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-3">
                Debug logs are written to the server's <code>logs/steadfast_webhook.log</code> file. Success messages are sent to the Telegram Chat ID above.
              </p>
            </div>

            {/* Store Activity Toggles */}
            <div className="md:col-span-2 pt-4 border-t border-gray-100">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Store Activity Alerts</h3>
              
              <div className="space-y-4">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={settings.notifyNewOrderExistingUser}
                      onChange={(e) => setSettings({ ...settings, notifyNewOrderExistingUser: e.target.checked })}
                    />
                    <div className={`block w-10 h-6 rounded-full transition-colors ${settings.notifyNewOrderExistingUser ? 'bg-pink-500' : 'bg-gray-300'}`}></div>
                    <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${settings.notifyNewOrderExistingUser ? 'transform translate-x-4' : ''}`}></div>
                  </div>
                  <div className="text-sm font-medium text-gray-700">New Order Notification (Existing User)</div>
                </label>

                <label className="flex items-center space-x-3 cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={settings.notifyNewOrderGuestUser}
                      onChange={(e) => setSettings({ ...settings, notifyNewOrderGuestUser: e.target.checked })}
                    />
                    <div className={`block w-10 h-6 rounded-full transition-colors ${settings.notifyNewOrderGuestUser ? 'bg-pink-500' : 'bg-gray-300'}`}></div>
                    <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${settings.notifyNewOrderGuestUser ? 'transform translate-x-4' : ''}`}></div>
                  </div>
                  <div className="text-sm font-medium text-gray-700">New Order Notification (Guest User)</div>
                </label>

                <label className="flex items-center space-x-3 cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={settings.notifyNewUserSignup}
                      onChange={(e) => setSettings({ ...settings, notifyNewUserSignup: e.target.checked })}
                    />
                    <div className={`block w-10 h-6 rounded-full transition-colors ${settings.notifyNewUserSignup ? 'bg-pink-500' : 'bg-gray-300'}`}></div>
                    <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${settings.notifyNewUserSignup ? 'transform translate-x-4' : ''}`}></div>
                  </div>
                  <div className="text-sm font-medium text-gray-700">New User Signup</div>
                </label>

                <label className="flex items-center space-x-3 cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={settings.notifyPasswordChange}
                      onChange={(e) => setSettings({ ...settings, notifyPasswordChange: e.target.checked })}
                    />
                    <div className={`block w-10 h-6 rounded-full transition-colors ${settings.notifyPasswordChange ? 'bg-pink-500' : 'bg-gray-300'}`}></div>
                    <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${settings.notifyPasswordChange ? 'transform translate-x-4' : ''}`}></div>
                  </div>
                  <div className="text-sm font-medium text-gray-700">User Password Change / Reset</div>
                </label>
              </div>
            </div>

          </div>

          <div className="pt-6 mt-6 border-t border-gray-100 flex items-center justify-between">
            <button
              type="button"
              onClick={handleTestConfig}
              disabled={isTesting || !settings.botToken || !settings.chatId}
              className="flex items-center space-x-2 px-6 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {isTesting ? (
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Play className="w-4 h-4" />
              )}
              <span>{isTesting ? 'Testing...' : 'Test Configuration'}</span>
            </button>
            
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center space-x-2 px-6 py-2.5 bg-pink-600 hover:bg-pink-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
