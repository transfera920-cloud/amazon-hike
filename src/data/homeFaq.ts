/**
 * 首頁「常見問題」內容。React 畫面（ServiceSections.tsx）與 index.html 的靜態 HTML、
 * FAQPage 結構化資料必須是同一份文字，修改時請三處一併更新。
 */
export type FaqPart = string | { text: string; href: string };

export interface HomeFaqItem {
  question: string;
  answer: FaqPart[];
}

export const HOME_FAQ: HomeFaqItem[] = [
  {
    question: "亞馬遜高山接駁提供什麼服務？",
    answer: [
      "亞馬遜高山接駁提供全台灣熱門百岳與高山步道的登山口包車接送（許多登山客也會搜尋「登山接駁」）。車型可選 9 人座商務車、7 人座休旅車，或適合林道碎石路段的高底盤四驅車，並可選擇來回包車、單程，也可安排夜間或 D0 跨夜出發的時段。",
    ],
  },
  {
    question: "可以從哪些地方出發？",
    answer: [
      "北中南主要縣市與宜蘭都可以出發。實際車程建議用 Google 地圖查詢，其他細節歡迎透過 LINE 詢問。",
    ],
  },
  {
    question: "高山接駁有哪些車型？哪些路線需要四驅車？",
    answer: [
      "車型有 9 人座商務車、7 人座休旅車與高底盤四驅車。郡大林道（檢查哨至 32K 登山口）路面崎嶇、多坑洞碎石，限高底盤四驅車進入，一般轎車切勿進入；本站提供專用高底盤 4WD 四驅越野車與經驗司機帶路。郡大山、西巒大山另有",
      { text: "專屬接駁頁", href: "https://shuttle.amazon-hike.com/" },
      "。",
    ],
  },
  {
    question: "登山接駁的費用怎麼算？",
    answer: [
      "可先使用本站的",
      { text: "價格估算系統", href: "https://price.amazon-hike.com/" },
      "試算各路線的包車費用，依序選擇出發城市、車型、行程模式（來回或單程）、乘客人數，以及是否夜間出發。前往郡大山（望鄉部落、郡大林道）請改用",
      { text: "郡大山專用價格估算系統", href: "https://shuttle.amazon-hike.com/" },
      "。",
    ],
  },
  {
    question: "怎麼預約高山接駁？",
    answer: [
      "先用價格估算系統試算費用，再點選「帶入報價加 LINE 預約」，系統會複製行程摘要並開啟 LINE，貼上訊息即可詢問預約日期是否有車趟；也可以直接來電 0972573495。",
    ],
  },
  {
    question: "可以只搭單程，或是 A進B出嗎？",
    answer: [
      "可以。A進B出是指從一個登山口入山、由另一個登山口下山的行程（例如縱走），起點與終點不同。價格估算提供「來回包車」與「單程」兩種行程模式；若入山口與下山口不同，請透過 LINE 說明入山口、下山口與日期。",
    ],
  },
  {
    question: "搭乘亞馬遜高山接駁有什麼安全保障？",
    answer: [
      "使用合法租賃營業車，由職業駕照司機駕駛，並投保 600 萬乘客平安險。",
    ],
  },
  {
    question: "目前提供哪些百岳的登山接駁？",
    answer: [
      "熱門路線包含",
      { text: "合歡山群峰", href: "/hehuanshan/" },
      "、",
      { text: "雪山登山口服務站", href: "/xueshan/" },
      "、",
      { text: "武陵山莊", href: "/wulingshanzhuang/" },
      "、",
      { text: "玉山", href: "/yushan/" },
      "、",
      { text: "嘉明湖", href: "/jiaminghu/" },
      "、",
      { text: "奇萊南華", href: "/qilai-nanhua/" },
      "、",
      { text: "大霸尖山", href: "/dabajianshan/" },
      "與",
      { text: "郡大山", href: "/jundashan/" },
      "，各路線頁有車程、路況與預約說明。其他路線歡迎透過 LINE 詢問。",
    ],
  },
  {
    question: "建議前一晚出發，還是凌晨直接起登？",
    answer: [
      "建議安排交通日（D0）：下班後先出發，前一晚住在登山口附近，隔天再從容起登。凌晨直接起登容易睡眠不足、增加司機疲勞駕駛的風險，也少了適應高度的時間，凌晨集合也比較容易睡過頭。",
    ],
  },
];
