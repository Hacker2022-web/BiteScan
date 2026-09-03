import React, { useRef, useState, useCallback } from 'react';
import { Camera, Upload, X, Loader2, ScanLine, CheckCircle2, AlertTriangle } from 'lucide-react';

function compressAndProcessImage(file, maxDimension = 1600, quality = 0.85) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      return reject(new Error('Invalid image file'));
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to parse image'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          const rawBase64 = e.target.result.split(',')[1];
          return resolve({ previewUrl: e.target.result, base64: rawBase64 });
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        const base64 = compressedDataUrl.split(',')[1];
        resolve({ previewUrl: compressedDataUrl, base64 });
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

export default function ScannerViewport({ onScan, presets, activePreset, onPresetSelect, scanning, scanData }) {
  const fileInputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback(async (file) => {
    if (!file) return;
    try {
      const { previewUrl, base64 } = await compressAndProcessImage(file);
      setPreview(previewUrl);
      onScan({ imageBase64: base64, preset: null });
    } catch (err) {
      console.error('Image compression error:', err);
      // Fallback to basic read
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target.result.split(',')[1];
        setPreview(e.target.result);
        onScan({ imageBase64: base64, preset: null });
      };
      reader.readAsDataURL(file);
    }
  }, [onScan]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) handleFile(file);
  }, [handleFile]);

  const clearPreview = () => {
    setPreview(null);
  };

  const getPresetImage = (presetId) => {
    if (presetId === 'maggi') return "https://images.unsplash.com/photo-1612927601601-6638404737ce?w=800&auto=format&fit=crop&q=80";
    if (presetId === 'coca_cola') return "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=800&auto=format&fit=crop&q=80";
    if (presetId === 'olive_oil') return "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800&auto=format&fit=crop&q=80";
    return null;
  };

  const currentDisplayImg = preview || (activePreset ? getPresetImage(activePreset) : null);

  return (
    <div className="space-y-4 animate-fade">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-walnut flex items-center gap-2">
          <ScanLine size={20} className="text-terracotta" />
          Packaging Scanner & Verification
        </h2>
        {scanning && (
          <span className="flex items-center gap-1.5 text-xs text-terracotta font-mono font-bold bg-orange-50 px-2.5 py-1 rounded-full border border-terracotta/20 animate-pulse">
            <Loader2 size={13} className="animate-spin" />
            AI COMPLIANCE SCANNING...
          </span>
        )}
      </div>

      {/* Main Viewport Card */}
      <div
        className={`relative bg-white border-2 border-dashed rounded-3xl overflow-hidden transition-all duration-300 shadow-sm ${
          dragOver
            ? 'border-terracotta bg-orange-50/50 scale-[1.01]'
            : currentDisplayImg
            ? 'border-oatmeal-dark'
            : 'border-oatmeal-dark hover:border-terracotta/50'
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {currentDisplayImg ? (
          <div className="relative aspect-16/10 sm:aspect-16/9 bg-walnut/5 flex items-center justify-center overflow-hidden">
            <img 
              src={currentDisplayImg} 
              alt="Scan preview" 
              className="w-full h-full object-cover transition-all" 
            />

            {/* Glowing Laser Scanline */}
            {scanning && <div className="absolute inset-0 scanline pointer-events-none z-10" />}

            {/* Bounding Box HUD Overlays */}
            {scanData && !scanning && (
              <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between z-20">
                {/* Top Overlay Badge */}
                <div className="flex justify-between items-start">
                  <div className="bg-forest/90 backdrop-blur-xs text-white px-2.5 py-1 rounded-lg text-xs font-mono font-bold shadow-sm flex items-center gap-1.5 border border-white/20">
                    <CheckCircle2 size={13} />
                    <span>{scanData.ocr_data?.mrp_declaration || "MRP: INCL. OF ALL TAXES"}</span>
                  </div>

                  <div className="bg-walnut/80 backdrop-blur-xs text-oatmeal px-2.5 py-1 rounded-lg text-[11px] font-mono border border-oatmeal-dark/30 shadow-sm">
                    PPM: {scanData.scale_data?.pixels_per_mm || "8.2"} px/mm
                  </div>
                </div>

                {/* Bottom Overlay Violation Badge */}
                {scanData.compliance?.violations_count > 0 && (
                  <div className="self-end bg-crimson/95 backdrop-blur-xs text-white px-3 py-1.5 rounded-xl text-xs font-mono font-bold shadow-md flex items-center gap-1.5 border border-white/20 animate-pulse">
                    <AlertTriangle size={14} />
                    <span>
                      FLAGGED: {scanData.compliance.violations?.[0]?.clause || scanData.compliance.violations?.[0]?.rule || "Rule 6(1)(c) Non-Standard Unit"}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Clear Button */}
            <button
              onClick={clearPreview}
              className="absolute top-3 right-3 w-8 h-8 bg-walnut/80 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-walnut transition-colors z-30"
            >
              <X size={15} />
            </button>
          </div>
        ) : (
          <div
            className="flex flex-col items-center justify-center py-16 px-4 cursor-pointer group"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="w-16 h-16 bg-oatmeal border border-oatmeal-dark rounded-2xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform shadow-xs">
              <Camera size={28} className="text-terracotta" />
            </div>
            <p className="text-walnut font-bold text-base">Capture or upload packaging photo</p>
            <p className="text-slate text-xs mt-1">Drag & drop image here, or click to choose from camera</p>
            <div className="flex items-center gap-2 mt-4">
              <span className="px-4 py-2 bg-terracotta hover:bg-terracotta-hover text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all">
                <Upload size={13} />
                Browse File / Camera
              </span>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (file) handleFile(file);
          }}
        />
      </div>

      {/* Preset Demo Chips */}
      {presets && presets.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] text-slate font-mono font-bold uppercase tracking-wider">
            Quick Inspection Presets:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {presets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => {
                  setPreview(null);
                  onPresetSelect(preset.id);
                  onScan({ imageBase64: null, preset: preset.id });
                }}
                className={`group text-left p-3 rounded-2xl border transition-all duration-200 ${
                  activePreset === preset.id
                    ? 'bg-orange-50/70 border-terracotta/40 shadow-xs ring-1 ring-terracotta/30'
                    : 'bg-white border-oatmeal-dark hover:border-terracotta/40 hover:shadow-xs'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-2xs ${
                    activePreset === preset.id ? 'bg-terracotta/15' : 'bg-oatmeal'
                  }`}>
                    {preset.icon === 'noodles' ? '🍜' : preset.icon === 'bottle' ? '🥤' : '🫒'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-walnut truncate">{preset.name}</p>
                    <p className="text-[11px] text-slate truncate">{preset.brand}</p>
                    <span className={`inline-block mt-1 text-[9.5px] font-mono font-bold px-2 py-0.5 rounded-full ${
                      preset.concern.includes('Clean')
                        ? 'bg-forest-soft text-forest'
                        : 'bg-amber-soft text-amber'
                    }`}>
                      {preset.concern}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
