import React, { useState, useEffect } from 'react';
import { Shield, Leaf, Menu, X, Activity, Film } from 'lucide-react';

export default function Navbar({ role, onRoleChange, onReplayIntro }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [backendOnline, setBackendOnline] = useState(true);

  useEffect(() => {
    fetch('/api/v1/dashboard/stats')
      .then(res => setBackendOnline(res.ok))
      .catch(() => setBackendOnline(false));
  }, []);

  return (
    <nav className="bg-white/90 backdrop-blur-md border-b border-oatmeal-dark shadow-2xs sticky top-0 z-50 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Tagline */}
          <div className="flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt="BiteScan Official Logo"
              className="w-10 h-10 object-contain rounded-full drop-shadow-sm hover:scale-105 transition-transform"
            />
            <div>
              <div className="flex items-center gap-1 leading-none">
                <span className="text-forest font-serif italic font-extrabold text-xl tracking-tight">Bite</span>
                <span className="text-terracotta font-extrabold text-xl tracking-tight">Scan</span>
              </div>
              <p className="text-[8.5px] text-slate font-mono font-bold tracking-widest uppercase mt-0.5">
                SCAN IT. KNOW IT. EAT SMART.
              </p>
            </div>
          </div>

          {/* Center/Right: Live System Status & Role Switcher */}
          <div className="hidden md:flex items-center gap-3">
            {onReplayIntro && (
              <button
                onClick={onReplayIntro}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-oatmeal hover:bg-oatmeal-dark border border-oatmeal-dark text-[11px] font-mono font-bold text-walnut transition-all cursor-pointer shadow-2xs hover:scale-105"
                title="Watch App Starting Video & Portal Selector"
              >
                <Film size={13} className="text-terracotta" />
                <span>Intro Video</span>
              </button>
            )}

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-oatmeal border border-oatmeal-dark text-[11px] font-mono text-slate">
              <span className={`w-2 h-2 rounded-full ${backendOnline ? 'bg-forest animate-pulse' : 'bg-amber'}`} />
              <span>{backendOnline ? 'ENGINE READY' : 'OFFLINE MODE'}</span>
            </div>

            <div className="bg-oatmeal p-1 rounded-xl flex items-center gap-1 border border-oatmeal-dark">
              <RoleButton
                active={role === 'citizen'}
                onClick={() => onRoleChange('citizen')}
                icon={<Leaf size={14} />}
                label="Citizen Health"
                variant="forest"
              />
              <RoleButton
                active={role === 'inspector'}
                onClick={() => onRoleChange('inspector')}
                icon={<Shield size={14} />}
                label="Gov Inspector"
                variant="terracotta"
              />
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${backendOnline ? 'bg-forest' : 'bg-amber'}`} />
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-xl text-walnut bg-oatmeal border border-oatmeal-dark hover:bg-oatmeal-dark transition-colors"
            >
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {menuOpen && (
        <div className="md:hidden border-t border-oatmeal-dark bg-white px-4 py-3 space-y-2 animate-fade">
          <RoleButton
            active={role === 'citizen'}
            onClick={() => { onRoleChange('citizen'); setMenuOpen(false); }}
            icon={<Leaf size={14} />}
            label="Citizen Health Mode"
            variant="forest"
            full
          />
          <RoleButton
            active={role === 'inspector'}
            onClick={() => { onRoleChange('inspector'); setMenuOpen(false); }}
            icon={<Shield size={14} />}
            label="Government Inspector Terminal"
            variant="terracotta"
            full
          />
        </div>
      )}
    </nav>
  );
}

function RoleButton({ active, onClick, icon, label, variant, full }) {
  const styles = {
    forest: active
      ? 'bg-forest text-white shadow-xs font-bold'
      : 'text-walnut hover:bg-forest-soft/60',
    terracotta: active
      ? 'bg-terracotta text-white shadow-xs font-bold'
      : 'text-walnut hover:bg-orange-50/60'
  };

  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs transition-all flex items-center justify-center gap-1.5 ${styles[variant]} ${
        full ? 'w-full py-2.5 justify-center' : ''
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
