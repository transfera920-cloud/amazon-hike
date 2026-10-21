import React from 'react';

interface AboutSectionProps {
  title: string;
  content: string;
}

export const AboutSection: React.FC<AboutSectionProps> = ({ title, content }) => {
  return (
    <section className="bg-[#0e2318]/85 border border-emerald-900/60 rounded-2xl p-4 md:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.3)] backdrop-blur-md mb-4 md:mb-12 relative overflow-hidden">
      {/* 裝飾背景柔光 */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none"></div>

      <h2 className="text-lg md:text-xl font-bold text-white mb-2.5 md:mb-4 flex items-center relative z-10">
        <span className="w-1.5 h-5 bg-gradient-to-b from-[#00e676] to-[#00c853] rounded-full mr-3 inline-block shadow-[0_0_8px_rgba(0,200,83,0.6)]"></span>
        <span id="about-title">{title}</span>
      </h2>

      {/* Content paragraphs */}
      <div
        id="about-content"
        className="text-emerald-100/85 leading-relaxed text-sm md:text-base space-y-2.5 md:space-y-4 whitespace-pre-line relative z-10"
      >
        {content}
      </div>
    </section>
  );
};

