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
      const res = await fetch(`/api/public-data?_t=${Date.now()}`, {
        cache: 'no-store',
      });
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

  // SEO: Update page title, meta description, canonical and og:url dynamically
  useEffect(() => {
    const seoMap: Record<string, { title: string; description: string }> = {
      '/': {
        title: '亞馬遜國家山岳協會 | Amazon Alpine Association',
        description: '亞馬遜國家山岳協會（Amazon Alpine Association）官方入口網站與活動行事曆，提倡全民運動、鍛鍊強健體魄、培養互助團隊精神，以及接觸大自然與山林相關知識及技能。',
      },
      '/intro': {
        title: '登山入門指南 | 亞馬遜國家山岳協會 | Amazon Alpine Association',
        description: '專為登山新手與山友整理的登山入門指南，涵蓋高山裝備清單、行前體能鍛鍊、山林安全自保守則與無痕山林（LNT）準則，助您安全開啟山岳旅程。',
      },
      '/tools': {
        title: '登山工具與氣象服務 | 亞馬遜國家山岳協會 | Amazon Alpine Association',
        description: '登山實用數位工具與氣象服務專區，即時整合高山氣象預報、國家公園入山入園線上申辦、步道路況通報及離線地圖軌跡等數位資源。',
      },
      '/highlights': {
        title: '活動花絮影音專區 | 亞馬遜國家山岳協會 | Amazon Alpine Association',
        description: '亞馬遜國家山岳協會歷年登山行程精選花絮與影音專區，收錄百岳縱走記錄、山友精彩回顧、自然風光縮時與活動實況影片分享。',
      },
      '/policies': {
        title: '政策與章程條款 | 亞馬遜國家山岳協會 | Amazon Alpine Association',
        description: '亞馬遜國家山岳協會章程、活動報名規範、費用與退費標準、山域活動安全責任守則及個人資料保護聲明，維護全體山友權益。',
      },
      '/surveys': {
        title: '問卷調查專區 | 亞馬遜國家山岳協會 | Amazon Alpine Association',
        description: '亞馬遜國家山岳協會意見回饋與問卷調查專區，歡迎山友填寫活動滿意度調查及山岳發展建議，共同打造優質山岳社群。',
      },
      '/admin': {
        title: '後台管理系統 | 亞馬遜國家山岳協會 | Amazon Alpine Association',
        description: '亞馬遜國家山岳協會後台管理系統。',
      },
    };

    const currentMeta = seoMap[currentPath] || seoMap['/'];
    document.title = currentMeta.title;

    // Update meta description
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', currentMeta.description);

    // Update og:title
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', currentMeta.title);

    // Update og:description
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', currentMeta.description);

    // Update canonical link
    const canonicalUrl = currentPath === '/' ? 'https://amazon-hike.com/' : `https://amazon-hike.com${currentPath}`;
    const canonicalLink = document.querySelector('link[rel="canonical"]');
    if (canonicalLink) canonicalLink.setAttribute('href', canonicalUrl);

    // Update og:url
    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) ogUrl.setAttribute('content', canonicalUrl);
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
