import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import RoleSelector from './components/RoleSelector';
import CitizenHome from './components/CitizenHome';
import CitizenCategories from './components/CitizenCategories';
import CitizenSearch from './components/CitizenSearch';
import CitizenBot from './components/CitizenBot';
import BottomNav from './components/BottomNav';
import ScannerViewport from './components/ScannerViewport';
import HealthGauge from './components/HealthGauge';
import AdditiveAlerts from './components/AdditiveAlerts';
import AlternativesList from './components/AlternativesList';
import NutritionCard from './components/NutritionCard';
import GrievanceButton from './components/GrievanceButton';
import ComplianceCard from './components/ComplianceCard';
import ScaleHUD from './components/ScaleHUD';
import NoticeModal from './components/NoticeModal';
import EcommerceAuditor from './components/EcommerceAuditor';
import IntroModal from './components/IntroModal';
import { scanProduct, getPresets } from './services/api';
import { saveScanToSupabase } from './services/supabaseService';

export default function App() {
  const [role, setRole] = useState('citizen');
  const [showIntro, setShowIntro] = useState(true); // Startup video & portal pop-up
  const [citizenTab, setCitizenTab] = useState('home'); // 'home', 'search', 'categories', 'bot', 'scan'
  const [scanData, setScanData] = useState(null);
  const [presets, setPresets] = useState([]);
  const [activePreset, setActivePreset] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    getPresets()
      .then(setPresets)
      .catch(() => {
        setPresets([
          { id: 'maggi', name: 'Maggi 2-Minute Noodles 70g', brand: 'Nestle', category: 'Processed Food', concern: 'Palm Oil + MSG', icon: 'noodles' },
          { id: 'coca_cola', name: 'Coca-Cola 500ml', brand: 'Coca-Cola', category: 'Soft Drink', concern: 'Excessive Sugar', icon: 'bottle' },
          { id: 'olive_oil', name: 'Borges Extra Virgin Olive Oil 1L', brand: 'Borges', category: 'Cooking Oil', concern: 'Clean — No Issues', icon: 'bottle' }
        ]);
      });
  }, []);

  const handleScan = useCallback(async ({ imageBase64, preset }) => {
    setScanning(true);
    setError(null);
    setCitizenTab('scan');
    try {
      const data = await scanProduct({ role, imageBase64, preset });
      setScanData(data);
      if (preset) setActivePreset(preset);

      // Asynchronously log scan to Supabase
      saveScanToSupabase(data, role);
    } catch (err) {
      console.error('Scan failed:', err);
      setError('Scan failed. Make sure the backend is running on localhost:8000');
    }
    setScanning(false);
  }, [role]);

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
    setScanData(null);
    setActivePreset(null);
    setCitizenTab('home');
  };

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    setScanData(null);
    setActivePreset(null);
    setCitizenTab('home');
  };

  if (!role) {
    return (
      <div className="min-h-screen bg-oatmeal">
        <RoleSelector onSelect={handleRoleSelect} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-oatmeal text-walnut font-sans flex flex-col selection:bg-terracotta selection:text-white">
      
      {/* Starting Video & Login Portal Pop-up */}
      <IntroModal
        isOpen={showIntro}
        onClose={() => setShowIntro(false)}
        onSelectRole={handleRoleSelect}
      />

      {/* Top Navbar */}
      <Navbar
        role={role}
        onRoleChange={handleRoleChange}
        onReplayIntro={() => setShowIntro(true)}
      />

      {/* Main Responsive Body */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5">
        
        {/* Error Toast */}
        {error && (
          <div className="mb-4 p-3.5 bg-crimson-soft border border-crimson/20 rounded-2xl text-xs text-crimson font-mono font-bold animate-fade flex items-center justify-between">
            <span>⚠️ {error}</span>
            <button onClick={() => setError(null)} className="text-crimson underline ml-2">Dismiss</button>
          </div>
        )}

        {/* Role Content */}
        {role === 'citizen' ? (
          <div>
            {/* Citizen Screen Routing */}
            {citizenTab === 'home' && (
              <CitizenHome 
                onOpenScanner={() => setCitizenTab('scan')}
                onSelectPreset={(id) => {
                  setActivePreset(id);
                  handleScan({ imageBase64: null, preset: id });
                }}
                onNavigateTab={(t) => setCitizenTab(t)}
              />
            )}

            {citizenTab === 'search' && (
              <CitizenSearch
                onOpenScanner={() => setCitizenTab('scan')}
                onSelectPreset={(id) => {
                  setActivePreset(id);
                  handleScan({ imageBase64: null, preset: id });
                }}
              />
            )}

            {citizenTab === 'categories' && (
              <CitizenCategories
                onOpenScanner={() => setCitizenTab('scan')}
                onSelectCategory={(id) => {
                  setActivePreset(id);
                  handleScan({ imageBase64: null, preset: id });
                }}
              />
            )}

            {citizenTab === 'bot' && (
              <CitizenBot />
            )}

            {citizenTab === 'scan' && (
              <CitizenScanView
                scanData={scanData}
                scanning={scanning}
                presets={presets}
                activePreset={activePreset}
                onScan={handleScan}
                onPresetSelect={(id) => setActivePreset(id)}
                onBackToHome={() => setCitizenTab('home')}
              />
            )}

            {/* Floating Mobile Bottom Nav */}
            <BottomNav
              activeTab={citizenTab}
              onSelectTab={(t) => setCitizenTab(t)}
              onOpenScanner={() => setCitizenTab('scan')}
            />
          </div>
        ) : (
          <InspectorView
            scanData={scanData}
            scanning={scanning}
            presets={presets}
            activePreset={activePreset}
            onScan={handleScan}
            onPresetSelect={(id) => setActivePreset(id)}
            onGenerateNotice={() => setShowNoticeModal(true)}
          />
        )}
      </main>

      {/* Show Cause Notice Modal */}
      {showNoticeModal && (
        <NoticeModal
          scanData={scanData}
          onClose={() => setShowNoticeModal(false)}
        />
      )}
    </div>
  );
}

/* ========================================================================= */
/* CITIZEN ACTIVE SCAN VIEW (TRUTHIN ENGINE)                                 */
/* ========================================================================= */
function CitizenScanView({ scanData, scanning, presets, activePreset, onScan, onPresetSelect, onBackToHome }) {
  const health = scanData?.health;
  const ocr = scanData?.ocr_data;

  return (
    <div className="space-y-6 pb-20 animate-fade">
      
      {/* Top Back Nav */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToHome}
          className="text-xs font-bold text-slate hover:text-walnut flex items-center gap-1 bg-white px-3 py-1.5 rounded-full border border-oatmeal-dark shadow-2xs"
        >
          &larr; Back to Explore
        </button>
        <span className="text-[10px] font-mono font-bold text-forest bg-forest-soft px-2.5 py-1 rounded-full">
          TRUTHIN SCANNER ACTIVE
        </span>
      </div>

      {/* Camera / Upload Viewport */}
      <ScannerViewport
        onScan={onScan}
        presets={presets}
        activePreset={activePreset}
        onPresetSelect={onPresetSelect}
        scanning={scanning}
        scanData={scanData}
      />

      {/* OCR Detected Details */}
      {ocr && (
        <div className="bg-white rounded-3xl border border-oatmeal-dark shadow-sm p-5 animate-fade">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-walnut text-sm">Detected Product Details</h3>
            <span className="text-[10px] font-mono font-bold text-forest bg-forest-soft px-2 py-0.5 rounded-md">OCR EXTRACTED</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <InfoChip label="Product" value={ocr.product_name} />
            <InfoChip label="Brand" value={ocr.brand} />
            <InfoChip label="MRP" value={ocr.mrp} mono />
            <InfoChip label="Net Qty" value={ocr.net_quantity} mono />
          </div>
          {ocr.ingredients && ocr.ingredients.length > 0 && (
            <div className="mt-4 pt-3 border-t border-oatmeal-dark/60">
              <p className="text-[10px] text-slate font-mono font-bold uppercase tracking-wider mb-2">Ingredients List</p>
              <div className="flex flex-wrap gap-1.5">
                {ocr.ingredients.map((ing, i) => (
                  <span key={i} className="text-[11px] bg-oatmeal text-walnut px-2.5 py-1 rounded-lg border border-oatmeal-dark">
                    {ing}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Health Score Gauge & Macros */}
      {health && (
        <div className="grid sm:grid-cols-2 gap-4">
          <HealthGauge score={health.health_score} label={health.score_label} />
          <NutritionCard nutrition={health.nutrition_summary} />
        </div>
      )}

      {/* Harmful Ingredient Alerts (Palm oil, Sugar, Additives) */}
      {health && <AdditiveAlerts alerts={health.alerts} />}

      {/* TruthIn Clean Alternatives */}
      {health?.alternatives?.length > 0 && (
        <AlternativesList alternatives={health.alternatives} />
      )}

      {/* Overcharging Grievance CTA */}
      {ocr && <GrievanceButton productName={ocr.product_name} />}
    </div>
  );
}

/* ========================================================================= */
/* GOVERNMENT INSPECTOR VIEW                                                 */
/* ========================================================================= */
function InspectorView({ scanData, scanning, presets, activePreset, onScan, onPresetSelect, onGenerateNotice }) {
  const compliance = scanData?.compliance;
  const scale = scanData?.scale_data;
  const ocr = scanData?.ocr_data;

  return (
    <div className="space-y-6 pb-12 animate-fade">
      
      {/* Inspector Terminal Header */}
      <div className="bg-white rounded-3xl p-4 border border-oatmeal-dark shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-terracotta text-white flex items-center justify-center font-bold text-sm shadow-xs font-mono">
            DoCA
          </div>
          <div>
            <h3 className="text-sm font-bold text-walnut">Inspector Rajesh Kumar</h3>
            <p className="text-[10px] text-slate font-mono">Legal Metrology Dept • Badge #MH-4021</p>
          </div>
        </div>
        <span className="text-[10px] font-mono font-bold bg-forest-soft text-forest px-2.5 py-1 rounded-full border border-forest/20">
          ENFORCEMENT AUTH
        </span>
      </div>

      <ScannerViewport
        onScan={onScan}
        presets={presets}
        activePreset={activePreset}
        onPresetSelect={onPresetSelect}
        scanning={scanning}
        scanData={scanData}
      />

      {ocr && (
        <div className="bg-white rounded-3xl border border-oatmeal-dark shadow-sm p-5 animate-fade">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-walnut text-sm">Principal Display Panel Declarations</h3>
            <span className="text-[10px] font-mono font-bold text-terracotta bg-orange-50 px-2 py-0.5 rounded-md">STATUTORY PDP</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <InfoChip label="Product" value={ocr.product_name} />
            <InfoChip label="Brand" value={ocr.brand} />
            <InfoChip label="MRP" value={ocr.mrp} mono />
            <InfoChip label="Net Qty" value={ocr.net_quantity} mono />
            <InfoChip label="Packing Date" value={ocr.date_of_packing} mono />
            <InfoChip label="Origin" value={ocr.country_of_origin} />
            <InfoChip label="Manufacturer" value={ocr.manufacturer} />
            <InfoChip label="Customer Care" value={ocr.customer_care} mono />
          </div>
        </div>
      )}

      {scale && <ScaleHUD scaleData={scale} />}

      {compliance && <ComplianceCard compliance={compliance} />}

      {scanData && compliance && (
        <button
          onClick={onGenerateNotice}
          className="w-full py-3.5 bg-terracotta hover:bg-terracotta-hover text-white rounded-2xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2"
        >
          <span>⚖️</span>
          <span>Draft & Issue Section 36 Show Cause Notice</span>
        </button>
      )}

      <EcommerceAuditor />
    </div>
  );
}

function InfoChip({ label, value, mono }) {
  return (
    <div className="bg-oatmeal/70 border border-oatmeal-dark rounded-xl px-3 py-2.5">
      <p className="text-[9.5px] text-slate font-mono font-bold uppercase tracking-wider">{label}</p>
      <p className={`text-xs text-walnut font-bold mt-0.5 truncate ${mono ? 'font-mono' : ''}`}>
        {value || '—'}
      </p>
    </div>
  );
}
