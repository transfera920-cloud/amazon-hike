/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { SiteData } from './types';
import { DEFAULT_DATA, STORAGE_KEY } from './data/defaultData';

// Initialize Firebase App & Services
const app = initializeApp(firebaseConfig);

// CRITICAL: Using firestoreDatabaseId specified in config
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const SETTINGS_COLLECTION = 'settings';
const SETTINGS_DOC_ID = 'general';

/**
 * Validate connection to Firestore as required by Firebase integration guidelines
 */
export async function testConnection(): Promise<boolean> {
  const docRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
  try {
    await getDocFromServer(docRef);
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore is currently offline, using cached/local data.');
    }
    return false;
  }
}

/**
 * 後台資料庫裡存的卡片網址若是舊網址，自動換成目前的子網域網址
 */
const CARD_URL_REWRITES: Record<string, string> = {
  'https://a28d92ab-amazon-control.yy661003.workers.dev': 'https://road.amazon-hike.com/',
  'https://29e854ac-amazon-control.transfera920.workers.dev': 'https://road.amazon-hike.com/',
  'https://route-amazon-hike-com.lovable.app': 'https://price.amazon-hike.com/',
  'https://summit-route-advisor.lovable.app': 'https://price.amazon-hike.com/',
  'https://re-use-your-stuff.lovable.app': 'https://price.amazon-hike.com/',
  'https://google-trek-finder.lovable.app/trailhead-stays': 'https://stays.amazon-hike.com/trailhead-stays',
  'https://summit-feast-finder.lovable.app': 'https://feast.amazon-hike.com/',
  'https://yun-da-xi-luan-connect.lovable.app': 'https://shuttle.amazon-hike.com/'
};

function normalizeCardUrl(c: any): any {
  const url = typeof c?.url === 'string' ? c.url : '';
  if (c?.id === 'card-1' && (url === '#calc' || !url)) {
    return { ...c, url: 'https://price.amazon-hike.com/' };
  }
  const target = CARD_URL_REWRITES[url.replace(/\/+$/, '')];
  return target ? { ...c, url: target } : c;
}

/**
 * Normalizes raw data into fully populated SiteData
 */
export function sanitizeSiteData(raw: any): SiteData {
  if (!raw || typeof raw !== 'object') return DEFAULT_DATA;
  return {
    ...DEFAULT_DATA,
    ...raw,
    phone: typeof raw.phone === 'string' ? raw.phone : DEFAULT_DATA.phone,
    lineUrl: typeof raw.lineUrl === 'string' ? raw.lineUrl : DEFAULT_DATA.lineUrl,
    email: typeof raw.email === 'string' ? raw.email : DEFAULT_DATA.email,
    siteTitle: typeof raw.siteTitle === 'string' ? raw.siteTitle : DEFAULT_DATA.siteTitle,
    siteSubtitle: typeof raw.siteSubtitle === 'string' ? raw.siteSubtitle : DEFAULT_DATA.siteSubtitle,
    heroLineText: typeof raw.heroLineText === 'string' ? raw.heroLineText : DEFAULT_DATA.heroLineText,
    sectionTitle: typeof raw.sectionTitle === 'string' ? raw.sectionTitle : DEFAULT_DATA.sectionTitle,
    seoDesc: typeof raw.seoDesc === 'string' ? raw.seoDesc : DEFAULT_DATA.seoDesc,
    features: Array.isArray(raw.features) && raw.features.length > 0 ? raw.features : DEFAULT_DATA.features,
    aboutTitle: typeof raw.aboutTitle === 'string' ? raw.aboutTitle : DEFAULT_DATA.aboutTitle,
    aboutContent: typeof raw.aboutContent === 'string' ? raw.aboutContent : DEFAULT_DATA.aboutContent,
    footerBannerTitle: typeof raw.footerBannerTitle === 'string' ? raw.footerBannerTitle : DEFAULT_DATA.footerBannerTitle,
    footerBannerSub: typeof raw.footerBannerSub === 'string' ? raw.footerBannerSub : DEFAULT_DATA.footerBannerSub,
    cards: Array.isArray(raw.cards) && raw.cards.length > 0
      ? raw.cards.map(normalizeCardUrl)
      : DEFAULT_DATA.cards,
    popularRoutesTitle: typeof raw.popularRoutesTitle === 'string' && raw.popularRoutesTitle.trim()
      ? raw.popularRoutesTitle
      : DEFAULT_DATA.popularRoutesTitle,
    // 後台尚未儲存過這個欄位時用預設；已儲存過（即使刪光）則尊重後台內容
    popularRoutes: Array.isArray(raw.popularRoutes)
      ? raw.popularRoutes
          .filter((r: any) => r && typeof r === 'object')
          .map((r: any, i: number) => ({
            id: typeof r.id === 'string' && r.id ? r.id : `route-${i + 1}`,
            name: typeof r.name === 'string' ? r.name : '',
            description: typeof r.description === 'string' ? r.description : '',
            url: typeof r.url === 'string' ? r.url : ''
          }))
      : DEFAULT_DATA.popularRoutes
  };
}

