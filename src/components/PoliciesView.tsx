import React from 'react';
import { ArrowLeft, Shield } from 'lucide-react';
import type { PolicyItem } from '../types.js';

interface PoliciesViewProps {
  policies: PolicyItem[];
  onBack: () => void;
}

export const PoliciesView: React.FC<PoliciesViewProps> = ({ policies, onBack }) => {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6" aria-label="政策與條款專區">
      {/* Breadcrumb / Back button */}
      <div className="mb-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors py-1"
          id="policies-back-btn"
        >
          <ArrowLeft size={14} />
          <span>回到上一頁</span>
        </button>
      </div>

      {/* Section Title */}
      <div className="border-b border-neutral-800 pb-4 mb-6">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded bg-neutral-900 border border-neutral-800 text-emerald-400">
            <Shield size={20} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-100">
              政策與條款
            </h1>
            <p className="text-xs text-neutral-400 mt-0.5">
              協會組織章程、活動參與安全守則、退費條款與個資聲明
            </p>
          </div>
        </div>
      </div>

      {/* Policies List */}
      {policies.length === 0 ? (
        <div className="p-12 text-center text-xs text-neutral-500 border border-neutral-800 rounded bg-neutral-900/40">
          目前暫無政策與條款資料
        </div>
      ) : (
        <div className="space-y-6">
          {policies.map((policy) => (
            <article
              key={policy.id}
              className="border border-neutral-800 rounded bg-neutral-900/40 p-6 space-y-3"
            >
              <h2 className="text-base sm:text-lg font-bold text-neutral-100 border-b border-neutral-800/80 pb-2">
                {policy.title}
              </h2>
              <div className="text-xs sm:text-sm text-neutral-300 leading-relaxed whitespace-pre-line">
                {policy.content}
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
};
