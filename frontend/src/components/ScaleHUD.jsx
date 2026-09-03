import React from 'react';
import { ScanBarcode, Ruler, AlertCircle, CheckCircle } from 'lucide-react';

export default function ScaleHUD({ scaleData }) {
  if (!scaleData) return null;

  const { barcode_detected, barcode_value, barcode_type, ppm, calibration_quality, measured_font_heights } = scaleData;

  if (!barcode_detected) {
    return (
      <div className="bg-white rounded-2xl border border-oatmeal-dark shadow-sm p-5 animate-slide-up">
        <div className="flex items-center gap-2 mb-2">
          <ScanBarcode size={18} className="text-terracotta" />
          <h3 className="font-bold text-walnut">Barcode Diagnostics</h3>
        </div>
        <div className="flex items-center gap-3 p-4 bg-amber-soft rounded-xl">
          <AlertCircle size={20} className="text-amber" />
          <p className="text-sm text-amber font-medium">No barcode detected — manual measurement required</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-oatmeal-dark shadow-sm overflow-hidden animate-slide-up">
      <div className="px-5 py-4 border-b border-oatmeal-dark bg-gradient-to-r from-terracotta/5 to-transparent">
        <div className="flex items-center gap-2">
          <ScanBarcode size={18} className="text-terracotta" />
          <h3 className="font-bold text-walnut">Barcode PPM Diagnostics</h3>
        </div>
        <p className="text-xs text-slate mt-1">Physical Scale Calibration Engine</p>
      </div>

      <div className="px-5 py-4">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-oatmeal rounded-xl p-3">
            <p className="text-[10px] text-slate font-medium uppercase tracking-wider">Barcode Type</p>
            <p className="text-sm font-bold font-mono text-walnut mt-0.5">{barcode_type}</p>
          </div>
          <div className="bg-oatmeal rounded-xl p-3">
            <p className="text-[10px] text-slate font-medium uppercase tracking-wider">Barcode Value</p>
            <p className="text-sm font-bold font-mono text-walnut mt-0.5">{barcode_value}</p>
          </div>
          <div className="bg-oatmeal rounded-xl p-3">
            <p className="text-[10px] text-slate font-medium uppercase tracking-wider">Pixels Per MM</p>
            <p className="text-lg font-bold font-mono text-terracotta mt-0.5">{Number(ppm || 0).toFixed(2)}</p>
          </div>
          <div className="bg-oatmeal rounded-xl p-3">
            <p className="text-[10px] text-slate font-medium uppercase tracking-wider">Calibration</p>
            <p className={`text-sm font-bold mt-0.5 ${
              calibration_quality === 'good' ? 'text-forest' :
              calibration_quality === 'moderate' ? 'text-amber' : 'text-crimson'
            }`}>
              {calibration_quality ? String(calibration_quality).toUpperCase() : 'STANDARD'}
            </p>
          </div>
        </div>

        {measured_font_heights && measured_font_heights.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-walnut mb-2 uppercase tracking-wider flex items-center gap-1.5">
              <Ruler size={12} className="text-terracotta" />
              Measured Font Heights
            </p>
            <div className="space-y-1.5">
              {measured_font_heights.map((m, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-oatmeal/50">
                  <span className="text-[10px] font-bold font-mono text-slate uppercase w-14 shrink-0">
                    {m.category}
                  </span>
                  <span className="text-xs text-walnut truncate flex-1">{m.text_content}</span>
                  <span className="text-xs font-bold font-mono text-terracotta">{m.physical_height_mm}mm</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
