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
    const deliveryDisplay = result.delivery_ratio !== undefined && result.delivery_ratio !== null
      ? `${result.delivery_ratio}%`
      : (result.total_delivered || 0);

    const cancelDisplay = result.cancellation_ratio !== undefined && result.cancellation_ratio !== null
      ? `${result.cancellation_ratio}%`
      : (result.total_cancelled || 0);

    const fraudCount = result.total_reports !== undefined ? result.total_reports : (result.frauds || 0);

    return (
      <div className="flex items-center gap-1.5 mt-1 px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-[10px] w-fit shadow-xs font-mono">
        <span className="flex items-center text-emerald-600 font-semibold" title={`Delivered: ${deliveryDisplay}`}>
          <CheckCircle className="h-3 w-3 mr-0.5 text-emerald-500" />
          {deliveryDisplay}
        </span>
        <span className="text-slate-300">|</span>
        <span className="flex items-center text-amber-600 font-semibold" title={`Cancelled: ${cancelDisplay}`}>
          <XCircle className="h-3 w-3 mr-0.5 text-amber-500" />
          {cancelDisplay}
        </span>
        <span className="text-slate-300">|</span>
        <span className={`flex items-center font-semibold ${fraudCount > 0 ? 'text-rose-600' : 'text-slate-500'}`} title={`Fraud Reports: ${fraudCount}`}>
          <AlertTriangle className={`h-3 w-3 mr-0.5 ${fraudCount > 0 ? 'text-rose-500' : 'text-slate-400'}`} />
          {fraudCount}
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
