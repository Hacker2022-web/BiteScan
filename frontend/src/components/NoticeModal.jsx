import React, { useState } from 'react';
import { FileText, Download, X, Loader2, Printer } from 'lucide-react';
import { generateNotice } from '../services/api';

export default function NoticeModal({ scanData, onClose }) {
  const [generating, setGenerating] = useState(false);
  const [noticeResult, setNoticeResult] = useState(null);
  const [inspectorName, setInspectorName] = useState('Inspector — Consumer Affairs');
  const [badge, setBadge] = useState('CA-2024-0001');

  const handleGenerate = async () => {
    if (!scanData) return;
    setGenerating(true);
    try {
      const result = await generateNotice({
        scanId: scanData.scan_id || 'SCAN-MANUAL',
        violationDetails: {
          product_name: scanData.ocr_data?.product_name || 'Unknown',
          brand: scanData.ocr_data?.brand || '',
          mrp: scanData.ocr_data?.mrp || 'N/A',
          net_quantity: scanData.ocr_data?.net_quantity || 'N/A',
          manufacturer: scanData.ocr_data?.manufacturer || 'N/A',
          compliance: scanData.compliance || {},
          health: scanData.health || {}
        },
        inspectorName: inspectorName,
        inspectorBadge: badge
      });
      setNoticeResult(result);
    } catch (err) {
      console.error('Notice generation failed:', err);
    }
    setGenerating(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-walnut/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="px-5 py-4 border-b border-oatmeal-dark flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-terracotta" />
            <h3 className="font-bold text-walnut">Show Cause Notice</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-oatmeal transition-colors">
            <X size={18} className="text-slate" />
          </button>
        </div>

        <div className="px-5 py-4">
          <p className="text-xs text-slate mb-4">
            Under Section 36 of the Legal Metrology Act, 2009
          </p>

          {!noticeResult ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-walnut block mb-1">Inspector Name</label>
                <input
                  type="text"
                  value={inspectorName}
                  onChange={(e) => setInspectorName(e.target.value)}
                  className="w-full px-3 py-2 border border-oatmeal-dark rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-walnut block mb-1">Badge Number</label>
                <input
                  type="text"
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                  className="w-full px-3 py-2 border border-oatmeal-dark rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta"
                />
              </div>

              {scanData?.compliance?.violations?.length > 0 && (
                <div className="bg-crimson-soft rounded-xl p-3">
                  <p className="text-xs font-bold text-crimson mb-1">
                    {scanData.compliance.violations_count} Violation(s) Will Be Included
                  </p>
                  {scanData.compliance.violations.map((v, i) => (
                    <p key={i} className="text-[11px] text-crimson/80">• {v.rule}: {v.description}</p>
                  ))}
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={generating}
                className="w-full py-2.5 bg-terracotta text-white rounded-xl text-sm font-bold hover:bg-terracotta-hover transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {generating ? (
                  <><Loader2 size={14} className="animate-spin" /> Generating PDF...</>
                ) : (
                  <><FileText size={14} /> Generate Show Cause Notice</>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-forest-soft rounded-xl p-4 text-center">
                <p className="text-2xl mb-1">📄</p>
                <p className="text-sm font-bold text-forest">Notice Generated Successfully</p>
                <p className="text-xs text-slate mt-1">Notice ID: <span className="font-mono">{noticeResult.notice_id}</span></p>
                <p className="text-xs text-slate">Section: {noticeResult.section}</p>
              </div>

              <div className="bg-oatmeal rounded-xl p-3 space-y-1">
                <p className="text-xs text-slate"><strong>Product:</strong> {noticeResult.product}</p>
                <p className="text-xs text-slate"><strong>Manufacturer:</strong> {noticeResult.manufacturer}</p>
                <p className="text-xs text-slate"><strong>Violations:</strong> {noticeResult.violations_count}</p>
                <p className="text-xs text-slate"><strong>Generated:</strong> {noticeResult.generated_at}</p>
              </div>

              <div className="flex gap-2">
                <a
                  href={noticeResult.pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 bg-terracotta text-white rounded-xl text-sm font-bold hover:bg-terracotta-hover transition-colors flex items-center justify-center gap-2"
                >
                  <Download size={14} /> Download PDF
                </a>
                <button
                  onClick={onClose}
                  className="px-4 py-2.5 bg-oatmeal text-walnut rounded-xl text-sm font-semibold hover:bg-oatmeal-dark transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
