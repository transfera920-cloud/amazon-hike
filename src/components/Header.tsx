import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Mail, Phone, ExternalLink, ShieldCheck, Menu, X } from 'lucide-react';
import { normalizeUrl } from '../utils/url.js';
import type { NavButtonItem } from '../types.js';

interface HeaderProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  surveyUrl?: string;
  navButtons?: NavButtonItem[];
}

export const Header: React.FC<HeaderProps> = ({ currentPath, onNavigate, surveyUrl, navButtons }) => {
  const [contactOpen, setContactOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const contactRef = useRef<HTMLDivElement>(null);

  // Close contact dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (contactRef.current && !contactRef.current.contains(event.target as Node)) {
        setContactOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavClick = (path: string, externalUrl?: string) => {
    setMobileMenuOpen(false);
    setContactOpen(false);
    if (externalUrl) {
      window.open(normalizeUrl(externalUrl), '_blank', 'noopener,noreferrer');
      return;
    }
    onNavigate(path);
  };

  // Process and sort enabled navigation buttons
  const displayButtons: NavButtonItem[] = (
    navButtons && navButtons.length > 0
      ? navButtons.filter((b) => b.enabled)
      : [
          { id: '1', title: '活動行事曆', url: '/', isExternal: false, sortOrder: 1, enabled: true },
          { id: '2', title: '近期活動', url: 'https://amazon-trail.ai.studio/activity/', isExternal: true, sortOrder: 2, enabled: true },
          { id: '3', title: '登山入門', url: '/intro', isExternal: false, sortOrder: 3, enabled: true },
          { id: '4', title: '登山工具', url: '/tools', isExternal: false, sortOrder: 4, enabled: true },
          { id: '5', title: '活動花絮', url: '/highlights', isExternal: false, sortOrder: 5, enabled: true },
          { id: '6', title: '問卷調查', url: '/surveys', isExternal: false, sortOrder: 6, enabled: true },
          { id: '7', title: '政策與條款', url: '/policies', isExternal: false, sortOrder: 7, enabled: true },
          { id: '8', title: '行程總表', url: 'https://amazon-data.ai.studio/routes', isExternal: true, sortOrder: 8, enabled: true },
        ]
  ).sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <header className="border-b border-neutral-800 bg-neutral-950/95 backdrop-blur-md sticky top-0 z-40">
      {/* Top Organization Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Brand Titles on Left & Legal/Mission on Right */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 flex-1">
            <div className="flex items-center justify-between sm:block shrink-0">
              <a
                href="/"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate('/');
                }}
                className="group inline-block text-left shrink-0"
                id="brand-home-link"
              >
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-100 group-hover:text-emerald-400 transition-colors whitespace-nowrap">
                  亞馬遜國家山岳協會
                </h1>
                <p className="text-xs sm:text-sm font-medium tracking-wide text-neutral-400 group-hover:text-neutral-300 transition-colors">
                  Amazon Alpine Association
                </p>
              </a>

              {/* Mobile menu button */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="sm:hidden p-2 rounded-md text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 focus:outline-none"
                aria-label="選單開關"
                id="mobile-menu-toggle"
              >
                {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>

            {/* Placed to the RIGHT of 亞馬遜國家山岳協會 / Amazon Alpine Association */}
            <div className="border-t sm:border-t-0 sm:border-l border-neutral-800 pt-2 sm:pt-0 sm:pl-5 space-y-1 text-left">
              <div className="flex flex-wrap items-center gap-x-2 text-xs text-neutral-400">
                <span className="text-emerald-400 font-semibold">社團法人</span>
                <span>·</span>
                <span>立案編號 台內團自第1130008137號</span>
              </div>
              <p className="text-xs text-neutral-300 leading-relaxed max-w-2xl">
                協會宗旨：提倡全民運動、鍛鍊強健體魄、培養互助團隊精神，以及接觸大自然與山林相關知識及技能。
              </p>
            </div>
          </div>

          {/* Quick utility controls (Contact & Admin) */}
          <div className="hidden sm:flex items-center gap-2 shrink-0 self-end lg:self-center">
            {/* Contact Dropdown */}
            <div className="relative" ref={contactRef}>
              <button
                type="button"
                onClick={() => setContactOpen(!contactOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border border-neutral-700 bg-neutral-900 text-neutral-200 hover:bg-neutral-800 hover:text-white transition-colors"
                id="contact-dropdown-btn"
                aria-expanded={contactOpen}
              >
                <span>聯絡方式</span>
                <ChevronDown size={14} className={`transition-transform duration-200 ${contactOpen ? 'rotate-180' : ''}`} />
              </button>

              {contactOpen && (
                <div
                  className="absolute right-0 mt-1.5 w-64 rounded-md border border-neutral-800 bg-neutral-900 p-2 shadow-xl z-50 text-xs space-y-2"
                  id="contact-dropdown-menu"
                >
                  <a
                    href="mailto:YY661003@GMAIL.COM"
                    className="flex items-start gap-2.5 p-2 rounded hover:bg-neutral-800 transition-colors text-neutral-200"
                    id="contact-email-link"
                  >
                    <Mail size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-neutral-300">EMAIL</div>
                      <div className="text-neutral-400 break-all">YY661003@GMAIL.COM</div>
                    </div>
                  </a>

                  <a
                    href="tel:0972573495"
                    className="flex items-start gap-2.5 p-2 rounded hover:bg-neutral-800 transition-colors text-neutral-200"
                    id="contact-phone-link"
                  >
                    <Phone size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-neutral-300">電話</div>
                      <div className="text-neutral-400">0972573495</div>
                    </div>
                  </a>

                  <a
                    href="https://lin.ee/yFZbgXb"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-2.5 p-2 rounded hover:bg-neutral-800 transition-colors text-neutral-200"
                    id="contact-line-link"
                  >
                    <div className="w-4 h-4 rounded-full bg-[#06C755] flex items-center justify-center text-black font-bold text-[9px] shrink-0 mt-0.5">
                      L
                    </div>
                    <div>
                      <div className="font-semibold text-neutral-300">LINE 官方</div>
                      <div className="text-emerald-400 flex items-center gap-1 mt-0.5">
                        <span>點擊加入好友諮詢</span>
                        <ExternalLink size={11} />
                      </div>
                    </div>
                  </a>
                </div>
              )}
            </div>

            {/* Admin link */}
            <button
              type="button"
              onClick={() => onNavigate('/admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border transition-colors ${
                currentPath === '/admin'
                  ? 'border-emerald-600 bg-emerald-950 text-emerald-300'
                  : 'border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
              }`}
              id="header-admin-link"
            >
              <ShieldCheck size={14} />
              <span>後台管理</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Bar: Dynamic Portals (Supports admin editing, enlarged font, no text wrapping) */}
      <nav className="border-t border-neutral-800 bg-neutral-900/95 shadow-inner" aria-label="主要導覽">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
          <div className="hidden md:flex items-center justify-between gap-1 lg:gap-1.5 py-2 w-full text-center flex-nowrap">
            {displayButtons.map((btn) => {
              const isExternal = btn.isExternal || btn.url.startsWith('http://') || btn.url.startsWith('https://');
              if (isExternal) {
                return (
                  <a
                    key={btn.id}
                    href={normalizeUrl(btn.url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1 px-2 lg:px-3.5 py-2.5 rounded-md text-neutral-200 hover:bg-neutral-800/80 hover:text-white transition-all whitespace-nowrap text-[15px] lg:text-base font-bold"
                    id={`nav-btn-${btn.id}`}
                  >
                    <span>{btn.title}</span>
                    <ExternalLink size={14} className="text-neutral-400 shrink-0" />
                  </a>
                );
              }

              const isActive = currentPath === btn.url;
              return (
                <button
                  key={btn.id}
                  type="button"
                  onClick={() => handleNavClick(btn.url)}
                  className={`flex-1 flex items-center justify-center px-2 lg:px-3.5 py-2.5 rounded-md transition-all whitespace-nowrap text-[15px] lg:text-base font-bold ${
                    isActive
                      ? 'bg-neutral-800 text-emerald-400 font-bold border-b-2 border-emerald-400 shadow'
                      : 'text-neutral-200 hover:bg-neutral-800/80 hover:text-white'
                  }`}
                  id={`nav-btn-${btn.id}`}
                >
                  {btn.title}
                </button>
              );
            })}
          </div>

          {/* Mobile Collapsible Navigation Menu (Enlarged touch targets, no wrap) */}
          {mobileMenuOpen && (
            <div className="md:hidden py-3 space-y-1.5 border-t border-neutral-800 text-base font-bold" id="mobile-nav-panel">
              {displayButtons.map((btn, idx) => {
                const isExternal = btn.isExternal || btn.url.startsWith('http://') || btn.url.startsWith('https://');
                if (isExternal) {
                  return (
                    <a
                      key={btn.id}
                      href={normalizeUrl(btn.url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between px-4 py-2.5 rounded text-neutral-100 hover:bg-neutral-800 whitespace-nowrap"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <span>{idx + 1}. {btn.title}</span>
                      <ExternalLink size={16} className="text-neutral-400 shrink-0" />
                    </a>
                  );
                }

                const isActive = currentPath === btn.url;
                return (
                  <button
                    key={btn.id}
                    type="button"
                    onClick={() => handleNavClick(btn.url)}
                    className={`w-full text-left px-4 py-2.5 rounded whitespace-nowrap ${
                      isActive ? 'bg-neutral-800 text-emerald-400 font-bold' : 'text-neutral-100 hover:bg-neutral-800'
                    }`}
                  >
                    {idx + 1}. {btn.title}
                  </button>
                );
              })}

              {/* Mobile Contact & Admin */}
              <div className="pt-3 mt-2 border-t border-neutral-800 space-y-1">
                <div className="px-4 py-1 text-xs text-neutral-500 font-semibold">聯絡方式</div>
                <a href="mailto:YY661003@GMAIL.COM" className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-300">
                  <Mail size={16} className="text-emerald-400" />
                  <span>EMAIL: YY661003@GMAIL.COM</span>
                </a>
                <a href="tel:0972573495" className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-300">
                  <Phone size={16} className="text-emerald-400" />
                  <span>電話: 0972573495</span>
                </a>
                <a href="https://lin.ee/yFZbgXb" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-300">
                  <span className="w-4 h-4 rounded-full bg-[#06C755] flex items-center justify-center text-black font-bold text-[9px]">L</span>
                  <span>LINE 官方好友諮詢</span>
                </a>
                <button
                  type="button"
                  onClick={() => handleNavClick('/admin')}
                  className="w-full text-left flex items-center gap-2 px-4 py-2.5 mt-2 text-sm text-emerald-400 font-medium bg-neutral-900 rounded"
                >
                  <ShieldCheck size={16} />
                  <span>後台管理</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
};
