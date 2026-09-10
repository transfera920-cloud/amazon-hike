import fs from 'fs';
import path from 'path';
import type {
  AssociationDatabase,
  IntroItem,
  ToolItem,
  HighlightItem,
  PolicyItem,
  SurveyItem,
  NavButtonItem,
  PublicDataResponse
} from '../src/types.js';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'association_db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export function getDefaultNavButtons(): NavButtonItem[] {
  return [
    { id: 'btn_calendar', title: '活動行事曆', url: '/', isExternal: false, enabled: true, sortOrder: 1 },
    { id: 'btn_recent', title: '近期活動', url: 'https://amazon-trail.ai.studio/activity/', isExternal: true, enabled: true, sortOrder: 2 },
    { id: 'btn_intro', title: '登山入門', url: '/intro', isExternal: false, enabled: true, sortOrder: 3 },
    { id: 'btn_tools', title: '登山工具', url: '/tools', isExternal: false, enabled: true, sortOrder: 4 },
    { id: 'btn_highlights', title: '活動花絮', url: '/highlights', isExternal: false, enabled: true, sortOrder: 5 },
    { id: 'btn_survey', title: '問卷調查', url: '/surveys', isExternal: false, enabled: true, sortOrder: 6 },
    { id: 'btn_policies', title: '政策與條款', url: '/policies', isExternal: false, enabled: true, sortOrder: 7 },
    { id: 'btn_routes', title: '行程總表', url: 'https://amazon-data.ai.studio/routes', isExternal: true, enabled: true, sortOrder: 8 },
  ];
}

export function getDefaultSurveys(surveyUrl?: string): SurveyItem[] {
  return [
    {
      id: 'survey_01',
      title: '亞馬遜登山活動滿意度與建議問卷',
      url: surveyUrl || 'https://docs.google.com/forms/d/e/1FAIpQLScX9amazonSurveyFormExample/viewform',
      description: '收集會員與參加山友對於登山嚮導、行程規劃與安全管理的寶貴意見與滿意度回饋。',
      enabled: true,
      sortOrder: 1,
    }
  ];
}

/**
 * Initial baseline records created ONLY if association_db.json does not exist.
 * Once created, this data is NEVER overwritten on restarts or deploys.
 */
