'use client';

import React, { useState, useEffect } from 'react';
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import { FileText, ShoppingCart, CreditCard, Truck, AlertTriangle, Users, Scale, Mail, Phone } from 'lucide-react';
import { menuAPI } from '@/services/api';

export default function TermsConditions() {
  const lastUpdated = "August 6, 2026";
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
  let phone = "N/A";

  if (contactData) {
    if (Array.isArray(contactData)) {
      const emailContact = contactData.find(c => c.contactType === 'email');
      const phoneContact = contactData.find(c => c.contactType === 'phone');
      if (emailContact) email = emailContact.href || emailContact.description || email;
      if (phoneContact) phone = phoneContact.href || phoneContact.description || phone;
    } else {
      if (contactData.email) email = contactData.email;
      if (contactData.phone) phone = contactData.phone;
    }
  }

  const sections = [
    {
      id: "intro",
      title: "Welcome",
      icon: FileText,
      content: `Welcome to Pinkspot.bd. By using our website, you agree to the following Terms & Conditions.`
    },
    {
      id: "general",
      title: "1. General",
      icon: FileText,
      content: `Pinkspot.bd reserves the right to update products, prices, offers, and these terms at any time without prior notice.`
    },
    {
      id: "product-information",
      title: "2. Product Information",
      icon: ShoppingCart,
      content: `We try to ensure that all product descriptions and images are accurate. However:
• Slight color differences may occur due to screen settings.
• Product size may vary slightly due to manufacturing tolerance.`
    },
    {
      id: "pricing",
      title: "3. Pricing",
      icon: CreditCard,
      content: `All prices are listed in Bangladeshi Taka (BDT). Prices may change without prior notice.`
    },
    {
      id: "orders",
      title: "4. Orders",
      icon: ShoppingCart,
      content: `Pinkspot.bd reserves the right to:
• Accept or cancel any order
• Verify customer information before processing an order
• Cancel orders due to stock unavailability or pricing errors`
    },
    {
      id: "delivery",
      title: "5. Delivery",
      icon: Truck,
      content: `Delivery time depends on your location and courier availability. Delays caused by natural disasters, political situations, strikes, or courier issues are beyond our control.`
    },
    {
      id: "customer-responsibilities",
      title: "6. Customer Responsibilities",
      icon: Users,
      content: `Customers must provide:
• Correct name
• Valid phone number
• Accurate delivery address
Incorrect information may result in delivery failure.`
    },
    {
      id: "intellectual-property",
      title: "7. Intellectual Property",
      icon: FileText,
      content: `All logos, images, product descriptions, graphics, and website content belong to Pinkspot.bd and may not be copied without permission.`
    },
    {
      id: "limitation-liability",
      title: "8. Limitation of Liability",
      icon: AlertTriangle,
      content: `Pinkspot.bd shall not be responsible for indirect, incidental, or consequential damages arising from the use of the website or purchased products.`
    },
    {
      id: "governing-law",
      title: "9. Governing Law",
      icon: Scale,
      content: `These Terms & Conditions are governed by the laws of Bangladesh.`
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      
      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-pink-100 rounded-full mb-6">
            <FileText className="w-8 h-8 text-pink-500" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms & Conditions</h1>
          <p className="text-gray-600 text-lg">Please read these terms carefully</p>
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
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">Questions About These Terms?</h3>
            <p className="text-gray-600 mb-6">
              If you have any questions about these Terms and Conditions, please contact us:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center justify-center space-x-2 text-gray-600">
                <Mail className="w-4 h-4 text-pink-500" />
                {loadingContact ? (
                  <div className="h-4 w-32 bg-gray-200 animate-pulse rounded"></div>
                ) : (
                  <span>{email}</span>
                )}
              </div>
              <div className="flex items-center justify-center space-x-2 text-gray-600">
                <Phone className="w-4 h-4 text-pink-500" />
                {loadingContact ? (
                  <div className="h-4 w-32 bg-gray-200 animate-pulse rounded"></div>
                ) : (
                  <span>{phone}</span>
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
