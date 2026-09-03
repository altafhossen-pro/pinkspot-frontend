'use client';

import React, { useState } from 'react';
import { ShieldAlert, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { settingsAPI } from '@/services/api';
import { getCookie } from 'cookies-next';
import { toast } from 'react-hot-toast';

export default function InlineFraudChecker({ phone }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const checkFraud = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!phone) return;
    
    setLoading(true);
    try {
      const token = getCookie('token');
      const response = await settingsAPI.checkFraudStatus(phone, token);
      
      if (response.success && response.data) {
        setResult(response.data);
      } else {
        toast.error(response.message || 'Check failed');
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Error checking fraud status');
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div className="flex items-center gap-2 mt-1 px-1.5 py-0.5 rounded-md bg-gray-50 border border-gray-200 text-[10px] w-fit">
        <span className="flex items-center text-green-600 font-medium" title="Delivered">
          <CheckCircle className="h-3 w-3 mr-0.5" />
          {result.total_delivered || 0}
        </span>
        <span className="text-gray-300">|</span>
        <span className="flex items-center text-yellow-600 font-medium" title="Cancelled">
          <XCircle className="h-3 w-3 mr-0.5" />
          {result.total_cancelled || 0}
        </span>
        <span className="text-gray-300">|</span>
        <span className="flex items-center text-red-600 font-medium" title="Frauds">
          <AlertTriangle className="h-3 w-3 mr-0.5" />
          {result.frauds || 0}
        </span>
      </div>
    );
  }

  return (
    <button
      onClick={checkFraud}
      disabled={loading}
      title="Check Fraud Status (Steadfast)"
      className="inline-flex items-center justify-center p-1 mt-0.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
    >
      {loading ? (
        <div className="h-3 w-3 rounded-full border-b-2 border-red-500 animate-spin"></div>
      ) : (
        <ShieldAlert className="h-3.5 w-3.5" />
      )}
    </button>
  );
}