function getInitialSeedData(): AssociationDatabase {
  const initialSurveyUrl = 'https://docs.google.com/forms/d/e/1FAIpQLScX9amazonSurveyFormExample/viewform';
  return {
    version: 1,
    surveyUrl: initialSurveyUrl,
    surveys: getDefaultSurveys(initialSurveyUrl),
    navButtons: getDefaultNavButtons(),
    intros: [
      {
        id: 'intro_01',
        title: '高山行前體能與適應訓練指南',
        description: '百岳長程攀登所需的有氧耐力、負重步行與核心肌群訓練原則，幫助登山者循序漸進建立體能基礎。',
        content: '高山活動講求穩定體能與高海拔適應。建議於出發前 6 至 8 週展開循序漸進的有氧、負重階梯與間歇耐力訓練。行前妥善調整睡眠與作息，上山時維持穩定呼吸節奏與定時水分電解質補充。',
        url: '',
        enabled: true,
        sortOrder: 1,
      },
      {
        id: 'intro_02',
        title: '高山三層穿衣法與失溫預防要訣',
        description: '排汗底層、保暖中層、防風雨外層的正確配置與穿著時機，兼顧行進散熱與靜態保溫。',
        content: '山區氣候瞬息萬變，維持身體乾爽是避免失溫的關鍵。底層嚴禁穿著純棉衣物，宜選用羊毛或機能化纖；行進時依體溫即時調節拉鍊或增減外層，休息時立即套上羽絨或化纖保暖層。',
        url: '',
        enabled: true,
        sortOrder: 2,
      },
      {
        id: 'intro_03',
        title: '無痕山林（LNT）七大準則實踐說明',
        description: '在親近自然山林的同時，降低對野生動植物及高山地貌的衝擊，落實負責任的戶外倫理。',
        content: '實踐無痕山林七大原則：事先充分規劃與準備、在堅實地表行走與露營、妥善處理排泄與廢棄物、保持環境原有風貌、降低營火影響、尊重野生動植物、考量其他使用者的體驗。所有垃圾必須完整帶下山。',
        url: '',
        enabled: true,
        sortOrder: 3,
      },
      {
        id: 'intro_04',
        title: '離線離線航跡 GPX 判讀與定位應用',
        description: '行前航跡下載、離線地圖判讀、等高線地形識別與迷途自保標準作業程序（STOP原則）。',
        content: '入山前必須下載離線地圖與官方 GPX 航跡，熟練使用智慧型手機登山離線地圖軟體與備份行動電源。一旦察覺走偏路徑，切記不要往下切溪谷，請留在稜線上或原路折返，冷靜通報求援。',
        url: '',
        enabled: true,
        sortOrder: 4,
      }
    ],
    tools: [
      {
        id: 'tool_01',
        title: '中央氣象署高山氣象預報',
        description: '查詢台灣各高山、主要登山步道即時氣溫、風速、紫外線與降雨機率',
        url: 'https://www.cwa.gov.tw/V8/C/L/Mountain/Mountain.html',
        enabled: true,
        sortOrder: 1,
      },
      {
        id: 'tool_02',
        title: '國家公園入山入園線上申辦系統',
        description: '玉山、雪霸、太魯閣國家公園生態保護區入園證與山屋營地抽籤查詢',
        url: 'https://npm.cpami.gov.tw/',
        enabled: true,
        sortOrder: 2,
      },
      {
        id: 'tool_03',
        title: '林業及自然保育署山林悠遊網',
        description: '全台國家森林遊樂區、國家步道即時路況通阻與天災警戒資訊',
        url: 'https://recreation.forest.gov.tw/',
        enabled: true,
        sortOrder: 3,
      },
      {
        id: 'tool_04',
        title: 'Windy 專業氣象與風場模式',
        description: 'ECMWF 與 GFS 多模式高空風向、雲層高度與積雨雲動態模擬',
        url: 'https://www.windy.com/',
        enabled: true,
        sortOrder: 4,
      }
    ],
    highlights: [
      {
        id: 'hl_01',
        youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        enabled: true,
        sortOrder: 1,
      }
    ],
    policies: [
      {
        id: 'pol_01',
        title: '亞馬遜國家山岳協會章程總則',
        content: '第一條：本會定名為「亞馬遜國家山岳協會」（Amazon Alpine Association），立案編號：台內團自第1130008137號。\n第二條：本會為依法設立、非以營利為目的之社會團體，以提倡全民運動、鍛鍊強健體魄、培養互助團隊精神，以及接觸大自然與山林相關知識及技能為宗旨。\n第三條：本會以全國行政區域為組織區域，會址設於主管機關所轄地區。',
        enabled: true,
        sortOrder: 1,
      },
      {
        id: 'pol_02',
        title: '活動參與安全與裝備守則',
        content: '一、所有參加本會行程之隊員，均應遵守領隊與嚮導之專業安全指導，不得私自脫隊、抄捷徑或擅自變更既定路線。\n二、高山氣候多變，行前請務必依活動裝備清單備妥個人防寒、防水與照明設備，並於活動期間嚴格落實無痕山林（LNT）原則。\n三、參加活動前應誠實告知個人健康狀況。如遇天候惡劣、天災坍方或不可抗力因素，本會保留依據安全考量取消或變更行程之權利。',
        enabled: true,
        sortOrder: 2,
      },
      {
        id: 'pol_03',
        title: '退費規範與延期異動條款',
        content: '一、活動如因颱風、地震、道路中斷或主管機關封山等不可抗力因素取消，本會扣除已發生之行政作業、訂金及保險手續費後，餘款全數退還或轉折抵後續行程。\n二、隊員因個人因素申請取消者，依據體育署戶外登山活動定型化契約原則辦理扣款退費，詳情請洽官方 LINE 諮詢窗口。',
        enabled: true,
        sortOrder: 3,
      },
      {
        id: 'pol_04',
        title: '個人資料保護與隱私權聲明',
        content: '本會所蒐集之姓名、身分證字號、出生年月日、緊急聯絡人及聯絡電話等資訊，僅供辦理登山綜合保險、國家公園入山入園申請、行政接駁登記及緊急搜救聯繫之用，絕不作其他商業用途或移轉予無關之第三方。',
        enabled: true,
        sortOrder: 4,
      }
    ]
  };
}

