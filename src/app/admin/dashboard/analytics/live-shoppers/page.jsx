'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Users, Activity, ShoppingCart, CreditCard, Clock, Globe,
  Smartphone, Monitor, Tablet, RefreshCw, ExternalLink, Eye,
  Phone, User, MapPin, AlertCircle, Sparkles, ChevronRight, X
} from 'lucide-react';
import { io } from 'socket.io-client';
import { getCookie } from 'cookies-next';
import visitorAPI from '@/services/visitorApi';

export default function LiveShoppersPage() {
  const [shoppers, setShoppers] = useState([]);
  const [todayTotal, setTodayTotal] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [recentAlert, setRecentAlert] = useState(null);
  const [selectedJourneySession, setSelectedJourneySession] = useState(null);
  const [journeyEvents, setJourneyEvents] = useState([]);
  const [journeyLoading, setJourneyLoading] = useState(false);

  const socketRef = useRef(null);

  // Initialize socket & fetch live shoppers snapshot
  useEffect(() => {
    const token = getCookie('token') || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);

    const fetchSnapshot = async () => {
      try {
        const res = await visitorAPI.getLiveShoppers(token);
        if (res && res.success) {
          const list = Array.isArray(res.data) 
            ? res.data 
            : (Array.isArray(res.data?.shoppers) ? res.data.shoppers : []);
          setShoppers(list);
          if (res.data?.todayTotal !== undefined) {
            setTodayTotal(res.data.todayTotal);
          }
          setLastRefreshed(new Date());
        }
      } catch (err) {
        console.error('Error fetching live shoppers snapshot:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSnapshot();

    // Setup Socket.io connection
    const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 
      (process.env.NEXT_PUBLIC_API_URL 
        ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/v1\/?$/, '') 
        : 'http://localhost:5000');

    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      // Join admin live monitor room
      socket.emit('join_visitor_monitor');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Receive live stream snapshot from server
    socket.on('live_shoppers_stream', (liveData) => {
      if (Array.isArray(liveData)) {
        setShoppers(liveData);
      } else if (liveData && Array.isArray(liveData.shoppers)) {
        setShoppers(liveData.shoppers);
        if (liveData.todayTotal !== undefined) {
          setTodayTotal(liveData.todayTotal);
        }
      }
      setLastRefreshed(new Date());
    });

    // High-priority alert when customer enters phone/name at checkout
    socket.on('customer_identified_alert', (customer) => {
      setRecentAlert(customer);
      setTimeout(() => {
        setRecentAlert(null);
      }, 10000);
    });

    // Fallback polling interval every 15s to keep time sync
    const pollInterval = setInterval(() => {
      fetchSnapshot();
    }, 15000);

    return () => {
      clearInterval(pollInterval);
      if (socket) {
        socket.emit('leave_visitor_monitor');
        socket.disconnect();
      }
    };
  }, []);

  // View journey modal handler
  const handleViewJourney = async (shopper) => {
    if (!shopper?.sessionId) return;
    setSelectedJourneySession(shopper);
    setJourneyLoading(true);
    const token = getCookie('token') || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);

    try {
      const res = await visitorAPI.getSessionJourney(shopper.sessionId, token);
      if (res && res.success) {
        const rawEvents = Array.isArray(res.data?.events) ? res.data.events : [];
        const sorted = [...rawEvents].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setJourneyEvents(sorted);
      }
    } catch (err) {
      console.error('Failed to fetch session journey:', err);
      setJourneyEvents([]);
    } finally {
      setJourneyLoading(false);
    }
  };

  // Metrics computation
  const shoppersList = Array.isArray(shoppers) ? shoppers : [];
  const activeCount = shoppersList.length;
  const inCheckoutCount = shoppersList.filter(s => s && (s.visitedCheckout || (s.url && s.url.includes('/checkout')))).length;
  const withCartCount = shoppersList.filter(s => s && s.hasCart && s.cartItems?.length > 0).length;
  const totalCartValue = shoppersList.reduce((sum, s) => sum + (Number(s?.cartTotal) || 0), 0);
  const identifiedCount = shoppersList.filter(s => s && (s.customerPhone || s.customerName)).length;

  const formatDuration = (seconds = 0) => {
    const s = Math.max(0, Math.floor(seconds));
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    const remSec = s % 60;
    return `${m}m ${remSec}s`;
  };

  const getDeviceIcon = (device = '') => {
    const d = String(device).toLowerCase();
    if (d.includes('mobile')) return <Smartphone className="w-4 h-4 text-pink-500" />;
    if (d.includes('tablet')) return <Tablet className="w-4 h-4 text-purple-500" />;
    return <Monitor className="w-4 h-4 text-blue-500" />;
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center font-bold">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Live Shoppers Monitor
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                  LIVE RADAR
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Real-time active visitors, live carts, and checkout interactions via Socket.io
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Socket Status Indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-50 border border-slate-200 text-slate-600">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'}`}></span>
            <span>{isConnected ? 'Connected' : 'Connecting...'}</span>
          </div>

          <Link
            href="/admin/dashboard/analytics/visitor-footprint"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-pink-50 text-pink-700 hover:bg-pink-100 transition-colors border border-pink-200"
          >
            <span>Visitor Footprint Audit</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Real-time Customer Identified Banner (Pre-order alert) */}
      {recentAlert && (
        <div className="bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 text-white p-4 rounded-2xl shadow-lg flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-yellow-300 animate-spin" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-extrabold tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
                  🔥 Pre-Order Identified!
                </span>
                <span className="text-xs opacity-90">Visitor #{recentAlert.dailySerial}</span>
              </div>
              <div className="text-sm sm:text-base font-bold mt-0.5">
                {recentAlert.name || 'Shopper'} ({recentAlert.phone}) entered checkout!
                {recentAlert.cartTotal > 0 && <span className="ml-2 bg-white/20 px-2 py-0.5 rounded text-xs">Cart: ৳{recentAlert.cartTotal}</span>}
              </div>
            </div>
          </div>
          <button 
            onClick={() => setRecentAlert(null)}
            className="p-1 rounded-lg hover:bg-white/20 transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Metric Cards Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Now */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Now</span>
            <div className="w-9 h-9 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{activeCount}</span>
            <span className="text-xs font-semibold text-pink-600">Shoppers on site</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Real-time presence</span>
          </div>
        </div>

        {/* In Checkout */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">In Checkout</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{inCheckoutCount}</span>
            <span className="text-xs font-semibold text-rose-600">On payment step</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            High purchase intent
          </div>
        </div>

        {/* Carts Active */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">With Active Cart</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{withCartCount}</span>
            <span className="text-xs font-bold text-slate-700">৳{totalCartValue.toLocaleString()}</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Cumulative live cart value
          </div>
        </div>

        {/* Identified Contacts */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Identified Leads</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Phone className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{identifiedCount}</span>
            <span className="text-xs font-semibold text-purple-600">Captured profiles</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Pre-order customer identity
          </div>
        </div>
      </div>

      {/* Shoppers Stream Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">
              Active Shoppers Stream
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {shoppersList.length} Active
            </span>
          </div>
          {lastRefreshed && (
            <span className="text-xs text-slate-400">
              Last synced: {lastRefreshed.toLocaleTimeString('en-GB', { hour12: true })}
            </span>
          )}
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-8 h-8 text-pink-500 animate-spin mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-600">Connecting to live shoppers stream...</p>
          </div>
        ) : shoppersList.length === 0 ? (
          <div className="p-12 text-center max-w-md mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
              <Users className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No Shoppers Currently Active</h3>
            <p className="text-xs text-slate-500 mt-1">
              Active storefront visitors will automatically appear here with their current page, cart items, and live duration.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4">Visitor / ID</th>
                  <th className="py-3 px-4">Customer Identity</th>
                  <th className="py-3 px-4">Current Page</th>
                  <th className="py-3 px-4">Live Cart</th>
                  <th className="py-3 px-4">Device & System</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {shoppersList.map((shopper, idx) => {
                  const isCheckout = shopper.visitedCheckout || (shopper.url && shopper.url.includes('/checkout'));
                  const hasItems = shopper.cartItems && shopper.cartItems.length > 0;

                  return (
                    <tr 
                      key={shopper.visitorId || idx}
                      className={`hover:bg-pink-50/30 transition-colors ${
                        isCheckout ? 'bg-rose-50/20' : ''
                      }`}
                    >
                      {/* Visitor Serial & ID */}
                      <td className="py-4 px-4 align-top">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-lg bg-pink-100 text-pink-700 font-extrabold text-xs flex items-center justify-center flex-shrink-0">
                            #{shopper.dailySerial || idx + 1}
                          </span>
                          <div>
                            <div className="font-mono text-xs text-slate-600 truncate max-w-[120px]" title={shopper.visitorId}>
                              {shopper.visitorId}
                            </div>
                            {shopper.isReturning && (
                              <span className="inline-block mt-0.5 text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-600">
                                Returning
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Customer Identity */}
                      <td className="py-4 px-4 align-top">
                        {shopper.customerPhone || shopper.customerName ? (
                          <div className="space-y-0.5">
                            <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-pink-500" />
                              <span>{shopper.customerName || 'Identified Customer'}</span>
                            </div>
                            {shopper.customerPhone && (
                              <a 
                                href={`tel:${shopper.customerPhone}`}
                                className="text-xs font-semibold text-pink-600 hover:underline flex items-center gap-1"
                              >
                                <Phone className="w-3 h-3 text-pink-500" />
                                <span>{shopper.customerPhone}</span>
                              </a>
                            )}
                            {shopper.customerAddress && (
                              <div className="text-[11px] text-slate-500 truncate max-w-[180px] flex items-center gap-1" title={shopper.customerAddress}>
                                <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                                <span>{shopper.customerAddress}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-xs text-slate-400 italic">
                            Guest Shopper
                          </div>
                        )}
                      </td>

                      {/* Current Page */}
                      <td className="py-4 px-4 align-top">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            {isCheckout ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-700 uppercase tracking-wide">
                                Checkout
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                                Browsing
                              </span>
                            )}
                            <a 
                              href={shopper.url || '/'}
                              target="_blank" 
                              rel="noreferrer"
                              className="text-xs font-medium text-slate-700 hover:text-pink-600 hover:underline flex items-center gap-1 truncate max-w-[220px]"
                              title={shopper.url}
                            >
                              <span>{shopper.title || shopper.url || '/'}</span>
                              <ExternalLink className="w-3 h-3 text-slate-400 flex-shrink-0" />
                            </a>
                          </div>
                          <div className="text-[11px] font-mono text-slate-400 truncate max-w-[220px]">
                            {shopper.url}
                          </div>
                        </div>
                      </td>

                      {/* Live Cart Preview */}
                      <td className="py-4 px-4 align-top">
                        {hasItems ? (
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-xs">
                                ৳{Number(shopper.cartTotal || 0).toLocaleString()}
                              </span>
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-pink-100 text-pink-700">
                                {shopper.cartItems.length} {shopper.cartItems.length === 1 ? 'item' : 'items'}
                              </span>
                            </div>
                            <div className="space-y-1 max-w-[200px]">
                              {shopper.cartItems.slice(0, 2).map((item, i) => (
                                <div key={i} className="text-[11px] text-slate-600 flex items-center justify-between gap-2 bg-slate-50 px-2 py-1 rounded">
                                  <span className="truncate">{item.title}</span>
                                  <span className="text-slate-500 font-semibold flex-shrink-0">x{item.quantity}</span>
                                </div>
                              ))}
                              {shopper.cartItems.length > 2 && (
                                <span className="text-[10px] text-slate-400 font-medium">
                                  +{shopper.cartItems.length - 2} more items
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">Empty</span>
                        )}
                      </td>

                      {/* Device, Browser & IP */}
                      <td className="py-4 px-4 align-top">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-xs text-slate-700">
                            {getDeviceIcon(shopper.device)}
                            <span className="font-medium">{shopper.device || 'Desktop'}</span>
                            <span className="text-slate-300">•</span>
                            <span className="text-slate-500">{shopper.browser || 'Browser'}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {shopper.ip || '127.0.0.1'}
                          </div>
                        </div>
                      </td>

                      {/* Live Duration */}
                      <td className="py-4 px-4 align-top">
                        <div className="space-y-0.5">
                          <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-pink-500" />
                            <span>{formatDuration(shopper.durationSeconds)}</span>
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Active {shopper.secondsAgo !== undefined ? `${shopper.secondsAgo}s ago` : 'just now'}
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 align-top text-right">
                        <button
                          onClick={() => handleViewJourney(shopper)}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-semibold bg-pink-50 text-pink-700 hover:bg-pink-100 transition-colors border border-pink-200 shadow-sm"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Journey</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Step-by-Step Journey Modal */}
      {selectedJourneySession && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-pink-100 bg-pink-50/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-xl bg-pink-600 text-white font-extrabold flex items-center justify-center text-sm">
                  #{selectedJourneySession.dailySerial || '1'}
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span>Shopper Live Journey</span>
                    {selectedJourneySession.customerName && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-pink-100 text-pink-700">
                        {selectedJourneySession.customerName}
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    {selectedJourneySession.visitorId}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedJourneySession(null)}
                className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 text-slate-500 flex items-center justify-center transition-colors shadow-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content / Timeline */}
            <div className="p-6 overflow-y-auto space-y-4">
              {journeyLoading ? (
                <div className="py-12 text-center">
                  <RefreshCw className="w-6 h-6 text-pink-500 animate-spin mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-500">Loading customer journey...</p>
                </div>
              ) : journeyEvents.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No recorded journey events for this active session yet.
                </div>
              ) : (
                <div className="relative pl-4 space-y-6">
                  {/* Vertical Timeline Bar */}
                  <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-pink-200"></div>

                  {journeyEvents.map((evt, idx) => {
                    const evtDate = new Date(evt.timestamp || Date.now());
                    const timeStr = evtDate.toLocaleTimeString('en-GB', {
                      timeZone: 'Asia/Dhaka',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      hour12: true
                    });

                    const isCart = evt.eventType?.includes('cart');
                    const isCheckout = evt.eventType?.includes('checkout');
                    const isProfile = evt.eventType === 'profile_identified';

                    const isLatest = idx === 0;

                    return (
                      <div key={idx} className="relative flex items-start gap-4">
                        {/* Dot */}
                        <div className={`w-3.5 h-3.5 rounded-full border-2 border-white z-10 flex-shrink-0 mt-0.5 ${
                          isLatest ? 'bg-pink-600 ring-4 ring-pink-300' :
                          isProfile ? 'bg-purple-600 ring-2 ring-purple-200' :
                          isCheckout ? 'bg-rose-500 ring-2 ring-rose-200' :
                          isCart ? 'bg-amber-500 ring-2 ring-amber-200' : 'bg-pink-400 ring-2 ring-pink-100'
                        }`}></div>

                        {/* Content */}
                        <div className={`flex-1 p-3 rounded-xl border transition-all ${
                          isLatest ? 'bg-pink-50/60 border-pink-200 shadow-sm' : 'bg-slate-50 border-slate-100'
                        }`}>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-800">
                                {evt.title || evt.url}
                              </span>
                              {isLatest && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-pink-600 text-white uppercase tracking-wider">
                                  Latest Activity
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] font-semibold text-pink-600 font-mono">
                              {timeStr} (BDT)
                            </span>
                          </div>
                          <div className="text-[11px] font-mono text-slate-500 break-all">
                            {evt.url}
                          </div>

                          {/* Metadata display */}
                          {isProfile && evt.metadata?.phone && (
                            <div className="mt-2 text-xs font-semibold text-purple-700 bg-purple-50 p-2 rounded-lg border border-purple-100">
                              Captured Phone: {evt.metadata.phone} {evt.metadata.fullName && `| Name: ${evt.metadata.fullName}`}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedJourneySession(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

