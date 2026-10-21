import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Mountain } from "lucide-react";
import heroImage from "@/assets/hero-alpine.jpg";
import { QuoteForm, type QuoteFormValues } from "@/components/QuoteForm";
import { QuoteResult } from "@/components/QuoteResult";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/lib/pricing-engine";
import { requestQuote, type QuoteResponse } from "@/lib/quote.functions";

const TITLE = "登山接駁費用試算｜全台登山口接駁即時估價 - 亞馬遜高山接駁";
const DESCRIPTION =
  "輸入起點與登山口，立即試算全台登山口接駁與包車的預估費用。涵蓋合歡山、雪山、玉山、南湖大山等百岳登山口，結合 Google 路線與歷史報價，估價後可直接由 LINE 預約。";
const SITE_URL = "https://transfer.amazon-hike.com/";
const PAGE_URL = "https://price.amazon-hike.com/";
const OG_IMAGE = "https://price.amazon-hike.com/og-cover.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      {
        name: "keywords",
        content:
          "登山接駁費用, 登山接駁價格, 登山口接駁估價, 登山包車估價, 登山接駁試算, 百岳接駁費用, 亞馬遜高山接駁",
      },
      { name: "robots", content: "index, follow" },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "亞馬遜高山接駁" },
      { property: "og:locale", content: "zh_TW" },
      { property: "og:title", content: "登山接駁費用試算｜全台登山口接駁即時估價" },
      {
        property: "og:description",
        content: "輸入起點與登山口，立即試算全台登山口接駁與包車預估費用，估價後可由 LINE 預約。",
      },
      { property: "og:image", content: OG_IMAGE },
      { property: "og:url", content: PAGE_URL },
      { name: "twitter:title", content: "登山接駁費用試算｜全台登山口接駁即時估價" },
      {
        name: "twitter:description",
        content: "輸入起點與登山口，立即試算全台登山口接駁與包車預估費用，估價後可由 LINE 預約。",
      },
      { name: "twitter:image", content: OG_IMAGE },
    ],
    links: [{ rel: "canonical", href: PAGE_URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebApplication",
              "@id": "https://price.amazon-hike.com/#app",
              name: "登山接駁費用試算系統",
              url: PAGE_URL,
              description: DESCRIPTION,
              applicationCategory: "TravelApplication",
              operatingSystem: "Web",
              inLanguage: "zh-TW",
              isAccessibleForFree: true,
              image: OG_IMAGE,
              provider: { "@id": "https://transfer.amazon-hike.com/#org" },
              relatedLink: ["https://transfer.amazon-hike.com/", "https://amazon-hike.com/"],
            },
            {
              "@type": "LocalBusiness",
              "@id": "https://transfer.amazon-hike.com/#org",
              name: "亞馬遜高山接駁",
              url: SITE_URL,
              telephone: "+886972573495",
              sameAs: ["https://lin.ee/TJJLV36"],
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "亞馬遜高山接駁", item: SITE_URL },
                { "@type": "ListItem", position: 2, name: "登山接駁費用試算", item: PAGE_URL },
              ],
            },
          ],
        }),
      },
    ],
  }),
  component: Index,
});


function RedirectNotice({ url, trailhead }: { url: string; trailhead: string }) {
  useEffect(() => {
    const t = window.setTimeout(() => {
      window.location.href = url;
    }, 1800);
    return () => window.clearTimeout(t);
  }, [url]);

  return (
    <div className="panel space-y-3 p-6 text-center">
      <h2 className="text-xl font-bold">「{trailhead}」由專屬系統報價</h2>
      <p className="text-sm text-muted-foreground">正在為您導向郡大山／西巒大山專屬估價系統…</p>
      <Button asChild size="lg" className="font-bold">
        <a href={url}>前往專屬系統</a>
      </Button>
    </div>
  );
}

