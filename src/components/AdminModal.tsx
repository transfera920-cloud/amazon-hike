import React, { useState, useEffect } from 'react';
import { SiteData, CardItem, CardLink } from '../types';
import { DEFAULT_DATA } from '../data/defaultData';
import {
  X,
  Save,
  Plus,
  Trash2,
  RotateCcw,
  ArrowUp,
  ArrowDown,
  Download,
  Upload,
  Check,
  AlertCircle,
  Sparkles,
  Link as LinkIcon,
  Cloud,
  Loader2,
  LogOut
} from 'lucide-react';
import { DynamicIcon } from './DynamicIcon';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: SiteData;
  onSave: (newData: SiteData) => Promise<void> | void;
  isCloudConnected?: boolean;
  onLogout?: () => void;
}

const COMMON_ICONS = [
  { label: '計算機/報價', icon: 'fa-calculator' },
  { label: '民宿/飯店', icon: 'fa-hotel' },
  { label: '美食/合菜', icon: 'fa-utensils' },
  { label: '警告/管制', icon: 'fa-triangle-exclamation' },
  { label: '高山百岳', icon: 'fa-mountain' },
  { label: '休旅接駁車', icon: 'fa-car' },
  { label: '指南/路線', icon: 'fa-compass' },
  { label: '地圖定位', icon: 'fa-location-dot' },
  { label: '安全保險', icon: 'fa-shield-halved' }
];

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  data,
  onSave,
  isCloudConnected = false,
  onLogout
}) => {
  const [formData, setFormData] = useState<SiteData>(data);
  const [newFeatureText, setNewFeatureText] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Sync state whenever modal opens or parent data updates
  useEffect(() => {
    if (isOpen) {
      setFormData(JSON.parse(JSON.stringify(data)));
      setSaveError(null);
    }
  }, [isOpen, data]);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleTextChange = (field: keyof SiteData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Features
  const addFeature = () => {
    const trimmed = newFeatureText.trim();
    if (!trimmed) return;
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, trimmed]
    }));
    setNewFeatureText('');
  };

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  // Cards
  const updateCard = (index: number, field: keyof CardItem, value: string) => {
    setFormData(prev => {
      const newCards = [...prev.cards];
      newCards[index] = {
        ...newCards[index],
        [field]: value
      };
      return { ...prev, cards: newCards };
    });
  };

  const updateCardLink = (cardIdx: number, linkIdx: number, field: keyof CardLink, value: string) => {
    setFormData(prev => {
      const newCards = [...prev.cards];
      const links = [...(newCards[cardIdx].links || [])];
      links[linkIdx] = { ...links[linkIdx], [field]: value };
      newCards[cardIdx] = { ...newCards[cardIdx], links };
      return { ...prev, cards: newCards };
    });
  };

  const addCardLink = (cardIdx: number) => {
    setFormData(prev => {
      const newCards = [...prev.cards];
      const links = [...(newCards[cardIdx].links || []), { group: '', label: '', url: '' }];
      newCards[cardIdx] = { ...newCards[cardIdx], links };
      return { ...prev, cards: newCards };
    });
  };

  const removeCardLink = (cardIdx: number, linkIdx: number) => {
    setFormData(prev => {
      const newCards = [...prev.cards];
      const links = (newCards[cardIdx].links || []).filter((_, i) => i !== linkIdx);
      newCards[cardIdx] = { ...newCards[cardIdx], links };
      return { ...prev, cards: newCards };
    });
  };

  const addNewCard = () => {
    const newCard: CardItem = {
      id: `card-${Date.now()}`,
      icon: 'fa-link',
      title: '新服務項目',
      desc: '請輸入此服務項目的詳細說明',
      url: '#',
      badge: '熱門推薦'
    };
    setFormData(prev => ({
      ...prev,
      cards: [...prev.cards, newCard]
    }));
    showToast('已新增一個功能板塊卡片');
  };

  const removeCard = (index: number) => {
    setFormData(prev => ({
      ...prev,
      cards: prev.cards.filter((_, i) => i !== index)
    }));
  };

  const moveCard = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= formData.cards.length) return;

    setFormData(prev => {
      const newCards = [...prev.cards];
      const temp = newCards[index];
      newCards[index] = newCards[targetIdx];
      newCards[targetIdx] = temp;
      return { ...prev, cards: newCards };
    });
  };

  const handleResetToDefault = () => {
    if (window.confirm('確定要還原為系統初始預設文案與卡片嗎？此操作將覆蓋您先前的修改。')) {
      setFormData(JSON.parse(JSON.stringify(DEFAULT_DATA)));
      showToast('已重設為預設底稿，點擊下方「儲存並同步更新」以套用');
    }
  };

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(formData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `amazon_mount_config_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('設定備份檔已匯出下載');
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && typeof parsed === 'object') {
          setFormData(prev => ({ ...prev, ...parsed }));
          showToast('設定已成功匯入！');
        }
      } catch (err) {
        alert('檔案格式錯誤，請確保為有效的 JSON 檔案');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      const dataToSave: SiteData = { ...formData };
      await onSave(dataToSave);
      showToast('網頁資料已成功同步至 Firebase 雲端與所有裝置！');
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: any) {
      console.error('Failed to save to cloud:', err);
      setSaveError(
        err?.message || '雲端儲存失敗，請檢查網路連線或稍後再試。'
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      id="admin-modal"
      className="admin-modal-root fixed inset-0 bg-black/65 backdrop-blur-sm z-50 flex items-center justify-center p-3 md:p-6 animate-fade-in"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* 後台 Header */}
        <div className="bg-[#1e293b] text-white px-6 py-4 flex justify-between items-center border-b border-slate-700">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/30 text-emerald-400 flex items-center justify-center">
              <i className="fa-solid fa-pen-to-square text-base"></i>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base md:text-lg">網站內容即時管理後台</h3>
                {isCloudConnected ? (
                  <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                    <Cloud className="w-3 h-3" />
                    <span>Firestore 雲端同步</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full">
                    <Cloud className="w-3 h-3" />
                    <span>本地備援模式</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-300">
                修改後將直接同步至 Firebase 雲端，任何電腦或手機打開網站皆即時生效
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetToDefault}
              disabled={isSaving}
              className="text-xs bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-1 transition cursor-pointer"
              title="恢復預設底稿"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">恢復預設</span>
            </button>

            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                disabled={isSaving}
                className="text-xs bg-red-900/60 hover:bg-red-800 text-red-200 border border-red-700/50 px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition cursor-pointer disabled:opacity-50"
                title="登出管理後台"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">登出</span>
              </button>
            )}

            <button
              onClick={onClose}
              disabled={isSaving}
              className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer disabled:opacity-50"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* 錯誤警示條 (Error Alert) */}
        {saveError && (
          <div className="bg-red-50 border-b border-red-200 text-red-800 text-xs py-2.5 px-6 flex items-center justify-between gap-2 animate-fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span><strong>儲存失敗：</strong>{saveError}</span>
            </div>
            <button
              onClick={() => setSaveError(null)}
              className="text-red-600 hover:text-red-900 font-bold ml-2 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Toast alert inside modal */}
        {toastMessage && (
          <div className="bg-emerald-600 text-white text-xs py-2 px-4 flex items-center justify-center gap-1.5 animate-fade-in">
            <Check className="w-4 h-4" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* 後台內容編輯區 */}
        <div className="p-6 overflow-y-auto space-y-6 flex-grow text-sm bg-slate-50/50">
          
          {/* 1. 聯絡資訊連結 (超連結設定) */}
          <div className="bg-white p-4 md:p-5 rounded-xl border border-gray-200 shadow-xs">
            <h4 className="font-bold text-gray-800 mb-3 text-base border-b border-gray-100 pb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>聯絡超連結設定 (前台僅顯示按鈕與直通操作)</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  電話號碼 (tel:)
                </label>
                <input
                  type="text"
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) => handleTextChange('phone', e.target.value)}
                  className="w-full border border-gray-300 p-2 rounded-lg text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none bg-slate-50 focus:bg-white"
                  placeholder="0912345678"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  LINE 官方網址 (https://)
                </label>
                <input
                  type="text"
                  id="edit-line"
                  value={formData.lineUrl}
                  onChange={(e) => handleTextChange('lineUrl', e.target.value)}
                  className="w-full border border-gray-300 p-2 rounded-lg text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none bg-slate-50 focus:bg-white"
                  placeholder="https://line.me/R/ti/p/@..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Email 信箱 (mailto:)
                </label>
                <input
                  type="text"
                  id="edit-email"
                  value={formData.email}
                  onChange={(e) => handleTextChange('email', e.target.value)}
                  className="w-full border border-gray-300 p-2 rounded-lg text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none bg-slate-50 focus:bg-white"
                  placeholder="service@example.com"
                />
              </div>
            </div>
          </div>

          {/* 2. 網站標題與 SEO */}
          <div className="bg-white p-4 md:p-5 rounded-xl border border-gray-200 shadow-xs space-y-3">
            <h4 className="font-bold text-gray-800 mb-2 text-base border-b border-gray-100 pb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>SEO與網站標題編輯</span>
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  網站大標題
                </label>
                <input
                  type="text"
                  id="edit-site-title"
                  value={formData.siteTitle}
                  onChange={(e) => handleTextChange('siteTitle', e.target.value)}
                  className="w-full border border-gray-300 p-2 rounded-lg text-xs font-bold focus:ring-2 focus:ring-emerald-600 focus:outline-none bg-slate-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  副標題 / 標語
                </label>
                <input
                  type="text"
                  id="edit-site-subtitle"
                  value={formData.siteSubtitle}
                  onChange={(e) => handleTextChange('siteSubtitle', e.target.value)}
                  className="w-full border border-gray-300 p-2 rounded-lg text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none bg-slate-50 focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  大 LINE 按鈕文字
                </label>
                <input
                  type="text"
                  id="edit-hero-line-text"
                  value={formData.heroLineText}
                  onChange={(e) => handleTextChange('heroLineText', e.target.value)}
                  className="w-full border border-gray-300 p-2 rounded-lg text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none bg-slate-50 focus:bg-white"
                  placeholder="點我加 LINE 官方帳號預約"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  功能板塊區塊大標題
                </label>
                <input
                  type="text"
                  id="edit-section-title"
                  value={formData.sectionTitle}
                  onChange={(e) => handleTextChange('sectionTitle', e.target.value)}
                  className="w-full border border-gray-300 p-2 rounded-lg text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none bg-slate-50 focus:bg-white"
                  placeholder="高山接駁服務與即時查詢"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                SEO 搜尋描述 (Description)
              </label>
              <textarea
                id="edit-seo-desc"
                value={formData.seoDesc}
                onChange={(e) => handleTextChange('seoDesc', e.target.value)}
                className="w-full border border-gray-300 p-2.5 rounded-lg h-16 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none bg-slate-50 focus:bg-white"
              />
            </div>
          </div>

          {/* 3. 特色賣點標籤 */}
          <div className="bg-white p-4 md:p-5 rounded-xl border border-gray-200 shadow-xs space-y-3">
            <h4 className="font-bold text-gray-800 text-base border-b border-gray-100 pb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>頁首特色賣點標籤管理</span>
              </div>
              <span className="text-xs font-normal text-slate-500">已設置 {formData.features.length} 項</span>
            </h4>

            <div className="flex flex-wrap gap-2 items-center">
              {formData.features.map((feat, fIdx) => (
                <span
                  key={fIdx}
                  className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs px-2.5 py-1 rounded-full font-medium"
                >
                  <span>{feat}</span>
                  <button
                    type="button"
                    onClick={() => removeFeature(fIdx)}
                    className="text-emerald-700 hover:text-red-600 transition"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex gap-2 pt-1">
              <input
                type="text"
                placeholder="新增特色標籤（例：高山專用雪鍊配備）"
                value={newFeatureText}
                onChange={(e) => setNewFeatureText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                className="border border-gray-300 p-2 rounded-lg text-xs flex-grow bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
              <button
                type="button"
                onClick={addFeature}
                className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs px-4 py-2 rounded-lg font-bold transition flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>新增標籤</span>
              </button>
            </div>
          </div>

          {/* 4. 關於我們 */}
          <div className="bg-white p-4 md:p-5 rounded-xl border border-gray-200 shadow-xs space-y-3">
            <h4 className="font-bold text-gray-800 text-base border-b border-gray-100 pb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>「關於亞馬遜高山接駁」文案</span>
            </h4>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                區塊標題
              </label>
              <input
                type="text"
                value={formData.aboutTitle}
                onChange={(e) => handleTextChange('aboutTitle', e.target.value)}
                className="w-full border border-gray-300 p-2 rounded-lg text-xs font-bold focus:ring-2 focus:ring-emerald-600 focus:outline-none bg-slate-50 focus:bg-white mb-2"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                詳細文案內容 (支援換行)
              </label>
              <textarea
                id="edit-about"
                value={formData.aboutContent}
                onChange={(e) => handleTextChange('aboutContent', e.target.value)}
                className="w-full border border-gray-300 p-2.5 rounded-lg h-28 text-xs leading-relaxed focus:ring-2 focus:ring-emerald-600 focus:outline-none bg-slate-50 focus:bg-white"
              />
            </div>
          </div>

          {/* 5. 板塊管理 */}
          <div className="bg-white p-4 md:p-5 rounded-xl border border-gray-200 shadow-xs">
            <div className="flex flex-wrap justify-between items-center border-b border-gray-100 pb-3 mb-3 gap-2">
              <div>
                <h4 className="font-bold text-gray-800 text-base flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>功能板塊管理 (可新增 / 修改 / 刪除 / 調順序)</span>
                </h4>
                <p className="text-[11px] text-gray-500">
                  可填入內部工具代碼（#calc, #hotel, #food, #road）或自訂外部跳轉超連結網址
                </p>
              </div>
              <button
                type="button"
                onClick={addNewCard}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>新增板塊</span>
              </button>
            </div>

            {/* Quick Icon Selector Hint */}
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 mb-4 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-500 font-medium">常見圖示快速代碼：</span>
              {COMMON_ICONS.map((ci, cIdx) => (
                <span
                  key={cIdx}
                  className="bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded text-[11px] flex items-center gap-1 select-all cursor-pointer hover:border-emerald-500"
                  title="可複製填入下方圖示欄位"
                >
                  <DynamicIcon iconName={ci.icon} className="w-3 h-3 text-emerald-700" />
                  <code>{ci.icon}</code>
                </span>
              ))}
            </div>

            {/* 卡片列表 */}
            <div id="edit-cards-container" className="space-y-3">
              {formData.cards.map((card, idx) => (
                <div
                  key={card.id || idx}
                  className="bg-slate-50 p-3.5 rounded-xl border border-gray-300 relative space-y-2.5 transition hover:border-emerald-500"
                >
                  <div className="flex items-center justify-between gap-2 border-b border-gray-200 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                        {idx + 1}
                      </div>
                      <span className="font-bold text-gray-800 text-xs">{card.title || '服務項目'}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Move up / down */}
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => moveCard(idx, 'up')}
                        className="p-1 text-gray-500 hover:text-gray-800 disabled:opacity-30 rounded hover:bg-gray-200"
                        title="往上移"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === formData.cards.length - 1}
                        onClick={() => moveCard(idx, 'down')}
                        className="p-1 text-gray-500 hover:text-gray-800 disabled:opacity-30 rounded hover:bg-gray-200"
                        title="往下移"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => removeCard(idx)}
                        className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition text-xs flex items-center gap-1 ml-1"
                        title="刪除此項目"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>刪除</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <div className="sm:col-span-1">
                      <label className="block text-[11px] font-medium text-gray-600 mb-0.5">標題名稱</label>
                      <input
                        type="text"
                        value={card.title}
                        onChange={(e) => updateCard(idx, 'title', e.target.value)}
                        placeholder="卡片標題"
                        className="w-full bg-white border border-gray-300 p-1.5 rounded text-xs font-bold focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-1">
                      <label className="block text-[11px] font-medium text-gray-600 mb-0.5">圖示名稱 (FA/Lucide)</label>
                      <div className="flex items-center gap-1.5">
                        <div className="w-7 h-7 rounded bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0 text-sm border border-emerald-200">
                          <DynamicIcon iconName={card.icon} className="w-3.5 h-3.5" />
                        </div>
                        <input
                          type="text"
                          value={card.icon}
                          onChange={(e) => updateCard(idx, 'icon', e.target.value)}
                          placeholder="fa-calculator"
                          className="w-full bg-white border border-gray-300 p-1.5 rounded text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-1">
                      <label className="block text-[11px] font-medium text-gray-600 mb-0.5">連結 / 模式 (#calc 或 網址)</label>
                      <input
                        type="text"
                        value={card.url}
                        onChange={(e) => updateCard(idx, 'url', e.target.value)}
                        placeholder="#calc, #hotel, 或 https://"
                        className="w-full bg-white border border-gray-300 p-1.5 rounded text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none font-mono"
                      />
                    </div>

                    <div className="sm:col-span-1">
                      <label className="block text-[11px] font-medium text-gray-600 mb-0.5">右上標籤角標 (可選)</label>
                      <input
                        type="text"
                        value={card.badge || ''}
                        onChange={(e) => updateCard(idx, 'badge', e.target.value)}
                        placeholder="例：即時試算"
                        className="w-full bg-white border border-gray-300 p-1.5 rounded text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-gray-600 mb-0.5">說明描述文字</label>
                    <input
                      type="text"
                      value={card.desc}
                      onChange={(e) => updateCard(idx, 'desc', e.target.value)}
                      placeholder="描述文字"
                      className="w-full bg-white border border-gray-300 p-1.5 rounded text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  {/* 彈窗連結清單：有填時，前台點卡片會跳出清單，只顯示文字不顯示網址 */}
                  <div className="bg-white border border-emerald-200 rounded-lg p-2.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-emerald-800">
                        彈窗連結清單（有填就會取代上方「連結」，前台只顯示文字、不顯示網址）
                      </span>
                      <button
                        type="button"
                        onClick={() => addCardLink(idx)}
                        className="text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> 新增連結
                      </button>
                    </div>
                    {(card.links || []).map((lk, li) => (
                      <div key={li} className="grid grid-cols-1 sm:grid-cols-[1fr_1.2fr_2fr_auto] gap-1.5 items-center">
                        <input
                          type="text"
                          value={lk.group}
                          onChange={(e) => updateCardLink(idx, li, 'group', e.target.value)}
                          placeholder="分類（例：國家公園）"
                          className="bg-white border border-gray-300 p-1.5 rounded text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                        />
                        <input
                          type="text"
                          value={lk.label}
                          onChange={(e) => updateCardLink(idx, li, 'label', e.target.value)}
                          placeholder="顯示文字"
                          className="bg-white border border-gray-300 p-1.5 rounded text-xs font-bold focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                        />
                        <input
                          type="text"
                          value={lk.url}
                          onChange={(e) => updateCardLink(idx, li, 'url', e.target.value)}
                          placeholder="https://..."
                          className="bg-white border border-gray-300 p-1.5 rounded text-xs font-mono focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => removeCardLink(idx, li)}
                          className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
                          title="刪除此連結"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 6. 備份與匯出/匯入 */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="text-gray-600">
              <span className="font-semibold text-gray-800">資料安全備份：</span>
              <span>可將全部設定匯出為 JSON 備份檔，或從備份檔還原。</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportJson}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-300 flex items-center gap-1 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>匯出備份 JSON</span>
              </button>

              <label className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-300 flex items-center gap-1 transition cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>匯入備份</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportJson}
                  className="hidden"
                />
              </label>
            </div>
          </div>

        </div>

        {/* 後台 Footer / 儲存按鈕 */}
        <div className="bg-gray-100 px-6 py-3.5 flex items-center justify-between border-t border-gray-200">
          <div className="text-xs text-gray-500 hidden sm:block">
            儲存後將同步寫入 Firebase 雲端資料庫，任何訪客與裝置即時查看最新內容（並更新本地備援快取）。
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-200 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-500 text-white rounded-lg font-bold shadow-sm transition flex items-center gap-2 text-xs sm:text-sm cursor-pointer disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>雲端同步寫入中...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>儲存並同步至雲端</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
