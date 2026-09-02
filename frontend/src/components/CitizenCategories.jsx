import React, { useState, useEffect } from 'react';
import { ChevronRight, Search, Sparkles, Star, ArrowRight } from 'lucide-react';
import { getTruthinCategories, getTruthinProducts } from '../services/api';

export default function CitizenCategories({ onSelectCategory, onOpenScanner }) {
  const [categories, setCategories] = useState([]);
  const [selectedCat, setSelectedCat] = useState('all');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getTruthinCategories().then(setCategories).catch(() => {});
    loadCategoryProducts('all');
  }, []);

  const loadCategoryProducts = (catId) => {
    setSelectedCat(catId);
    setLoading(true);
    getTruthinProducts(catId)
      .then(res => {
        setProducts(res);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  return (
    <div className="space-y-6 pb-20 animate-fade max-w-2xl mx-auto">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-walnut tracking-tight">Packaged Food Categories 🍱</h2>
        <p className="text-xs text-slate font-medium mt-0.5">Browse real FMCG supermarket items and their TruthIn health grades.</p>
      </div>

      {/* Categories Horizontal Selector */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
        <button
          onClick={() => loadCategoryProducts('all')}
          className={`shrink-0 px-4 py-2 rounded-2xl text-xs font-bold font-mono transition-all ${
            selectedCat === 'all'
              ? 'bg-walnut text-white shadow-xs'
              : 'bg-white border border-oatmeal-dark text-slate hover:text-walnut'
          }`}
        >
          🌟 All Items
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => loadCategoryProducts(cat.id)}
            className={`shrink-0 px-4 py-2 rounded-2xl text-xs font-bold font-mono transition-all flex items-center gap-1.5 ${
              selectedCat === cat.id
                ? 'bg-terracotta text-white shadow-xs'
                : 'bg-white border border-oatmeal-dark text-slate hover:text-walnut'
            }`}
          >
            <span>{cat.icon}</span>
            <span>{cat.name}</span>
          </button>
        ))}
      </div>

      {/* Category Product Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-mono font-bold text-slate uppercase">
            Showing {products.length} Products
          </p>
          <span className="text-[10px] font-mono font-bold text-forest bg-forest-soft px-2 py-0.5 rounded-full">
            TRUTHIN VERIFIED
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate font-mono animate-pulse">
            Loading food catalog...
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {products.map((p) => (
              <div
                key={p.id}
                onClick={() => {
                  const presetId = p.id.includes('coca') ? 'coca_cola' : p.id.includes('olive') ? 'olive_oil' : 'maggi';
                  onSelectCategory(presetId);
                  onOpenScanner();
                }}
                className="bg-white rounded-3xl p-3.5 border border-oatmeal-dark hover:border-terracotta/40 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start gap-3">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden bg-oatmeal shrink-0 border border-oatmeal-dark">
                      <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-md ${
                          p.health_score >= 8 ? 'bg-forest-soft text-forest' :
                          p.health_score >= 5 ? 'bg-amber-soft text-amber' : 'bg-crimson-soft text-crimson'
                        }`}>
                          {p.health_score}/10 {p.score_label}
                        </span>
                        <span className="text-xs font-mono font-bold text-walnut">{p.mrp}</span>
                      </div>
                      <h4 className="text-xs font-bold text-walnut truncate mt-1">{p.name}</h4>
                      <p className="text-[10px] text-slate">{p.brand}</p>
                    </div>
                  </div>

                  {/* Alarms preview */}
                  {p.alarms && p.alarms.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-oatmeal-dark/50 space-y-1">
                      {p.alarms.slice(0, 1).map((a, idx) => (
                        <p key={idx} className="text-[10.5px] text-crimson font-medium flex items-center gap-1 truncate">
                          <span>⚠️</span>
                          <span>{a.title}</span>
                        </p>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-2 border-t border-oatmeal-dark/60 flex items-center justify-between text-[11px] font-bold text-terracotta group-hover:translate-x-0.5 transition-transform">
                  <span>View Breakdown & Clean Alternatives</span>
                  <ArrowRight size={13} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