// In-memory runtime cache ensuring persistence across queries even on read-only environments
let inMemoryFallbackDb: AssociationDatabase | null = null;

/**
 * Loads database from disk or memory cache. If not found, initializes once with baseline data.
 * NEVER overwrites existing data!
 */
export function loadDatabase(): AssociationDatabase {
  if (inMemoryFallbackDb) {
    return inMemoryFallbackDb;
  }

  if (fs.existsSync(DB_PATH)) {
    try {
      const content = fs.readFileSync(DB_PATH, 'utf-8');
      const parsed = JSON.parse(content) as AssociationDatabase;
      let needsSave = false;

      if (!Array.isArray(parsed.surveys)) {
        parsed.surveys = getDefaultSurveys(parsed.surveyUrl);
        needsSave = true;
      }

      if (!Array.isArray(parsed.navButtons)) {
        parsed.navButtons = getDefaultNavButtons();
        needsSave = true;
      } else {
        // Ensure '問卷調查' points to internal /surveys page instead of direct external link
        for (const btn of parsed.navButtons) {
          if (
            (btn.id === 'btn_survey' || btn.title === '問卷調查') &&
            (btn.isExternal || btn.url.includes('google.com') || btn.url === 'https://docs.google.com/forms')
          ) {
            btn.url = '/surveys';
            btn.isExternal = false;
            needsSave = true;
          }
        }
      }

      inMemoryFallbackDb = parsed;

      if (needsSave) {
        saveDatabase(parsed);
      }

      return parsed;
    } catch (err) {
      console.error('Failed to parse database file, preserving existing file:', err);
      throw new Error('Database file corrupted. Please check server data integrity.');
    }
  }

  // Only if file does NOT exist:
  const seed = getInitialSeedData();
  inMemoryFallbackDb = seed;
  saveDatabase(seed);
  return seed;
}

/**
 * Safely saves the database to disk using atomic temp file write and rename.
 * Also keeps in-memory state in sync so read-only container file systems don't fail.
 */
export function saveDatabase(data: AssociationDatabase): void {
  inMemoryFallbackDb = data;
  try {
    const tmpPath = `${DB_PATH}.${Date.now()}.tmp`;
    fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tmpPath, DB_PATH);
  } catch (err) {
    console.warn('Warning: Could not write to disk (read-only filesystem or permission issue), kept in memory cache:', err);
  }
}

// Helpers for public view (filtering only enabled items, ordered by sortOrder)
export function getPublicData(): PublicDataResponse {
  const db = loadDatabase();
  const enabledSurveys = (db.surveys || [])
    .filter((s) => s.enabled)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  const resolvedSurveyUrl = db.surveyUrl || (enabledSurveys[0]?.url) || '';

  return {
    surveyUrl: resolvedSurveyUrl,
    surveys: enabledSurveys,
    navButtons: (db.navButtons || [])
      .filter((b) => b.enabled)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    intros: (db.intros || [])
      .filter((i) => i.enabled)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    tools: (db.tools || [])
      .filter((t) => t.enabled)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    highlights: (db.highlights || [])
      .filter((h) => h.enabled)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    policies: (db.policies || [])
      .filter((p) => p.enabled)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
  };
}
