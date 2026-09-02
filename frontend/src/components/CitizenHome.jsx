import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Search, 
  ScanLine, 
  Gift, 
  ShieldAlert, 
  ArrowRight, 
  Star, 
  ChevronRight,
  Flame,
  Droplets
} from 'lucide-react';
import { getTruthinCategories, getTruthinProducts } from '../services/api';

export default function CitizenHome({ onOpenScanner, onSelectPreset, onNavigateTab }) {
  const [categories, setCategories] = useState([
    { id: 'instant_foods', name: 'Instant Foods & Noodles', icon: '🍜', count: '15+ SKUs' },
    { id: 'biscuits_cookies', name: 'Biscuits & Cookies', icon: '🍪', count: '24+ SKUs' },
    { id: 'breakfast_spreads', name: 'Breakfast & Spreads', icon: '🍯', count: '18+ SKUs' },
    { id: 'beverages_juices', name: 'Cold Drinks & Juices', icon: '🥤', count: '20+ SKUs' },
    { id: 'chips_munchies', name: 'Chips & Munchies', icon: '🍿', count: '16+ SKUs' },
    { id: 'cooking_oils_ghee', name: 'Cooking Oils & Ghee', icon: '🫒', count: '14+ SKUs' },
  ]);

  const [healthyPicks, setHealthyPicks] = useState([]);

  useEffect(() => {
    getTruthinCategories().then(setCategories).catch(() => {});
    getTruthinProducts('all').then(prods => {
      // Filter top clean products (Score >= 8.5)
      const clean = prods.filter(p => p.health_score >= 8.5).slice(0, 4);
      setHealthyPicks(clean);
    }).catch(() => {});
  }, []);

  return (
    <div className="space-y-6 pb-20 animate-fade max-w-2xl mx-auto">
      
      {/* Greeting Header & Rewards Points */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h2 className="text-2xl font-extrabold text-walnut tracking-tight flex items-center gap-1.5">
            Hi Friend, <span className="inline-block animate-bounce">👋</span>
          </h2>
          <p className="text-xs text-slate font-medium mt-0.5">Ready to make a clean, smart food choice?</p>
        </div>

        {/* Rewards Streak Badge */}
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-oatmeal-dark shadow-2xs">
          <div className="w-6 h-6 rounded-full bg-forest-soft flex items-center justify-center text-forest text-xs font-bold">
            🌱
          </div>
          <div className="text-right">
            <p className="text-[9px] text-slate font-mono uppercase font-bold leading-none">Smart Points</p>
            <p className="text-xs font-bold text-forest font-mono leading-none mt-0.5">145 ⍟</p>
          </div>
        </div>
      </div>

      {/* Universal Search Bar */}
      <div 
        onClick={() => onNavigateTab('search')}
        className="bg-white border border-oatmeal-dark rounded-2xl p-3.5 flex items-center gap-3 shadow-xs cursor-pointer hover:border-terracotta/40 transition-all group"
      >
        <Search size={18} className="text-slate group-hover:text-terracotta transition-colors" />
        <span className="text-sm text-slate-light font-medium flex-1">Search packaged snacks, drinks, biscuits...</span>
        <span className="text-[10px] font-mono font-bold bg-oatmeal text-slate px-2 py-0.5 rounded-md">SCAN / SEARCH</span>
      </div>

      {/* Top Categories Scrollable Strip */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-walnut uppercase tracking-wider font-mono">Packaged Food Categories</h3>
          <button 
            onClick={() => onNavigateTab('categories')}
            className="text-xs font-bold text-terracotta hover:text-terracotta-hover flex items-center gap-0.5"
          >
            <span>View All</span>
            <ChevronRight size={14} />
          </button>
        </div>

        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                const presetId = cat.id === 'instant_foods' ? 'maggi' : cat.id === 'beverages_juices' ? 'coca_cola' : 'olive_oil';
                onSelectPreset(presetId);
                onOpenScanner();
              }}
              className="flex flex-col items-center shrink-0 w-26 p-3 bg-white rounded-2xl border border-oatmeal-dark hover:border-terracotta/40 hover:shadow-xs transition-all active:scale-95 text-center group"
            >
              <div className="w-12 h-12 rounded-2xl bg-oatmeal flex items-center justify-center text-2xl mb-2 group-hover:scale-110 transition-transform shadow-2xs">
                {cat.icon}
              </div>
              <p className="text-[11px] font-bold text-walnut leading-tight truncate w-full">{cat.name}</p>
              <span className="text-[9px] text-slate font-mono mt-0.5">{cat.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 4 Quick Action Banners (2x2 Grid) */}
      <div className="grid grid-cols-2 gap-3">
        
        {/* Action 1: Scan Food */}
        <div 
          onClick={onOpenScanner}
          className="bg-gradient-to-br from-white to-orange-50/50 p-4 rounded-3xl border border-terracotta/30 shadow-xs hover:shadow-md transition-all cursor-pointer group active:scale-98 flex flex-col justify-between"
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <h4 className="text-sm font-extrabold text-walnut">Scan Food</h4>
              <p className="text-[10px] text-slate font-medium">Verify Label & FSSAI</p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-terracotta text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <ScanLine size={20} />
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold text-terracotta flex items-center gap-1">
            <span>Instant Camera OCR</span>
            <ArrowRight size={11} className="group-hover:translate-x-1 transition-transform" />
          </span>
        </div>

        {/* Action 2: Health Rewards */}
        <div 
          onClick={() => alert("🎉 You've earned 145 Smart Points for choosing clean food! Redeemable for clean brand discounts.")}
          className="bg-gradient-to-br from-white to-amber-50/50 p-4 rounded-3xl border border-amber/30 shadow-xs hover:shadow-md transition-all cursor-pointer group active:scale-98 flex flex-col justify-between"
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <h4 className="text-sm font-extrabold text-walnut">My Rewards</h4>
              <p className="text-[10px] text-slate font-medium">Scan & Earn Points</p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-amber text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <Gift size={20} />
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold text-amber flex items-center gap-1">
            <span>145 Pts Active</span>
            <ArrowRight size={11} className="group-hover:translate-x-1 transition-transform" />
          </span>
        </div>

        {/* Action 3: Palm Oil & Sugar Alert Radar */}
        <div 
          onClick={() => {
            onSelectPreset('maggi');
            onOpenScanner();
          }}
          className="bg-gradient-to-br from-white to-red-50/50 p-4 rounded-3xl border border-crimson/20 shadow-xs hover:shadow-md transition-all cursor-pointer group active:scale-98 flex flex-col justify-between"
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <h4 className="text-sm font-extrabold text-walnut">Palm Oil & Sugar</h4>
              <p className="text-[10px] text-slate font-medium">Harmful Additive Radar</p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-crimson-soft text-crimson flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
              <ShieldAlert size={20} />
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold text-crimson flex items-center gap-1">
            <span>Scan for Toxins</span>
            <ArrowRight size={11} className="group-hover:translate-x-1 transition-transform" />
          </span>
        </div>

        {/* Action 4: TruthIn Clean Picks */}
        <div 
          onClick={() => {
            onSelectPreset('olive_oil');
            onOpenScanner();
          }}
          className="bg-gradient-to-br from-white to-forest-soft/60 p-4 rounded-3xl border border-forest/30 shadow-xs hover:shadow-md transition-all cursor-pointer group active:scale-98 flex flex-col justify-between"
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <h4 className="text-sm font-extrabold text-walnut">Clean Picks</h4>
              <p className="text-[10px] text-slate font-medium">TruthIn Verified</p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-forest text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <Sparkles size={20} />
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold text-forest flex items-center gap-1">
            <span>Explore 9+ Score</span>
            <ArrowRight size={11} className="group-hover:translate-x-1 transition-transform" />
          </span>
        </div>

      </div>

      {/* TruthIn Verified Healthy Picks Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-walnut uppercase tracking-wider font-mono flex items-center gap-1.5">
              <span>🌿</span>
              <span>TruthIn Verified Clean Foods</span>
            </h3>
            <p className="text-[11px] text-slate">Clean-label Indian brands with zero hidden palm oil or chemicals</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {healthyPicks.map((p) => (
            <div 
              key={p.id}
              onClick={() => {
                onSelectPreset('olive_oil');
                onOpenScanner();
              }}
              className="bg-white rounded-3xl p-3.5 border border-oatmeal-dark shadow-xs hover:border-forest/40 hover:shadow-md transition-all cursor-pointer group flex items-start gap-3.5"
            >
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-oatmeal shrink-0 border border-oatmeal-dark">
                <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-[9.5px] font-mono font-bold text-forest bg-forest-soft px-2 py-0.5 rounded-md">
                    CLEAN GRADE
                  </span>
                  <div className="flex items-center gap-1 text-[11px] font-bold font-mono text-forest">
                    <Star size={11} fill="currentColor" />
                    <span>{p.health_score}/10</span>
                  </div>
                </div>

                <h4 className="text-xs font-bold text-walnut truncate mt-1">{p.name}</h4>
                <p className="text-[10px] text-slate">{p.brand}</p>
                <p className="text-[10px] text-slate-light line-clamp-1 mt-1">
                  {p.clean_alternatives?.[0]?.key_differentiators?.[0] || '100% pure & unadulterated'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
