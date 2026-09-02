import React from 'react';
import { Sparkles, ExternalLink, Star, Check } from 'lucide-react';

export default function AlternativesList({ alternatives }) {
  if (!alternatives || alternatives.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-oatmeal-dark shadow-sm overflow-hidden animate-slide-up">
      <div className="px-5 py-4 border-b border-oatmeal-dark bg-gradient-to-r from-forest/5 to-transparent">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-forest" />
          <h3 className="font-bold text-walnut">TruthIn Clean Alternatives</h3>
        </div>
        <p className="text-xs text-slate mt-1">Healthier substitutes recommended for you</p>
      </div>

      <div className="px-5 py-3 space-y-3">
        {alternatives.map((alt, i) => (
          <div key={i} className="border border-oatmeal-dark rounded-xl p-4 hover:border-forest/30 transition-colors">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-sm font-bold text-walnut">{alt.product}</p>
                <p className="text-xs text-slate">{alt.brand}</p>
              </div>
              {alt.health_score && (
                <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                  alt.health_score >= 8.0 ? 'bg-forest-soft text-forest' : 'bg-amber-soft text-amber'
                }`}>
                  <Star size={10} fill="currentColor" />
                  {alt.health_score}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5 mb-3">
              {(alt.key_benefits || []).map((benefit, j) => (
                <span
                  key={j}
                  className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full bg-forest-soft text-forest"
                >
                  <Check size={8} />
                  {benefit}
                </span>
              ))}
            </div>

            {alt.price_range && (
              <p className="text-xs text-slate">
                Price: <span className="font-mono font-semibold text-walnut">{alt.price_range}</span>
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
