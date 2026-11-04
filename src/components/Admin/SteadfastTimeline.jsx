'use client';

import React, { useState, useEffect } from 'react';
import { 
  Truck, Clock, RefreshCw, ExternalLink, CheckCircle2, 
  AlertCircle, DollarSign, Package, MapPin, Printer
} from 'lucide-react';
import { getCookie } from 'cookies-next';
import steadfastAPI from '@/services/steadfastApi';

export default function SteadfastTimeline({ order, onOpenPrintModal }) {
  const [loading, setLoading] = useState(false);
  const [liveSteps, setLiveSteps] = useState([]);
  const [webhookHistory, setWebhookHistory] = useState([]);
  const [lastSynced, setLastSynced] = useState(null);

  const invoice = order?.orderId || order?._id;

  const fetchTracking = async () => {
    if (!invoice && !order?.steadfastConsignmentId) return;
    setLoading(true);
    try {
      const token = getCookie('token') || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
      const res = await steadfastAPI.getLiveTracking(invoice, token);
      if (res && res.success && res.data) {
        setLiveSteps(res.data.liveSteps || []);
        setWebhookHistory(res.data.webhookHistory || []);
        setLastSynced(new Date());
      }
    } catch (err) {
      console.error('Failed to sync live tracking:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (order?.isAddedIntoSteadfast || order?.steadfastConsignmentId) {
      fetchTracking();
    }
  }, [invoice, order?.steadfastConsignmentId]);

  if (!order?.isAddedIntoSteadfast && !order?.steadfastConsignmentId) {
    return null;
  }

  // Combine and dedupe events for chronological timeline (latest first)
  const allEvents = [];

  // Add live steps from Steadfast API
  liveSteps.forEach(step => {
    allEvents.push({
      text: step.text || 'Courier Activity',
      timestamp: step.created_at ? new Date(step.created_at) : new Date(),
      source: 'steadfast_live',
      tracking_type: step.tracking_type
    });
  });

  // Add webhook history
  webhookHistory.forEach(wh => {
    // Avoid exact duplicate text within 1 minute
    const whTime = new Date(wh.updated_at_steadfast || wh.createdAt);
    const text = wh.tracking_message || (wh.status ? `Parcel Status: ${wh.status}` : 'Status Update');
    const isDuplicate = allEvents.some(e => 
      e.text === text && Math.abs(new Date(e.timestamp).getTime() - whTime.getTime()) < 60000
    );
    if (!isDuplicate) {
      allEvents.push({
        text,
        status: wh.status,
        timestamp: whTime,
        source: 'webhook',
        cod_amount: wh.cod_amount,
        delivery_charge: wh.delivery_charge,
        net_amount: wh.net_amount
      });
    }
  });

  // If no events fetched yet but order has consignment ID, add initial dispatch step
  if (allEvents.length === 0) {
    allEvents.push({
      text: 'Consignment created & booked with Steadfast Courier',
      timestamp: new Date(order.updatedAt || order.createdAt),
      source: 'initial'
    });
  }

  // Sort latest first
  const sortedEvents = allEvents.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const consignmentId = order.steadfastConsignmentId;
  const trackingCode = order.steadfastTrackingCode;

  // Financial metrics
  const codAmount = order.steadfastCodAmount || 0;
  const deliveryCharge = order.steadfastDeliveryCharge || 0;
  const collectedAmount = order.steadfastCollectedAmount || 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 sm:p-7 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-pink-100 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center shadow-sm">
            <Truck className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">
                Steadfast Courier Timeline
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-pink-50 text-pink-700 border border-pink-200">
                LIVE SYNC
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-mono">
              Consignment ID: {consignmentId || 'Pending'} {trackingCode && `• Tracking: ${trackingCode}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenPrintModal && (
            <button
              onClick={onOpenPrintModal}
              className="px-3 py-1.5 bg-slate-800 text-white rounded-xl hover:bg-slate-900 transition-colors text-xs font-semibold flex items-center gap-1.5 shadow-sm"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print Label</span>
            </button>
          )}

          {consignmentId && (
            <a
              href={`https://steadfast.com.bd/user/consignment/${consignmentId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-pink-600 text-white rounded-xl hover:bg-pink-700 transition-colors text-xs font-semibold flex items-center gap-1.5 shadow-sm"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Steadfast Portal</span>
            </a>
          )}

          <button
            onClick={fetchTracking}
            disabled={loading}
            className="p-2 rounded-xl text-slate-500 hover:text-pink-600 hover:bg-pink-50 border border-slate-200 transition-colors disabled:opacity-50"
            title="Refresh Live Courier Trail"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-pink-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* COD Financial Breakdown Card (if delivered or collected) */}
      {(order.status === 'delivered' || order.status === 'partial_delivered' || collectedAmount > 0) && (
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-pink-50 p-4 rounded-2xl border border-emerald-200/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>Courier COD Settlement Breakdown</span>
            </span>
            <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              {order.status === 'partial_delivered' ? 'Partial Delivered' : 'Delivered & Confirmed'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs pt-1">
            <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-100 text-center">
              <span className="text-[10px] text-slate-500 font-semibold uppercase">Gross COD</span>
              <div className="text-sm font-extrabold text-slate-900 mt-0.5">
                ৳{codAmount > 0 ? codAmount.toLocaleString() : (order.totalAmount || 0).toLocaleString()}
              </div>
            </div>
            <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-100 text-center">
              <span className="text-[10px] text-slate-500 font-semibold uppercase">Delivery Charge</span>
              <div className="text-sm font-extrabold text-rose-600 mt-0.5">
                - ৳{deliveryCharge.toLocaleString()}
              </div>
            </div>
            <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-100 text-center">
              <span className="text-[10px] text-slate-500 font-semibold uppercase">Net Credited</span>
              <div className="text-sm font-black text-emerald-700 mt-0.5">
                ৳{collectedAmount > 0 ? collectedAmount.toLocaleString() : Math.max(0, (codAmount || order.totalAmount || 0) - deliveryCharge).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chronological Vertical Timeline (Latest First) */}
      <div className="relative pl-1 sm:pl-3 pt-2">
        <div className="space-y-6 sm:space-y-7">
          {sortedEvents.map((evt, idx) => {
            const isLatest = idx === 0;
            const isLast = idx === sortedEvents.length - 1;
            const d = new Date(evt.timestamp);

            const dateStr = d.toLocaleDateString('en-GB', {
              timeZone: 'Asia/Dhaka',
              day: '2-digit',
              month: 'short',
              year: 'numeric'
            });

            const timeStr = d.toLocaleTimeString('en-GB', {
              timeZone: 'Asia/Dhaka',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            });

            return (
              <div key={idx} className="relative flex items-start gap-3 sm:gap-6 group">
                {/* Left Column: Date & Time in BDT */}
                <div className="w-24 sm:w-28 flex-shrink-0 text-left sm:text-right pt-0.5">
                  <div className="text-xs sm:text-sm font-bold text-slate-800">
                    {dateStr}
                  </div>
                  <div className="text-[11px] font-semibold text-pink-600 flex items-center sm:justify-end gap-1 mt-0.5 font-mono">
                    <Clock className="w-3 h-3 text-pink-500 flex-shrink-0" />
                    <span>{timeStr}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                    BDT
                  </div>
                </div>

                {/* Center Column: Connecting Line & Pink Circular Dot */}
                <div className="relative flex flex-col items-center flex-shrink-0 self-stretch">
                  {!isLast && (
                    <div className="absolute top-4 bottom-[-24px] sm:bottom-[-28px] w-0.5 bg-pink-300"></div>
                  )}
                  <div className={`w-4 h-4 rounded-full border-2 transition-transform duration-200 group-hover:scale-110 z-10 ${
                    isLatest 
                      ? 'bg-pink-600 border-white ring-4 ring-pink-200 shadow-sm'
                      : 'bg-pink-500 border-white ring-2 ring-pink-100'
                  }`}></div>
                </div>

                {/* Right Column: Event Content */}
                <div className={`flex-1 p-3.5 sm:p-4 rounded-2xl border transition-all ${
                  isLatest 
                    ? 'bg-pink-50/60 border-pink-200 shadow-sm' 
                    : 'bg-slate-50 border-slate-100'
                }`}>
                  <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                    <span className="text-xs sm:text-sm font-bold text-slate-900">
                      {evt.text}
                    </span>
                    {isLatest && (
                      <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-pink-600 text-white uppercase tracking-wider">
                        Latest
                      </span>
                    )}
                    {evt.status && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-slate-200 text-slate-700">
                        {evt.status.replace(/_/g, ' ')}
                      </span>
                    )}
                  </div>

                  {evt.net_amount > 0 && (
                    <div className="text-xs font-semibold text-emerald-700 mt-1">
                      COD Collected: ৳{evt.cod_amount} • Net Credited: ৳{evt.net_amount}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