function Index() {
  const submit = useServerFn(requestQuote);
  const [result, setResult] = useState<QuoteResponse | null>(null);

  const mutation = useMutation({
    mutationFn: (values: QuoteFormValues) =>
      submit({
        data: {
          days: values.days,
          tripType: values.tripType,
          origin: values.origin.trim(),
          trailheadA: values.trailheadA.trim(),
          trailheadB: values.trailheadB.trim() || undefined,
          waypoints: values.waypoints.map((w) => w.trim()).filter(Boolean),
          departTime: values.departTime || undefined,
          returnTime: values.returnTime || undefined,
          localShuttleCost: Number.parseInt(values.localShuttleCost || "0", 10) || 0,
        },
      }),
    onSuccess: (data) => {
      setResult(data);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
  });

  return (
    <div className="min-h-screen">
      <header className="relative overflow-hidden">
        <img
          src={heroImage}
          alt="亞馬遜高山接駁 - 全國登山口智能估價系統，台灣高山夜色與蜿蜒山路"
          width={1920}
          height={1088}
          className="absolute inset-0 size-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/70 to-background" />
        <div className="relative mx-auto max-w-4xl px-5 pt-12 pb-8 text-center sm:pt-16">
          <a
            href={SITE_URL}
            className="font-display text-sm font-bold tracking-[0.3em] text-foreground/90 transition-colors hover:text-primary sm:text-base"
          >
            亞馬遜高山接駁
          </a>
          <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-background/60 px-4 py-1.5 text-xs font-semibold tracking-widest text-primary">
            <Mountain className="size-4" />
            {BRAND.name}
          </p>
          <h1 className="mt-4 text-3xl leading-tight font-black sm:text-5xl">
            全國登山口
            <br className="sm:hidden" />
            智能接駁估價系統
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
            任何登山口都能估價。依 Google 實際道路距離與車程時間，結合歷史報價模型，
            立即產生預估接駁費用。
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 pb-10">
        {result?.status === "redirect" ? (
          <RedirectNotice url={result.url} trailhead={result.trailhead} />
        ) : result?.status === "ok" ? (
          <div className="space-y-4">
            <QuoteResult quote={result} />
            <Button
              variant="ghost"
              className="w-full border border-border/60 text-muted-foreground"
              onClick={() => {
                setResult(null);
                mutation.reset();
              }}
            >
              重新估價
            </Button>
          </div>
        ) : (
          <QuoteForm
            onSubmit={(values) => mutation.mutate(values)}
            loading={mutation.isPending}
            error={mutation.error ? (mutation.error as Error).message : null}
          />
        )}

        <section className="mt-10 space-y-5">
          <h2 className="font-display text-xl font-bold sm:text-2xl">
            台灣高山接駁與登山包車服務
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            亞馬遜高山接駁提供全台百岳接駁與登山包車服務，從都會出發直達合歡山、雪山、玉山塔塔加、
            南湖大山、能高安東軍等熱門登山口。所有登山口接駁費用皆以 Google
            實際道路距離與山路車程時間，搭配歷史報價模型即時試算。
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="panel space-y-1.5 p-4">
              <h3 className="text-sm font-semibold">熱門百岳接駁路線</h3>
              <p className="text-xs leading-relaxed text-muted-foreground">
                合歡山群峰、雪山東峰、玉山塔塔加、南湖大山勝光、奇萊主北屯原、嘉明湖向陽等登山口皆可估價。
              </p>
            </div>
            <div className="panel space-y-1.5 p-4">
              <h3 className="text-sm font-semibold">登山包車估價方式</h3>
              <p className="text-xs leading-relaxed text-muted-foreground">
                依行程天數、單程接駁或 A 進 B 出、出發與回程時間計算，並可加入當地接駁費用。
              </p>
            </div>
            <div className="panel space-y-1.5 p-4">
              <h3 className="text-sm font-semibold">全台登山口自由輸入</h3>
              <p className="text-xs leading-relaxed text-muted-foreground">
                不限清單，任何登山口名稱或地址皆可輸入，系統自動定位並規劃實際行駛路線。
              </p>
            </div>
            <div className="panel space-y-1.5 p-4">
              <h3 className="text-sm font-semibold">預訂與注意事項</h3>
              <p className="text-xs leading-relaxed text-muted-foreground">
                線上估價為預估值，實際費用依路況、人數與需求確認；建議提前來電或加 LINE 預約。
              </p>
            </div>
          </div>
        </section>
      </main>


      <SiteFooter />
    </div>
  );
}
