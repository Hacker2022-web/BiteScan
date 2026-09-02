import React, { useState } from 'react';
import { Globe, Search, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { crawlUrl } from '../services/api';

export default function EcommerceAuditor() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleCrawl = async () => {
    if (!url.trim()) return;
    setLoading(true);
    try {
      const data = await crawlUrl({ url: url.trim() });
      setResult(data);
    } catch (err) {
      console.error('Crawl failed:', err);
    }
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-oatmeal-dark shadow-sm overflow-hidden animate-slide-up">
      <div className="px-5 py-4 border-b border-oatmeal-dark bg-gradient-to-r from-terracotta/5 to-transparent">
        <div className="flex items-center gap-2">
          <Globe size={18} className="text-terracotta" />
          <h3 className="font-bold text-walnut">E-Commerce URL Auditor</h3>
        </div>
        <p className="text-xs text-slate mt-1">Compare product listings vs packaging OCR data</p>
      </div>

      <div className="px-5 py-4">
        <div className="flex gap-2 mb-4">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.blinkit.com/product/maggi-noodles..."
            className="flex-1 px-3 py-2 border border-oatmeal-dark rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta placeholder:text-slate-light"
            onKeyDown={(e) => e.key === 'Enter' && handleCrawl()}
          />
          <button
            onClick={handleCrawl}
            disabled={loading || !url.trim()}
            className="px-4 py-2 bg-terracotta text-white rounded-lg text-sm font-semibold hover:bg-terracotta-hover transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
            Audit
          </button>
        </div>

        {result && (
          <div className="space-y-3 animate-fade">
            <div className={`flex items-center gap-2 p-3 rounded-xl ${
              result.severity === 'high' ? 'bg-crimson-soft' :
              result.severity === 'medium' ? 'bg-amber-soft' : 'bg-forest-soft'
            }`}>
              {result.severity === 'high' ? (
                <AlertTriangle size={16} className="text-crimson" />
              ) : result.severity === 'medium' ? (
                <AlertTriangle size={16} className="text-amber" />
              ) : (
                <CheckCircle size={16} className="text-forest" />
              )}
              <span className={`text-sm font-bold ${
                result.severity === 'high' ? 'text-crimson' :
                result.severity === 'medium' ? 'text-amber' : 'text-forest'
              }`}>
                {result.severity === 'high' ? 'Major Discrepancies Found' :
                 result.severity === 'medium' ? 'Minor Discrepancies' : 'No Significant Issues'}
              </span>
            </div>

            {result.listed_data && Object.keys(result.listed_data).length > 0 && (
              <div className="bg-oatmeal rounded-xl p-3">
                <p className="text-xs font-semibold text-walnut mb-2 uppercase tracking-wider">Website Listed Data</p>
                <div className="space-y-1">
                  {Object.entries(result.listed_data).map(([key, val]) => (
                    <div key={key} className="flex justify-between text-xs">
                      <span className="text-slate capitalize">{key.replace(/_/g, ' ')}</span>
                      <span className="text-walnut font-medium">{typeof val === 'object' ? JSON.stringify(val) : String(val)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.discrepancies && result.discrepancies.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-walnut mb-2 uppercase tracking-wider">Discrepancies</p>
                <div className="space-y-2">
                  {result.discrepancies.map((d, i) => (
                    <div key={i} className={`border rounded-xl p-3 ${
                      d.severity === 'high' ? 'border-crimson/20 bg-crimson-soft/30' :
                      'border-amber/20 bg-amber-soft/30'
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-walnut">{d.field}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          d.severity === 'high' ? 'bg-crimson text-white' : 'bg-amber text-white'
                        }`}>
                          {d.severity?.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate"><strong>Website:</strong> {d.website_shows}</p>
                      <p className="text-[11px] text-slate"><strong>Packaging:</strong> {d.packaging_actual}</p>
                      {d.note && <p className="text-[10px] text-slate mt-1 italic">{d.note}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {!result && (
          <div className="text-center py-6 text-slate">
            <Globe size={24} className="mx-auto mb-2 opacity-30" />
            <p className="text-xs">Enter a product URL to audit e-commerce listings</p>
          </div>
        )}
      </div>
    </div>
  );
}
