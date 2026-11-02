import React, { useState, useEffect } from 'react';
import { getApiBaseUrl, setApiBaseUrl, isApiConfigured } from '../../services/api';
import { AlertCircleIcon, SettingsIcon, CheckCircleIcon, XIcon } from './Icons';

export const ApiConfigBanner: React.FC = () => {
  const [configured, setConfigured] = useState<boolean>(true);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [inputUrl, setInputUrl] = useState<string>('');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState<string>('');

  useEffect(() => {
    const checkConfig = () => {
      const isConfigged = isApiConfigured();
      setConfigured(isConfigged);
      if (!isConfigged) {
        setInputUrl(getApiBaseUrl() || '');
      }
    };

    checkConfig();

    const handleUrlChange = () => checkConfig();
    window.addEventListener('crm:api-url-changed', handleUrlChange);
    return () => window.removeEventListener('crm:api-url-changed', handleUrlChange);
  }, []);

  if (configured && !isOpen) {
    return null;
  }

  const handleTestConnection = async () => {
    if (!inputUrl.trim()) {
      setTestStatus('error');
      setTestMessage('Please enter a valid backend URL.');
      return;
    }

    setTestStatus('testing');
    setTestMessage('Testing backend reachability...');

    const clean = inputUrl.trim().replace(/\/+$/, '');
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);

      // Try hitting /docs or /auth/me
      const res = await fetch(`${clean}/auth/me`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      }).catch(async () => {
        // If /auth/me returns 401 or whatever, server is alive! If fetch rejected, try /
        return fetch(clean, { method: 'HEAD', signal: controller.signal });
      });

      clearTimeout(timeout);

      // If we got ANY HTTP response (200, 401, 403, 404 from NestJS), the backend is online!
      if (res && res.status) {
        setTestStatus('success');
        setTestMessage(`Backend responded with HTTP status ${res.status}. Server is active!`);
      } else {
        setTestStatus('error');
        setTestMessage('Could not reach backend. Verify the URL is correct and the service is deployed.');
      }
    } catch (err: any) {
      setTestStatus('error');
      setTestMessage(
        err.name === 'AbortError'
          ? 'Connection timed out. If using Render free tier, the backend might be waking up.'
          : `Connection failed: ${err.message || 'Network error'}`
      );
    }
  };

  const handleSave = () => {
    const clean = inputUrl.trim().replace(/\/+$/, '');
    if (!clean) {
      alert('Please enter your backend URL.');
      return;
    }
    setApiBaseUrl(clean);
    setIsOpen(false);
    window.location.reload();
  };

  return (
    <>
      {/* Top Banner when API is unconfigured */}
      {!configured && (
        <aside
          role="status"
          aria-live="polite"
          className="fixed top-0 left-0 right-0 z-50 bg-amber-500/95 backdrop-blur text-slate-900 px-4 py-2.5 shadow-md flex items-center justify-between text-xs sm:text-sm font-medium border-b border-amber-600/30"
        >
          <div className="flex items-center gap-2 max-w-4xl truncate">
            <AlertCircleIcon size={18} className="text-slate-950 shrink-0" />
            <span>
              <strong>Backend Not Connected:</strong> The frontend is running on Render, but needs your backend API server URL to authenticate and load data.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-3">
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="bg-slate-950 text-white px-3 py-1 rounded-md text-xs font-semibold hover:bg-slate-800 transition-colors shadow-sm flex items-center gap-1.5"
            >
              <SettingsIcon size={13} />
              <span>Connect Backend</span>
            </button>
          </div>
        </aside>
      )}

      {/* API Configuration Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl max-w-lg w-full p-6 text-slate-100 relative">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <XIcon size={18} />
            </button>

            <div className="flex items-center gap-2.5 mb-2 text-indigo-400">
              <SettingsIcon size={20} />
              <h3 className="text-base font-bold text-white">Backend API Server Configuration</h3>
            </div>

            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Connect this frontend build to your CRM backend API service (hosted on Render, Railway, or local tunnel).
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Backend API URL
                </label>
                <input
                  type="url"
                  placeholder="https://your-crm-backend.onrender.com"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                />
              </div>

              {testStatus !== 'idle' && (
                <div
                  className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                    testStatus === 'testing'
                      ? 'bg-blue-950/60 border border-blue-800 text-blue-300'
                      : testStatus === 'success'
                      ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
                      : 'bg-rose-950/60 border border-rose-800 text-rose-300'
                  }`}
                >
                  {testStatus === 'testing' && <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full" />}
                  {testStatus === 'success' && <CheckCircleIcon size={15} className="text-emerald-400 shrink-0" />}
                  {testStatus === 'error' && <AlertCircleIcon size={15} className="text-rose-400 shrink-0" />}
                  <span>{testMessage}</span>
                </div>
              )}

              <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-3 text-[11px] text-slate-400 space-y-1">
                <p className="font-semibold text-slate-300">Permanent Render Static Site Setup:</p>
                <ol className="list-decimal list-inside space-y-0.5 text-slate-400">
                  <li>Open Render Dashboard &rarr; Static Site &rarr; <strong>Environment</strong>.</li>
                  <li>Add variable: <code className="text-indigo-300 bg-slate-900/80 px-1 py-0.5 rounded">VITE_API_URL</code> = your backend URL.</li>
                  <li>Click <strong>Manual Deploy &rarr; Clear build cache &amp; deploy</strong>.</li>
                </ol>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testStatus === 'testing'}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
                >
                  {testStatus === 'testing' ? 'Testing...' : 'Test Connection'}
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-sm"
                  >
                    Save &amp; Connect
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
