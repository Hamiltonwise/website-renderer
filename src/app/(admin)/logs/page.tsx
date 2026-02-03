'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Globe,
  RefreshCw,
  Trash2,
  AlertCircle,
  Terminal,
} from 'lucide-react';

interface LogsData {
  logs: string[];
  total_lines: number;
  timestamp: string;
  log_type: string;
}

interface LogsResponse {
  success: boolean;
  data: LogsData;
  message?: string;
}

// Log type configuration
const LOG_TABS = [
  {
    id: 'website-scrape',
    label: 'Website Scrape',
    description: 'Website scraping logs',
    icon: Globe,
    filename: 'website-scrape.log',
  },
] as const;

type LogType = (typeof LOG_TABS)[number]['id'];

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      type: 'spring' as const,
      stiffness: 100,
    },
  },
};

export default function LogsPage() {
  const [activeTab, setActiveTab] = useState<LogType>('website-scrape');
  const [logs, setLogs] = useState<string[]>([]);
  const [totalLines, setTotalLines] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Fetch logs for the active tab
  const fetchLogs = useCallback(async () => {
    try {
      const response = await fetch(`/api/logs?type=${activeTab}&lines=500`);
      const data: LogsResponse = await response.json();

      if (data.success) {
        setLogs(data.data.logs);
        setTotalLines(data.data.total_lines);
        setError(null);
      } else {
        setError(data.message || 'Failed to fetch logs');
      }
    } catch (err) {
      console.error('Failed to fetch logs:', err);
      setError('Failed to load logs. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  // Clear logs for the active tab
  const handleClearLogs = async () => {
    const tabLabel = LOG_TABS.find((t) => t.id === activeTab)?.label || activeTab;
    if (!window.confirm(`Are you sure you want to clear all ${tabLabel} logs?`)) {
      return;
    }

    setClearing(true);
    try {
      const response = await fetch(`/api/logs?type=${activeTab}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (data.success) {
        setLogs([]);
        setTotalLines(0);
        setError(null);
      } else {
        setError(data.message || 'Failed to clear logs');
      }
    } catch (err) {
      console.error('Failed to clear logs:', err);
      setError('Failed to clear logs. Please try again.');
    } finally {
      setClearing(false);
    }
  };

  // Auto-scroll to bottom when new logs arrive
  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch logs when tab changes
  useEffect(() => {
    setLoading(true);
    setLogs([]);
    fetchLogs();
  }, [activeTab, fetchLogs]);

  // Auto-refresh every 2 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchLogs();
    }, 2000);

    return () => clearInterval(interval);
  }, [autoRefresh, activeTab, fetchLogs]);

  // Auto-scroll when logs update
  useEffect(() => {
    if (logs.length > 0) {
      scrollToBottom();
    }
  }, [logs]);

  const activeTabInfo = LOG_TABS.find((t) => t.id === activeTab);

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-100 to-brand-50 flex items-center justify-center">
              <FileText className="w-6 h-6 text-brand-500" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Logs</h1>
              <p className="text-gray-600 font-light">Monitor system events and activities</p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {/* Auto-refresh toggle */}
            <motion.button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                autoRefresh
                  ? 'bg-green-100 text-green-700 border border-green-200'
                  : 'bg-gray-100 text-gray-600 border border-gray-200'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <motion.div
                animate={autoRefresh ? { rotate: 360 } : { rotate: 0 }}
                transition={
                  autoRefresh ? { duration: 1, repeat: Infinity, ease: 'linear' } : {}
                }
              >
                <RefreshCw className="h-4 w-4" />
              </motion.div>
              {autoRefresh ? 'Live' : 'Paused'}
            </motion.button>

            {/* Manual refresh */}
            <motion.button
              onClick={fetchLogs}
              disabled={autoRefresh}
              className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200 transition-all disabled:opacity-50"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </motion.button>

            {/* Clear logs */}
            <motion.button
              onClick={handleClearLogs}
              disabled={clearing || logs.length === 0}
              className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-all disabled:opacity-50"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Trash2 className="h-4 w-4" />
              {clearing ? 'Clearing...' : 'Clear'}
            </motion.button>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex gap-2 mb-6"
        >
          {LOG_TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-brand-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </motion.div>

        {/* Status Bar */}
        <motion.div
          className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 mb-6"
          initial="hidden"
          animate="visible"
          variants={cardVariants}
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Source:</span>
              <span className="text-sm font-medium text-gray-800">
                {activeTabInfo?.description}
              </span>
            </div>
            <span className="text-gray-300">|</span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Lines:</span>
              <span className="text-sm font-medium text-gray-800">
                {logs.length} / {totalLines}
              </span>
            </div>
            {autoRefresh && (
              <>
                <span className="text-gray-300">|</span>
                <div className="flex items-center gap-2">
                  <motion.span
                    className="w-2 h-2 rounded-full bg-green-500"
                    animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                  <span className="text-sm text-green-600 font-medium">Live updating</span>
                </div>
              </>
            )}
          </div>
        </motion.div>

        {/* Error message */}
        <AnimatePresence>
          {error && (
            <motion.div
              className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 mb-6"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900">Error</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Logs container */}
        <motion.div
          className="rounded-2xl border border-gray-200 bg-gray-900 shadow-lg overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Terminal header */}
          <div className="flex items-center gap-2 px-4 py-3 bg-gray-800 border-b border-gray-700">
            <div className="flex gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-500" />
              <span className="w-3 h-3 rounded-full bg-yellow-500" />
              <span className="w-3 h-3 rounded-full bg-green-500" />
            </div>
            <span className="text-xs text-gray-400 ml-2 font-mono">
              {activeTabInfo?.filename}
            </span>
          </div>

          {/* Logs content */}
          <div
            className="text-gray-100 font-mono text-xs p-4 overflow-auto"
            style={{ height: '500px' }}
          >
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <motion.div
                  className="flex items-center gap-3 text-gray-400"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Loading logs...
                </motion.div>
              </div>
            ) : logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <Terminal className="w-12 h-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">No logs available</p>
                <p className="text-sm">No logs found for {activeTabInfo?.label}</p>
              </div>
            ) : (
              <div className="space-y-0">
                {logs.map((line, index) => (
                  <motion.div
                    key={index}
                    className={`flex hover:bg-gray-800/50 px-2 py-0.5 rounded transition-colors ${
                      line.includes('ERROR') || line.includes('Failed')
                        ? 'border-l-2 border-red-500 bg-red-900/10'
                        : line.includes('SUCCESS') || line.includes('completed')
                        ? 'border-l-2 border-green-500 bg-green-900/10'
                        : line.includes('WARN')
                        ? 'border-l-2 border-yellow-500 bg-yellow-900/10'
                        : 'border-l-2 border-transparent'
                    }`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.1, delay: Math.min(index * 0.001, 0.5) }}
                  >
                    <span className="text-gray-600 select-none w-12 text-right mr-4 shrink-0">
                      {index + 1}
                    </span>
                    <span
                      className={
                        line.includes('ERROR') || line.includes('Failed')
                          ? 'text-red-400'
                          : line.includes('SUCCESS') || line.includes('completed')
                          ? 'text-green-400'
                          : line.includes('WARN')
                          ? 'text-yellow-400'
                          : 'text-gray-300'
                      }
                    >
                      {line}
                    </span>
                  </motion.div>
                ))}
                <div ref={logsEndRef} />
              </div>
            )}
          </div>
        </motion.div>

        {/* Legend */}
        <motion.div
          className="flex items-center gap-6 text-xs text-gray-500 mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-2">
            <span className="w-3 h-0.5 bg-red-500 rounded" />
            <span>Error</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-0.5 bg-yellow-500 rounded" />
            <span>Warning</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-0.5 bg-green-500 rounded" />
            <span>Success</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
