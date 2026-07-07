'use client';

import React from 'react';
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import { Shield, Database, Users, Lock, FileText, Mail } from 'lucide-react';

export default function PrivacyPolicy() {
  const lastUpdated = "January 15, 2025";

  const sections = [
    {
      id: "introduction",
      title: "Privacy Policy",
      icon: Shield,
      content: `Welcome to FORPINK.COM. Your privacy is very important to us. This Privacy Policy explains how we collect, use, and protect your personal information when you visit or purchase from our website.`
    },
    {
      id: "information-collection",
      title: "1. Information We Collect",
      icon: Database,
      content: `When you use our website, we may collect the following information:
      • Full Name
      • Phone Number
      • Email Address
      • Shipping & Billing Address
      • Payment-related information (we do not store card details)
      • Browsing data (cookies, IP address, device info)`
    },
    {
      id: "information-use",
      title: "2. How We Use Your Information",
      icon: Users,
      content: `We use your information to:
      • Process and deliver your orders
      • Contact you regarding your order or support requests
      • Improve our products, services, and website experience
      • Send promotional offers (only if you agree)`
    },
    {
      id: "information-protection",
      title: "3. Information Protection",
      icon: Lock,
      content: `We take reasonable security measures to protect your personal data from unauthorized access, misuse, or disclosure.`
    },
    {
      id: "information-sharing",
      title: "4. Sharing Information",
      icon: Lock,
      content: `We do not sell or rent your personal information. Your data may only be shared with:
      • Delivery partners
      • Payment service providers
      • Legal authorities if required by law`
    },
    {
      id: "cookies",
      title: "5. Cookies",
      icon: FileText,
      content: `FORPINK.COM uses cookies to improve your browsing experience and analyze website traffic.`
    },
    {
      id: "consent",
      title: "6. Your Consent",
      icon: Shield,
      content: `By using our website, you consent to our Privacy Policy.`
    },
    {
      id: "changes",
      title: "7. Changes to Privacy Policy",
      icon: Shield,
      content: `We reserve the right to update this policy at any time. Changes will be posted on this page.`
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
                <span className="font-medium">Email: support@forpink.com</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
