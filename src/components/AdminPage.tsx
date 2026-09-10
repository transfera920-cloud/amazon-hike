import React, { useState, useEffect } from 'react';
import {
  Lock,
  ArrowLeft,
  Plus,
  Edit2,
  Save,
  LogOut,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Wrench,
  Video,
  FileQuestion,
  Shield,
  Trash2,
  LayoutGrid,
  RotateCcw,
  ExternalLink,
  Globe
} from 'lucide-react';
import type {
  IntroItem,
  ToolItem,
  HighlightItem,
  PolicyItem,
  SurveyItem,
  NavButtonItem,
  AssociationDatabase
} from '../types.js';

interface AdminPageProps {
  onBack: () => void;
  onDataUpdated: () => void;
}

type AdminTab = 'intro' | 'tools' | 'highlights' | 'survey' | 'policies' | 'buttons';

export const AdminPage: React.FC<AdminPageProps> = ({ onBack, onDataUpdated }) => {
  // Auth state
  const [token, setToken] = useState<string>(() => {
    return sessionStorage.getItem('amazon_admin_session_token') || '';
  });
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState<AdminTab>('intro');

  // Full admin data loaded from server
  const [adminData, setAdminData] = useState<AssociationDatabase | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // Edit / Form state
  const [editingIntro, setEditingIntro] = useState<Partial<IntroItem> | null>(null);
  const [editingTool, setEditingTool] = useState<Partial<ToolItem> | null>(null);
  const [editingHighlight, setEditingHighlight] = useState<Partial<HighlightItem> | null>(null);
  const [surveyUrlInput, setSurveyUrlInput] = useState('');
  const [editingSurvey, setEditingSurvey] = useState<Partial<SurveyItem> | null>(null);
  const [editingPolicy, setEditingPolicy] = useState<Partial<PolicyItem> | null>(null);
  const [editingNavButton, setEditingNavButton] = useState<Partial<NavButtonItem> | null>(null);

  // In-app deletion modal
  const [deleteTarget, setDeleteTarget] = useState<{
    type: string;
    id: string;
    name: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [showResetNavModal, setShowResetNavModal] = useState(false);
  const [isResettingNav, setIsResettingNav] = useState(false);

  // Fetch full data from server API
  const fetchAdminData = async (authToken: string) => {
    setLoadingData(true);
    try {
      const res = await fetch(`/api/admin/data?_t=${Date.now()}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        cache: 'no-store',
      });

      if (res.status === 401 || res.status === 403) {
        setToken('');
        sessionStorage.removeItem('amazon_admin_session_token');
        setLoginError('認證已過期，請重新輸入密碼');
        return;
      }

      if (!res.ok) {
        throw new Error(`伺服器錯誤 (HTTP ${res.status})`);
      }

      const json = await res.json();
      if (json.success) {
        setAdminData(json.data);
        setSurveyUrlInput(json.data.surveyUrl || '');
      }
    } catch (err: any) {
      setStatusMessage({ text: err.message || '讀取資料庫失敗', isError: true });
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchAdminData(token);
    }
  }, [token]);

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const json = await res.json();
      if (json.success && json.token) {
        setToken(json.token);
        sessionStorage.setItem('amazon_admin_session_token', json.token);
        setPassword('');
      } else {
        setLoginError(json.error || '密碼認證失敗');
      }
    } catch (err: any) {
      setLoginError(err.message || '連線後端認證失敗');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    setToken('');
    sessionStorage.removeItem('amazon_admin_session_token');
    setAdminData(null);
  };

  const showFeedback = (text: string, isError = false) => {
    setStatusMessage({ text, isError });
    setTimeout(() => {
      setStatusMessage((prev) => (prev?.text === text ? null : prev));
    }, 4000);
  };

  // ---------------------------------------------------------
  // Intro CRUD
  // ---------------------------------------------------------
  const handleSaveIntro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingIntro || !editingIntro.title) return;

    try {
      const res = await fetch('/api/admin/save-intro', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editingIntro),
      });

      const json = await res.json();
      if (json.success) {
        showFeedback('登山入門項目已成功寫入永久資料庫');
        setEditingIntro(null);
        await fetchAdminData(token);
        onDataUpdated();
      } else {
        showFeedback(json.error || '儲存失敗', true);
      }
    } catch (err: any) {
      showFeedback(err.message || '連線儲存失敗', true);
    }
  };

  // ---------------------------------------------------------
  // Tool CRUD
  // ---------------------------------------------------------
  const handleSaveTool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTool || !editingTool.title) return;

    try {
      const res = await fetch('/api/admin/save-tool', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editingTool),
      });

      const json = await res.json();
      if (json.success) {
        showFeedback('登山工具已成功寫入永久資料庫');
        setEditingTool(null);
        await fetchAdminData(token);
        onDataUpdated();
      } else {
        showFeedback(json.error || '儲存失敗', true);
      }
    } catch (err: any) {
      showFeedback(err.message || '連線儲存失敗', true);
    }
  };

  // ---------------------------------------------------------
  // Highlight CRUD
  // ---------------------------------------------------------
  const handleSaveHighlight = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHighlight || !editingHighlight.youtubeUrl) return;

    try {
      const res = await fetch('/api/admin/save-highlight', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editingHighlight),
      });

      const json = await res.json();
      if (json.success) {
        showFeedback('活動花絮 YouTube 網址已成功寫入永久資料庫');
        setEditingHighlight(null);
        await fetchAdminData(token);
        onDataUpdated();
      } else {
        showFeedback(json.error || '儲存失敗', true);
      }
    } catch (err: any) {
      showFeedback(err.message || '連線儲存失敗', true);
    }
  };

  // ---------------------------------------------------------
  // Survey Save
  // ---------------------------------------------------------
  const handleSaveSurvey = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/save-survey', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ surveyUrl: surveyUrlInput }),
      });

      const json = await res.json();
      if (json.success) {
        showFeedback('問卷調查 Google Forms 網址已成功寫入永久資料庫');
        await fetchAdminData(token);
        onDataUpdated();
      } else {
        showFeedback(json.error || '儲存失敗', true);
      }
    } catch (err: any) {
      showFeedback(err.message || '連線儲存失敗', true);
    }
  };

  const handleSaveSurveyItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSurvey || !editingSurvey.title || !editingSurvey.url) return;

    try {
      const res = await fetch('/api/admin/save-survey-item', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editingSurvey),
      });

      const json = await res.json();
      if (json.success) {
        showFeedback('問卷調查項目已成功寫入永久資料庫');
        setEditingSurvey(null);
        await fetchAdminData(token);
        onDataUpdated();
      } else {
        showFeedback(json.error || '儲存失敗', true);
      }
    } catch (err: any) {
      showFeedback(err.message || '連線儲存失敗', true);
    }
  };

  // ---------------------------------------------------------
  // Front-end Navigation Buttons CRUD
  // ---------------------------------------------------------
  const handleSaveNavButton = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNavButton || !editingNavButton.title || !editingNavButton.url) return;

    try {
      const res = await fetch('/api/admin/save-nav-button', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editingNavButton),
      });

      const json = await res.json();
      if (json.success) {
        showFeedback('前台按鈕設定已成功寫入永久資料庫');
        setEditingNavButton(null);
        await fetchAdminData(token);
        onDataUpdated();
      } else {
        showFeedback(json.error || '儲存失敗', true);
      }
    } catch (err: any) {
      showFeedback(err.message || '連線儲存失敗', true);
    }
  };

  const handleResetNavButtons = () => {
    setShowResetNavModal(true);
  };

  const handleConfirmResetNav = async () => {
    if (isResettingNav) return;
    setIsResettingNav(true);
    try {
      const res = await fetch('/api/admin/reset-nav-buttons', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await res.json();
      if (json.success) {
        showFeedback('已成功恢復預設八大前台按鈕');
        setShowResetNavModal(false);
        await fetchAdminData(token);
        onDataUpdated();
      } else {
        showFeedback(json.error || '重設失敗', true);
      }
    } catch (err: any) {
      showFeedback(err.message || '連線失敗', true);
    } finally {
      setIsResettingNav(false);
    }
  };

  // ---------------------------------------------------------
  // Policy CRUD
  // ---------------------------------------------------------
  const handleSavePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPolicy || !editingPolicy.title) return;

    try {
      const res = await fetch('/api/admin/save-policy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editingPolicy),
      });

      const json = await res.json();
      if (json.success) {
        showFeedback('政策與條款已成功寫入永久資料庫');
        setEditingPolicy(null);
        await fetchAdminData(token);
        onDataUpdated();
      } else {
        showFeedback(json.error || '儲存失敗', true);
      }
    } catch (err: any) {
      showFeedback(err.message || '連線儲存失敗', true);
    }
  };

  // ---------------------------------------------------------
  // Generic Delete (In-App Modal Confirmation)
  // ---------------------------------------------------------
  const handleDeleteItem = (type: string, id: string, name: string) => {
    setDeleteTarget({ type, id, name });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget || isDeleting) return;
    setIsDeleting(true);

    try {
      // 1. Try POST /api/admin/delete-item first
      let res = await fetch('/api/admin/delete-item', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        cache: 'no-store',
        body: JSON.stringify({ type: deleteTarget.type, id: deleteTarget.id }),
      });

      // 2. Fallback to DELETE /api/admin/item/:type/:id if needed
      if (!res.ok) {
        res = await fetch(`/api/admin/item/${deleteTarget.type}/${deleteTarget.id}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: 'no-store',
        });
      }

      let json: any = null;
      try {
        json = await res.json();
      } catch {
        throw new Error(`伺服器回應錯誤 (HTTP ${res.status})`);
      }

      if (json && json.success) {
        showFeedback(`已成功自資料庫刪除「${deleteTarget.name}」`);

        // Optimistically remove from local state immediately
        const targetType = (deleteTarget.type || '').toLowerCase();
        const targetId = String(deleteTarget.id);
        setAdminData((prev) => {
          if (!prev) return prev;
          const next = { ...prev };
          if (targetType === 'intro') {
            next.intros = (next.intros || []).filter((i) => String(i.id) !== targetId);
          } else if (targetType === 'tool') {
            next.tools = (next.tools || []).filter((t) => String(t.id) !== targetId);
          } else if (targetType === 'highlight') {
            next.highlights = (next.highlights || []).filter((h) => String(h.id) !== targetId);
          } else if (targetType === 'survey') {
            next.surveys = (next.surveys || []).filter((s) => String(s.id) !== targetId);
            const first = next.surveys.find((s) => s.enabled);
            next.surveyUrl = first ? first.url : '';
          } else if (targetType === 'policy') {
            next.policies = (next.policies || []).filter((p) => String(p.id) !== targetId);
          } else if (targetType === 'navbutton' || targetType === 'nav_button') {
            next.navButtons = (next.navButtons || []).filter((b) => String(b.id) !== targetId);
          }
          return next;
        });

        // Reset currently editing object if it matches the deleted id
        if (editingIntro?.id === deleteTarget.id) setEditingIntro(null);
        if (editingTool?.id === deleteTarget.id) setEditingTool(null);
        if (editingHighlight?.id === deleteTarget.id) setEditingHighlight(null);
        if (editingSurvey?.id === deleteTarget.id) setEditingSurvey(null);
        if (editingPolicy?.id === deleteTarget.id) setEditingPolicy(null);
        if (editingNavButton?.id === deleteTarget.id) setEditingNavButton(null);

        setDeleteTarget(null);
        await fetchAdminData(token);
        onDataUpdated();
      } else {
        showFeedback((json && json.error) || '刪除失敗', true);
      }
    } catch (err: any) {
      showFeedback(err.message || '連線刪除失敗', true);
    } finally {
      setIsDeleting(false);
    }
  };

  // =========================================================
  // Unauthenticated: Login Screen
  // =========================================================
  if (!token) {
    return (
      <main className="max-w-md mx-auto px-4 py-16" aria-label="後台管理登入">
        <div className="mb-4">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <ArrowLeft size={14} />
            <span>回到網站首頁</span>
          </button>
        </div>

        <div className="border border-neutral-800 rounded-lg bg-neutral-900/70 p-6 shadow-2xl">
          <div className="flex items-center gap-3 border-b border-neutral-800 pb-4 mb-6">
            <div className="p-2.5 rounded-md bg-emerald-950 border border-emerald-800/80 text-emerald-400">
              <Lock size={20} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-neutral-100">
                後台管理系統
              </h1>
              <p className="text-xs text-neutral-400">
                亞馬遜國家山岳協會 超級管理權限認證
              </p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label
                htmlFor="admin-password-input"
                className="block text-xs font-medium text-neutral-300 mb-1.5"
              >
                管理認證密碼
              </label>
              <input
                id="admin-password-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full px-3 py-2 rounded bg-neutral-950 border border-neutral-700 text-neutral-100 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="請輸入後台管理密碼"
              />
            </div>

            {loginError && (
              <div className="p-2.5 rounded bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-2.5 px-4 rounded bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white font-semibold text-xs transition-colors shadow"
              id="admin-login-submit"
            >
              {loginLoading ? '驗證中...' : '登入後台'}
            </button>
          </form>
        </div>
      </main>
    );
  }

  // =========================================================
  // Authenticated: Admin Dashboard
  // =========================================================
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6" aria-label="後台資料管理">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-800 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-1.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white transition-colors"
            title="返回網站前台"
            id="admin-return-btn"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-neutral-100 flex items-center gap-2">
              協會網站後台管理
              <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/80 font-normal">
                永久資料庫已連線
              </span>
            </h1>
            <p className="text-xs text-neutral-400 mt-0.5">
              所有修改直接儲存至後端永久資料庫，重新整理與跨裝置均保持最新狀態
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border border-neutral-800 bg-neutral-900 text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
            id="admin-logout-btn"
          >
            <LogOut size={14} />
            <span>登出</span>
          </button>
        </div>
      </div>

      {/* Status feedback bar */}
      {statusMessage && (
        <div
          className={`mb-4 p-3 rounded text-xs flex items-center gap-2 border ${
            statusMessage.isError
              ? 'bg-rose-950/70 border-rose-800 text-rose-300'
              : 'bg-emerald-950/70 border-emerald-800 text-emerald-300'
          }`}
        >
          {statusMessage.isError ? <AlertCircle size={15} /> : <CheckCircle2 size={15} />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex items-center border-b border-neutral-800 gap-1 overflow-x-auto text-xs font-medium mb-6">
        <button
          type="button"
          onClick={() => setActiveTab('intro')}
          className={`px-3.5 py-2 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'intro'
              ? 'border-emerald-500 text-emerald-400 font-semibold'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <BookOpen size={14} />
          <span>登山入門管理</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('tools')}
          className={`px-3.5 py-2 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'tools'
              ? 'border-emerald-500 text-emerald-400 font-semibold'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Wrench size={14} />
          <span>登山工具管理</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('highlights')}
          className={`px-3.5 py-2 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'highlights'
              ? 'border-emerald-500 text-emerald-400 font-semibold'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Video size={14} />
          <span>活動花絮管理</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('survey')}
          className={`px-3.5 py-2 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'survey'
              ? 'border-emerald-500 text-emerald-400 font-semibold'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <FileQuestion size={14} />
          <span>問卷選單管理</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('policies')}
          className={`px-3.5 py-2 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'policies'
              ? 'border-emerald-500 text-emerald-400 font-semibold'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Shield size={14} />
          <span>政策與條款管理</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('buttons')}
          className={`px-3.5 py-2 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'buttons'
              ? 'border-emerald-500 text-emerald-400 font-semibold'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <LayoutGrid size={14} />
          <span>前台按鈕管理</span>
        </button>
      </div>

      {loadingData && (
        <div className="py-8 text-center text-xs text-neutral-400">
          讀取最新資料中...
        </div>
      )}

      {/* =========================================================
          TAB 1: 登山入門管理
          Fields strictly: title, description, content, url, enabled, sortOrder
          ========================================================= */}
      {activeTab === 'intro' && adminData && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-neutral-200">
              登山入門項目清單 ({adminData.intros.length})
            </h2>
            <button
              type="button"
              onClick={() =>
                setEditingIntro({
                  id: '',
                  title: '',
                  description: '',
                  content: '',
                  url: '',
                  enabled: true,
                  sortOrder: (adminData.intros.length || 0) + 1,
                })
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-emerald-800 hover:bg-emerald-700 text-white transition-colors"
            >
              <Plus size={14} />
              <span>新增入門專文</span>
            </button>
          </div>

          {/* Edit / Create Form */}
          {editingIntro && (
            <div className="border border-emerald-700/80 rounded bg-neutral-900 p-5 space-y-4">
              <h3 className="text-sm font-bold text-emerald-400">
                {editingIntro.id ? '編輯登山入門項目' : '新增登山入門項目'}
              </h3>
              <form onSubmit={handleSaveIntro} className="space-y-3 text-xs">
                <div>
                  <label className="block text-neutral-300 font-medium mb-1">
                    名稱／標題 *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingIntro.title || ''}
                    onChange={(e) =>
                      setEditingIntro({ ...editingIntro, title: e.target.value })
                    }
                    className="w-full px-3 py-1.5 rounded bg-neutral-950 border border-neutral-700 text-neutral-100"
                  />
                </div>

                <div>
                  <label className="block text-neutral-300 font-medium mb-1">
                    說明
                  </label>
                  <input
                    type="text"
                    value={editingIntro.description || ''}
                    onChange={(e) =>
                      setEditingIntro({ ...editingIntro, description: e.target.value })
                    }
                    className="w-full px-3 py-1.5 rounded bg-neutral-950 border border-neutral-700 text-neutral-100"
                  />
                </div>

                <div>
                  <label className="block text-neutral-300 font-medium mb-1">
                    內容
                  </label>
                  <textarea
                    rows={4}
                    value={editingIntro.content || ''}
                    onChange={(e) =>
                      setEditingIntro({ ...editingIntro, content: e.target.value })
                    }
                    className="w-full px-3 py-1.5 rounded bg-neutral-950 border border-neutral-700 text-neutral-100"
                  />
                </div>

                <div>
                  <label className="block text-neutral-300 font-medium mb-1">
                    網址 (若設定網址，前台點擊「閱讀完整專文」將直接前往)
                  </label>
                  <input
                    type="text"
                    value={editingIntro.url || ''}
                    onChange={(e) =>
                      setEditingIntro({ ...editingIntro, url: e.target.value })
                    }
                    placeholder="例如：example.com/hiking-article"
                    className="w-full px-3 py-1.5 rounded bg-neutral-950 border border-neutral-700 text-neutral-100"
                  />
                </div>

                <div className="flex items-center gap-6 pt-1">
                  <div>
                    <label className="block text-neutral-300 font-medium mb-1">
                      排序序號
                    </label>
                    <input
                      type="number"
                      value={editingIntro.sortOrder ?? 0}
                      onChange={(e) =>
                        setEditingIntro({
                          ...editingIntro,
                          sortOrder: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-24 px-3 py-1.5 rounded bg-neutral-950 border border-neutral-700 text-neutral-100"
                    />
                  </div>

                  <div className="flex items-center gap-2 mt-5">
                    <input
                      type="checkbox"
                      id="intro-enabled"
                      checked={editingIntro.enabled ?? true}
                      onChange={(e) =>
                        setEditingIntro({
                          ...editingIntro,
                          enabled: e.target.checked,
                        })
                      }
                      className="rounded border-neutral-700 text-emerald-600 focus:ring-0"
                    />
                    <label
                      htmlFor="intro-enabled"
                      className="text-neutral-300 font-medium"
                    >
                      啟用顯示
                    </label>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-3">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded bg-emerald-700 hover:bg-emerald-600 text-white font-semibold transition-colors"
                  >
                    <Save size={14} />
                    <span>儲存至永久資料庫</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingIntro(null)}
                    className="px-3 py-2 rounded bg-neutral-800 text-neutral-300 hover:text-white transition-colors"
                  >
                    取消
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* List Table */}
          <div className="border border-neutral-800 rounded bg-neutral-900/40 overflow-hidden">
            <div className="divide-y divide-neutral-800">
              {adminData.intros.map((item) => (
                <div
                  key={item.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 font-mono">
                        #{item.sortOrder}
                      </span>
                      <span className="font-bold text-neutral-100">
                        {item.title}
                      </span>
                      {!item.enabled && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-800">
                          已停用
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-xs text-neutral-400 line-clamp-1">
                        {item.description}
                      </p>
                    )}
                    {item.url && (
                      <p className="text-[11px] text-emerald-400 font-mono">
                        網址: {item.url}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setEditingIntro(item)}
                      className="p-1.5 rounded text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
                      title="編輯"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleDeleteItem('intro', item.id, item.title)
                      }
                      className="p-1.5 rounded text-rose-400 hover:text-rose-300 hover:bg-neutral-800 transition-colors"
                      title="刪除"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          TAB 2: 登山工具管理
          Fields strictly: title, description, url, enabled, sortOrder
          ========================================================= */}
      {activeTab === 'tools' && adminData && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-neutral-200">
              登山工具清單 ({adminData.tools.length})
            </h2>
            <button
              type="button"
              onClick={() =>
                setEditingTool({
                  id: '',
                  title: '',
                  description: '',
                  url: '',
                  enabled: true,
                  sortOrder: (adminData.tools.length || 0) + 1,
                })
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-emerald-800 hover:bg-emerald-700 text-white transition-colors"
            >
              <Plus size={14} />
              <span>新增登山工具</span>
            </button>
          </div>

          {/* Edit Tool Form */}
          {editingTool && (
            <div className="border border-emerald-700/80 rounded bg-neutral-900 p-5 space-y-4">
              <h3 className="text-sm font-bold text-emerald-400">
                {editingTool.id ? '編輯登山工具' : '新增登山工具'}
              </h3>
              <form onSubmit={handleSaveTool} className="space-y-3 text-xs">
                <div>
                  <label className="block text-neutral-300 font-medium mb-1">
                    名稱／標題 *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingTool.title || ''}
                    onChange={(e) =>
                      setEditingTool({ ...editingTool, title: e.target.value })
                    }
                    className="w-full px-3 py-1.5 rounded bg-neutral-950 border border-neutral-700 text-neutral-100"
                  />
                </div>

                <div>
                  <label className="block text-neutral-300 font-medium mb-1">
                    說明
                  </label>
                  <input
                    type="text"
                    value={editingTool.description || ''}
                    onChange={(e) =>
                      setEditingTool({
                        ...editingTool,
                        description: e.target.value,
                      })
                    }
                    className="w-full px-3 py-1.5 rounded bg-neutral-950 border border-neutral-700 text-neutral-100"
                  />
                </div>

                <div>
                  <label className="block text-neutral-300 font-medium mb-1">
                    網址 * (點擊時自動補齊 HTTPS 並直接前往)
                  </label>
                  <input
                    type="text"
                    value={editingTool.url || ''}
                    onChange={(e) =>
                      setEditingTool({ ...editingTool, url: e.target.value })
                    }
                    placeholder="例如：www.cwa.gov.tw"
                    className="w-full px-3 py-1.5 rounded bg-neutral-950 border border-neutral-700 text-neutral-100"
                  />
                </div>

                <div className="flex items-center gap-6 pt-1">
                  <div>
                    <label className="block text-neutral-300 font-medium mb-1">
                      排序序號
                    </label>
                    <input
                      type="number"
                      value={editingTool.sortOrder ?? 0}
                      onChange={(e) =>
                        setEditingTool({
                          ...editingTool,
                          sortOrder: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-24 px-3 py-1.5 rounded bg-neutral-950 border border-neutral-700 text-neutral-100"
                    />
                  </div>

                  <div className="flex items-center gap-2 mt-5">
                    <input
                      type="checkbox"
                      id="tool-enabled"
                      checked={editingTool.enabled ?? true}
                      onChange={(e) =>
                        setEditingTool({
                          ...editingTool,
                          enabled: e.target.checked,
                        })
                      }
                      className="rounded border-neutral-700 text-emerald-600 focus:ring-0"
                    />
                    <label
                      htmlFor="tool-enabled"
                      className="text-neutral-300 font-medium"
                    >
                      啟用顯示
                    </label>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-3">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded bg-emerald-700 hover:bg-emerald-600 text-white font-semibold transition-colors"
                  >
                    <Save size={14} />
                    <span>儲存至永久資料庫</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingTool(null)}
                    className="px-3 py-2 rounded bg-neutral-800 text-neutral-300 hover:text-white transition-colors"
                  >
                    取消
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Tools Table */}
          <div className="border border-neutral-800 rounded bg-neutral-900/40 overflow-hidden">
            <div className="divide-y divide-neutral-800">
              {adminData.tools.map((item) => (
                <div
                  key={item.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 font-mono">
                        #{item.sortOrder}
                      </span>
                      <span className="font-bold text-neutral-100">
                        {item.title}
                      </span>
                      {!item.enabled && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-800">
                          已停用
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-xs text-neutral-400">
                        {item.description}
                      </p>
                    )}
                    {item.url && (
                      <p className="text-[11px] text-emerald-400 font-mono">
                        {item.url}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setEditingTool(item)}
                      className="p-1.5 rounded text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
                      title="編輯"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleDeleteItem('tool', item.id, item.title)
                      }
                      className="p-1.5 rounded text-rose-400 hover:text-rose-300 hover:bg-neutral-800 transition-colors"
                      title="刪除"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          TAB 3: 活動花絮管理
          Fields strictly: youtubeUrl, enabled, sortOrder
          (Rule 二十二: 後台輸入 YouTube URL，不要另外建立活動名稱欄位)
          ========================================================= */}
      {activeTab === 'highlights' && adminData && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-neutral-200">
              活動花絮 YouTube 影片清單 ({adminData.highlights.length})
            </h2>
            <button
              type="button"
              onClick={() =>
                setEditingHighlight({
                  id: '',
                  youtubeUrl: '',
                  enabled: true,
                  sortOrder: (adminData.highlights.length || 0) + 1,
                })
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-emerald-800 hover:bg-emerald-700 text-white transition-colors"
            >
              <Plus size={14} />
              <span>新增 YouTube 影片</span>
            </button>
          </div>

          {/* Edit Highlight Form */}
          {editingHighlight && (
            <div className="border border-emerald-700/80 rounded bg-neutral-900 p-5 space-y-4">
              <h3 className="text-sm font-bold text-emerald-400">
                {editingHighlight.id ? '編輯影片項目' : '新增影片項目'}
              </h3>
              <form onSubmit={handleSaveHighlight} className="space-y-3 text-xs">
                <div>
                  <label className="block text-neutral-300 font-medium mb-1">
                    YouTube URL *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingHighlight.youtubeUrl || ''}
                    onChange={(e) =>
                      setEditingHighlight({
                        ...editingHighlight,
                        youtubeUrl: e.target.value,
                      })
                    }
                    placeholder="https://www.youtube.com/watch?v=... 或 https://youtu.be/..."
                    className="w-full px-3 py-1.5 rounded bg-neutral-950 border border-neutral-700 text-neutral-100"
                  />
                </div>

                <div className="flex items-center gap-6 pt-1">
                  <div>
                    <label className="block text-neutral-300 font-medium mb-1">
                      排序序號
                    </label>
                    <input
                      type="number"
                      value={editingHighlight.sortOrder ?? 0}
                      onChange={(e) =>
                        setEditingHighlight({
                          ...editingHighlight,
                          sortOrder: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-24 px-3 py-1.5 rounded bg-neutral-950 border border-neutral-700 text-neutral-100"
                    />
                  </div>

                  <div className="flex items-center gap-2 mt-5">
                    <input
                      type="checkbox"
                      id="highlight-enabled"
                      checked={editingHighlight.enabled ?? true}
                      onChange={(e) =>
                        setEditingHighlight({
                          ...editingHighlight,
                          enabled: e.target.checked,
                        })
                      }
                      className="rounded border-neutral-700 text-emerald-600 focus:ring-0"
                    />
                    <label
                      htmlFor="highlight-enabled"
                      className="text-neutral-300 font-medium"
                    >
                      啟用顯示
                    </label>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-3">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded bg-emerald-700 hover:bg-emerald-600 text-white font-semibold transition-colors"
                  >
                    <Save size={14} />
                    <span>儲存至永久資料庫</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingHighlight(null)}
                    className="px-3 py-2 rounded bg-neutral-800 text-neutral-300 hover:text-white transition-colors"
                  >
                    取消
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Highlights Table */}
          <div className="border border-neutral-800 rounded bg-neutral-900/40 overflow-hidden">
            <div className="divide-y divide-neutral-800">
              {adminData.highlights.map((item) => (
                <div
                  key={item.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 font-mono">
                        #{item.sortOrder}
                      </span>
                      <span className="font-mono text-xs text-neutral-100 break-all">
                        {item.youtubeUrl}
                      </span>
                      {!item.enabled && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-800">
                          已停用
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setEditingHighlight(item)}
                      className="p-1.5 rounded text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
                      title="編輯"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleDeleteItem('highlight', item.id, item.youtubeUrl)
                      }
                      className="p-1.5 rounded text-rose-400 hover:text-rose-300 hover:bg-neutral-800 transition-colors"
                      title="刪除"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          TAB 4: 問卷調查管理
          Supports Adding, Editing, Deleting surveys & Quick URL sync
          ========================================================= */}
      {activeTab === 'survey' && adminData && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-neutral-100 flex items-center gap-2">
                <FileQuestion size={18} className="text-emerald-400" />
                <span>問卷選單項目管理 ({(adminData.surveys || []).length})</span>
              </h2>
              <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                前台頂部「問卷調查」按鈕已導向至問卷選單專區。請在下方建立問卷標題與對應的問卷超連結，山友點擊標題後將直接前往填寫該問卷。
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setEditingSurvey({
                  id: '',
                  title: '',
                  url: '',
                  description: '',
                  enabled: true,
                  sortOrder: ((adminData.surveys || []).length || 0) + 1,
                })
              }
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded text-xs font-semibold bg-emerald-700 hover:bg-emerald-600 text-white transition-colors shadow shrink-0"
              id="btn-add-survey"
            >
              <Plus size={14} />
              <span>新增問卷標題與超連結</span>
            </button>
          </div>

          {/* Edit / Create Survey Form */}
          {editingSurvey && (
            <div className="border border-emerald-700/80 rounded-lg bg-neutral-900 p-5 space-y-4 shadow-xl">
              <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                <Edit2 size={15} />
                <span>{editingSurvey.id ? '編輯問卷項目（標題與超連結）' : '新增問卷項目（標題與超連結）'}</span>
              </h3>
              <form onSubmit={handleSaveSurveyItem} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">
                    問卷標題（前台選單顯示之標題名稱） *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingSurvey.title || ''}
                    onChange={(e) =>
                      setEditingSurvey({ ...editingSurvey, title: e.target.value })
                    }
                    placeholder="例如：2025年度登山活動滿意度調查"
                    className="w-full px-3 py-2 rounded bg-neutral-950 border border-neutral-700 text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">
                    問卷超連結（Google 表單或外部線上問卷 URL） *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingSurvey.url || ''}
                    onChange={(e) =>
                      setEditingSurvey({ ...editingSurvey, url: e.target.value })
                    }
                    placeholder="https://docs.google.com/forms/d/e/.../viewform"
                    className="w-full px-3 py-2 rounded bg-neutral-950 border border-neutral-700 text-neutral-100 font-mono text-xs placeholder:text-neutral-600 focus:outline-none focus:border-emerald-500"
                  />
                  <p className="text-[11px] text-neutral-500 mt-1">
                    支援完整網址（http:// 或 https://），前台山友點擊標題後將直接以此超連結另開視窗填寫。
                  </p>
                </div>

                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">
                    問卷說明／備註（選填，顯示於前台標題下方）
                  </label>
                  <input
                    type="text"
                    value={editingSurvey.description || ''}
                    onChange={(e) =>
                      setEditingSurvey({
                        ...editingSurvey,
                        description: e.target.value,
                      })
                    }
                    placeholder="例如：收集山友對活動行程、餐食與嚮導安全之寶貴回饋"
                    className="w-full px-3 py-2 rounded bg-neutral-950 border border-neutral-700 text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex items-center gap-6 pt-1">
                  <div>
                    <label className="block text-neutral-300 font-semibold mb-1">
                      排序序號
                    </label>
                    <input
                      type="number"
                      value={editingSurvey.sortOrder ?? 0}
                      onChange={(e) =>
                        setEditingSurvey({
                          ...editingSurvey,
                          sortOrder: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-24 px-3 py-1.5 rounded bg-neutral-950 border border-neutral-700 text-neutral-100"
                    />
                  </div>

                  <div className="flex items-center gap-2 mt-5">
                    <input
                      type="checkbox"
                      id="survey-enabled"
                      checked={editingSurvey.enabled ?? true}
                      onChange={(e) =>
                        setEditingSurvey({
                          ...editingSurvey,
                          enabled: e.target.checked,
                        })
                      }
                      className="rounded border-neutral-700 text-emerald-600 focus:ring-0 w-4 h-4 cursor-pointer"
                    />
                    <label
                      htmlFor="survey-enabled"
                      className="text-neutral-300 font-semibold cursor-pointer"
                    >
                      啟用顯示於前台
                    </label>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-neutral-800">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded bg-emerald-700 hover:bg-emerald-600 text-white font-semibold transition-colors shadow"
                  >
                    <Save size={14} />
                    <span>儲存至永久資料庫</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingSurvey(null)}
                    className="px-3.5 py-2 rounded bg-neutral-800 text-neutral-300 hover:text-white transition-colors"
                  >
                    取消
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Surveys Table */}
          <div className="border border-neutral-800 rounded-lg bg-neutral-900/40 overflow-hidden shadow">
            <div className="divide-y divide-neutral-800">
              {(adminData.surveys || []).map((item) => (
                <div
                  key={item.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-neutral-900/60 transition-colors"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 font-mono">
                        #{item.sortOrder}
                      </span>
                      <span className="font-bold text-neutral-100 text-sm">
                        {item.title}
                      </span>
                      {!item.enabled && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
                          已停用
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-xs text-neutral-400">
                        {item.description}
                      </p>
                    )}
                    {item.url && (
                      <div className="flex items-center gap-2 pt-0.5">
                        <span className="text-[11px] text-neutral-500">超連結：</span>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-emerald-400 hover:underline font-mono inline-flex items-center gap-1 break-all"
                        >
                          <span>{item.url}</span>
                          <ExternalLink size={12} className="shrink-0" />
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-300 inline-flex items-center gap-1 transition-colors"
                      title="測試開啟超連結"
                    >
                      <ExternalLink size={12} />
                      <span>測試連結</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => setEditingSurvey(item)}
                      className="p-1.5 rounded text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
                      title="編輯"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleDeleteItem('survey', item.id, item.title)
                      }
                      className="p-1.5 rounded text-rose-400 hover:text-rose-300 hover:bg-neutral-800 transition-colors"
                      title="刪除"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
              {(!adminData.surveys || adminData.surveys.length === 0) && (
                <div className="p-8 text-xs text-neutral-500 text-center space-y-1">
                  <p className="font-semibold text-neutral-400">目前尚無問卷選單項目</p>
                  <p>請點擊上方「新增問卷標題與超連結」按鈕建立第一筆線上問卷。</p>
                </div>
              )}
            </div>
          </div>

          {/* Optional Default Survey URL Setting */}
          <div className="border border-neutral-800 rounded-lg bg-neutral-900/50 p-5 space-y-3 max-w-2xl mt-8">
            <h3 className="text-sm font-bold text-neutral-200">
              全域預設問卷超連結（選填備用）
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              此欄位記錄協會主辦活動之官方預設表單網址。在上方建立的「問卷選單項目」會完整呈現在前台問卷專區，山友可點擊不同問卷標題進入各個表單。
            </p>

            <form onSubmit={handleSaveSurvey} className="space-y-3 text-xs">
              <div>
                <label className="block text-neutral-300 font-medium mb-1">
                  預設 Google Forms 或問卷網址
                </label>
                <input
                  type="text"
                  value={surveyUrlInput}
                  onChange={(e) => setSurveyUrlInput(e.target.value)}
                  placeholder="https://docs.google.com/forms/d/e/.../viewform"
                  className="w-full px-3 py-2 rounded bg-neutral-950 border border-neutral-700 text-neutral-100 text-xs font-mono"
                />
              </div>

              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white font-semibold transition-colors border border-neutral-700"
              >
                <Save size={14} />
                <span>儲存預設問卷網址</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          TAB 5: 政策與條款管理
          Fields strictly: title, content, enabled, sortOrder (Rule 二十四)
          ========================================================= */}
      {activeTab === 'policies' && adminData && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-neutral-200">
              政策與條款清單 ({adminData.policies.length})
            </h2>
            <button
              type="button"
              onClick={() =>
                setEditingPolicy({
                  id: '',
                  title: '',
                  content: '',
                  enabled: true,
                  sortOrder: (adminData.policies.length || 0) + 1,
                })
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-emerald-800 hover:bg-emerald-700 text-white transition-colors"
            >
              <Plus size={14} />
              <span>新增條款項目</span>
            </button>
          </div>

          {/* Edit Policy Form */}
          {editingPolicy && (
            <div className="border border-emerald-700/80 rounded bg-neutral-900 p-5 space-y-4">
              <h3 className="text-sm font-bold text-emerald-400">
                {editingPolicy.id ? '編輯條款項目' : '新增條款項目'}
              </h3>
              <form onSubmit={handleSavePolicy} className="space-y-3 text-xs">
                <div>
                  <label className="block text-neutral-300 font-medium mb-1">
                    標題 *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingPolicy.title || ''}
                    onChange={(e) =>
                      setEditingPolicy({ ...editingPolicy, title: e.target.value })
                    }
                    className="w-full px-3 py-1.5 rounded bg-neutral-950 border border-neutral-700 text-neutral-100"
                  />
                </div>

                <div>
                  <label className="block text-neutral-300 font-medium mb-1">
                    文字內容 *
                  </label>
                  <textarea
                    rows={6}
                    required
                    value={editingPolicy.content || ''}
                    onChange={(e) =>
                      setEditingPolicy({ ...editingPolicy, content: e.target.value })
                    }
                    className="w-full px-3 py-1.5 rounded bg-neutral-950 border border-neutral-700 text-neutral-100"
                  />
                </div>

                <div className="flex items-center gap-6 pt-1">
                  <div>
                    <label className="block text-neutral-300 font-medium mb-1">
                      排序序號
                    </label>
                    <input
                      type="number"
                      value={editingPolicy.sortOrder ?? 0}
                      onChange={(e) =>
                        setEditingPolicy({
                          ...editingPolicy,
                          sortOrder: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-24 px-3 py-1.5 rounded bg-neutral-950 border border-neutral-700 text-neutral-100"
                    />
                  </div>

                  <div className="flex items-center gap-2 mt-5">
                    <input
                      type="checkbox"
                      id="policy-enabled"
                      checked={editingPolicy.enabled ?? true}
                      onChange={(e) =>
                        setEditingPolicy({
                          ...editingPolicy,
                          enabled: e.target.checked,
                        })
                      }
                      className="rounded border-neutral-700 text-emerald-600 focus:ring-0"
                    />
                    <label
                      htmlFor="policy-enabled"
                      className="text-neutral-300 font-medium"
                    >
                      啟用顯示
                    </label>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-3">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded bg-emerald-700 hover:bg-emerald-600 text-white font-semibold transition-colors"
                  >
                    <Save size={14} />
                    <span>儲存至永久資料庫</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingPolicy(null)}
                    className="px-3 py-2 rounded bg-neutral-800 text-neutral-300 hover:text-white transition-colors"
                  >
                    取消
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Policies Table */}
          <div className="border border-neutral-800 rounded bg-neutral-900/40 overflow-hidden">
            <div className="divide-y divide-neutral-800">
              {adminData.policies.map((item) => (
                <div
                  key={item.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 font-mono">
                        #{item.sortOrder}
                      </span>
                      <span className="font-bold text-neutral-100">
                        {item.title}
                      </span>
                      {!item.enabled && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-800">
                          已停用
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-400 line-clamp-2">
                      {item.content}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setEditingPolicy(item)}
                      className="p-1.5 rounded text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
                      title="編輯"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleDeleteItem('policy', item.id, item.title)
                      }
                      className="p-1.5 rounded text-rose-400 hover:text-rose-300 hover:bg-neutral-800 transition-colors"
                      title="刪除"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          TAB 6: 前台按鈕管理 (Front-end Navigation Buttons Management)
          Supports editing button title, target URL, external flag,
          sort order, enabled state, adding & deleting buttons
          ========================================================= */}
      {activeTab === 'buttons' && adminData && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-neutral-200">
                前台導覽按鈕管理 ({(adminData.navButtons || []).length})
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                可自由編輯前台八大入口按鈕之文字標題、連結路徑、另開分頁與順序。
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetNavButtons}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors border border-neutral-700"
                title="恢復系統預設八大按鈕"
              >
                <RotateCcw size={13} />
                <span>重設回預設八大按鈕</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  setEditingNavButton({
                    id: '',
                    title: '',
                    url: '',
                    isExternal: false,
                    enabled: true,
                    sortOrder: ((adminData.navButtons || []).length || 0) + 1,
                  })
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-emerald-800 hover:bg-emerald-700 text-white transition-colors"
              >
                <Plus size={14} />
                <span>新增前台按鈕</span>
              </button>
            </div>
          </div>

          {/* Edit / Create Nav Button Form */}
          {editingNavButton && (
            <div className="border border-emerald-700/80 rounded bg-neutral-900 p-5 space-y-4">
              <h3 className="text-sm font-bold text-emerald-400">
                {editingNavButton.id ? '編輯前台按鈕' : '新增前台按鈕'}
              </h3>
              <form onSubmit={handleSaveNavButton} className="space-y-3 text-xs">
                <div>
                  <label className="block text-neutral-300 font-medium mb-1">
                    按鈕文字名稱 *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingNavButton.title || ''}
                    onChange={(e) =>
                      setEditingNavButton({
                        ...editingNavButton,
                        title: e.target.value,
                      })
                    }
                    placeholder="例如：活動行事曆、近期活動、入山須知"
                    className="w-full px-3 py-1.5 rounded bg-neutral-950 border border-neutral-700 text-neutral-100 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-neutral-300 font-medium mb-1">
                    連結目標（內部路徑或外部網址）*
                  </label>
                  <input
                    type="text"
                    required
                    value={editingNavButton.url || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      const isExt = val.startsWith('http://') || val.startsWith('https://');
                      setEditingNavButton({
                        ...editingNavButton,
                        url: val,
                        isExternal: isExt ? true : editingNavButton.isExternal,
                      });
                    }}
                    placeholder="內部路徑如 / 或 /intro 或外部網址如 https://..."
                    className="w-full px-3 py-1.5 rounded bg-neutral-950 border border-neutral-700 text-neutral-100 font-mono"
                  />
                  <p className="text-[11px] text-neutral-400 mt-1">
                    內部專區範例：首頁行事曆「/」、登山入門「/intro」、登山工具「/tools」、活動花絮「/highlights」、問卷調查「/surveys」、政策條款「/policies」
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-6 pt-1">
                  <div>
                    <label className="block text-neutral-300 font-medium mb-1">
                      排序序號
                    </label>
                    <input
                      type="number"
                      value={editingNavButton.sortOrder ?? 0}
                      onChange={(e) =>
                        setEditingNavButton({
                          ...editingNavButton,
                          sortOrder: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-24 px-3 py-1.5 rounded bg-neutral-950 border border-neutral-700 text-neutral-100"
                    />
                  </div>

                  <div className="flex items-center gap-2 mt-5">
                    <input
                      type="checkbox"
                      id="button-external"
                      checked={editingNavButton.isExternal ?? false}
                      onChange={(e) =>
                        setEditingNavButton({
                          ...editingNavButton,
                          isExternal: e.target.checked,
                        })
                      }
                      className="rounded border-neutral-700 text-emerald-600 focus:ring-0"
                    />
                    <label
                      htmlFor="button-external"
                      className="text-neutral-300 font-medium inline-flex items-center gap-1"
                    >
                      <ExternalLink size={12} className="text-neutral-400" />
                      <span>另開新分頁 (外部連結)</span>
                    </label>
                  </div>

                  <div className="flex items-center gap-2 mt-5">
                    <input
                      type="checkbox"
                      id="button-enabled"
                      checked={editingNavButton.enabled ?? true}
                      onChange={(e) =>
                        setEditingNavButton({
                          ...editingNavButton,
                          enabled: e.target.checked,
                        })
                      }
                      className="rounded border-neutral-700 text-emerald-600 focus:ring-0"
                    />
                    <label
                      htmlFor="button-enabled"
                      className="text-neutral-300 font-medium"
                    >
                      啟用顯示在前台
                    </label>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-3">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded bg-emerald-700 hover:bg-emerald-600 text-white font-semibold transition-colors"
                  >
                    <Save size={14} />
                    <span>儲存按鈕設定</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingNavButton(null)}
                    className="px-3 py-2 rounded bg-neutral-800 text-neutral-300 hover:text-white transition-colors"
                  >
                    取消
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Navigation Buttons Table */}
          <div className="border border-neutral-800 rounded bg-neutral-900/40 overflow-hidden">
            <div className="divide-y divide-neutral-800">
              {(adminData.navButtons || []).map((item) => (
                <div
                  key={item.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 font-mono">
                        #{item.sortOrder}
                      </span>
                      <span className="font-bold text-neutral-100 text-sm">
                        {item.title}
                      </span>
                      {item.isExternal ? (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-950 text-sky-300 border border-sky-800 inline-flex items-center gap-0.5">
                          <ExternalLink size={10} />
                          外部連結
                        </span>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                          內部專區
                        </span>
                      )}
                      {!item.enabled && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-800">
                          已隱藏
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-neutral-400 font-mono flex items-center gap-1">
                      <Globe size={12} className="text-neutral-500 shrink-0" />
                      <span className="break-all">{item.url}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setEditingNavButton(item)}
                      className="p-1.5 rounded text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
                      title="編輯按鈕"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleDeleteItem('navButton', item.id, item.title)
                      }
                      className="p-1.5 rounded text-rose-400 hover:text-rose-300 hover:bg-neutral-800 transition-colors"
                      title="刪除按鈕"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
              {(!adminData.navButtons || adminData.navButtons.length === 0) && (
                <div className="p-4 text-xs text-neutral-500 text-center">
                  目前沒有設定前台按鈕，請點擊上方按鈕新增，或點擊「重設回預設八大按鈕」。
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal (In-App Dialog, no window.confirm dependency) */}
      {deleteTarget && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn"
          id="delete-confirm-modal"
          role="dialog"
          aria-modal="true"
        >
          <div className="max-w-md w-full bg-neutral-900 border border-rose-900/60 rounded-xl p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-full bg-rose-950/80 border border-rose-800 text-rose-400 shrink-0">
                <Trash2 size={22} />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-neutral-100">確認永久刪除此項目？</h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  您即將自永久資料庫刪除以下項目：
                </p>
                <div className="mt-2 p-2.5 rounded bg-neutral-950 border border-neutral-800 text-xs font-semibold text-rose-300 break-all">
                  {deleteTarget.name}
                </div>
                <p className="text-[11px] text-neutral-500 pt-1">
                  注意：此刪除操作將直接寫入資料庫並同步至前台，確定要繼續嗎？
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold transition-colors disabled:opacity-50"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors disabled:opacity-50 shadow-lg shadow-rose-950/50"
                id="btn-confirm-delete"
              >
                <Trash2 size={14} />
                <span>{isDeleting ? '正在刪除...' : '確認永久刪除'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Nav Buttons Modal (In-App Dialog) */}
      {showResetNavModal && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn"
          id="reset-nav-modal"
          role="dialog"
          aria-modal="true"
        >
          <div className="max-w-md w-full bg-neutral-900 border border-neutral-700 rounded-xl p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-full bg-amber-950/80 border border-amber-800 text-amber-400 shrink-0">
                <RotateCcw size={22} />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-neutral-100">恢復預設八大前台按鈕？</h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  確定要將前台導覽按鈕恢復為官方預設的 8 個主要按鈕嗎？此操作將覆蓋目前自訂的按鈕清單。
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setShowResetNavModal(false)}
                disabled={isResettingNav}
                className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold transition-colors disabled:opacity-50"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirmResetNav}
                disabled={isResettingNav}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-colors disabled:opacity-50"
                id="btn-confirm-reset-nav"
              >
                <RotateCcw size={14} />
                <span>{isResettingNav ? '正在恢復...' : '確認恢復預設'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
