'use client';

import React from 'react';
import { RotateCcw, AlertCircle, CheckCircle, XCircle, Mail, Phone } from 'lucide-react';
import Footer from '@/components/Footer/Footer';

export default function ReturnRefundPolicy() {
  const lastUpdated = "January 15, 2025";

  const sections = [
    {
      id: "important-notice",
      title: "IMPORTANT NOTICE",
      icon: AlertCircle,
      content: `Customers must check the product in front of the delivery man at the time of delivery.`,
      highlight: true
    },
    {
      id: "no-returns",
      title: "No Returns or Refunds",
      icon: XCircle,
      content: `Once the delivery is accepted, no complaints, returns, or refunds will be accepted under any circumstances.
      
      • No return after delivery man leaves
      • No return for change of mind
      • No return for size, color, or design issues after delivery`,
      highlight: true
    },
    {
      id: "agreement",
      title: "Agreement",
      icon: CheckCircle,
      content: `By placing an order on FORPINK.COM, you fully agree to this return policy.`
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
                <span>support@forpink.com</span>
              </div>
              <div className="flex items-center justify-center space-x-2 text-gray-600">
                <Phone className="w-4 h-4 text-pink-500" />
                <span>+8801313664466</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

