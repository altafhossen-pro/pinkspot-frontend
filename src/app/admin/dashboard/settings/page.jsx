'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Settings as SettingsIcon, 
  Coins, 
  Menu,
  MapPin,
  Mail,
  Users,
  Truck,
} from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import PermissionDenied from '@/components/Common/PermissionDenied';

export default function AdminSettingsPage() {
  const router = useRouter();
  const { hasPermission, contextLoading } = useAppContext();
  const [checkingPermission, setCheckingPermission] = useState(true);
  const [hasReadPermission, setHasReadPermission] = useState(false);
  const [permissionError, setPermissionError] = useState(null);

  useEffect(() => {
    if (contextLoading) return;
    const canRead = hasPermission('settings', 'read');
    setHasReadPermission(canRead);
    setCheckingPermission(false);
  }, [contextLoading, hasPermission]);

  const settingsMenus = [
    {
      id: 'loyalty',
      title: 'Loyalty System',
      description: 'Coins & rewards',
      icon: Coins,
      color: 'bg-pink-100 text-pink-600',
      href: '/admin/dashboard/settings/loyalty'
    },
    {
      id: 'menu',
      title: 'Menu Management',
      description: 'Header & footer',
      icon: Menu,
      color: 'bg-gray-100 text-gray-600',
      href: '/admin/dashboard/settings/menu'
    },
    {
      id: 'address',
      title: 'Address Settings',
      description: 'Division, District, Upazila',
      icon: MapPin,
      color: 'bg-blue-100 text-blue-600',
      href: '/admin/dashboard/settings/address'
    },
    {
      id: 'email-sms',
      title: 'Email & SMS Settings',
      description: 'Order confirmation',
      icon: Mail,
      color: 'bg-green-100 text-green-600',
      href: '/admin/dashboard/settings/email-sms'
    },
    {
      id: 'affiliate',
      title: 'Affiliate Settings',
      description: 'Referral & rewards',
      icon: Users,
      color: 'bg-purple-100 text-purple-600',
      href: '/admin/dashboard/settings/affiliate'
    },
    {
      id: 'steadfast',
      title: 'Steadfast Configuration',
      description: 'Courier API settings',
      icon: Truck,
      color: 'bg-orange-100 text-orange-600',
      href: '/admin/dashboard/settings/steadfast'
    }
  ];

  const handleMenuClick = (href) => {
    router.push(href);
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
      <div className=" mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <SettingsIcon className="h-8 w-8 text-pink-500" />
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          </div>
          <p className="text-gray-600">Manage your store configuration and preferences</p>
        </div>

        {/* Settings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {settingsMenus.map((menu) => {
            const Icon = menu.icon;
            return (
              <div
                key={menu.id}
                onClick={() => handleMenuClick(menu.href)}
                className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-all duration-200 cursor-pointer group hover:scale-102 border border-gray-100"
              >
                <div className="flex items-center space-x-3 mb-3">
                  <div className={`p-2 rounded-md ${menu.color} group-hover:scale-105 transition-transform`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-gray-900 group-hover:text-pink-600 transition-colors">
                      {menu.title}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {menu.description}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Configure</span>
                  <div className="w-1.5 h-1.5 bg-pink-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}