/**
 * Reads local storage backup
 */
export function getLocalCachedData(): SiteData {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return sanitizeSiteData(parsed);
    }
  } catch (e) {
    console.warn('Failed to parse localStorage cache', e);
  }
  return DEFAULT_DATA;
}

/**
 * Writes data to local storage backup cache
 */
export function updateLocalCachedData(data: SiteData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to update localStorage cache', e);
  }
}

/**
 * Load SiteData from Firestore with fallback to localStorage
 */
export async function loadSiteDataFromCloud(): Promise<{ data: SiteData; fromCloud: boolean }> {
  const docPath = `${SETTINGS_COLLECTION}/${SETTINGS_DOC_ID}`;
  const docRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);

  try {
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const cloudData = sanitizeSiteData(snap.data());
      // Update local cache as fallback
      updateLocalCachedData(cloudData);
      return { data: cloudData, fromCloud: true };
    } else {
      // Document doesn't exist yet in Cloud, try saving initial seed data from localStorage or default
      const initialData = getLocalCachedData();
      try {
        await setDoc(docRef, initialData);
        updateLocalCachedData(initialData);
        return { data: initialData, fromCloud: true };
      } catch (writeErr) {
        console.warn('Initial cloud seed write skipped, using local data', writeErr);
        return { data: initialData, fromCloud: false };
      }
    }
  } catch (error) {
    console.warn('Failed to fetch from Firestore, falling back to localStorage cache:', error);
    const cached = getLocalCachedData();
    return { data: cached, fromCloud: false };
  }
}

/**
 * Save SiteData to Firestore and update localStorage backup
 */
export async function saveSiteDataToCloud(newData: SiteData): Promise<void> {
  const docPath = `${SETTINGS_COLLECTION}/${SETTINGS_DOC_ID}`;
  const docRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);

  try {
    const cleanData = sanitizeSiteData(newData);
    await setDoc(docRef, cleanData);
    // Sync to local cache after successful cloud write
    updateLocalCachedData(cleanData);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

/**
 * Real-time listener for multi-device sync
 */
export function subscribeToSiteData(
  onUpdate: (data: SiteData) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const docPath = `${SETTINGS_COLLECTION}/${SETTINGS_DOC_ID}`;
  const docRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);

  return onSnapshot(
    docRef,
    (snap) => {
      if (snap.exists()) {
        const cloudData = sanitizeSiteData(snap.data());
        updateLocalCachedData(cloudData);
        onUpdate(cloudData);
      }
    },
    (error) => {
      console.warn('Real-time sync snapshot error:', error);
      if (onError) {
        onError(error);
      } else {
        handleFirestoreError(error, OperationType.GET, docPath);
      }
    }
  );
}
