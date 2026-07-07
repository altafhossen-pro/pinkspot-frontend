'use client'

import { useState } from 'react'
import { 
  Settings, 
  Store, 
  Package, 
  ShoppingCart, 
  Users, 
  CreditCard,
  Bell,
  Shield,
  Save,
  RefreshCw
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general')
  const [loading, setLoading] = useState(false)

  // Settings state
  const [settings, setSettings] = useState({
    // General Settings
    siteName: 'Gold Ecommerce',
    siteDescription: 'Premium Gold Jewelry Store',
    siteLogo: '',
    siteFavicon: '',
    contactEmail: 'info@goldecommerce.com',
    contactPhone: '+8801234567890',
    address: 'Dhaka, Bangladesh',
    
    // Product Settings
    defaultCurrency: 'BDT',
    currencySymbol: '৳',
    lowStockThreshold: 5,
    autoApproveReviews: false,
    allowGuestCheckout: true,
    
    // Order Settings
    orderPrefix: 'ORD',
    autoConfirmOrders: false,
    defaultOrderStatus: 'pending',
    allowOrderCancellation: true,
    cancellationTimeLimit: 24, // hours
    
    // Payment Settings
    paymentMethods: ['cod', 'card', 'bkash', 'nagad'],
    codEnabled: true,
    cardEnabled: true,
    bkashEnabled: true,
    nagadEnabled: true,
    
    // Notification Settings
    emailNotifications: true,
    smsNotifications: false,
    orderNotifications: true,
    lowStockNotifications: true,
    
    // Security Settings
    requireEmailVerification: false,
    requirePhoneVerification: false,
    maxLoginAttempts: 5,
    sessionTimeout: 30, // minutes
  })

  const handleSave = async (section) => {
    setLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success(`${section} settings saved successfully!`)
    } catch (error) {
      toast.error('Failed to save settings')
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'general', label: 'General', icon: Store },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'orders', label: 'Orders', icon: ShoppingCart },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
  ]

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Site Name
          </label>
          <input
            type="text"
            value={settings.siteName}
            onChange={(e) => setSettings({...settings, siteName: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Contact Email
          </label>
          <input
            type="email"
            value={settings.contactEmail}
            onChange={(e) => setSettings({...settings, contactEmail: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Contact Phone
          </label>
          <input
            type="tel"
            value={settings.contactPhone}
            onChange={(e) => setSettings({...settings, contactPhone: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Address
          </label>
          <input
            type="text"
            value={settings.address}
            onChange={(e) => setSettings({...settings, address: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Site Description
        </label>
        <textarea
          value={settings.siteDescription}
          onChange={(e) => setSettings({...settings, siteDescription: e.target.value})}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
        />
      </div>
    </div>
  )

  const renderProductSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Currency
          </label>
          <select
            value={settings.defaultCurrency}
            onChange={(e) => setSettings({...settings, defaultCurrency: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
          >
            <option value="BDT">Bangladeshi Taka (BDT)</option>
            <option value="USD">US Dollar (USD)</option>
            <option value="EUR">Euro (EUR)</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Currency Symbol
          </label>
          <input
            type="text"
            value={settings.currencySymbol}
            onChange={(e) => setSettings({...settings, currencySymbol: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Low Stock Threshold
          </label>
          <input
            type="number"
            value={settings.lowStockThreshold}
            onChange={(e) => setSettings({...settings, lowStockThreshold: parseInt(e.target.value)})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-gray-700">Auto Approve Reviews</h4>
            <p className="text-xs text-gray-500">Automatically approve customer reviews</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.autoApproveReviews}
              onChange={(e) => setSettings({...settings, autoApproveReviews: e.target.checked})}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
          </label>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-gray-700">Allow Guest Checkout</h4>
            <p className="text-xs text-gray-500">Allow customers to checkout without registration</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.allowGuestCheckout}
              onChange={(e) => setSettings({...settings, allowGuestCheckout: e.target.checked})}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
          </label>
        </div>
      </div>
    </div>
  )

  const renderOrderSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Order Prefix
          </label>
          <input
            type="text"
            value={settings.orderPrefix}
            onChange={(e) => setSettings({...settings, orderPrefix: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Default Order Status
          </label>
          <select
            value={settings.defaultOrderStatus}
            onChange={(e) => setSettings({...settings, defaultOrderStatus: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
          >
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="processing">Processing</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cancellation Time Limit (Hours)
          </label>
          <input
            type="number"
            value={settings.cancellationTimeLimit}
            onChange={(e) => setSettings({...settings, cancellationTimeLimit: parseInt(e.target.value)})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-gray-700">Auto Confirm Orders</h4>
            <p className="text-xs text-gray-500">Automatically confirm new orders</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.autoConfirmOrders}
              onChange={(e) => setSettings({...settings, autoConfirmOrders: e.target.checked})}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
          </label>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-gray-700">Allow Order Cancellation</h4>
            <p className="text-xs text-gray-500">Allow customers to cancel their orders</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.allowOrderCancellation}
              onChange={(e) => setSettings({...settings, allowOrderCancellation: e.target.checked})}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
          </label>
        </div>
      </div>
    </div>
  )

  const renderPaymentSettings = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-700">Payment Methods</h4>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h5 className="text-sm font-medium text-gray-600">Cash on Delivery (COD)</h5>
              <p className="text-xs text-gray-500">Pay when you receive the product</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.codEnabled}
                onChange={(e) => setSettings({...settings, codEnabled: e.target.checked})}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h5 className="text-sm font-medium text-gray-600">Credit/Debit Card</h5>
              <p className="text-xs text-gray-500">Pay with card online</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.cardEnabled}
                onChange={(e) => setSettings({...settings, cardEnabled: e.target.checked})}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h5 className="text-sm font-medium text-gray-600">bKash</h5>
              <p className="text-xs text-gray-500">Pay with bKash mobile payment</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.bkashEnabled}
                onChange={(e) => setSettings({...settings, bkashEnabled: e.target.checked})}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h5 className="text-sm font-medium text-gray-600">Nagad</h5>
              <p className="text-xs text-gray-500">Pay with Nagad mobile payment</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.nagadEnabled}
                onChange={(e) => setSettings({...settings, nagadEnabled: e.target.checked})}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  )

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-gray-700">Email Notifications</h4>
            <p className="text-xs text-gray-500">Send notifications via email</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.emailNotifications}
              onChange={(e) => setSettings({...settings, emailNotifications: e.target.checked})}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
          </label>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-gray-700">SMS Notifications</h4>
            <p className="text-xs text-gray-500">Send notifications via SMS</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.smsNotifications}
              onChange={(e) => setSettings({...settings, smsNotifications: e.target.checked})}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
          </label>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-gray-700">Order Notifications</h4>
            <p className="text-xs text-gray-500">Notify about new orders</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.orderNotifications}
              onChange={(e) => setSettings({...settings, orderNotifications: e.target.checked})}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
          </label>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-gray-700">Low Stock Notifications</h4>
            <p className="text-xs text-gray-500">Notify when products are low in stock</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.lowStockNotifications}
              onChange={(e) => setSettings({...settings, lowStockNotifications: e.target.checked})}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
          </label>
        </div>
      </div>
    </div>
  )

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Max Login Attempts
          </label>
          <input
            type="number"
            value={settings.maxLoginAttempts}
            onChange={(e) => setSettings({...settings, maxLoginAttempts: parseInt(e.target.value)})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Session Timeout (Minutes)
          </label>
          <input
            type="number"
            value={settings.sessionTimeout}
            onChange={(e) => setSettings({...settings, sessionTimeout: parseInt(e.target.value)})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-gray-700">Require Email Verification</h4>
            <p className="text-xs text-gray-500">Users must verify their email address</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.requireEmailVerification}
              onChange={(e) => setSettings({...settings, requireEmailVerification: e.target.checked})}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
          </label>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-gray-700">Require Phone Verification</h4>
            <p className="text-xs text-gray-500">Users must verify their phone number</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.requirePhoneVerification}
              onChange={(e) => setSettings({...settings, requirePhoneVerification: e.target.checked})}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
          </label>
        </div>
      </div>
    </div>
  )

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return renderGeneralSettings()
      case 'products':
        return renderProductSettings()
      case 'orders':
        return renderOrderSettings()
      case 'payments':
        return renderPaymentSettings()
      case 'notifications':
        return renderNotificationSettings()
      case 'security':
        return renderSecuritySettings()
      default:
        return renderGeneralSettings()
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Settings className="h-6 w-6 text-pink-600" />
          Settings
        </h1>
        <p className="text-gray-600">Manage your store settings and preferences</p>
      </div>

      <div className="bg-white rounded-lg shadow">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'border-pink-500 text-pink-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {renderTabContent()}
          
          {/* Save Button */}
          <div className="mt-8 flex justify-end">
            <button
              onClick={() => handleSave(activeTab)}
              disabled={loading}
              className="bg-pink-600 text-white px-6 py-2 rounded-md hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save {tabs.find(tab => tab.id === activeTab)?.label} Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
