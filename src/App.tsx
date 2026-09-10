import { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header.js';
import { Footer } from './components/Footer.js';
import { CalendarSection } from './components/CalendarSection.js';
import { IntroView } from './components/IntroView.js';
import { ToolsView } from './components/ToolsView.js';
import { HighlightsView } from './components/HighlightsView.js';
import { PoliciesView } from './components/PoliciesView.js';
import { SurveysView } from './components/SurveysView.js';
import { AdminPage } from './components/AdminPage.js';
import type { PublicDataResponse, CalendarActivity } from './types.js';

export default function App() {
  // Current route pathname
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return window.location.pathname || '/';
    }
    return '/';
  });

  // Public backend data
  const [publicData, setPublicData] = useState<PublicDataResponse>({
    surveyUrl: '',
    intros: [],
    tools: [],
    highlights: [],
    policies: [],
  });

  // Calendar activities from external official API
  const [activities, setActivities] = useState<CalendarActivity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [activitiesError, setActivitiesError] = useState<string | null>(null);

  // Fetch public data from backend
  const fetchPublicData = useCallback(async () => {
    try {
      const res = await fetch('/api/public-data');
      const contentType = res.headers.get('content-type') || '';
      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }
      if (!contentType.includes('application/json')) {
        const text = await res.text();
        throw new Error(`預期收到 JSON，但收到 ${contentType} (HTTP ${res.status})：${text.slice(0, 80)}`);
      }
      const json = await res.json();
      if (json.success && json.data) {
        setPublicData(json.data);
      }
    } catch (err: any) {
      console.error('Failed to load public data:', err);
    }
  }, []);

  // Fetch calendar activities from API proxy
  const fetchActivities = useCallback(async () => {
    setActivitiesLoading(true);
    setActivitiesError(null);
    try {
      const res = await fetch('/api/calendar-activities');
      const contentType = res.headers.get('content-type') || '';
      if (!res.ok) {
        if (!contentType.includes('application/json')) {
          const text = await res.text();
          throw new Error(`伺服器錯誤 (HTTP ${res.status} ${contentType})：${text.slice(0, 80)}`);
        }
        const errJson = await res.json();
        throw new Error(errJson.error || `HTTP error ${res.status}`);
      }
      if (!contentType.includes('application/json')) {
        const text = await res.text();
        throw new Error(`預期收到 JSON，但收到 ${contentType} (HTTP ${res.status})：${text.slice(0, 80)}`);
      }
      const json = await res.json();
      if (json.success && Array.isArray(json.activities)) {
        setActivities(json.activities);
      } else {
        setActivitiesError(json.error || '無法取得行事曆資料');
      }
    } catch (err: any) {
      setActivitiesError(err.message || '無法連線至活動資料庫');
    } finally {
      setActivitiesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPublicData();
    fetchActivities();
  }, [fetchPublicData, fetchActivities]);

  // Handle browser popstate (back / forward buttons)
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Routing navigation helper
  const navigate = (path: string) => {
    if (path !== currentPath) {
      window.history.pushState({}, '', path);
      setCurrentPath(path);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // SEO: Update page title dynamically
  useEffect(() => {
    const baseTitle = '亞馬遜國家山岳協會 | Amazon Alpine Association';
    switch (currentPath) {
      case '/intro':
        document.title = `登山入門指南 | ${baseTitle}`;
        break;
      case '/tools':
        document.title = `登山工具與氣象服務 | ${baseTitle}`;
        break;
      case '/highlights':
        document.title = `活動花絮影音專區 | ${baseTitle}`;
        break;
      case '/policies':
        document.title = `政策與章程條款 | ${baseTitle}`;
        break;
      case '/admin':
        document.title = `後台管理系統 | ${baseTitle}`;
        break;
      case '/':
      default:
        document.title = baseTitle;
        break;
    }
  }, [currentPath]);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-emerald-800 selection:text-white">
      {/* 1. 主導覽 (Header) with Organization details and 8 portals */}
      <Header
        currentPath={currentPath}
        onNavigate={navigate}
        surveyUrl={publicData.surveyUrl}
        navButtons={publicData.navButtons}
      />

      {/* 2. Main Content based on route */}
      <div className="flex-1">
        {/* 首頁: 活動行事曆 ONLY (沒有任何堆疊的多餘區塊) */}
        {currentPath === '/' && (
          <CalendarSection
            activities={activities}
            loading={activitiesLoading}
            error={activitiesError}
          />
        )}

        {/* 登山入門 獨立專區 */}
        {currentPath === '/intro' && (
          <IntroView
            intros={publicData.intros}
            onBack={() => navigate('/')}
          />
        )}

        {/* 登山工具 獨立專區 */}
        {currentPath === '/tools' && (
          <ToolsView
            tools={publicData.tools}
            onBack={() => navigate('/')}
          />
        )}

        {/* 活動花絮 YouTube 影音專區 */}
        {currentPath === '/highlights' && (
          <HighlightsView
            highlights={publicData.highlights}
            onBack={() => navigate('/')}
          />
        )}

        {/* 政策與條款 獨立專區 */}
        {currentPath === '/policies' && (
          <PoliciesView
            policies={publicData.policies}
            onBack={() => navigate('/')}
          />
        )}

        {/* 問卷調查 獨立選單專區 */}
        {currentPath === '/surveys' && (
          <SurveysView
            surveys={publicData.surveys}
            onBack={() => navigate('/')}
          />
        )}

        {/* 後台管理 /admin */}
        {currentPath === '/admin' && (
          <AdminPage
            onBack={() => navigate('/')}
            onDataUpdated={fetchPublicData}
          />
        )}
      </div>

      {/* 3. 頁尾資訊列 (FOOT: 亞馬遜國家山岳協會 ｜ LINE 官方諮詢) */}
      <Footer />
    </div>
  );
}
