'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, ShieldAlert, ShieldX, RefreshCw, AlertTriangle, 
  CheckCircle2, XCircle, Phone, PackageCheck, Ban, Info
} from 'lucide-react';
import { getCookie } from 'cookies-next';
import steadfastAPI from '@/services/steadfastApi';

export default function CustomerFraudScoreCard({ phone, orderId }) {
  const [loading, setLoading] = useState(false);
  const [fraudData, setFraudData] = useState(null);
  const [isCached, setIsCached] = useState(false);
  const [cachedAt, setCachedAt] = useState(null);
  const [error, setError] = useState(null);

  const fetchScore = async (force = false) => {
    if (!phone) return;
    setLoading(true);
    setError(null);
    try {
      const token = getCookie('token') || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
      const res = await steadfastAPI.getFraudScore(phone, token, force);
      if (res && res.success && res.data) {
        setFraudData(res.data);
        setIsCached(Boolean(res.isCached));
        setCachedAt(res.cachedAt || null);
      } else {
        setError(res.message || 'No delivery history found');
      }
    } catch (err) {
      setError(err.message || 'Failed to check customer score');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (phone) {
      fetchScore(false);
    }
  }, [phone]);

  if (!phone) return null;

  // Compute risk level
  const deliveryRatio = fraudData?.delivery_ratio !== undefined && fraudData?.delivery_ratio !== null 
    ? Number(fraudData.delivery_ratio) 
    : null;
  const returnRatio = fraudData?.return_ratio !== undefined && fraudData?.return_ratio !== null
    ? Number(fraudData.return_ratio)
    : (fraudData?.cancellation_ratio || 0);

  let riskLevel = 'unknown'; // 'safe' | 'warning' | 'danger' | 'unknown'
  if (deliveryRatio !== null) {
    if (deliveryRatio >= 80) riskLevel = 'safe';
    else if (deliveryRatio >= 55) riskLevel = 'warning';
    else riskLevel = 'danger';
  } else if (fraudData?.total_reports > 0 && returnRatio > 50) {
    riskLevel = 'danger';
  }

  const fraudCategories = fraudData?.fraud_categories || {};
  const hasCategoryReports = Object.values(fraudCategories).some(val => Number(val) > 0);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
            riskLevel === 'safe' ? 'bg-emerald-50 text-emerald-600' :
            riskLevel === 'warning' ? 'bg-amber-50 text-amber-600' :
            riskLevel === 'danger' ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-600'
          }`}>
            {riskLevel === 'safe' && <ShieldCheck className="w-5 h-5" />}
            {riskLevel === 'warning' && <ShieldAlert className="w-5 h-5" />}
            {riskLevel === 'danger' && <ShieldX className="w-5 h-5" />}
            {riskLevel === 'unknown' && <ShieldCheck className="w-5 h-5 text-slate-400" />}
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <span>Customer Courier Trust Score</span>
              <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-pink-50 text-pink-700 border border-pink-200">
                Official Steadfast
              </span>
              {isCached && (
                <span className="text-[9px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200" title={cachedAt ? `Cached at: ${new Date(cachedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Cached'}>
                  Cached 24h
                </span>
              )}
            </h3>
            <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 font-mono">
              <Phone className="w-3 h-3 text-slate-400" />
              <span>{phone}</span>
            </p>
          </div>
        </div>

        <button
          onClick={() => fetchScore(true)}
          disabled={loading}
          className="p-1.5 rounded-lg text-slate-400 hover:text-pink-600 hover:bg-pink-50 transition-colors disabled:opacity-50"
          title="Force Live Refresh (Bypass Cache)"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-pink-600' : ''}`} />
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-6 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-pink-600" />
          <span>Verifying courier delivery history across Steadfast...</span>
        </div>
      ) : error ? (
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-xs text-slate-600 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Info className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <span>{error}</span>
          </span>
          <button
            onClick={fetchScore}
            className="text-[11px] font-semibold text-pink-600 hover:underline"
          >
            Retry
          </button>
        </div>
      ) : fraudData ? (
        <div className="space-y-3">
          {/* Main Score Banner */}
          <div className={`p-4 rounded-xl border flex items-center justify-between ${
            riskLevel === 'safe' ? 'bg-emerald-50/60 border-emerald-200' :
            riskLevel === 'warning' ? 'bg-amber-50/60 border-amber-200' :
            riskLevel === 'danger' ? 'bg-rose-50/60 border-rose-200' : 'bg-slate-50 border-slate-200'
          }`}>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-extrabold uppercase px-2 py-0.5 rounded-full ${
                  riskLevel === 'safe' ? 'bg-emerald-600 text-white' :
                  riskLevel === 'warning' ? 'bg-amber-500 text-white' :
                  riskLevel === 'danger' ? 'bg-rose-600 text-white' : 'bg-slate-500 text-white'
                }`}>
                  {riskLevel === 'safe' ? 'Low Risk • Reliable' :
                   riskLevel === 'warning' ? 'Moderate Risk' :
                   riskLevel === 'danger' ? 'High Risk • Caution' : 'New Customer'}
                </span>
                {fraudData.volume_range && (
                  <span className="text-[11px] font-bold text-slate-600">
                    Volume: {fraudData.volume_range} orders
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-1.5">
                {riskLevel === 'safe' && 'High delivery success rate across Steadfast merchants.'}
                {riskLevel === 'warning' && 'Average return history. Confirm parcel before dispatch.'}
                {riskLevel === 'danger' && 'Frequent return/cancellation history. Call customer to verify before shipping.'}
                {riskLevel === 'unknown' && 'Limited courier records found on Steadfast.'}
              </p>
            </div>

            {deliveryRatio !== null && (
              <div className="text-right pl-3 border-l border-slate-200/60 flex-shrink-0">
                <div className={`text-2xl font-black ${
                  riskLevel === 'safe' ? 'text-emerald-700' :
                  riskLevel === 'warning' ? 'text-amber-700' : 'text-rose-700'
                }`}>
                  {deliveryRatio}%
                </div>
                <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  Success Rate
                </div>
              </div>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Delivered</span>
              <div className="text-base font-extrabold text-emerald-700 mt-0.5">
                {deliveryRatio !== null ? `${deliveryRatio}%` : (fraudData.delivered_count || 'N/A')}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Cancelled / Return</span>
              <div className="text-base font-extrabold text-rose-600 mt-0.5">
                {returnRatio !== null ? `${returnRatio}%` : (fraudData.cancelled_count || 'N/A')}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Total Reports</span>
              <div className="text-base font-extrabold text-slate-800 mt-0.5">
                {fraudData.total_reports !== undefined ? fraudData.total_reports : 0}
              </div>
            </div>
          </div>

          {/* Specific Reports Breakdown (if any reports exist) */}
          {hasCategoryReports && (
            <div className="p-3 rounded-xl bg-rose-50/50 border border-rose-100 space-y-1.5 text-xs">
              <div className="font-bold text-rose-900 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                <span>Steadfast Merchant Incident Reports:</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-700 pt-1">
                {Number(fraudCategories.fake_order) > 0 && (
                  <div className="flex items-center gap-1 text-rose-700 font-semibold">
                    <Ban className="w-3 h-3" />
                    <span>Fake Orders: {fraudCategories.fake_order}</span>
                  </div>
                )}
                {Number(fraudCategories.no_response) > 0 && (
                  <div className="flex items-center gap-1 text-amber-700 font-semibold">
                    <XCircle className="w-3 h-3" />
                    <span>No Response: {fraudCategories.no_response}</span>
                  </div>
                )}
                {Number(fraudCategories.blocked) > 0 && (
                  <div className="flex items-center gap-1 text-rose-700 font-semibold">
                    <Ban className="w-3 h-3" />
                    <span>Blocked: {fraudCategories.blocked}</span>
                  </div>
                )}
                {Number(fraudCategories.cancelled_after_confirm) > 0 && (
                  <div className="flex items-center gap-1 text-amber-700 font-semibold">
                    <XCircle className="w-3 h-3" />
                    <span>Cancelled Late: {fraudCategories.cancelled_after_confirm}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

