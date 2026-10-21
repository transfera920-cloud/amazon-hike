import { PopularRouteItem } from '../types';

export interface MoreRouteGroup {
  id: string;
  title: string;
  routes: PopularRouteItem[];
}

// 依屬性分組、預設收合；之後可新增「古道」「縱走」等分組
export const MORE_ROUTE_GROUPS: MoreRouteGroup[] = [
  {
    id: 'baiyue',
    title: '更多百岳登山接駁路線',
    routes: [
    { id: 'more-1', name: "大小劍｜仁壽橋停車場", description: "大小劍線（大劍山、佳陽山、小劍山）", url: '/dajianshan/' },
    { id: 'more-2', name: "志佳陽山｜環山部落", description: "志佳陽山", url: '/zhijiayang/' },
    { id: 'more-3', name: "南湖大山｜勝光登山口", description: "南湖中央尖、北一段、南湖群峰", url: '/nanhu/' },
    { id: 'more-4', name: "白姑大山｜紅香部落｜最後農家", description: "白姑大山", url: '/baigu/' },
    { id: 'more-5', name: "閂山鈴鳴山｜730 林道接駁 11.7K", description: "北二段、閂山鈴鳴山、無明甘藷", url: '/shuanshan/' },
    { id: 'more-6', name: "畢羊縱走｜820 林道起點｜慈恩隧道口", description: "畢羊縱走（畢祿山、羊頭山）", url: '/biyang/' },
    { id: 'more-7', name: "能高安東軍｜屯原雲天宮｜奧萬大森林遊樂區", description: "能高安東軍縱走", url: '/nenggao-andongjun/' },
    { id: 'more-7b', name: "干卓萬｜萬大林道｜武界林道", description: "干卓萬縱走", url: '/wanda/' },
    { id: 'more-8', name: "八通關｜八通關登山口", description: "馬博拉斯橫斷、八大秀、南二段", url: '/batongguan/' },
    { id: 'more-9', name: "南橫三星｜南橫登山口｜特生中心", description: "南橫三星、南一段", url: '/nanhengsanxing/' },
    { id: 'more-10', name: "北大武山｜北大武登山口", description: "北大武山", url: '/beidawu/' }
    ]
  }
];
