'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Footprints, Calendar, Search, Filter, Clock, Eye, ShoppingCart,
  CreditCard, Smartphone, Monitor, Tablet, Phone, User, MapPin,
  ChevronRight, RefreshCw, AlertCircle, ArrowUpRight, CheckCircle2,
  X, Check, Activity, Zap, Copy, MoreVertical, ShoppingBag, ExternalLink
} from 'lucide-react';
import { getCookie } from 'cookies-next';
import visitorAPI from '@/services/visitorApi';
import SendOfferModal from '@/components/Admin/Analytics/SendOfferModal';
import ShopperCartModal from '@/components/Admin/Analytics/ShopperCartModal';
import OrderAsCustomerModal from '@/components/Admin/Analytics/OrderAsCustomerModal';

// Format date helper for Asia/Dhaka
function getTodayDhakaDate() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dhaka',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());
}

function VisitorFootprintContent() {
  const searchParams = useSearchParams();
  const urlVisitorId = searchParams.get('visitorId') || searchParams.get('search') || '';

  const todayStr = getTodayDhakaDate();

  const getNDaysAgoDhaka = (n = 6) => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Dhaka',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(d);
  };

  const [dateRangeMode, setDateRangeMode] = useState(urlVisitorId ? 'all' : 'today');
  const [singleDate, setSingleDate] = useState(todayStr);
  const [fromDate, setFromDate] = useState(getNDaysAgoDhaka(6));
  const [toDate, setToDate] = useState(todayStr);
  const [activeDateLabel, setActiveDateLabel] = useState(urlVisitorId ? 'All History' : 'Today');
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState(urlVisitorId || '');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Data states
  const [sessions, setSessions] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 25, totalPages: 1 });
  const [metrics, setMetrics] = useState({
    totalVisitors: 0,
    totalPageViews: 0,
    returningCount: 0,
    cartVisitors: 0,
    checkoutVisitors: 0,
    identifiedVisitors: 0,
    avgDurationSeconds: 0
  });

  // Modal states for Journey Timeline
  const [selectedSession, setSelectedSession] = useState(null);
  const [journeyEvents, setJourneyEvents] = useState([]);
  const [groupedJourneyDates, setGroupedJourneyDates] = useState([]);
  const [journeyLoading, setJourneyLoading] = useState(false);
  const [token, setToken] = useState(null);
  const [offerTargetSession, setOfferTargetSession] = useState(null);
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [cartModalShopper, setCartModalShopper] = useState(null);
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);
  const [copiedPhoneId, setCopiedPhoneId] = useState(null);
  const [orderAsCustomerShopper, setOrderAsCustomerShopper] = useState(null);
  const [isOrderAsCustomerModalOpen, setIsOrderAsCustomerModalOpen] = useState(false);

  const router = useRouter();
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState({});
  const buttonRefs = useRef({});
  const [contextMenu, setContextMenu] = useState({ open: false, session: null, x: 0, y: 0 });

  // Close menus on outside click, escape key, or scroll
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (openDropdownId && !e.target.closest('.footprint-actions-dropdown') && !e.target.closest('.footprint-actions-btn')) {
        setOpenDropdownId(null);
      }
      if (contextMenu.open && !e.target.closest('.footprint-context-menu')) {
        setContextMenu({ open: false, session: null, x: 0, y: 0 });
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setOpenDropdownId(null);
        setContextMenu({ open: false, session: null, x: 0, y: 0 });
      }
    };
    const handleScroll = () => {
      if (openDropdownId) setOpenDropdownId(null);
      if (contextMenu.open) setContextMenu({ open: false, session: null, x: 0, y: 0 });
    };

    window.addEventListener('click', handleOutsideClick);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      window.removeEventListener('click', handleOutsideClick);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [openDropdownId, contextMenu.open]);

  const calculateDropdownPosition = (keyId) => {
    const buttonElement = buttonRefs.current[keyId];
    if (!buttonElement) return { top: 0, left: 0, position: 'fixed' };

    const rect = buttonElement.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const dropdownHeight = 175;
    const dropdownWidth = 190;
    const gap = 6;

    let pos = { position: 'fixed', zIndex: 9999 };

    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;

    if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
      pos.bottom = `${viewportHeight - rect.top + gap}px`;
      pos.top = 'auto';
    } else {
      pos.top = `${rect.bottom + gap}px`;
      pos.bottom = 'auto';
    }

    const spaceRight = viewportWidth - rect.right;
    if (spaceRight < dropdownWidth) {
      pos.left = `${Math.max(10, rect.left)}px`;
      pos.right = 'auto';
    } else {
      pos.right = `${Math.max(10, viewportWidth - rect.right)}px`;
      pos.left = 'auto';
    }

    return pos;
  };

  const handleDropdownToggle = (session) => {
    const id = session._id || session.visitorId;
    if (openDropdownId === id) {
      setOpenDropdownId(null);
    } else {
      setOpenDropdownId(id);
      setContextMenu({ open: false, session: null, x: 0, y: 0 });
      setTimeout(() => {
        setDropdownPosition(calculateDropdownPosition(id));
      }, 0);
    }
  };

  const handleContextMenu = (e, session) => {
    e.preventDefault();
    setOpenDropdownId(null);
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const menuWidth = 190;
    const menuHeight = 175;

    let x = e.clientX;
    let y = e.clientY;

    if (x + menuWidth > viewportWidth) {
      x = viewportWidth - menuWidth - 10;
    }
    if (y + menuHeight > viewportHeight) {
      y = viewportHeight - menuHeight - 10;
    }

    setContextMenu({
      open: true,
      session,
      x: Math.max(10, x),
      y: Math.max(10, y)
    });
  };

  // Fetch footprint data
  const fetchData = async (overrideParams = {}) => {
    setLoading(true);
    const userToken = getCookie('token') || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
    setToken(userToken);

    try {
      const mode = overrideParams.range !== undefined ? overrideParams.range : dateRangeMode;
      const effectiveSearch = overrideParams.search !== undefined ? overrideParams.search : searchQuery;
      const effectiveVisitorId = overrideParams.visitorId !== undefined 
        ? overrideParams.visitorId 
        : (effectiveSearch?.startsWith('visitor_') ? effectiveSearch : '');

      const queryParams = {
        filter: activeTab,
        search: effectiveSearch,
        page: currentPage,
        limit: 25,
        ...overrideParams
      };

      if (effectiveVisitorId) {
        queryParams.visitorId = effectiveVisitorId;
      }

      if (mode === 'today') {
        queryParams.range = 'today';
        queryParams.date = overrideParams.date || singleDate || todayStr;
      } else if (mode === 'last_7_days') {
        queryParams.range = 'last_7_days';
      } else if (mode === 'last_30_days') {
        queryParams.range = 'last_30_days';
      } else if (mode === 'custom') {
        queryParams.from = overrideParams.from || fromDate;
        queryParams.to = overrideParams.to || toDate;
      } else if (mode === 'all') {
        queryParams.range = 'all';
      }

      const res = await visitorAPI.getFootprint(queryParams, userToken);

      if (res && res.success) {
        setSessions(res.data?.sessions || []);
        setPagination(res.data?.pagination || { total: 0, page: 1, limit: 25, totalPages: 1 });
        if (res.data?.metrics) {
          setMetrics(res.data.metrics);
        }
      }
    } catch (err) {
      console.error('Error fetching visitor footprint:', err);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (urlVisitorId) {
      setSearchQuery(urlVisitorId);
      setDateRangeMode('all');
      setActiveDateLabel('All History');
      fetchData({ search: urlVisitorId, visitorId: urlVisitorId, range: 'all' });
    } else {
      fetchData();
    }
  }, [dateRangeMode, singleDate, activeTab, currentPage, urlVisitorId]);

  // Handle Search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchData();
  };

  // Quick Preset Selector
  const handlePresetSelect = (preset) => {
    setDateRangeMode(preset);
    setCurrentPage(1);
    if (preset === 'today') {
      setSingleDate(todayStr);
      setActiveDateLabel('Today');
    } else if (preset === 'last_7_days') {
      setActiveDateLabel('Last 7 Days');
    } else if (preset === 'last_30_days') {
      setActiveDateLabel('Last 30 Days');
    } else if (preset === 'custom') {
      setActiveDateLabel('Custom Range');
    }
  };

  // Apply Custom Range
  const handleApplyCustom = (e) => {
    if (e) e.preventDefault();
    if (!fromDate || !toDate) return;
    setDateRangeMode('custom');
    setActiveDateLabel(`${fromDate} - ${toDate}`);
    setCurrentPage(1);
    fetchData({ range: 'custom', from: fromDate, to: toDate });
  };

  // Open Journey Modal
  const openJourneyModal = async (session) => {
    setSelectedSession(session);
    setJourneyLoading(true);
    const userToken = getCookie('token') || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);

    try {
      const targetId = session.visitorId || session.sessionId || session._id;
      const res = await visitorAPI.getSessionJourney(targetId, userToken);
      if (res && res.success) {
        const rawEvents = Array.isArray(res.data?.events) ? res.data.events : [];
        const sorted = [...rawEvents].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setJourneyEvents(sorted);
        setGroupedJourneyDates(Array.isArray(res.data?.groupedDates) ? res.data.groupedDates : []);
      }
    } catch (err) {
      console.error('Failed to fetch journey timeline:', err);
      setJourneyEvents([]);
      setGroupedJourneyDates([]);
    } finally {
      setJourneyLoading(false);
    }
  };

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

  const sessionsList = Array.isArray(sessions) ? sessions : [];

  const tabs = [
    { id: 'all', label: 'All Visitors', count: metrics.totalVisitors },
    { id: 'returning', label: 'Returning', count: metrics.returningCount },
    { id: 'with_cart', label: 'With Cart', count: metrics.cartVisitors },
    { id: 'checkout', label: 'In Checkout', count: metrics.checkoutVisitors },
    { id: 'identified', label: 'Identified Leads', count: metrics.identifiedVisitors },
    { id: 'abandoned', label: 'Abandoned Carts', count: metrics.cartVisitors }
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center font-bold">
            <Footprints className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Visitor Footprint & Audit
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Daily visitor timeline, sequential serials, navigation trails, and cart abandonment audit
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/dashboard/analytics/live-shoppers"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors border border-emerald-200"
          >
            <Activity className="w-3.5 h-3.5 animate-pulse" />
            <span>Live Radar</span>
          </Link>

          <button
            onClick={() => fetchData()}
            className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-pink-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Date Filter & Search Controls */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        {/* Row 1: Quick Range Presets + Search Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Preset Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">Period:</span>
            <button
              type="button"
              onClick={() => handlePresetSelect('today')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                dateRangeMode === 'today'
                  ? 'bg-pink-600 text-white shadow-sm ring-2 ring-pink-200'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => handlePresetSelect('last_7_days')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                dateRangeMode === 'last_7_days'
                  ? 'bg-pink-600 text-white shadow-sm ring-2 ring-pink-200'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Last 7 Days
            </button>
            <button
              type="button"
              onClick={() => handlePresetSelect('last_30_days')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                dateRangeMode === 'last_30_days'
                  ? 'bg-pink-600 text-white shadow-sm ring-2 ring-pink-200'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Last 30 Days
            </button>
            <button
              type="button"
              onClick={() => handlePresetSelect('custom')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                dateRangeMode === 'custom'
                  ? 'bg-pink-600 text-white shadow-sm ring-2 ring-pink-200'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Custom Range</span>
            </button>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="relative w-full lg:max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Visitor #, Phone, Name, IP, or URL..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-20 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-200 focus:outline-none focus:border-pink-500 focus:bg-white transition-all text-slate-800"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 rounded-lg bg-pink-600 text-white text-xs font-semibold hover:bg-pink-700 transition-colors"
            >
              Search
            </button>
          </form>
        </div>

        {/* Row 2: Sub-controls (Single Date picker or From/To Range inputs) */}
        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          {dateRangeMode === 'today' ? (
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Specific single date:</span>
              <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                <Calendar className="w-3.5 h-3.5 text-pink-600 flex-shrink-0" />
                <input
                  type="date"
                  value={singleDate}
                  onChange={(e) => {
                    setSingleDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
                />
              </div>
            </div>
          ) : dateRangeMode === 'custom' ? (
            <form onSubmit={handleApplyCustom} className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
                <span className="text-slate-400 font-semibold">From:</span>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
                />
              </div>
              <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
                <span className="text-slate-400 font-semibold">To:</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
                />
              </div>
              <button
                type="submit"
                className="px-3.5 py-1.5 rounded-xl bg-pink-600 text-white font-bold hover:bg-pink-700 transition-colors shadow-sm"
              >
                Apply Range
              </button>
            </form>
          ) : (
            <div className="flex items-center gap-2 text-slate-500 font-medium">
              <span>Selected Window:</span>
              <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-lg">{activeDateLabel}</span>
            </div>
          )}

          {/* Active Range Chip */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-50 border border-pink-200 text-pink-700 font-semibold self-start sm:self-auto text-xs">
            <Calendar className="w-3.5 h-3.5 text-pink-600" />
            <span>Active Filter: {metrics.date || activeDateLabel}</span>
          </div>
        </div>
      </div>

      {/* Summary Metrics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {/* Total Visitors */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Visitors</span>
          <div className="mt-2 text-2xl font-extrabold text-slate-900 tracking-tight">
            {metrics.totalVisitors || 0}
          </div>
          <span className="text-[10px] text-pink-600 font-medium">Daily Serials</span>
        </div>

        {/* Total Page Views */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Page Views</span>
          <div className="mt-2 text-2xl font-extrabold text-slate-900 tracking-tight">
            {metrics.totalPageViews || 0}
          </div>
          <span className="text-[10px] text-slate-400 font-medium">Storefront clicks</span>
        </div>

        {/* Returning Visitors */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Returning</span>
          <div className="mt-2 text-2xl font-extrabold text-slate-900 tracking-tight">
            {metrics.returningCount || 0}
          </div>
          <span className="text-[10px] text-indigo-600 font-medium">
            {metrics.totalVisitors > 0 ? `${Math.round((metrics.returningCount / metrics.totalVisitors) * 100)}%` : '0%'}
          </span>
        </div>

        {/* Added to Cart */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">With Cart</span>
          <div className="mt-2 text-2xl font-extrabold text-slate-900 tracking-tight">
            {metrics.cartVisitors || 0}
          </div>
          <span className="text-[10px] text-amber-600 font-medium">Cart intent</span>
        </div>

        {/* Visited Checkout */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Visited Checkout</span>
          <div className="mt-2 text-2xl font-extrabold text-slate-900 tracking-tight">
            {metrics.checkoutVisitors || 0}
          </div>
          <span className="text-[10px] text-rose-600 font-medium">Payment step</span>
        </div>

        {/* Identified Contacts */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Identified Leads</span>
          <div className="mt-2 text-2xl font-extrabold text-slate-900 tracking-tight">
            {metrics.identifiedVisitors || 0}
          </div>
          <span className="text-[10px] text-purple-600 font-medium">Phone captured</span>
        </div>

        {/* Avg Time on Site */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Avg Time</span>
          <div className="mt-2 text-2xl font-extrabold text-slate-900 tracking-tight">
            {formatDuration(metrics.avgDurationSeconds || 0)}
          </div>
          <span className="text-[10px] text-slate-400 font-medium">Time on store</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setCurrentPage(1);
            }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${activeTab === tab.id
              ? 'bg-pink-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-pink-600 hover:bg-pink-50/50'
              }`}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Sessions Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 text-center">
            <RefreshCw className="w-8 h-8 text-pink-500 animate-spin mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-600">Loading visitor sessions for {metrics.date || activeDateLabel}...</p>
          </div>
        ) : sessionsList.length === 0 ? (
          <div className="p-16 text-center max-w-md mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
              <Footprints className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No Visitors Found for this Date Range</h3>
            <p className="text-xs text-slate-500 mt-1">
              There were no recorded visitor sessions on {metrics.date || activeDateLabel} matching your current filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4">Visitor / ID</th>
                  <th className="py-3 px-4">Customer Identity</th>
                  <th className="py-3 px-4">Entry & Last Visited</th>
                  <th className="py-3 px-4">Cart & Status</th>
                  <th className="py-3 px-4">Device & System</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {sessionsList.map((s, idx) => {
                  const firstSeen = new Date(s.firstSeenAt);
                  const lastSeen = new Date(s.lastSeenAt);

                  const firstSeenTime = firstSeen.toLocaleTimeString('en-GB', {
                    timeZone: 'Asia/Dhaka',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  });
                  const lastSeenTime = lastSeen.toLocaleTimeString('en-GB', {
                    timeZone: 'Asia/Dhaka',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  });

                  return (
                    <tr
                      key={s._id || idx}
                      onContextMenu={(e) => handleContextMenu(e, s)}
                      className="hover:bg-pink-50/20 transition-colors cursor-default"
                    >
                      {/* Visitor Serial & ID */}
                      <td className="py-4 px-4 align-top">
                        <div className="flex items-center gap-2">
                          <span className="w-8 h-8 rounded-xl bg-pink-100 text-pink-700 font-extrabold text-xs flex items-center justify-center flex-shrink-0 shadow-sm">
                            #{s.dailySerial}
                          </span>
                          <div>
                            <div className="font-mono text-xs text-slate-600 truncate max-w-[130px]" title={s.visitorId}>
                              {s.visitorId}
                            </div>
                            {s.totalDaysCount > 1 ? (
                              <div className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 flex items-center gap-1 mt-0.5 w-fit">
                                <Calendar className="w-3 h-3 text-indigo-500 flex-shrink-0" />
                                <span>{s.totalDaysCount} Days Active</span>
                              </div>
                            ) : s.sessionDate ? (
                              <div className="text-[10px] font-semibold text-pink-600 flex items-center gap-1 mt-0.5">
                                <Calendar className="w-3 h-3 text-pink-500 flex-shrink-0" />
                                <span>{s.sessionDate}</span>
                              </div>
                            ) : null}
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {s.isReturning ? (
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-600">
                                  Returning
                                </span>
                              ) : (
                                <span className="text-[10px] font-medium text-slate-400">
                                  New
                                </span>
                              )}
                              <span className="text-[10px] text-slate-400 font-medium">
                                • {s.pageViewsCount || 1} views
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Customer Identity */}
                      <td className="py-4 px-4 align-top">
                        {s.customerPhone || s.customerName ? (
                          <div className="space-y-0.5">
                            <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-pink-500" />
                              <span>{s.customerName || 'Identified Customer'}</span>
                            </div>
                            {s.customerPhone && (
                              <div className="flex items-center gap-1.5">
                                <a
                                  href={`tel:${s.customerPhone}`}
                                  className="text-xs font-semibold text-pink-600 hover:underline flex items-center gap-1"
                                >
                                  <Phone className="w-3 h-3 text-pink-500" />
                                  <span>{s.customerPhone}</span>
                                </a>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (navigator?.clipboard?.writeText) {
                                      navigator.clipboard.writeText(s.customerPhone);
                                      setCopiedPhoneId(s._id || s.visitorId);
                                      setTimeout(() => setCopiedPhoneId(null), 2000);
                                    }
                                  }}
                                  className="p-1 rounded text-slate-400 hover:text-pink-600 hover:bg-pink-50 transition-colors"
                                  title="Copy Phone Number"
                                >
                                  {copiedPhoneId === (s._id || s.visitorId) ? (
                                    <Check className="w-3 h-3 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                            )}
                            {s.customerAddress && (
                              <div className="text-[11px] text-slate-500 truncate max-w-[180px] flex items-center gap-1" title={s.customerAddress}>
                                <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                                <span>{s.customerAddress}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-xs text-slate-400 italic">
                            Guest Shopper
                          </div>
                        )}
                      </td>

                      {/* Entry & Last Visited */}
                      <td className="py-4 px-4 align-top">
                        <div className="space-y-1.5 max-w-[240px]">
                          <div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Last Visited:</div>
                            <div className="text-xs font-semibold text-slate-800 truncate" title={s.lastTitle || s.lastUrl}>
                              {s.lastTitle || s.lastUrl || '/'}
                            </div>
                            <div className="text-[10px] font-mono text-slate-400 truncate">
                              {s.lastUrl} • <span className="text-pink-600">{lastSeenTime}</span>
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Entry Point:</div>
                            <div className="text-[11px] text-slate-500 truncate">
                              {s.entryUrl || '/'} • <span className="text-slate-400">{firstSeenTime}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Cart & Order Status */}
                      <td className="py-4 px-4 align-top">
                        <div className="space-y-1">
                          {s.hasCart ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-slate-900">
                                  ৳{Number(s.cartTotal || 0).toLocaleString()}
                                </span>
                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-pink-100 text-pink-700">
                                  {s.cartItems?.length || 0} items
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setCartModalShopper(s);
                                  setIsCartModalOpen(true);
                                }}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-pink-600 hover:text-pink-700 hover:underline"
                              >
                                <ShoppingCart className="w-3 h-3" />
                                <span>View Cart</span>
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">No Cart</span>
                          )}

                          <div className="flex items-center gap-1 flex-wrap pt-0.5">
                            {s.isOrderPlaced || s.placedOrderId ? (
                              <a
                                href={`/admin/dashboard/orders?search=${s.placedOrderId}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300 flex items-center gap-1 transition-colors"
                                title="Click to view order details in admin panel"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span>Ordered #{s.placedOrderId || 'Completed'}</span>
                                {Number(s.placedOrderAmount) > 0 && (
                                  <span className="font-extrabold text-emerald-950">(৳{Number(s.placedOrderAmount).toLocaleString()})</span>
                                )}
                              </a>
                            ) : s.visitedCheckout ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                                Reached Checkout
                              </span>
                            ) : s.hasCart ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                Abandoned Cart
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </td>

                      {/* Device & System */}
                      <td className="py-4 px-4 align-top">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-xs text-slate-700">
                            {getDeviceIcon(s.device)}
                            <span className="font-medium">{s.device || 'Desktop'}</span>
                            <span className="text-slate-300">•</span>
                            <span className="text-slate-500">{s.browser || 'Browser'}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {s.ip || '127.0.0.1'}
                          </div>
                        </div>
                      </td>

                      {/* Active Duration */}
                      <td className="py-4 px-4 align-top">
                        <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-pink-500" />
                          <span>{formatDuration(s.durationSeconds)}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Total on site
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 align-top text-right whitespace-nowrap">
                        <button
                          ref={(el) => (buttonRefs.current[s._id || s.visitorId] = el)}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDropdownToggle(s);
                          }}
                          className="footprint-actions-btn inline-flex items-center justify-center w-8 h-8 rounded-xl bg-slate-50 hover:bg-pink-50 text-slate-500 hover:text-pink-600 border border-slate-200 transition-colors shadow-2xs"
                          title="Actions (or Right-Click row)"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between flex-wrap gap-2 text-xs">
            <span className="text-slate-500 font-medium">
              Showing page <span className="font-bold text-slate-800">{pagination.page}</span> of{' '}
              <span className="font-bold text-slate-800">{pagination.totalPages}</span> ({pagination.total} sessions)
            </span>

            <div className="flex items-center gap-1">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                disabled={currentPage >= pagination.totalPages}
                onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Step-by-Step Chronological Journey Timeline Modal */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[88vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-pink-100 bg-pink-50/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-600 to-rose-600 text-white font-extrabold flex items-center justify-center text-sm shadow-md shadow-pink-500/20">
                  #{selectedSession.dailySerial || '1'}
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span>Visitor Complete Footprint & Journey</span>
                    {selectedSession.customerName && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-pink-100 text-pink-700">
                        {selectedSession.customerName}
                      </span>
                    )}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-mono mt-0.5">
                    <span>{selectedSession.visitorId}</span>
                    {selectedSession.totalDaysCount > 1 && (
                      <>
                        <span>•</span>
                        <span className="text-indigo-600 font-semibold">{selectedSession.totalDaysCount} Days Active</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedSession(null)}
                className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 text-slate-500 flex items-center justify-center transition-colors shadow-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Visitor Profile Summary Bar */}
            <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-4 flex-wrap">
                {selectedSession.customerPhone && (
                  <a href={`tel:${selectedSession.customerPhone}`} className="font-semibold text-pink-600 flex items-center gap-1 hover:underline">
                    <Phone className="w-3.5 h-3.5" />
                    <span>{selectedSession.customerPhone}</span>
                  </a>
                )}
                <div className="text-slate-600 flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5 text-slate-400" />
                  <span><strong>{selectedSession.pageViewsCount || journeyEvents.length}</strong> Total Views</span>
                </div>
                {selectedSession.hasCart && (
                  <div className="text-amber-700 font-semibold flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>Cart: ৳{Number(selectedSession.cartTotal || 0).toLocaleString()}</span>
                  </div>
                )}
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                First Seen: {new Date(selectedSession.firstSeenAt || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
              </div>
            </div>

            {/* Modal Content - Date-wise Grouped Timeline */}
            <div className="p-6 overflow-y-auto space-y-6">
              {journeyLoading ? (
                <div className="py-12 text-center">
                  <RefreshCw className="w-6 h-6 text-pink-500 animate-spin mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-500">Loading full visitor history...</p>
                </div>
              ) : journeyEvents.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No recorded journey events found for this visitor.
                </div>
              ) : groupedJourneyDates && groupedJourneyDates.length > 0 ? (
                <div className="space-y-6">
                  {groupedJourneyDates.map((group, gIdx) => (
                    <div key={gIdx} className="space-y-4">
                      {/* Sticky Date Header */}
                      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm py-2 px-3 rounded-xl border border-pink-100 flex items-center justify-between shadow-xs">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-pink-600" />
                          <span className="text-xs font-bold text-slate-800">{group.label || group.date}</span>
                        </div>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-pink-50 text-pink-700 border border-pink-100">
                          {group.events?.length || 0} activities
                        </span>
                      </div>

                      {/* Timeline Events for this Date */}
                      <div className="relative pl-4 space-y-4">
                        <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-pink-200"></div>

                        {group.events.map((evt, idx) => {
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
                          const isLatest = gIdx === 0 && idx === 0;

                          return (
                            <div key={idx} className="relative flex items-start gap-4">
                              <div className={`w-3.5 h-3.5 rounded-full border-2 border-white z-10 flex-shrink-0 mt-0.5 ${
                                isLatest ? 'bg-pink-600 ring-4 ring-pink-300' :
                                isProfile ? 'bg-purple-600 ring-2 ring-purple-200' :
                                isCheckout ? 'bg-rose-500 ring-2 ring-rose-200' :
                                isCart ? 'bg-amber-500 ring-2 ring-amber-200' : 'bg-pink-400 ring-2 ring-pink-100'
                              }`}></div>

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
                                    {timeStr}
                                  </span>
                                </div>
                                <div className="text-[11px] font-mono text-slate-500 break-all">
                                  {evt.url}
                                </div>

                                {isProfile && evt.metadata?.phone && (
                                  <div className="mt-2 text-xs font-semibold text-purple-700 bg-purple-50 p-2 rounded-lg border border-purple-100">
                                    Captured Phone: {evt.metadata.phone} {evt.metadata.fullName && `| Name: ${evt.metadata.fullName}`}
                                  </div>
                                )}

                                {isCart && evt.metadata?.cartTotal > 0 && (
                                  <div className="mt-2 text-xs font-semibold text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-100">
                                    Cart Total: ৳{evt.metadata.cartTotal.toLocaleString()} ({evt.metadata.cartCount || 0} items)
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="relative pl-4 space-y-6">
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
                        <div className={`w-3.5 h-3.5 rounded-full border-2 border-white z-10 flex-shrink-0 mt-0.5 ${
                          isLatest ? 'bg-pink-600 ring-4 ring-pink-300' :
                          isProfile ? 'bg-purple-600 ring-2 ring-purple-200' :
                          isCheckout ? 'bg-rose-500 ring-2 ring-rose-200' :
                          isCart ? 'bg-amber-500 ring-2 ring-amber-200' : 'bg-pink-400 ring-2 ring-pink-100'
                        }`}></div>

                        <div className={`flex-1 p-3 rounded-xl border transition-all ${
                          isLatest ? 'bg-pink-50/60 border-pink-200 shadow-sm' : 'bg-slate-50 border-slate-100'
                        }`}>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="font-bold text-slate-800">{evt.title || evt.url}</span>
                            <span className="text-[11px] font-semibold text-pink-600 font-mono">{timeStr}</span>
                          </div>
                          <div className="text-[11px] font-mono text-slate-500 break-all">{evt.url}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="text-xs text-slate-500">
                Total <strong>{journeyEvents.length}</strong> recorded actions across <strong>{groupedJourneyDates.length || 1}</strong> dates
              </div>
              <button
                onClick={() => setSelectedSession(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send Custom Offer Modal */}
      <SendOfferModal
        isOpen={isOfferModalOpen}
        onClose={() => {
          setIsOfferModalOpen(false);
          setOfferTargetSession(null);
        }}
        targetVisitor={offerTargetSession}
        token={token}
      />

      {/* Shopper Cart Modal */}
      <ShopperCartModal
        isOpen={isCartModalOpen}
        onClose={() => {
          setIsCartModalOpen(false);
          setCartModalShopper(null);
        }}
        shopper={cartModalShopper}
      />

      {/* 3-Dot Floating Actions Dropdown Menu (Portal) */}
      {openDropdownId && typeof window !== 'undefined' && createPortal(
        (() => {
          const targetSession = sessions.find(s => (s._id || s.visitorId) === openDropdownId);
          if (!targetSession) return null;

          return (
            <div
              className="footprint-actions-dropdown w-52 bg-white rounded-2xl shadow-xl border border-slate-200/90 overflow-hidden text-xs py-1.5 animate-in fade-in zoom-in-95 duration-100 z-[9999]"
              style={dropdownPosition}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => {
                  setOpenDropdownId(null);
                  setOrderAsCustomerShopper(targetSession);
                  setIsOrderAsCustomerModalOpen(true);
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-pink-700 bg-pink-50/50 hover:bg-pink-100/70 transition-colors text-left font-bold"
              >
                <ShoppingBag className="w-4 h-4 text-pink-600" />
                <span>Order as Customer</span>
              </button>
              {targetSession.placedOrderId && (
                <a
                  href={`/admin/dashboard/orders?search=${targetSession.placedOrderId}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setOpenDropdownId(null)}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-emerald-700 hover:bg-emerald-50 transition-colors text-left font-bold"
                >
                  <ExternalLink className="w-4 h-4 text-emerald-600" />
                  <span>View Order #{targetSession.placedOrderId}</span>
                </a>
              )}
              <button
                type="button"
                onClick={() => {
                  setOpenDropdownId(null);
                  setCartModalShopper(targetSession);
                  setIsCartModalOpen(true);
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-slate-700 hover:bg-pink-50 hover:text-pink-700 transition-colors text-left font-medium"
              >
                <ShoppingCart className="w-4 h-4 text-emerald-600" />
                <span>View Cart</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setOpenDropdownId(null);
                  setOfferTargetSession(targetSession);
                  setIsOfferModalOpen(true);
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-slate-700 hover:bg-pink-50 hover:text-pink-700 transition-colors text-left font-medium"
              >
                <Zap className="w-4 h-4 text-pink-600" />
                <span>Send Offer</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setOpenDropdownId(null);
                  openJourneyModal(targetSession);
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-slate-700 hover:bg-pink-50 hover:text-pink-700 transition-colors text-left font-medium"
              >
                <Eye className="w-4 h-4 text-indigo-600" />
                <span>Timeline Journey</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setOpenDropdownId(null);
                  router.push(`/admin/dashboard/analytics/live-shoppers`);
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-slate-700 hover:bg-pink-50 hover:text-pink-700 transition-colors text-left font-medium"
              >
                <Activity className="w-4 h-4 text-rose-600" />
                <span>Live Stream</span>
              </button>
            </div>
          );
        })(),
        document.body
      )}

      {/* Right-Click Context Menu (Portal) */}
      {contextMenu.open && contextMenu.session && typeof window !== 'undefined' && createPortal(
        <div
          className="footprint-context-menu fixed w-48 bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden text-xs py-1.5 z-[9999] animate-in fade-in zoom-in-95 duration-100"
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">
            Visitor #{contextMenu.session.dailySerial || 'Actions'}
          </div>
          <button
            type="button"
            onClick={() => {
              const s = contextMenu.session;
              setContextMenu({ open: false, session: null, x: 0, y: 0 });
              setOrderAsCustomerShopper(s);
              setIsOrderAsCustomerModalOpen(true);
            }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-pink-700 bg-pink-50/50 hover:bg-pink-100/70 transition-colors text-left font-bold"
          >
            <ShoppingBag className="w-4 h-4 text-pink-600" />
            <span>Order as Customer</span>
          </button>
          {contextMenu.session.placedOrderId && (
            <a
              href={`/admin/dashboard/orders?search=${contextMenu.session.placedOrderId}`}
              target="_blank"
              rel="noreferrer"
              onClick={() => setContextMenu({ open: false, session: null, x: 0, y: 0 })}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-emerald-700 hover:bg-emerald-50 transition-colors text-left font-bold"
            >
              <ExternalLink className="w-4 h-4 text-emerald-600" />
              <span>View Order #{contextMenu.session.placedOrderId}</span>
            </a>
          )}
          <button
            type="button"
            onClick={() => {
              const s = contextMenu.session;
              setContextMenu({ open: false, session: null, x: 0, y: 0 });
              setCartModalShopper(s);
              setIsCartModalOpen(true);
            }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-slate-700 hover:bg-pink-50 hover:text-pink-700 transition-colors text-left font-medium"
          >
            <ShoppingCart className="w-4 h-4 text-emerald-600" />
            <span>View Cart</span>
          </button>
          <button
            type="button"
            onClick={() => {
              const s = contextMenu.session;
              setContextMenu({ open: false, session: null, x: 0, y: 0 });
              setOfferTargetSession(s);
              setIsOfferModalOpen(true);
            }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-slate-700 hover:bg-pink-50 hover:text-pink-700 transition-colors text-left font-medium"
          >
            <Zap className="w-4 h-4 text-pink-600" />
            <span>Send Offer</span>
          </button>
          <button
            type="button"
            onClick={() => {
              const s = contextMenu.session;
              setContextMenu({ open: false, session: null, x: 0, y: 0 });
              openJourneyModal(s);
            }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-slate-700 hover:bg-pink-50 hover:text-pink-700 transition-colors text-left font-medium"
          >
            <Eye className="w-4 h-4 text-indigo-600" />
            <span>Timeline Journey</span>
          </button>
          <button
            type="button"
            onClick={() => {
              const s = contextMenu.session;
              setContextMenu({ open: false, session: null, x: 0, y: 0 });
              router.push(`/admin/dashboard/analytics/live-shoppers`);
            }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-slate-700 hover:bg-pink-50 hover:text-pink-700 transition-colors text-left font-medium"
          >
            <Activity className="w-4 h-4 text-rose-600" />
            <span>Live Stream</span>
          </button>
        </div>,
        document.body
      )}

      {/* Order as Customer Modal */}
      {isOrderAsCustomerModalOpen && orderAsCustomerShopper && (
        <OrderAsCustomerModal
          shopper={orderAsCustomerShopper}
          isOpen={isOrderAsCustomerModalOpen}
          onClose={() => {
            setIsOrderAsCustomerModalOpen(false);
            setOrderAsCustomerShopper(null);
          }}
          onOrderCreated={(orderDoc) => {
            const orderId = orderDoc.orderId || orderDoc._id;
            setSessions(prev => prev.map(s => {
              if (s.visitorId === orderAsCustomerShopper.visitorId) {
                return {
                  ...s,
                  isOrderPlaced: true,
                  placedOrderId: orderId,
                  placedOrderAmount: orderDoc.total || orderDoc.totalAmount,
                  hasCart: false
                };
              }
              return s;
            }));
          }}
        />
      )}
    </div>
  );
}

export default function VisitorFootprintPage() {
  return (
    <Suspense fallback={
      <div className="p-12 text-center text-slate-400">
        <RefreshCw className="w-8 h-8 text-pink-500 animate-spin mx-auto mb-3" />
        <p className="text-sm font-semibold text-slate-600">Loading Visitor Footprint Analytics...</p>
      </div>
    }>
      <VisitorFootprintContent />
    </Suspense>
  );
}

