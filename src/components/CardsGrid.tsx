import React, { useState } from 'react';
import { LinksModal } from './LinksModal';
import { DynamicIcon } from './DynamicIcon';
import { CardItem, ActiveModalType } from '../types';

interface CardsGridProps {
  sectionTitle: string;
  cards: CardItem[];
  onOpenModal: (type: ActiveModalType) => void;
}

const MODAL_KEYS: Record<string, Exclude<ActiveModalType, null | 'admin'>> = {
  '#calc': 'calc',
  '#hotel': 'hotel',
  '#food': 'food',
  '#road': 'road',
};

function resolveCardLink(card: CardItem): { href: string; isModal: boolean; isExternal: boolean } {
  const rawUrl = (card.url || '').trim();

  if (MODAL_KEYS[rawUrl]) {
    return { href: rawUrl, isModal: true, isExternal: false };
  }
  if (rawUrl.startsWith('tel:') || rawUrl.startsWith('mailto:')) {
    return { href: rawUrl, isModal: false, isExternal: false };
  }
  if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
    return { href: rawUrl, isModal: false, isExternal: true };
  }
  if (rawUrl.startsWith('/') || rawUrl.startsWith('line://')) {
    return { href: rawUrl, isModal: false, isExternal: true };
  }
  if (rawUrl.includes('.') && !rawUrl.startsWith('#')) {
    return { href: `https://${rawUrl}`, isModal: false, isExternal: true };
  }

  // 網址留空時，依標題關鍵字對應到內建彈窗
  const title = card.title || '';
  if (title.includes('價格') || title.includes('估算') || title.includes('試算')) {
    return { href: '#calc', isModal: true, isExternal: false };
  }
  if (title.includes('住宿') || title.includes('D0')) {
    return { href: '#hotel', isModal: true, isExternal: false };
  }
  if (title.includes('慶功') || title.includes('餐廳') || title.includes('美食')) {
    return { href: '#food', isModal: true, isExternal: false };
  }
  if (title.includes('管制') || title.includes('路況') || title.includes('道路')) {
    return { href: '#road', isModal: true, isExternal: false };
  }
  return { href: rawUrl || '#', isModal: false, isExternal: false };
}

export const CardsGrid: React.FC<CardsGridProps> = ({ sectionTitle, cards, onOpenModal }) => {
  const [linksCard, setLinksCard] = useState<CardItem | null>(null);
  return (
    <section className="mb-6 md:mb-12">
      <div className="text-center mb-4 md:mb-9">
        <h2 id="section-title" className="text-xl md:text-3xl font-extrabold text-white tracking-tight drop-shadow-sm">
          {sectionTitle}
        </h2>
        <div className="w-12 h-1 bg-gradient-to-r from-emerald-500 to-[#00c853] mx-auto mt-2 md:mt-3 rounded-full shadow-[0_0_8px_rgba(0,200,83,0.5)]"></div>
      </div>

      <div id="cards-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
        {cards.map((card) => {
          const hasLinks = !!card.links && card.links.some((l) => l.label?.trim() && l.url?.trim());
          const resolved = resolveCardLink(card);
          const href = hasLinks ? '#' : resolved.href;
          const isModal = hasLinks ? true : resolved.isModal;
          const isExternal = hasLinks ? false : resolved.isExternal;

          return (
            <a
              key={card.id}
              href={href}
              onClick={
                hasLinks
                  ? (e) => {
                      e.preventDefault();
                      setLinksCard(card);
                    }
                  : isModal
                  ? (e) => {
                      e.preventDefault();
                      onOpenModal(MODAL_KEYS[href]);
                    }
                  : undefined
              }
              target={isExternal ? '_blank' : undefined}
              rel={isExternal ? 'noopener noreferrer' : undefined}
              className="bg-[#0e2318]/85 hover:bg-[#122e20] p-3.5 md:p-6 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:shadow-[0_10px_35px_rgba(0,200,83,0.2)] border border-emerald-900/60 hover:border-emerald-500/60 flex flex-row md:flex-col items-center gap-3.5 md:gap-0 text-left md:text-center card-hover group cursor-pointer relative overflow-hidden transition-all duration-300 backdrop-blur-md"
              id={`card-link-${card.id}`}
              title={card.title}
            >
              <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl group-hover:bg-emerald-400/25 transition duration-300 pointer-events-none"></div>

              <div className="w-11 h-11 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-[#0a2718] to-[#06190f] text-[#00e676] border border-emerald-700/50 shrink-0 flex items-center justify-center text-xl md:text-2xl mb-0 md:mb-4 group-hover:from-[#00c853] group-hover:to-[#00963e] group-hover:text-white group-hover:shadow-[0_0_20px_rgba(0,200,83,0.45)] transition-all duration-300 shadow-sm">
                <DynamicIcon iconName={card.icon} className="w-6 h-6" />
              </div>

              <div className="flex-1 min-w-0 md:flex md:flex-col md:flex-grow md:items-center">
                <h3 className="font-bold text-white text-base mb-0.5 md:mb-2 group-hover:text-[#00e676] transition-colors duration-200">
                  {card.title}
                </h3>

                <p className="text-xs text-emerald-100/70 group-hover:text-emerald-100/90 leading-relaxed md:flex-grow transition-colors">
                  {card.desc}
                </p>
              </div>
            </a>
          );
        })}
      </div>
      <LinksModal card={linksCard} onClose={() => setLinksCard(null)} />
    </section>
  );
};
