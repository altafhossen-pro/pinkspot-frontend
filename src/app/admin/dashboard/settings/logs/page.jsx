'use client';

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getCookie } from 'cookies-next';
import { settingsAPI } from '@/services/api';
import { 
  ArrowLeft,
  Terminal,
  FileText,
  Trash2,
  Download,
  RefreshCw,
  Edit3,
  Eye,
  Save,
  Copy,
  Check,
  Search,
  AlertTriangle,
  Play,
  Pause,
  Server,
  Activity,
  CheckCircle2,
  XCircle,
  X,
  Clock,
  HardDrive
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAppContext } from '@/context/AppContext';
import PermissionDenied from '@/components/Common/PermissionDenied';

function LogsManagementContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasPermission, contextLoading } = useAppContext();

  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'steadfast');
  const [checkingPermission, setCheckingPermission] = useState(true);
  const [hasReadPermission, setHasReadPermission] = useState(false);
  const [hasUpdatePermission, setHasUpdatePermission] = useState(false);

  // Steadfast Log States
  const [steadfastData, setSteadfastData] = useState({
    content: '',
    sizeBytes: 0,
    sizeFormatted: '0 B',
    linesCount: 0,
    exists: false,
    updatedAt: null
  });
  const [steadfastLoading, setSteadfastLoading] = useState(false);
  const [isEditingSteadfast, setIsEditingSteadfast] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [savingSteadfast, setSavingSteadfast] = useState(false);
  const [steadfastSearch, setSteadfastSearch] = useState('');
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearingSteadfast, setClearingSteadfast] = useState(false);
  const [copiedSteadfast, setCopiedSteadfast] = useState(false);

  // Server Log States
  const [serverService, setServerService] = useState('pinkspot-backend');
  const [serverLines, setServerLines] = useState(100);
  const [serverSearch, setServerSearch] = useState('');
  const [serverLogs, setServerLogs] = useState('');
  const [serverLoading, setServerLoading] = useState(false);
  const [isLiveStreaming, setIsLiveStreaming] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [copiedServerCmd, setCopiedServerCmd] = useState(false);
  const [copiedServerLogs, setCopiedServerLogs] = useState(false);
  const [lastServerFetchTime, setLastServerFetchTime] = useState(null);

  const serverConsoleRef = useRef(null);
  const pollingIntervalRef = useRef(null);

  // Check permissions
  useEffect(() => {
    if (contextLoading) return;
    const canRead = hasPermission('settings', 'read');
    const canUpdate = hasPermission('settings', 'update');
    setHasReadPermission(canRead);
    setHasUpdatePermission(!!canUpdate);
    setCheckingPermission(false);

    if (canRead) {
      if (activeTab === 'steadfast') {
        fetchSteadfastLogs();
      } else {
        fetchServerLogs();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contextLoading, activeTab]);

  // Sync tab with URL
  const switchTab = (tab) => {
    setActiveTab(tab);
    router.replace(`/admin/dashboard/settings/logs?tab=${tab}`);
    if (tab === 'steadfast') {
      fetchSteadfastLogs();
      setIsLiveStreaming(false);
    } else {
      fetchServerLogs();
    }
  };

  // ----------------------------------------------------
  // Steadfast Error Log Logic
  // ----------------------------------------------------
  const fetchSteadfastLogs = async () => {
    try {
      setSteadfastLoading(true);
      const token = getCookie('token');
      const response = await settingsAPI.getSteadfastLogs(token);

      if (response.success && response.data) {
        setSteadfastData(response.data);
        setEditedContent(response.data.content || '');
      } else {
        toast.error(response.message || 'Failed to fetch Steadfast logs');
      }
    } catch (error) {
      console.error('Error fetching Steadfast logs:', error);
      toast.error(error?.response?.data?.message || 'Error fetching Steadfast logs');
    } finally {
      setSteadfastLoading(false);
    }
  };

  const handleSaveSteadfast = async () => {
    if (!hasUpdatePermission) {
      toast.error("You don't have permission to update logs");
      return;
    }

    try {
      setSavingSteadfast(true);
      const token = getCookie('token');
      const response = await settingsAPI.updateSteadfastLogs(editedContent, token);

      if (response.success) {
        toast.success('Steadfast error log saved successfully');
        setIsEditingSteadfast(false);
        fetchSteadfastLogs();
      } else {
        toast.error(response.message || 'Failed to save log changes');
      }
    } catch (error) {
      console.error('Error saving Steadfast log:', error);
      toast.error(error?.response?.data?.message || 'Error saving Steadfast log');
    } finally {
      setSavingSteadfast(false);
    }
  };

  const handleClearSteadfast = async () => {
    if (!hasUpdatePermission) {
      toast.error("You don't have permission to clear logs");
      return;
    }

    try {
      setClearingSteadfast(true);
      const token = getCookie('token');
      const response = await settingsAPI.clearSteadfastLogs(token);

      if (response.success) {
        toast.success('Steadfast error log cleared successfully');
        setShowClearModal(false);
        setSteadfastData({
          content: '',
          sizeBytes: 0,
          sizeFormatted: '0 B',
          linesCount: 0,
          exists: true,
          updatedAt: new Date()
        });
        setEditedContent('');
        setIsEditingSteadfast(false);
      } else {
        toast.error(response.message || 'Failed to clear log');
      }
    } catch (error) {
      console.error('Error clearing Steadfast log:', error);
      toast.error(error?.response?.data?.message || 'Error clearing Steadfast log');
    } finally {
      setClearingSteadfast(false);
    }
  };

  const handleDownloadSteadfast = () => {
    if (!steadfastData.content) {
      toast.error('Log file is empty');
      return;
    }
    const blob = new Blob([steadfastData.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `steadfast_errors_${new Date().toISOString().slice(0, 10)}.log`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Steadfast log downloaded');
  };

  const handleCopySteadfast = () => {
    if (!steadfastData.content) return;
    navigator.clipboard.writeText(steadfastData.content);
    setCopiedSteadfast(true);
    toast.success('Log copied to clipboard');
    setTimeout(() => setCopiedSteadfast(false), 2000);
  };

  // Filtered Steadfast content based on search query
  const filteredSteadfastContent = React.useMemo(() => {
    if (!steadfastData.content) return '';
    if (!steadfastSearch.trim()) return steadfastData.content;

    const term = steadfastSearch.trim().toLowerCase();
    const blocks = steadfastData.content.split(/\n(?=---)/);
    const matchedBlocks = blocks.filter(b => b.toLowerCase().includes(term));
    return matchedBlocks.length > 0
      ? matchedBlocks.join('\n')
      : `// No error log entries found matching "${steadfastSearch}"`;
  }, [steadfastData.content, steadfastSearch]);

  // ----------------------------------------------------
  // Server Live Logs Logic
  // ----------------------------------------------------
  const fetchServerLogs = useCallback(async (isBackground = false) => {
    try {
      if (!isBackground) setServerLoading(true);
      const token = getCookie('token');
      const response = await settingsAPI.getServerLogs({
        service: serverService,
        lines: serverLines,
        search: serverSearch
      }, token);

      if (response.success && response.data) {
        setServerLogs(response.data.logs || 'No log output received.');
        setLastServerFetchTime(new Date().toLocaleTimeString());
      } else if (!isBackground) {
        toast.error(response.message || 'Failed to fetch server logs');
      }
    } catch (error) {
      if (!isBackground) {
        console.error('Error fetching server logs:', error);
        toast.error(error?.response?.data?.message || 'Error fetching server logs');
      }
    } finally {
      if (!isBackground) setServerLoading(false);
    }
  }, [serverService, serverLines, serverSearch]);

  // Live polling effect
  useEffect(() => {
    if (activeTab !== 'server') {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
      return;
    }

    if (isLiveStreaming) {
      pollingIntervalRef.current = setInterval(() => {
        fetchServerLogs(true);
      }, 3000);
    } else {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    }

    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    };
  }, [activeTab, isLiveStreaming, fetchServerLogs]);

  // Auto-scroll console
  useEffect(() => {
    if (autoScroll && serverConsoleRef.current) {
      serverConsoleRef.current.scrollTop = serverConsoleRef.current.scrollHeight;
    }
  }, [serverLogs, autoScroll]);

  const handleCopyServerCmd = () => {
    const cmd = `journalctl -u ${serverService} -n ${serverLines} -f`;
    navigator.clipboard.writeText(cmd);
    setCopiedServerCmd(true);
    toast.success('VPS CLI command copied!');
    setTimeout(() => setCopiedServerCmd(false), 2000);
  };

  const handleCopyServerLogs = () => {
    if (!serverLogs) return;
    navigator.clipboard.writeText(serverLogs);
    setCopiedServerLogs(true);
    toast.success('Server logs copied!');
    setTimeout(() => setCopiedServerLogs(false), 2000);
  };

  if (checkingPermission || contextLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
        </div>
      </div>
    );
  }

  if (!hasReadPermission) {
    return (
      <PermissionDenied
        title="Access Denied"
        message="You don't have permission to access system and error logs"
        action="Contact your administrator for access"
        showBackButton={true}
      />
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <button
            onClick={() => router.push('/admin/dashboard/settings')}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors text-sm mb-2 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Settings Hub</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-100 rounded-xl">
              <Terminal className="h-6 w-6 text-rose-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Logs & Diagnostics</h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Inspect Steadfast delivery errors, edit logs, and monitor realtime server activity
              </p>
            </div>
          </div>
        </div>

        {/* Tab Switcher Pills */}
        <div className="flex items-center p-1 bg-slate-100 rounded-xl self-start sm:self-auto border border-slate-200">
          <button
            onClick={() => switchTab('steadfast')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'steadfast'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4 text-orange-500" />
            <span>Steadfast Error Log</span>
            {steadfastData.sizeBytes > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] bg-orange-100 text-orange-700 rounded-full font-mono">
                {steadfastData.sizeFormatted}
              </span>
            )}
          </button>

          <button
            onClick={() => switchTab('server')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'server'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Server className="w-4 h-4 text-emerald-500" />
            <span>Server Live Logs</span>
            {isLiveStreaming && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            )}
          </button>
        </div>
      </div>

      {/* ==================================================== */}
      {/* TAB 1: STEADFAST ERROR LOG                          */}
      {/* ==================================================== */}
      {activeTab === 'steadfast' && (
        <div className="space-y-4">
          {/* Metadata & Controls Bar */}
          <div className="bg-white rounded-2xl p-4 md:p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* File Stats */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
                <HardDrive className="w-3.5 h-3.5 text-slate-400" />
                <span>File Size:</span>
                <span className={`font-mono font-bold ${steadfastData.sizeBytes > 500000 ? 'text-red-600' : 'text-slate-800'}`}>
                  {steadfastData.sizeFormatted}
                </span>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span>Lines:</span>
                <span className="font-mono font-bold text-slate-800">{steadfastData.linesCount}</span>
              </div>

              {steadfastData.updatedAt && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Last Updated:</span>
                  <span className="font-medium text-slate-700">
                    {new Date(steadfastData.updatedAt).toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Search in log */}
              {!isEditingSteadfast && (
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={steadfastSearch}
                    onChange={(e) => setSteadfastSearch(e.target.value)}
                    placeholder="Search errors..."
                    className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:border-rose-500 w-36 sm:w-44 transition-all"
                  />
                  {steadfastSearch && (
                    <button
                      onClick={() => setSteadfastSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}

              {/* Mode Toggle (View vs Edit) */}
              {hasUpdatePermission && (
                <button
                  type="button"
                  onClick={() => setIsEditingSteadfast(!isEditingSteadfast)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer border ${
                    isEditingSteadfast
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  {isEditingSteadfast ? <Eye className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
                  <span>{isEditingSteadfast ? 'Exit Edit Mode' : 'Edit Log'}</span>
                </button>
              )}

              {/* Save Button (when editing) */}
              {isEditingSteadfast && (
                <button
                  type="button"
                  onClick={handleSaveSteadfast}
                  disabled={savingSteadfast}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingSteadfast ? 'Saving...' : 'Save Changes'}</span>
                </button>
              )}

              {/* Copy */}
              {!isEditingSteadfast && steadfastData.content && (
                <button
                  type="button"
                  onClick={handleCopySteadfast}
                  className="p-1.5 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 cursor-pointer transition-colors"
                  title="Copy log to clipboard"
                >
                  {copiedSteadfast ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              )}

              {/* Download */}
              {!isEditingSteadfast && steadfastData.content && (
                <button
                  type="button"
                  onClick={handleDownloadSteadfast}
                  className="p-1.5 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 cursor-pointer transition-colors"
                  title="Download .log file"
                >
                  <Download className="w-4 h-4" />
                </button>
              )}

              {/* Refresh */}
              <button
                type="button"
                onClick={fetchSteadfastLogs}
                disabled={steadfastLoading}
                className="p-1.5 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 cursor-pointer transition-colors disabled:opacity-50"
                title="Refresh log"
              >
                <RefreshCw className={`w-4 h-4 ${steadfastLoading ? 'animate-spin text-rose-600' : ''}`} />
              </button>

              {/* Clear */}
              {hasUpdatePermission && steadfastData.content && (
                <button
                  type="button"
                  onClick={() => setShowClearModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  title="Clear all log entries"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Clear Log</span>
                </button>
              )}
            </div>
          </div>

          {/* Main Log Editor / Viewer Window */}
          <div className="bg-slate-950 rounded-2xl shadow-xl border border-slate-800 overflow-hidden flex flex-col">
            {/* Terminal Window Header */}
            <div className="px-4 py-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
                <span className="ml-2 font-mono text-xs text-slate-400">
                  ecommerce-backend/logs/steadfast_errors.log
                </span>
              </div>
              <div className="text-[11px] font-mono text-slate-400 flex items-center gap-3">
                <span>{isEditingSteadfast ? '✏️ Mode: EDITABLE' : '👁️ Mode: READ-ONLY'}</span>
                <span>UTF-8</span>
              </div>
            </div>

            {/* Content Area */}
            {isEditingSteadfast ? (
              <div className="relative">
                <textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  rows={22}
                  className="w-full bg-slate-950 text-slate-100 font-mono text-xs md:text-sm p-4 focus:outline-none resize-y selection:bg-rose-500/30 leading-relaxed border-none"
                  placeholder="Paste or write error log entries..."
                  spellCheck={false}
                />
              </div>
            ) : steadfastLoading ? (
              <div className="h-96 flex flex-col items-center justify-center text-slate-400 gap-3">
                <RefreshCw className="w-6 h-6 animate-spin text-rose-500" />
                <span className="text-xs font-mono">Loading Steadfast error logs...</span>
              </div>
            ) : !steadfastData.content ? (
              <div className="h-80 flex flex-col items-center justify-center text-slate-400 p-6 text-center">
                <div className="w-14 h-14 bg-emerald-500/10 rounded-full flex items-center justify-center mb-3">
                  <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                </div>
                <h3 className="text-sm font-semibold text-slate-200">No Steadfast Errors Found</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  The error log is clean! When delivery integration errors happen, they will be logged here with complete endpoint and payload details.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto p-4 font-mono text-xs md:text-sm text-slate-200 selection:bg-rose-500/30 leading-relaxed">
                <pre className="whitespace-pre-wrap break-all">
                  {filteredSteadfastContent.split('\n').map((line, idx) => {
                    const isHeader = line.startsWith('---');
                    const isEndpoint = line.startsWith('Endpoint:');
                    const isPayload = line.startsWith('Payload:');
                    const isResponse = line.startsWith('Response:');

                    let lineStyle = 'text-slate-300';
                    if (isHeader) lineStyle = 'text-amber-400 font-bold';
                    else if (isEndpoint) lineStyle = 'text-cyan-400 font-semibold';
                    else if (isPayload) lineStyle = 'text-indigo-300';
                    else if (isResponse) lineStyle = 'text-rose-400 font-semibold';

                    return (
                      <div key={idx} className="flex hover:bg-slate-900/60 px-1.5 rounded-sm">
                        <span className="select-none text-slate-600 text-right pr-4 w-10 text-[11px] shrink-0 font-mono">
                          {idx + 1}
                        </span>
                        <span className={lineStyle}>{line}</span>
                      </div>
                    );
                  })}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 2: SERVER REALTIME LOGS (JOURNALCTL CONSOLE)    */}
      {/* ==================================================== */}
      {activeTab === 'server' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white rounded-2xl p-4 md:p-5 border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Service & Lines Selector */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Service Pills */}
              <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setServerService('pinkspot-backend')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    serverService === 'pinkspot-backend'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Backend (pinkspot-backend)
                </button>
                <button
                  type="button"
                  onClick={() => setServerService('pinkspot-frontend')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    serverService === 'pinkspot-frontend'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Frontend (pinkspot-frontend)
                </button>
                <button
                  type="button"
                  onClick={() => setServerService('all')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    serverService === 'all'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Combined All
                </button>
              </div>

              {/* Lines count */}
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <span className="font-medium text-slate-500">Lines:</span>
                <select
                  value={serverLines}
                  onChange={(e) => setServerLines(Number(e.target.value))}
                  className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 font-semibold focus:ring-2 focus:ring-rose-500 cursor-pointer"
                >
                  <option value={50}>50 lines</option>
                  <option value={100}>100 lines</option>
                  <option value={200}>200 lines</option>
                  <option value={500}>500 lines</option>
                </select>
              </div>
            </div>

            {/* Live Streaming, Search & Actions */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Search Filter */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={serverSearch}
                  onChange={(e) => setServerSearch(e.target.value)}
                  placeholder="Filter logs (e.g. error, 400)..."
                  className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:border-rose-500 w-36 sm:w-48 transition-all"
                />
                {serverSearch && (
                  <button
                    onClick={() => setServerSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Live Streaming Toggle */}
              <button
                type="button"
                onClick={() => setIsLiveStreaming(!isLiveStreaming)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                  isLiveStreaming
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200'
                }`}
                title={isLiveStreaming ? 'Pause live stream' : 'Start live polling every 3s'}
              >
                {isLiveStreaming ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                    <Pause className="w-3.5 h-3.5" />
                    <span>Live Stream Active</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Start Live Stream</span>
                  </>
                )}
              </button>

              {/* Auto Scroll Toggle */}
              <button
                type="button"
                onClick={() => setAutoScroll(!autoScroll)}
                className={`px-2.5 py-1.5 text-xs rounded-lg border transition-colors cursor-pointer ${
                  autoScroll
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold'
                    : 'bg-white text-slate-500 border-slate-200'
                }`}
                title="Auto scroll to bottom on new log lines"
              >
                Auto-scroll
              </button>

              {/* Copy Server Logs */}
              <button
                type="button"
                onClick={handleCopyServerLogs}
                className="p-1.5 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 cursor-pointer transition-colors"
                title="Copy current console output"
              >
                {copiedServerLogs ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>

              {/* Refresh Button */}
              <button
                type="button"
                onClick={() => fetchServerLogs()}
                disabled={serverLoading}
                className="p-1.5 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 cursor-pointer transition-colors disabled:opacity-50"
                title="Fetch latest lines"
              >
                <RefreshCw className={`w-4 h-4 ${serverLoading ? 'animate-spin text-rose-600' : ''}`} />
              </button>
            </div>
          </div>

          {/* Quick VPS CLI Hint Banner */}
          <div className="bg-slate-900 text-slate-300 rounded-xl p-3 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs border border-slate-800">
            <div className="flex items-center gap-2 font-mono">
              <span className="text-emerald-400 font-bold">$</span>
              <span>journalctl -u {serverService} -n {serverLines} -f</span>
            </div>
            <button
              type="button"
              onClick={handleCopyServerCmd}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-mono text-[11px] transition-colors cursor-pointer self-start sm:self-auto border border-slate-700"
            >
              {copiedServerCmd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedServerCmd ? 'Copied' : 'Copy VPS Command'}</span>
            </button>
          </div>

          {/* Realtime Terminal Console Window */}
          <div className="bg-slate-950 rounded-2xl shadow-2xl border border-slate-800 overflow-hidden flex flex-col">
            {/* Terminal Chrome Header */}
            <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
                <span className="ml-2 font-mono text-xs text-slate-300 font-semibold flex items-center gap-2">
                  <span>root@pinkspot:/var/www/pinkspot#</span>
                  <span className="text-emerald-400 font-normal">[{serverService}]</span>
                </span>
              </div>
              <div className="text-[11px] font-mono text-slate-400 flex items-center gap-3">
                {lastServerFetchTime && (
                  <span className="text-slate-500">Updated: {lastServerFetchTime}</span>
                )}
                {isLiveStreaming ? (
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    STREAMING
                  </span>
                ) : (
                  <span className="text-slate-500">PAUSED</span>
                )}
              </div>
            </div>

            {/* Console Body */}
            <div
              ref={serverConsoleRef}
              className="h-[550px] overflow-y-auto p-4 font-mono text-xs text-slate-200 leading-relaxed selection:bg-rose-500/30"
            >
              {serverLoading && !serverLogs ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-rose-500" />
                  <span className="text-xs">Connecting to server journalctl...</span>
                </div>
              ) : !serverLogs ? (
                <div className="h-full flex items-center justify-center text-slate-500">
                  No log entries returned.
                </div>
              ) : (
                <pre className="whitespace-pre-wrap break-all">
                  {serverLogs.split('\n').map((line, idx) => {
                    const isError = /error|failed|exception|status 5\d\d|status 4\d\d/i.test(line);
                    const isSuccess = /200|201|success|connected/i.test(line);
                    const isNotice = /warning|notice|timeout/i.test(line);

                    let color = 'text-slate-300';
                    if (isError) color = 'text-rose-400 font-semibold';
                    else if (isNotice) color = 'text-amber-300';
                    else if (isSuccess) color = 'text-emerald-300';

                    return (
                      <div key={idx} className="flex hover:bg-slate-900/60 px-1 rounded-xs">
                        <span className="select-none text-slate-600 text-right pr-4 w-9 text-[11px] shrink-0 font-mono">
                          {idx + 1}
                        </span>
                        <span className={color}>{line}</span>
                      </div>
                    );
                  })}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Clear Confirmation Modal */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-150 border border-slate-200">
            <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6 text-rose-600" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-slate-900">Clear Steadfast Error Log?</h3>
              <p className="text-xs text-slate-500 mt-2">
                This will permanently erase all error records in <code className="bg-slate-100 px-1 py-0.5 rounded text-rose-600">steadfast_errors.log</code>. The file size will reset to 0 bytes. This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowClearModal(false)}
                className="flex-1 py-2.5 px-4 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearSteadfast}
                disabled={clearingSteadfast}
                className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors cursor-pointer disabled:opacity-50"
              >
                {clearingSteadfast ? 'Clearing...' : 'Yes, Clear Log'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LogsManagementPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading logs...</div>}>
      <LogsManagementContent />
    </Suspense>
  );
}

