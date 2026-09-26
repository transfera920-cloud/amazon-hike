import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Header } from './components/Header.js';
import { Footer } from './components/Footer.js';
import { CalendarSection } from './components/CalendarSection.js';
import { IntroView } from './components/IntroView.js';
import { ChapterView } from './components/ChapterView.js';
import { ToolsView } from './components/ToolsView.js';
import { HighlightsView } from './components/HighlightsView.js';
import { PoliciesView } from './components/PoliciesView.js';
import { SurveysView } from './components/SurveysView.js';
import { AdminPage } from './components/AdminPage.js';
import { NavActivitiesView } from './components/NavActivitiesView.js';
import { RouteActivityView } from './components/RouteActivityView.js';
import { getCategorySlug, resolveActivitySeo } from './utils/activitySeo.js';
import type { AssociationDatabase, CalendarActivity } from './types.js';

const KNOWN_PATHS = new Set(['/', '/intro', '/tools', '/highlights', '/policies', '/surveys', '/admin']);
const CHAPTER_PATH_RE = /^\/chapter(0[1-9]|1[0-5])$/i;

function normalizePath(p: string): string {
  if (!p || p === '/') return '/';
  const stripped = p.replace(/\/+$/, '');
  return stripped === '' ? '/' : stripped;
}

export default function App() {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return normalizePath(window.location.pathname || '/');
  });

  const [publicData, setPublicData] = useState<AssociationDatabase>({
    version: 1,
    surveyUrl: '',
    intros: [],
    tools: [],
    highlights: [],
    policies: [],
    surveys: [],
    navButtons: [],
    navButtonEntries: [],
    navButtonActivities: [],
    chapters: [],
  });

  // 章節資料是否已載入完成（避免資料載入前誤判章節不存在 → 404 / noindex）
  const [publicDataLoaded, setPublicDataLoaded] = useState(false);
  const [activities, setActivities] = useState<CalendarActivity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [activitiesError, setActivitiesError] = useState<string | null>(null);

  // Fetch baseline / dynamic public data (tools, policies, highlights, navButtons, chapters)
  const fetchPublicData = useCallback(async () => {
    try {
      const res = await fetch(`/api/public-data?_t=${Date.now()}`, {
        cache: 'no-store',
      });
      const contentType = res.headers.get('content-type') || '';
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      if (!contentType.includes('application/json')) {
        throw new Error(`非預期的回應格式: ${contentType}`);
      }
      const json = await res.json();
      if (json.success && json.data) {
        setPublicData(json.data);
      } else {
        throw new Error(json.error || '無法取得協會公開資料');
      }
    } catch (err) {
      console.warn('Failed to load public data:', err);
    } finally {
      setPublicDataLoaded(true);
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
      setCurrentPath(normalizePath(window.location.pathname || '/'));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Routing navigation helper
  const navigate = (path: string) => {
    const m = path.match(/^\/intro\/(chapter(?:0[1-9]|1[0-5]))\/?$/i);
    if (m) {
      window.location.assign(`/${m[1].toLowerCase()}/`);
      return;
    }

    const target = normalizePath(path);
    if (target !== currentPath) {
      window.history.pushState({}, '', target);
      setCurrentPath(target);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Parse dynamic chapter slug if route matches /intro/:slug
  const currentChapterSlug = useMemo(() => {
    if (currentPath.startsWith('/intro/')) {
      const slug = currentPath.replace(/^\/intro\//, '').replace(/\/+$/, '');
      return slug.toLowerCase();
    }
    if (CHAPTER_PATH_RE.test(currentPath)) {
      return currentPath.slice(1).toLowerCase();
    }
    return null;
  }, [currentPath]);

  // Current chapter and adjacent chapters for Prev/Next
  const sortedChapters = useMemo(() => {
    return (publicData.chapters || []).slice().sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }, [publicData.chapters]);

  const currentChapterIndex = useMemo(() => {
    if (!currentChapterSlug) return -1;
    return sortedChapters.findIndex((c) => c.slug.toLowerCase() === currentChapterSlug);
  }, [sortedChapters, currentChapterSlug]);

  const currentChapter = currentChapterIndex >= 0 ? sortedChapters[currentChapterIndex] : null;
  const prevChapter = currentChapterIndex > 0 ? sortedChapters[currentChapterIndex - 1] : undefined;
  const nextChapter = currentChapterIndex >= 0 && currentChapterIndex < sortedChapters.length - 1 ? sortedChapters[currentChapterIndex + 1] : undefined;

  // Dynamic nav button ID if route matches /nav/:buttonId
  const currentNavButtonId = useMemo(() => {
    if (currentPath.startsWith('/nav/')) {
      return currentPath.replace(/^\/nav\//, '').replace(/\/+$/, '');
    }
    return null;
  }, [currentPath]);

  // Current nav button: matches by id or by url matching /nav/:buttonId
  const currentNavButton = useMemo(() => {
    if (!currentNavButtonId) return null;
    return (
      (publicData.navButtons || []).find((b) => {
        if (b.id === currentNavButtonId) return true;
        if (b.url === currentPath) return true;
        if (b.url === `/nav/${currentNavButtonId}`) return true;
        const stripped = (b.url || '').replace(/^\/nav\//, '').replace(/\/+$/, '');
        if (stripped && stripped === currentNavButtonId) return true;
        return false;
      }) || null
    );
  }, [publicData.navButtons, currentNavButtonId, currentPath]);

  // Enabled activities for current nav button
  const currentNavActivities = useMemo(() => {
    if (!currentNavButton) return [];
    return (publicData.navButtonActivities || [])
      .filter((a) => a.navButtonId === currentNavButton.id && a.enabled)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }, [publicData.navButtonActivities, currentNavButton]);

  // Dynamic two-segment category and activity route: /{categorySlug}/{activitySlug}/
  const currentCategoryActivitySegments = useMemo<[string, string] | null>(() => {
    if (
      KNOWN_PATHS.has(currentPath) ||
      CHAPTER_PATH_RE.test(currentPath) ||
      currentPath.startsWith('/intro/') ||
      currentPath.startsWith('/nav/') ||
      currentPath.startsWith('/route/') ||
      currentPath.startsWith('/admin')
    ) {
      return null;
    }
    const segs = currentPath.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean);
    if (segs.length !== 2) return null;
    if (!segs[0].trim() || !segs[1].trim()) return null;
    return [segs[0].toLowerCase(), segs[1].toLowerCase()];
  }, [currentPath]);

  // Current category button matching first segment
  const currentCategoryButton = useMemo(() => {
    if (!currentCategoryActivitySegments) return null;
    const [catSlug] = currentCategoryActivitySegments;
    return (
      (publicData.navButtons || []).find(
        (btn) => btn.enabled && getCategorySlug(btn) === catSlug
      ) || null
    );
  }, [currentCategoryActivitySegments, publicData.navButtons]);

  // Current category activity matching second segment under currentCategoryButton
  const currentCategoryActivity = useMemo(() => {
    if (!currentCategoryButton || !currentCategoryActivitySegments) return null;
    const [, actSlug] = currentCategoryActivitySegments;
    return (
      (publicData.navButtonActivities || []).find(
        (a) =>
          a.navButtonId === currentCategoryButton.id &&
          a.slug.toLowerCase() === actSlug &&
          a.enabled
      ) || null
    );
  }, [currentCategoryButton, currentCategoryActivitySegments, publicData.navButtonActivities]);

  // Sibling activities under the same category
  const currentCategorySiblingActivities = useMemo(() => {
    if (!currentCategoryButton || !currentCategoryActivity) return [];
    return (publicData.navButtonActivities || [])
      .filter(
        (a) =>
          a.navButtonId === currentCategoryButton.id &&
          a.enabled &&
          a.id !== currentCategoryActivity.id
      )
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      .slice(0, 4);
  }, [currentCategoryButton, currentCategoryActivity, publicData.navButtonActivities]);

  // Dynamic route slug if route matches /route/:slug (legacy fallback)
  const currentRouteSlug = useMemo(() => {
    if (currentPath.startsWith('/route/')) {
      return currentPath.replace(/^\/route\//, '').replace(/\/+$/, '').toLowerCase();
    }
    return null;
  }, [currentPath]);

  // Current route activity (legacy fallback)
  const currentRouteActivity = useMemo(() => {
    if (!currentRouteSlug) return null;
    return (
      (publicData.navButtonActivities || []).find(
        (a) => a.slug.toLowerCase() === currentRouteSlug && a.enabled
      ) || null
    );
  }, [publicData.navButtonActivities, currentRouteSlug]);

  const currentRouteParentButton = useMemo(() => {
    if (!currentRouteActivity) return undefined;
    return (publicData.navButtons || []).find((b) => b.id === currentRouteActivity.navButtonId);
  }, [publicData.navButtons, currentRouteActivity]);

  // Determine if current route is an unknown path
  const isUnknownPath = useMemo(() => {
    if (KNOWN_PATHS.has(currentPath)) return false;
    if (currentPath.startsWith('/intro/')) return false; // Handled by dynamic chapter view or chapter 404
    if (CHAPTER_PATH_RE.test(currentPath)) return false; // 正式章節網址 /chapterXX/
    if (currentPath.startsWith('/nav/')) {
      if (!publicDataLoaded) return false;
      return !currentNavButton;
    }
    if (currentPath.startsWith('/route/')) {
      if (!publicDataLoaded) return false;
      return !currentRouteActivity;
    }
    if (currentCategoryActivitySegments) {
      if (!publicDataLoaded) return false;
      return !currentCategoryButton || !currentCategoryActivity;
    }
    return true;
  }, [
    currentPath,
    publicDataLoaded,
    currentNavButton,
    currentRouteActivity,
    currentCategoryActivitySegments,
    currentCategoryButton,
    currentCategoryActivity,
  ]);

  // SEO: Update page title, meta description, canonical, og:url, twitter:title, twitter:description, and robots
  useEffect(() => {
    if (currentChapterSlug && !currentChapter && !publicDataLoaded) return;
    if (currentNavButtonId && !currentNavButton && !publicDataLoaded) return;
    if (currentRouteSlug && !currentRouteActivity && !publicDataLoaded) return;
    if (currentCategoryActivitySegments && !currentCategoryActivity && !publicDataLoaded) return;

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

    let currentMeta: { title: string; description: string; ogImage?: string } | undefined = seoMap[currentPath];
    let is404 = false;
    let customCanonicalUrl: string | undefined;

    if (isUnknownPath) {
      is404 = true;
      if (currentCategoryActivitySegments) {
        currentMeta = {
          title: '找不到此活動 | 亞馬遜國家山岳協會 | Amazon Alpine Association',
          description: '找不到該行程活動，可能已下架、網址錯誤或分類已異動。',
        };
      } else {
        currentMeta = {
          title: '找不到此頁面 | 亞馬遜國家山岳協會 | Amazon Alpine Association',
          description: '很抱歉，您所尋找的頁面不存在或已被移除。請返回首頁或瀏覽其他專題專區。',
        };
      }
    } else if (!currentMeta && currentCategoryActivity && currentCategoryButton) {
      const catSlug = getCategorySlug(currentCategoryButton);
      customCanonicalUrl = `https://amazon-hike.com/${catSlug}/${currentCategoryActivity.slug}/`;
      const resolved = resolveActivitySeo(currentCategoryActivity, currentCategoryButton);
      currentMeta = {
        title: resolved.title,
        description: resolved.description,
        ogImage: resolved.image,
      };
    } else if (!currentMeta && currentRouteActivity) {
      currentMeta = {
        title: `${currentRouteActivity.title} | 亞馬遜國家山岳協會 | Amazon Alpine Association`,
        description:
          currentRouteActivity.description ||
          `${currentRouteActivity.title} - 亞馬遜國家山岳協會登山行程活動說明與完整報名資訊。`,
      };
    } else if (!currentMeta && currentNavButton) {
      currentMeta = {
        title: `${currentNavButton.title} - 活動列表 | 亞馬遜國家山岳協會 | Amazon Alpine Association`,
        description: `亞馬遜國家山岳協會 ${currentNavButton.title} 活動與行程清單。`,
      };
    } else if (!currentMeta && currentChapter) {
      currentMeta = {
        title: `${currentChapter.title} | 亞馬遜國家山岳協會 | Amazon Alpine Association`,
        description: currentChapter.description || `${currentChapter.title} - 亞馬遜國家山岳協會登山入門教學專文。`,
      };
    } else if (!currentMeta && currentChapterSlug) {
      is404 = true;
      currentMeta = {
        title: '找不到此章節 | 亞馬遜國家山岳協會 | Amazon Alpine Association',
        description: '抱歉，您所尋找的登山入門章節不存在或已被下架。',
      };
    } else if (!currentMeta) {
      currentMeta = seoMap['/'];
    }

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

    // Update twitter:title & twitter:description
    const twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (twitterTitle) twitterTitle.setAttribute('content', currentMeta.title);

    const twitterDesc = document.querySelector('meta[name="twitter:description"]');
    if (twitterDesc) twitterDesc.setAttribute('content', currentMeta.description);

    // Update canonical link: 未知路徑 404 canonical 指向首頁
    const canonicalUrl = isUnknownPath || currentPath === '/'
      ? 'https://amazon-hike.com/'
      : (customCanonicalUrl || `https://amazon-hike.com${currentPath}`);
    const canonicalLink = document.querySelector('link[rel="canonical"]');
    if (canonicalLink) canonicalLink.setAttribute('href', canonicalUrl);

    // Update og:url
    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) ogUrl.setAttribute('content', canonicalUrl);

    // Update og:image if provided
    let ogImageEl = document.querySelector('meta[property="og:image"]');
    if (currentMeta.ogImage) {
      if (!ogImageEl) {
        ogImageEl = document.createElement('meta');
        ogImageEl.setAttribute('property', 'og:image');
        document.head.appendChild(ogImageEl);
      }
      ogImageEl.setAttribute('content', currentMeta.ogImage);
    }

    // Update robots meta tag: 404 時設為 noindex, follow
    let robotsMeta = document.querySelector('meta[name="robots"]');
    if (!robotsMeta) {
      robotsMeta = document.createElement('meta');
      robotsMeta.setAttribute('name', 'robots');
      document.head.appendChild(robotsMeta);
    }
    if (is404) {
      robotsMeta.setAttribute('content', 'noindex, follow');
    } else {
      robotsMeta.setAttribute('content', 'index, follow');
    }
  }, [
    currentPath,
    currentChapter,
    currentChapterSlug,
    isUnknownPath,
    publicDataLoaded,
    currentCategoryActivitySegments,
    currentCategoryButton,
    currentCategoryActivity,
  ]);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-emerald-800 selection:text-white">
      {/* 1. 主導覽 (Header) with Organization details and 8 portals */}
      <Header
        currentPath={currentPath}
        onNavigate={navigate}
        surveyUrl={publicData.surveyUrl}
        navButtons={publicData.navButtons}
        navButtonActivities={publicData.navButtonActivities}
      />

      {/* 2. Main Content based on route */}
      <div className="flex-1">
        {/* 未知路徑 404 畫面 */}
        {isUnknownPath && (
          <main className="max-w-4xl mx-auto px-4 py-20 text-center">
            <h1 className="text-3xl font-extrabold text-neutral-100 mb-3">找不到此頁面</h1>
            <p className="text-base text-neutral-400 mb-8 max-w-lg mx-auto">
              很抱歉，您輸入或點選的網址不存在或已被移除。請返回協會首頁或使用上方主導覽前往其他專區。
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-sm font-semibold transition-colors shadow-lg shadow-emerald-950"
              >
                返回協會首頁
              </button>
              <button
                type="button"
                onClick={() => navigate('/intro')}
                className="px-5 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-md text-sm font-semibold transition-colors border border-neutral-700"
              >
                瀏覽登山入門指南
              </button>
            </div>
          </main>
        )}

        {/* 首頁: 活動行事曆 ONLY (沒有任何堆疊的多餘區塊) */}
        {!isUnknownPath && currentPath === '/' && (
          <CalendarSection
            activities={activities}
            loading={activitiesLoading}
            error={activitiesError}
          />
        )}

        {/* 登山入門 獨立專區 */}
        {!isUnknownPath && currentPath === '/intro' && (
          <IntroView
            chapters={publicData.chapters}
            intros={publicData.intros}
            onBack={() => navigate('/')}
            onSelectChapter={(slug) => navigate(`/intro/${slug}`)}
          />
        )}

        {/* 登山入門 單篇章節頁面 /intro/:slug */}
        {!isUnknownPath && currentChapterSlug && currentChapter && (
          <ChapterView
            chapter={currentChapter}
            prevChapter={prevChapter}
            nextChapter={nextChapter}
            onBack={() => navigate('/intro')}
            onNavigateChapter={(slug) => navigate(`/intro/${slug}`)}
          />
        )}

        {/* 登山入門 章節 404 狀態 */}
        {!isUnknownPath && currentChapterSlug && !currentChapter && (
          <main className="max-w-4xl mx-auto px-4 py-16 text-center">
            <h1 className="text-2xl font-bold text-neutral-200 mb-2">找不到該專文章節</h1>
            <p className="text-sm text-neutral-400 mb-6">
              您輸入的章節網址「{currentPath}」不存在或目前未發布。
            </p>
            <button
              type="button"
              onClick={() => navigate('/intro')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-sm font-medium transition-colors"
            >
              返回登山入門目錄
            </button>
          </main>
        )}

        {/* 按鈕活動列表專區 /nav/:buttonId */}
        {!isUnknownPath && currentNavButtonId && currentNavButton && (
          <NavActivitiesView
            button={currentNavButton}
            activities={currentNavActivities}
            onBack={() => navigate('/')}
            onSelectActivity={(slug) => navigate(`/${getCategorySlug(currentNavButton)}/${slug}/`)}
          />
        )}

        {/* 兩層式行程活動內部頁面 /:categorySlug/:activitySlug/ */}
        {!isUnknownPath && currentCategoryButton && currentCategoryActivity && (
          <RouteActivityView
            activity={currentCategoryActivity}
            parentButton={currentCategoryButton}
            siblingActivities={currentCategorySiblingActivities}
            onBack={() => navigate(`/nav/${currentCategoryButton.id}`)}
            onNavigateHome={() => navigate('/')}
          />
        )}

        {/* 找不到行程活動 404 狀態 */}
        {isUnknownPath && currentCategoryActivitySegments && (
          <main className="max-w-4xl mx-auto px-4 py-16 text-center">
            <h1 className="text-2xl font-bold text-neutral-200 mb-2">找不到該行程活動</h1>
            <p className="text-sm text-neutral-400 mb-6">
              找不到該行程活動，可能已下架、網址錯誤或分類已異動。
            </p>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-sm font-medium transition-colors"
            >
              返回協會首頁
            </button>
          </main>
        )}

        {/* 單一活動內部頁面 /route/:slug（舊版相容） */}
        {!isUnknownPath && currentRouteSlug && currentRouteActivity && (
          <RouteActivityView
            activity={currentRouteActivity}
            parentButton={currentRouteParentButton}
            onBack={() => {
              if (currentRouteActivity.navButtonId) {
                navigate(`/nav/${currentRouteActivity.navButtonId}`);
              } else {
                navigate('/');
              }
            }}
            onNavigateHome={() => navigate('/')}
          />
        )}

        {/* 登山工具 獨立專區 */}
        {!isUnknownPath && currentPath === '/tools' && (
          <ToolsView
            tools={publicData.tools}
            onBack={() => navigate('/')}
          />
        )}

        {/* 活動花絮 YouTube 影音專區 */}
        {!isUnknownPath && currentPath === '/highlights' && (
          <HighlightsView
            highlights={publicData.highlights}
            onBack={() => navigate('/')}
          />
        )}

        {/* 政策與條款 獨立專區 */}
        {!isUnknownPath && currentPath === '/policies' && (
          <PoliciesView
            policies={publicData.policies}
            onBack={() => navigate('/')}
          />
        )}

        {/* 問卷調查 獨立選單專區 */}
        {!isUnknownPath && currentPath === '/surveys' && (
          <SurveysView
            surveys={publicData.surveys}
            onBack={() => navigate('/')}
          />
        )}

        {/* 後台管理 /admin */}
        {!isUnknownPath && currentPath === '/admin' && (
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
