import type { ChapterItem } from '../src/types.js';

export function getDefaultChapters(): ChapterItem[] {
  const seedTitles = [
    { slug: 'chapter01', title: '第 1 講：登山入門心態與行前安全概念', desc: '建立敬畏山林的心態、風險評估要點與入山前的心理準備。' },
    { slug: 'chapter02', title: '第 2 講：認識台灣高山氣候與環境特性', desc: '台灣百岳氣候垂直變化、地形雨、午後熱對流與高海拔環境特徵解析。' },
    { slug: 'chapter03', title: '第 3 講：行前體能鍛鍊與耐力訓練指南', desc: '循序漸進的心肺耐力、負重階梯、核心肌群訓練與爬山體能規劃。' },
    { slug: 'chapter04', title: '第 4 講：高山三層穿衣法與失溫防範技巧', desc: '排汗底層、保暖中層與防水防風外層配置，防範失溫的生死法則。' },
    { slug: 'chapter05', title: '第 5 講：登山鞋、襪與足部護理防水泡指南', desc: '專業登山鞋選購、厚羊毛襪搭配、長途重裝防起水泡與足踝保護。' },
    { slug: 'chapter06', title: '第 6 講：登山背包挑選、容量計算與打包重心配置', desc: '單日與多日百岳容量選擇、背長調節、上重下輕與靠近背部的打包重心學。' },
    { slug: 'chapter07', title: '第 7 講：高山症預防、初期症狀識別與應變處置', desc: '急性高山症（AMS）、肺水腫（HAPE）與腦水腫（HACE）預防、用藥原則與黃金下撤處置。' },
    { slug: 'chapter08', title: '第 8 講：離線地圖 GPX 航跡下載、判讀與定位應用', desc: '手機離線地圖設定、航跡下載、等高線識別與無網路狀態下的自保定位。' },
    { slug: 'chapter09', title: '第 9 講：高山水份補給、行動糧熱量規劃與炊事常識', desc: '每小時水份消耗計算、高熱量行動糧配置、高山爐具與防風瓦斯安全操作。' },
    { slug: 'chapter10', title: '第 10 講：迷途自保 STOP 原則與山難求救SOP', desc: '不慎迷途時停止走動、思考、觀察、規劃（STOP原則）與正確報案求援步驟。' },
    { slug: 'chapter11', title: '第 11 講：無痕山林（LNT）七大準則在百岳的實踐', desc: '妥善處理垃圾排泄物、保持地貌風貌、保護水源與負責任的戶外倫理。' },
    { slug: 'chapter12', title: '第 12 講：登山杖正確使用、上下坡受力調節與步態', desc: '雙杖搭配、手腕帶正確套法、長度調節以及保護膝關節的省力步伐。' },
    { slug: 'chapter13', title: '第 13 講：頭燈、急救包與必備高山維生裝備清單', desc: '頭燈選購與備用電池、個人醫療急救包、保溫毯與緊急避難袋清單。' },
    { slug: 'chapter14', title: '第 14 講：國家公園入園入山線上申請與抽籤技巧', desc: '玉山、雪霸、太魯閣山屋營地抽籤制度、申請流程與生態保護區規範。' },
    { slug: 'chapter15', title: '第 15 講：高山步道禮儀與團隊合作行進準則', desc: '會車禮讓原則、隊伍行進節奏、壓隊領隊職責與不脫隊的安全紀律。' }
  ];

  return seedTitles.map((item, idx) => ({
    id: `chap_${item.slug}`,
    slug: item.slug,
    title: item.title,
    description: item.desc,
    content: `${item.title}\n\n${item.desc}\n\n進入高山環境前，完善的知識累積與充足的事前準備是保障登山安全的第一步。建議山友配合體能循序漸進，並詳加研讀每一章節的實務操作建議。出發前務必關注即時山區氣候，攜帶齊全的保暖與導航裝備，與隊友互相照應，落實無痕山林與安全登山。`,
    sortOrder: idx + 1,
    enabled: true,
    updatedAt: '2026-09-22',
  }));
}
