import baselineData from '../data/association_db.json';
import type {
  AssociationDatabase,
  PublicDataResponse
} from '../src/types.js';

export interface KVNamespaceLike {
  get(key: string, type: 'text'): Promise<string | null>;
  get(key: string, type: 'json'): Promise<any | null>;
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
}

export interface WorkerEnv {
  ASSOCIATION_DB?: KVNamespaceLike;
  ASSETS?: { fetch(request: Request | string): Promise<Response> };
  ADMIN_TOKEN?: string;
  ADMIN_PASSWORD?: string;
}

export const KV_KEY = 'association_data';
const LEGACY_KV_KEY = 'association_db';

/**
 * Validates that an object contains the required fields of an AssociationDatabase
 */
export function isValidDatabase(obj: any): obj is AssociationDatabase {
  return (
    obj &&
    typeof obj === 'object' &&
    Array.isArray(obj.tools) &&
    Array.isArray(obj.policies) &&
    Array.isArray(obj.highlights) &&
    Array.isArray(obj.navButtons)
  );
}

/**
 * 嚴格檢查環境中是否已綁定 Cloudflare KV。
 * 若未定義則拋出明確異常，防止靜默降級到伺服器記憶體暫存。
 */
function assertKVBinding(env?: WorkerEnv): asserts env is WorkerEnv & { ASSOCIATION_DB: KVNamespaceLike } {
  if (!env || !env.ASSOCIATION_DB) {
    throw new Error(
      '【生產環境持久化錯誤】Cloudflare KV 命名空間未繫結！' +
      '環境變數 env.ASSOCIATION_DB 為 undefined。' +
      '請在 wrangler.jsonc 中加入 ASSOCIATION_DB 綁定，或於 Cloudflare Dashboard 完成 KV 繫結，以確保資料跨裝置永久保存。'
    );
  }
}

/**
 * 「KV 優先 + 無覆蓋防護」讀取機制：
 * 1. 強制檢查 KV Binding，未綁定立即中斷並報錯。
 * 2. 優先讀取 Cloudflare KV 中的 association_data 鍵值。
 * 3. 只有在 KV 完全無資料時（全新專案初次啟動），才讀取 ./data/association_db.json 作為初始種子，並自動存入 KV。
 * 4. 程式重新打包或重新部署時，絕對不讀取也不覆蓋線上已由管理員異動的 KV 資料。
 */
export async function loadDatabaseWorker(env?: WorkerEnv): Promise<AssociationDatabase> {
  assertKVBinding(env);

  try {
    // 1. 優先嘗試讀取 association_data
    let kvValue = await env.ASSOCIATION_DB.get(KV_KEY, 'json');

    // 2. 向下相容檢查 legacy 鍵名
    if (!kvValue || !isValidDatabase(kvValue)) {
      kvValue = await env.ASSOCIATION_DB.get(LEGACY_KV_KEY, 'json');
    }

    // 3. 若 KV 內已有正式資料，直接返回線上權威資料，絕不覆蓋
    if (kvValue && isValidDatabase(kvValue)) {
      return kvValue;
    }
  } catch (err: any) {
    console.error('❌ [Cloudflare KV] 讀取 KV 發生異常:', err);
    throw new Error(`讀取 Cloudflare KV 失敗: ${err.message || String(err)}`);
  }

  // 4. 僅在 KV 完全沒有資料時（首次啟動），才載入靜態種子檔並自動初始化到 KV
  console.log('ℹ️ [Cloudflare KV] KV 為空，首次載入種子檔 baselineData 並自動寫入 KV (key: association_data)...');
  const seed = JSON.parse(JSON.stringify(baselineData)) as AssociationDatabase;

  try {
    await env.ASSOCIATION_DB.put(KV_KEY, JSON.stringify(seed, null, 2));
    console.log('✅ [Cloudflare KV] 初始種子資料已成功存入 Cloudflare KV');
  } catch (err: any) {
    console.warn('⚠️ [Cloudflare KV] 初次種子寫入 KV 失敗:', err);
  }

  return seed;
}

/**
 * 直通寫入 Cloudflare KV 機制：
 * 1. 驗證資料庫結構完整性。
 * 2. 強制驗證 KV Binding，未綁定直接拋錯。
 * 3. 直通寫入 Cloudflare KV (Key: association_data)。
 * 4. 嚴禁單獨存放於記憶體變數，確保全網所有邊緣節點即時同步。
 */
export async function saveDatabaseWorker(data: AssociationDatabase, env?: WorkerEnv): Promise<void> {
  if (!isValidDatabase(data)) {
    throw new Error('拒絕儲存：資料庫物件結構不符，缺少必要陣列欄位 (tools, policies, highlights, navButtons)');
  }

  assertKVBinding(env);

  try {
    await env.ASSOCIATION_DB.put(KV_KEY, JSON.stringify(data, null, 2));
    console.log('✅ [Cloudflare KV] 成功直通寫入 Cloudflare KV (key: association_data)');
  } catch (err: any) {
    console.error('❌ [Cloudflare KV] 寫入 KV 失敗:', err);
    throw new Error(`直通寫入 Cloudflare KV 失敗: ${err.message || String(err)}`);
  }
}

/**
 * Formats public-facing data (filtering enabled items, ordered by sortOrder)
 */
export function formatPublicData(db: AssociationDatabase): PublicDataResponse {
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
