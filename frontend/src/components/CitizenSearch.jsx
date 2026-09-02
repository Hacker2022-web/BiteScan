import React, { useState, useEffect } from 'react';
import { Search, X, Sparkles, ArrowRight, CheckCircle2, AlertTriangle, Star } from 'lucide-react';
import { searchTruthin, getTruthinProducts } from '../services/api';

export default function CitizenSearch({ onSelectPreset, onOpenScanner }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      setLoading(true);
      searchTruthin(query)
        .then(res => {
          setResults(res);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="space-y-6 pb-20 animate-fade max-w-2xl mx-auto">
      
      {/* Search Input Bar */}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search 'Maggi', 'Nutella', 'Palm Oil', 'Sugar'..."
          className="w-full bg-white border border-oatmeal-dark rounded-2xl py-3.5 pl-11 pr-10 text-sm font-medium text-walnut focus:outline-none focus:ring-2 focus:ring-terracotta/40 shadow-xs placeholder:text-slate-light"
          autoFocus
        />
        <Search size={18} className="absolute left-4 top-4 text-slate" />
        {query && (
          <button 
            onClick={() => setQuery('')}
            className="absolute right-3.5 top-3.5 p-1 text-slate hover:text-walnut rounded-full bg-oatmeal"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Quick Search Chips */}
      {!query && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {['Maggi Noodles', 'Nutella', 'Coca-Cola', 'Oreo Biscuits', 'Lay\'s Chips', 'Palm Oil Free'].map((tag) => (
            <button
              key={tag}
              onClick={() => setQuery(tag.replace(' Free', ''))}
              className="shrink-0 px-3 py-1.5 bg-white border border-oatmeal-dark rounded-full text-[11px] font-medium text-slate hover:text-walnut hover:border-terracotta/40 transition-colors shadow-2xs"
            >
              🔍 {tag}
            </button>
          ))}
        </div>
      )}

      {/* Search Results */}
      {query ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-mono font-bold text-slate uppercase">
              Search Results ({results.length})
            </p>
            {loading && <span className="text-xs text-slate font-mono animate-pulse">Searching TruthIn...</span>}
          </div>

          {results.length > 0 ? (
            <div className="space-y-2.5">
              {results.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    const presetId = item.id.includes('coca') ? 'coca_cola' : item.id.includes('olive') ? 'olive_oil' : 'maggi';
                    onSelectPreset(presetId);
                    onOpenScanner();
                  }}
                  className="bg-white rounded-3xl p-3.5 border border-oatmeal-dark hover:border-terracotta/40 hover:shadow-sm transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden bg-oatmeal shrink-0 border border-oatmeal-dark">
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-walnut truncate">{item.name}</h4>
                      <p className="text-[10px] text-slate">{item.brand} • <span className="font-mono">{item.mrp}</span></p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full ${
                          item.health_score >= 8.0 ? 'bg-forest-soft text-forest' :
                          item.health_score >= 5.0 ? 'bg-amber-soft text-amber' : 'bg-crimson-soft text-crimson'
                        }`}>
                          Score: {item.health_score}/10
                        </span>
                        <span className="text-[10px] text-slate-light truncate">
                          {item.health_status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-xs font-bold text-terracotta group-hover:translate-x-1 transition-transform shrink-0 ml-3">
                    <span>Inspect</span>
                    <ArrowRight size={13} />
                  </div>
                </div>
              ))}
            </div>
          ) : !loading && (
            <div className="bg-white rounded-3xl border border-oatmeal-dark p-8 text-center space-y-2">
              <p className="text-2xl">🔍</p>
              <h4 className="text-sm font-bold text-walnut">No product found for "{query}"</h4>
              <p className="text-xs text-slate max-w-xs mx-auto">
                Snap a photo of the packet with the camera scanner to analyze ingredients instantly with Gemini AI.
              </p>
              <button
                onClick={onOpenScanner}
                className="mt-3 px-4 py-2 bg-terracotta text-white rounded-xl text-xs font-bold font-mono"
              >
                OPEN CAMERA SCANNER &rarr;
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-oatmeal-dark p-8 text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-forest-soft text-forest flex items-center justify-center text-2xl mx-auto shadow-inner">
            🔍
          </div>
          <h3 className="text-base font-extrabold text-walnut">TruthIn FMCG Database</h3>
          <p className="text-xs text-slate max-w-sm mx-auto leading-relaxed">
            Search Indian packaged foods to reveal hidden palm oil, added sugars, harmful E-numbers, and clean alternatives.
          </p>
        </div>
      )}

    </div>
  );
}
