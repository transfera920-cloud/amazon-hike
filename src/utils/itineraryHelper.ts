import type {
  ItineraryDay,
  ItineraryLink,
  ItineraryLinkType,
  ItineraryTimePoint,
  TripItinerary,
} from '../types.js';

export const ITINERARY_LINK_TYPES: { type: ItineraryLinkType; label: string }[] = [
  { type: 'mountain', label: '山岳' },
  { type: 'trailhead', label: '登山口' },
  { type: 'forestRoad', label: '林道' },
  { type: 'junction', label: '岔路' },
  { type: 'hut', label: '山屋' },
  { type: 'shed', label: '工寮' },
  { type: 'campsite', label: '營地' },
  { type: 'waterSource', label: '水源' },
  { type: 'stream', label: '溪流' },
  { type: 'saddle', label: '鞍部' },
  { type: 'terrain', label: '地形' },
  { type: 'other', label: '其他' },
];

const VALID_LINK_TYPES = new Set<string>(ITINERARY_LINK_TYPES.map((t) => t.type));

/**
 * Calculates total estimated hours dynamically from all days' estimatedHours.
 * No independent data field is stored or used.
 */
export function calculateTotalEstimatedHours(days?: ItineraryDay[]): number {
  if (!Array.isArray(days)) return 0;
  const total = days.reduce((sum, d) => {
    const hrs = typeof d.estimatedHours === 'number' && !isNaN(d.estimatedHours) ? d.estimatedHours : 0;
    return sum + hrs;
  }, 0);
  // Round to 1 decimal place if floating point error occurs
  return Math.round(total * 10) / 10;
}

/**
 * Calculates itinerary days count from start and end dates.
 */
export function calculateDaysFromDates(startDate?: string, endDate?: string, fallbackDaysCount: number = 0): number {
  if (startDate && endDate) {
    const d1 = new Date(startDate).getTime();
    const d2 = new Date(endDate).getTime();
    if (!isNaN(d1) && !isNaN(d2)) {
      const diff = Math.round((d2 - d1) / (1000 * 60 * 60 * 24)) + 1;
      return Math.max(1, diff);
    }
  } else if (startDate && !endDate) {
    return 1;
  }
  return Math.max(1, fallbackDaysCount);
}

/**
 * Gets the display days count for an itinerary:
 * Priority: daysOverride -> calculated from dates -> days.length -> 1
 */
export function getDisplayDaysCount(itinerary?: TripItinerary): number {
  if (!itinerary) return 0;
  if (typeof itinerary.daysOverride === 'number' && !isNaN(itinerary.daysOverride) && itinerary.daysOverride > 0) {
    return itinerary.daysOverride;
  }
  return calculateDaysFromDates(itinerary.startDate, itinerary.endDate, itinerary.days?.length || 0);
}

function parseOptionalNumber(val: any): number | undefined {
  if (val === undefined || val === null || val === '') return undefined;
  const n = Number(val);
  return isNaN(n) ? undefined : n;
}

function isValidDateFormat(val: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(val);
}

/**
 * Cleans and validates incoming raw TripItinerary data before persisting.
 */
export function cleanTripItinerary(raw: any): TripItinerary | undefined {
  if (!raw || typeof raw !== 'object') return undefined;

  const enabled = Boolean(raw.enabled);
  const subtitle = typeof raw.subtitle === 'string' && raw.subtitle.trim() ? raw.subtitle.trim() : undefined;
  const difficulty = typeof raw.difficulty === 'string' && raw.difficulty.trim() ? raw.difficulty.trim() : undefined;
  const requiredGear = typeof raw.requiredGear === 'string' && raw.requiredGear.trim() ? raw.requiredGear.trim() : undefined;
  const safetyNotes = typeof raw.safetyNotes === 'string' && raw.safetyNotes.trim() ? raw.safetyNotes.trim() : undefined;

  const sDate = typeof raw.startDate === 'string' ? raw.startDate.trim() : '';
  const startDate = sDate && isValidDateFormat(sDate) ? sDate : undefined;

  const eDate = typeof raw.endDate === 'string' ? raw.endDate.trim() : '';
  const endDate = eDate && isValidDateFormat(eDate) ? eDate : undefined;

  const daysOverride = parseOptionalNumber(raw.daysOverride);
  const totalDistanceKm = parseOptionalNumber(raw.totalDistanceKm);
  const maxElevationM = parseOptionalNumber(raw.maxElevationM);
  const elevationGainM = parseOptionalNumber(raw.elevationGainM);
  const elevationLossM = parseOptionalNumber(raw.elevationLossM);

  const rawDays = Array.isArray(raw.days) ? raw.days : [];
  const days: ItineraryDay[] = rawDays.map((d: any, dayIdx: number): ItineraryDay => {
    const dayId = d && d.id ? String(d.id) : `day_${Date.now()}_${dayIdx}`;
    const estimatedHours = parseOptionalNumber(d?.estimatedHours);

    const rawTimePoints = Array.isArray(d?.timePoints) ? d.timePoints : [];
    const timePoints: ItineraryTimePoint[] = [];

    let tpOrder = 0;
    for (let tpIdx = 0; tpIdx < rawTimePoints.length; tpIdx++) {
      const tp = rawTimePoints[tpIdx];
      if (!tp || typeof tp !== 'object') continue;

      const location = typeof tp.location === 'string' ? tp.location.trim() : '';
      if (!location) {
        // location 為必填，缺少則整筆節點視為無效並過濾掉
        continue;
      }

      const time = typeof tp.time === 'string' ? tp.time.trim() : '';
      const tpId = tp.id ? String(tp.id) : `tp_${Date.now()}_${tpIdx}`;
      const description = typeof tp.description === 'string' && tp.description.trim() ? tp.description.trim() : undefined;

      let cleanLink: ItineraryLink | undefined = undefined;
      if (tp.link && typeof tp.link === 'object') {
        const linkName = typeof tp.link.name === 'string' ? tp.link.name.trim() : '';
        if (linkName) {
          const rawType = String(tp.link.type || '');
          const linkType: ItineraryLinkType = VALID_LINK_TYPES.has(rawType)
            ? (rawType as ItineraryLinkType)
            : 'other';
          const linkUrl = typeof tp.link.url === 'string' && tp.link.url.trim() ? tp.link.url.trim() : undefined;
          const linkDesc = typeof tp.link.description === 'string' && tp.link.description.trim() ? tp.link.description.trim() : undefined;
          cleanLink = {
            id: tp.link.id ? String(tp.link.id) : `link_${Date.now()}_${tpIdx}`,
            name: linkName,
            url: linkUrl,
            description: linkDesc,
            type: linkType,
            showOnFrontend: Boolean(tp.link.showOnFrontend),
          };
        }
      }

      timePoints.push({
        id: tpId,
        time,
        location,
        description,
        sortOrder: tpOrder++,
        link: cleanLink,
      });
    }

    return {
      id: dayId,
      dayNumber: dayIdx + 1,
      sortOrder: dayIdx + 1,
      estimatedHours,
      timePoints,
    };
  });

  return {
    enabled,
    subtitle,
    startDate,
    endDate,
    daysOverride,
    totalDistanceKm,
    maxElevationM,
    elevationGainM,
    elevationLossM,
    difficulty,
    requiredGear,
    safetyNotes,
    days,
  };
}
