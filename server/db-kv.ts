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

const KV_KEY = 'association_db';

/**
 * Validates that an object contains the required fields of an AssociationDatabase
 */
function isValidDatabase(obj: any): obj is AssociationDatabase {
  return (
    obj &&
    typeof obj === 'object' &&
    Array.isArray(obj.tools) &&
    Array.isArray(obj.policies) &&
    Array.isArray(obj.highlights) &&
    Array.isArray(obj.navButtons)
  );
}

// In-memory cache for Worker instances when KV is unbound or across requests
let memoryWorkerDb: AssociationDatabase | null = null;

/**
 * Safely loads the database for Worker runtime:
 * 1. Attempts to read from Cloudflare KV (env.ASSOCIATION_DB) if bound.
 * 2. If KV has a valid non-empty database, returns it.
 * 3. If memoryWorkerDb is set (cached in isolate), returns it.
 * 4. If KV does not have the key or is not bound, falls back to the baselineData (from data/association_db.json).
 * 5. NEVER returns empty {} or null.
 * 6. NEVER writes to KV during read.
 */
export async function loadDatabaseWorker(env?: WorkerEnv): Promise<AssociationDatabase> {
  if (env && env.ASSOCIATION_DB) {
    try {
      const kvValue = await env.ASSOCIATION_DB.get(KV_KEY, 'json');
      if (kvValue && isValidDatabase(kvValue)) {
        memoryWorkerDb = kvValue;
        return kvValue;
      }
    } catch (err) {
      console.error('❌ [Cloudflare KV Error] Failed to read from env.ASSOCIATION_DB:', err);
    }
  } else {
    console.warn(
      '⚠️ [CRITICAL WARNING] env.ASSOCIATION_DB is NOT defined or not bound! ' +
      'Data will NOT persist across workers or devices. ' +
      'Please bind the ASSOCIATION_DB KV namespace in wrangler.jsonc or Cloudflare Dashboard.'
    );
  }

  // If memory cache exists in isolate (when KV is unbound in local test)
  if (memoryWorkerDb && isValidDatabase(memoryWorkerDb)) {
    return memoryWorkerDb;
  }

  // Safe fallback to immutable baseline
  const seed = JSON.parse(JSON.stringify(baselineData)) as AssociationDatabase;
  memoryWorkerDb = seed;
  return seed;
}

/**
 * Saves database updates to Cloudflare KV:
 * 1. Checks that data is valid.
 * 2. When env.ASSOCIATION_DB is bound, writes directly to Cloudflare KV.
 * 3. Emits explicit critical warnings if env.ASSOCIATION_DB is not bound.
 * 4. Does NOT touch or mutate data/association_db.json.
 */
export async function saveDatabaseWorker(data: AssociationDatabase, env?: WorkerEnv): Promise<void> {
  if (!isValidDatabase(data)) {
    throw new Error('拒絕儲存：資料庫物件結構不符');
  }

  if (env && env.ASSOCIATION_DB) {
    await env.ASSOCIATION_DB.put(KV_KEY, JSON.stringify(data, null, 2));
    memoryWorkerDb = data;
    console.log('✅ [Cloudflare KV] Successfully wrote database to env.ASSOCIATION_DB');
    return;
  }

  memoryWorkerDb = data;
  console.warn(
    '⚠️ [CRITICAL WARNING] env.ASSOCIATION_DB is NOT bound! ' +
    'Changes were ONLY saved to this worker isolate memory and will NOT persist across devices or restarts. ' +
    'Please bind the ASSOCIATION_DB KV namespace in Cloudflare.'
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
