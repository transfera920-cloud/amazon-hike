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

let memoryWorkerDb: AssociationDatabase | null = null;

/**
 * 檢查環境中是否已綁定 Cloudflare KV。
 */
export function isKVBound(env?: WorkerEnv): env is WorkerEnv & { ASSOCIATION_DB: KVNamespaceLike } {
  return Boolean(env && env.ASSOCIATION_DB);
}

/**
 * 「KV 優先 + 安全容錯」讀取機制：
 * 1. 若環境有綁定 ASSOCIATION_DB，優先讀取 Cloudflare KV (association_data)。
 * 2. 若 KV 內已有資料，直接返回線上權威資料，絕不覆蓋。
 * 3. 若 KV 尚無資料，首次載入種子檔並自動寫入 KV。
 * 4. 若尚未綁定 KV（如暫時移除綁定時），安全退回至種子資料/記憶體暫存，確保網站 100% 正常運作不當機。
 */
export async function loadDatabaseWorker(env?: WorkerEnv): Promise<AssociationDatabase> {
  if (isKVBound(env)) {
    try {
      // 1. 優先嘗試讀取 association_data
      let kvValue = await env.ASSOCIATION_DB.get(KV_KEY, 'json');

      // 2. 向下相容檢查 legacy 鍵名
      if (!kvValue || !isValidDatabase(kvValue)) {
        kvValue = await env.ASSOCIATION_DB.get(LEGACY_KV_KEY, 'json');
      }

      // 3. 若 KV 內已有正式資料，直接返回線上權威資料，絕不覆蓋
      if (kvValue && isValidDatabase(kvValue)) {
        memoryWorkerDb = kvValue;
        return kvValue;
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
      memoryWorkerDb = seed;
      return seed;
    } catch (err: any) {
      console.error('❌ [Cloudflare KV] 讀取 KV 發生異常:', err);
    }
  } else {
    console.warn(
      '⚠️ [Cloudflare KV 尚未綁定] env.ASSOCIATION_DB 未定義。' +
      '系統已安全降級讀取初始資料，前台運作正常。若需跨裝置永久保存資料，請於 Cloudflare 綁定 KV 命名空間。'
    );
  }

  // 若尚未綁定 KV 或讀取異常時的安全退回機制
  if (memoryWorkerDb && isValidDatabase(memoryWorkerDb)) {
    return memoryWorkerDb;
  }

  const seed = JSON.parse(JSON.stringify(baselineData)) as AssociationDatabase;
  memoryWorkerDb = seed;
  return seed;
}

/**
 * 寫入 Cloudflare KV 機制：
 * 1. 驗證資料庫結構完整性。
 * 2. 若環境有綁定 ASSOCIATION_DB，直通寫入 Cloudflare KV (Key: association_data)。
 * 3. 若尚未綁定 KV，暫存於記憶體並發出警告，確保不拋出未捕獲錯誤。
 */
export async function saveDatabaseWorker(data: AssociationDatabase, env?: WorkerEnv): Promise<void> {
  if (!isValidDatabase(data)) {
    throw new Error('拒絕儲存：資料庫物件結構不符，缺少必要陣列欄位 (tools, policies, highlights, navButtons)');
  }

  memoryWorkerDb = data;

  if (isKVBound(env)) {
    try {
      await env.ASSOCIATION_DB.put(KV_KEY, JSON.stringify(data, null, 2));
      console.log('✅ [Cloudflare KV] 成功直通寫入 Cloudflare KV (key: association_data)');
      return;
    } catch (err: any) {
      console.error('❌ [Cloudflare KV] 寫入 KV 失敗:', err);
      throw new Error(`直通寫入 Cloudflare KV 失敗: ${err.message || String(err)}`);
    }
  }

  console.warn(
    '⚠️ [Cloudflare KV 尚未綁定] 資料僅更新於當前實例記憶體。' +
    '請在 Cloudflare 綁定 ASSOCIATION_DB 以實現跨裝置永久持久化。'
  );
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
