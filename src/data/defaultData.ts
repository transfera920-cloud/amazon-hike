import { SiteData, PopularRouteItem } from '../types';

export const STORAGE_KEY = 'amazon_mount_data';

export const DEFAULT_POPULAR_ROUTES: PopularRouteItem[] = [
  { id: 'route-1', name: '合歡山群峰｜武嶺｜小奇萊', description: '石門山、合歡群峰、小奇萊登山口', url: '/hehuanshan/' },
  { id: 'route-2', name: '雪山登山口服務站', description: '雪山主東峰', url: '/xueshan/' },
  { id: 'route-2b', name: '武陵山莊', description: '武陵四秀（桃山、池有、品田、喀拉業）', url: '/wulingshanzhuang/' },
  { id: 'route-3', name: '玉山登山口｜塔塔加停車場', description: '玉山群峰、麟趾山、鹿林山', url: '/yushan/' },
  { id: 'route-4', name: '嘉明湖｜向陽國家森林遊樂區', description: '天使的眼淚嘉明湖、向陽山、三叉山，南橫台20線接駁', url: '/jiaminghu/' },
  { id: 'route-5', name: '奇萊南華｜屯原登山口', description: '能高越嶺西段、奇萊南峰、南華山黃金大草原', url: '/qilai-nanhua/' },
  { id: 'route-6', name: '大霸尖山｜觀霧大鹿林道東線口', description: '世紀奇峰大霸群峰、觀霧遊憩區', url: '/dabajianshan/' },
  { id: 'route-7', name: '郡大山｜望鄉部落 (含林道接駁)', description: '八大秀、郡大林道 32K 搖晃專車直達登山口', url: '/jundashan/' }
];

export const DEFAULT_DATA: SiteData = {
  phone: "0972573495",
  lineUrl: "https://lin.ee/TJJLV36",
  email: "amazonchiayi@gmail.com",
  siteTitle: "亞馬遜高山接駁",
  siteSubtitle: "安全 ‧ 舒適 ‧ 準時 | 專業百岳高山包車接駁",
  heroLineText: "點我加 LINE 官方帳號預約",
  sectionTitle: "百岳與高山登山接駁",
  seoDesc: "亞馬遜高山接駁提供全台灣熱門百岳與高山步道之專業登山接駁服務。合法租賃營業車、職業駕照司機、600萬乘客平安險，讓您的登山行程更安心順暢。",
  features: [
    "合法租賃營業車",
    "職業駕照司機",
    "準時接送不延誤",
    "全台登山口接送",
    "600萬乘客平安險"
  ],
  aboutTitle: "關於我們",
  aboutContent: `亞馬遜高山接駁（許多登山客也會搜尋「登山接駁」）提供全台灣熱門百岳與高山步道之專業接駁服務。無論您是要前往合歡山群峰、雪山主東峰、嘉明湖（向陽）、玉山登山口、奇萊南華，或是能高越嶺等路線，我們皆提供安全、優質的接駁車隊體驗。\n\n提供司機駕駛經驗豐富的高山接駁服務，協助登山客解決大眾運輸不便的問題。請善用本站提供的價格估算系統、D0住宿推薦、慶功宴餐廳資訊與即時道路管制動態，讓您的登山行程更安心順暢。`,
  footerBannerTitle: "高山登山接駁專屬預約",
  footerBannerSub: "合法租賃車輛 ‧ 行程彈性安排 ‧ 歡迎提早預約包車",
  popularRoutesTitle: "熱門百岳登山接駁路線",
  popularRoutes: DEFAULT_POPULAR_ROUTES,
  cards: [
    {
      id: "card-1",
      icon: "fa-calculator",
      title: "價格估算系統",
      desc: "透明化高山包車資估算，快速試算包車費用",
      url: "https://price.amazon-hike.com/"
    },
    {
      id: "card-2",
      icon: "fa-hotel",
      title: "D0 住宿查詢",
      desc: "登山口周邊優質民宿與接駁合作住宿推薦篇",
      url: "https://stays.amazon-hike.com/trailhead-stays"
    },
    {
      id: "card-3",
      icon: "fa-utensils",
      title: "下山慶功宴查詢",
      desc: "精選完登下山補給合菜與在地美食餐廳",
      url: "https://feast.amazon-hike.com/"
    },
    {
      id: "card-4",
      icon: "fa-triangle-exclamation",
      title: "道路路線管制查詢",
      desc: "即時掌握林道與高山省道最新施工管制時間",
      url: "https://road.amazon-hike.com/"
    }
  ]
};
