'use client';

import React, { useState, useEffect } from 'react';
import { RotateCcw, AlertCircle, CheckCircle, XCircle, Mail, Phone, Truck, CreditCard } from 'lucide-react';
import Footer from '@/components/Footer/Footer';
import { menuAPI } from '@/services/api';

export default function ReturnRefundPolicy() {
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
      icon: CheckCircle,
      content: `Pinkspot.bd, customer satisfaction is important to us.`,
      highlight: false
    },
    {
      id: "return-eligibility",
      title: "1. Return Eligibility",
      icon: RotateCcw,
      content: `Products can be returned only if:\n• The wrong product was delivered.\n• The product is damaged during delivery.\n• The product has a manufacturing defect.`,
      highlight: false
    },
    {
      id: "return-time",
      title: "2. Return Time",
      icon: AlertCircle,
      content: `Customers must report any issue within 24 hours of receiving the product.`,
      highlight: false
    },
    {
      id: "unboxing-requirement",
      title: "3. Unboxing Requirement",
      icon: AlertCircle,
      content: `Open the parcel in front of the delivery man and check it. No complaints will be accepted afterwards. If you do not like the product, return the parcel with the delivery charge. In this case, it is mandatory to pay the delivery charge.\nCustomers are strongly encouraged to record an unboxing video while opening the package. Claims regarding missing, damaged, or incorrect items may not be accepted without clear evidence.`,
      highlight: true
    },
    {
      id: "non-returnable",
      title: "4. Non-Returnable Products",
      icon: XCircle,
      content: `Returns will not be accepted if:\n• The product has been used.\n• The product is damaged by the customer.\n• The customer changes their mind after receiving the correct product.\n• Hygiene-sensitive or customized products (if applicable).`,
      highlight: true
    },
    {
      id: "refund",
      title: "5. Refund",
      icon: CreditCard,
      content: `Approved refunds will be processed within 7–10 business days after the returned product has been received and inspected.\nRefunds will be made through:\n• Mobile Banking\n• Bank Transfer\n• Original Payment Method (where applicable)`,
      highlight: false
    },
    {
      id: "exchange",
      title: "6. Exchange",
      icon: RotateCcw,
      content: `If stock is available, customers may choose an exchange instead of a refund.`,
      highlight: false
    },
    {
      id: "delivery-charges",
      title: "7. Delivery Charges",
      icon: Truck,
      content: `Delivery charges are non-refundable unless the mistake was made by Pinkspot.bd.`,
      highlight: false
    },
    {
      id: "contact",
      title: "8. Contact",
      icon: Phone,
      content: `For return or refund requests, please contact our customer support within the specified time.`,
      highlight: false
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-6">
            <RotateCcw className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Return & Refund Policy</h1>
          <p className="text-gray-600 text-lg">Please read this policy carefully</p>
          <div className="mt-4 text-sm text-gray-500">
            Last updated: {lastUpdated}
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-6">
          {sections.map((section, index) => (
            <div
              key={section.id}
              className={`rounded-lg p-6 shadow-sm border ${section.highlight
                ? 'bg-red-50 border-red-200'
                : 'bg-white border-gray-100'
                }`}
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${section.highlight
                    ? 'bg-red-100'
                    : 'bg-pink-100'
                    }`}>
                    <section.icon className={`w-5 h-5 ${section.highlight
                      ? 'text-red-500'
                      : 'text-pink-500'
                      }`} />
                  </div>
                </div>
                <div className="flex-1">
                  <h2 className={`text-xl font-semibold mb-3 ${section.highlight
                    ? 'text-red-700'
                    : 'text-gray-900'
                    }`}>
                    {section.title}
                  </h2>
                  <div className={`leading-relaxed ${section.highlight
                    ? 'text-red-800'
                    : 'text-gray-600'
                    }`}>
                    {section.content.split('\n').map((paragraph, pIndex) => (
                      paragraph.trim() ? (
                        <p key={pIndex} className="mb-3">
                          {paragraph}
                        </p>
                      ) : null
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
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">Questions About This Policy?</h3>
            <p className="text-gray-600 mb-6">
              If you have any questions about our Return & Refund Policy, please contact us:
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

