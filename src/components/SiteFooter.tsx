import { BRAND } from "@/lib/pricing-engine";

const MAIN_SITE_URL = "https://transfer.amazon-hike.com/";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border bg-card/40">
      <div className="mx-auto max-w-4xl space-y-2 px-6 py-10 text-center text-sm text-muted-foreground">
        <a
          href={MAIN_SITE_URL}
          className="font-display text-lg font-bold text-foreground transition-colors hover:text-primary"
        >
          {BRAND.name}
        </a>
        <p>
          電話：
          <a className="text-primary hover:underline" href={`tel:${BRAND.phone}`}>
            {BRAND.phone}
          </a>
        </p>
        <p>
          LINE：
          <a
            className="text-primary hover:underline"
            href={BRAND.line}
            target="_blank"
            rel="noreferrer"
          >
            {BRAND.line}
          </a>
        </p>
        <p>
          <a className="text-primary hover:underline" href={MAIN_SITE_URL}>
            登山接駁包車預約
          </a>
        </p>
        <div className="space-y-2 pt-4">
          <h2 className="font-semibold text-foreground">登山接駁路線</h2>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
            {[
              ["合歡山接駁", "hehuanshan"],
              ["雪山接駁", "xueshan"],
              ["武陵山莊接駁", "wulingshanzhuang"],
              ["玉山接駁", "yushan"],
              ["嘉明湖接駁", "jiaminghu"],
              ["奇萊南華接駁", "qilai-nanhua"],
              ["大霸尖山接駁", "dabajianshan"],
              ["郡大山接駁", "jundashan"],
            ].map(([label, path]) => (
              <a
                key={path}
                className="text-primary hover:underline"
                href={`${MAIN_SITE_URL}${path}/`}
              >
                {label}
              </a>
            ))}
          </div>
        </div>
        <div className="space-y-2 pt-4">
          <h2 className="font-semibold text-foreground">其他登山工具</h2>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
            <a
              className="text-primary hover:underline"
              href="https://stays.amazon-hike.com/trailhead-stays"
            >
              登山口住宿查詢
            </a>
            <a className="text-primary hover:underline" href="https://shuttle.amazon-hike.com/">
              郡大山・西巒大山接駁
            </a>
            <a className="text-primary hover:underline" href="https://feast.amazon-hike.com/">
              下山慶功宴餐廳
            </a>
            <a className="text-primary hover:underline" href="https://road.amazon-hike.com/">
              登山路況與管制查詢
            </a>
          </div>
        </div>
        <div className="space-y-2 pt-4">
          <h2 className="font-semibold text-foreground">相關組織</h2>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
            <a className="text-primary hover:underline" href="https://amazon-hike.com/">
              亞馬遜國家山岳協會（登山教學與百岳介紹）
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
