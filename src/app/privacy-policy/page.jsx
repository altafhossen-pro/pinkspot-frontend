'use client';

import React, { useState, useEffect } from 'react';
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import { Shield, Database, Users, Lock, FileText, Mail } from 'lucide-react';
import { menuAPI } from '@/services/api';

export default function PrivacyPolicy() {
  const lastUpdated = "January 15, 2025";
  const [contactData, setContactData] = useState(null);
  const [loadingContact, setLoadingContact] = useState(true);

  useEffect(() => {
    const fetchContactData = async () => {
      try {
        const response = await menuAPI.getFooterMenus();
        if (response?.success && response?.data?.contact) {
          setContactData(response.data.contact);
        }
      } catch (error) {
        console.error('Error fetching contact details:', error);
      } finally {
        setLoadingContact(false);
      }
    };
    fetchContactData();
  }, []);

  let email = "N/A";

  if (contactData) {
    if (Array.isArray(contactData)) {
      const emailContact = contactData.find(c => c.contactType === 'email');
      if (emailContact) email = emailContact.href || emailContact.description || email;
    } else {
      if (contactData.email) email = contactData.email;
    }
  }

  const sections = [
    {
      id: "introduction",
      title: "Privacy Policy",
      icon: Shield,
      content: `Welcome to Pinkspot.bd. Your privacy is important to us. This Privacy Policy explains how we collect, use, and protect your personal information.`
    },
    {
      id: "information-collection",
      title: "1. Information We Collect",
      icon: Database,
      content: `We may collect the following information:
• Full Name
• Mobile Number
• Email Address
• Delivery Address
• Billing Information
• Order History
• Device and Browser Information
• IP Address`
    },
    {
      id: "how-we-use",
      title: "2. How We Use Your Information",
      icon: Users,
      content: `We use your information to:
• Process and deliver your orders
• Contact you regarding your order
• Provide customer support
• Improve our website and services
• Send promotional offers (only if you agree)`
    },
    {
      id: "payment-information",
      title: "3. Payment Information",
      icon: Lock,
      content: `Pinkspot.bd does not store your debit or credit card details. Online payments are processed securely through trusted payment gateway providers.`
    },
    {
      id: "cookies",
      title: "4. Cookies",
      icon: FileText,
      content: `We use cookies to improve your browsing experience, remember your preferences, and analyze website traffic.`
    },
    {
      id: "information-sharing",
      title: "5. Information Sharing",
      icon: Users,
      content: `We do not sell or rent your personal information. We may share necessary information only with:
• Delivery Partners
• Payment Gateway Providers
• Government authorities if legally required`
    },
    {
      id: "data-security",
      title: "6. Data Security",
      icon: Shield,
      content: `We use reasonable security measures to protect your personal information from unauthorized access or misuse.`
    },
    {
      id: "your-rights",
      title: "7. Your Rights",
      icon: Users,
      content: `You may request to:
• Update your information
• Correct incorrect information
• Delete your account (subject to legal obligations)`
    },
    {
      id: "changes",
      title: "8. Changes to This Policy",
      icon: FileText,
      content: `Pinkspot.bd reserves the right to modify this Privacy Policy at any time. Updated versions will be published on this page.`
    },
    {
      id: "contact-us",
      title: "9. Contact Us",
      icon: Mail,
      content: `For any privacy-related questions, please contact us through our official Facebook page, email, or customer support number listed on Pinkspot.bd.`
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-pink-100 rounded-full mb-6">
            <Shield className="w-8 h-8 text-pink-500" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-gray-600 text-lg">Your privacy is important to us</p>
          <div className="mt-4 text-sm text-gray-500">
            Last updated: {lastUpdated}
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-6">
          {sections.map((section, index) => (
            <div key={section.id} className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                    <section.icon className="w-5 h-5 text-pink-500" />
                  </div>
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">
                    {section.title}
                  </h2>
                  <div className="text-gray-600 leading-relaxed">
                    {section.content.split('\n').map((paragraph, pIndex) => (
                      <p key={pIndex} className="mb-3">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Contact Section */}
        <div className="mt-12 bg-white rounded-lg p-8 shadow-sm border border-gray-100">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-pink-100 rounded-full mb-4">
              <Mail className="w-6 h-6 text-pink-500" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">Contact Us</h3>
            <p className="text-gray-600 mb-6">
              If you have any questions, please contact us at:
            </p>
            <div className="text-sm">
              <div className="flex items-center justify-center space-x-2 text-gray-700 mb-2">
                <Mail className="w-4 h-4 text-pink-500" />
                {loadingContact ? (
                  <div className="h-4 w-32 bg-gray-200 animate-pulse rounded"></div>
                ) : (
                  <span className="font-medium">Email: {email}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
