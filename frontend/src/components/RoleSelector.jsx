import React from 'react';
import { Shield, Leaf, ArrowRight, Zap, CheckCircle2, Lock } from 'lucide-react';

export default function RoleSelector({ onSelect }) {
  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-8">
      <div className="max-w-2xl w-full animate-fade">
        
        {/* Logo & Header */}
        <div className="text-center mb-10">
          <div className="w-18 h-18 bg-white border border-oatmeal-dark rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-sm shadow-terracotta/10 group">
            <span className="text-forest font-serif italic font-extrabold text-3xl">B</span>
          </div>
          
          <div className="flex items-center justify-center gap-1.5 leading-none">
            <span className="text-forest font-serif italic font-extrabold text-3xl sm:text-4xl tracking-tight">Bite</span>
            <span className="text-terracotta font-extrabold text-3xl sm:text-4xl tracking-tight">Scan</span>
          </div>
          
          <p className="text-[11px] font-mono font-bold tracking-widest text-slate uppercase mt-2">
            SCAN IT. KNOW IT. EAT SMART.
          </p>

          <p className="text-slate mt-2 text-sm max-w-md mx-auto leading-relaxed">
            AI Automated Legal Metrology (Packaged Commodities) & FSSAI Clean Food Intelligence Platform
          </p>
          <span className="inline-block mt-2 px-3 py-0.5 rounded-full bg-oatmeal-dark/50 text-[10px] font-mono text-slate font-bold">
            SIH PROBLEM ID: SIH26034
          </span>
        </div>

        {/* Dual Role Selector Cards */}
        <div className="grid sm:grid-cols-2 gap-5">
          
          {/* Card 1: Citizen Consumer Mode */}
          <RoleCard
            icon={<Leaf className="text-forest" size={28} />}
            title="Citizen & Consumer Health"
            subtitle="TruthIn Clean Food Advisor"
            description="Scan food packages to reveal hidden sugars, palm oil, restricted E-numbers, and get clean-label substitutes."
            features={[
              '1 to 10 FSSAI Health Rating',
              'Palm Oil & Added Sugar Alarms',
              'TruthIn Clean Alternatives',
              '1-Click MRP Overcharging Grievance'
            ]}
            color="forest"
            badge="PUBLIC ACCESS"
            onClick={() => onSelect('citizen')}
          />

          {/* Card 2: Government Inspector Terminal */}
          <RoleCard
            icon={<Shield className="text-terracotta" size={28} />}
            title="Government Official"
            subtitle="Legal Metrology Terminal"
            description="Physical barcode scale calibration, Legal Metrology PC Rules 2011 audit, and 1-click Show Cause notices."
            features={[
              'Barcode PPM Scale Calibration',
              '6-Clause Statutory Rule Engine',
              'Section 36 Show Cause Notice PDF',
              'E-Commerce Digital PDP URL Crawler'
            ]}
            color="terracotta"
            badge="OFFICIAL ENFORCEMENT"
            onClick={() => onSelect('inspector')}
          />
        </div>

        {/* Footer */}
        <div className="mt-10 text-center">
          <p className="text-xs font-mono text-slate">
            Ministry of Consumer Affairs, Food & Public Distribution • Government of India
          </p>
        </div>
      </div>
    </div>
  );
}

function RoleCard({ icon, title, subtitle, description, features, color, badge, onClick }) {
  const borderColors = {
    forest: 'border-forest/20 hover:border-forest/50 hover:shadow-forest/10 hover:bg-forest-soft/20',
    terracotta: 'border-terracotta/20 hover:border-terracotta/50 hover:shadow-terracotta/10 hover:bg-orange-50/20'
  };
  const iconBgs = {
    forest: 'bg-forest-soft text-forest',
    terracotta: 'bg-orange-50 text-terracotta'
  };
  const badgeColors = {
    forest: 'bg-forest-soft text-forest border-forest/20',
    terracotta: 'bg-orange-50 text-terracotta border-terracotta/20'
  };

  return (
    <button
      onClick={onClick}
      className={`group bg-white rounded-3xl border ${borderColors[color]} p-6 text-left transition-all duration-300 hover:shadow-md cursor-pointer flex flex-col justify-between`}
    >
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 ${iconBgs[color]}`}>
            {icon}
          </div>
          <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border ${badgeColors[color]}`}>
            {badge}
          </span>
        </div>

        <h3 className="text-base font-bold text-walnut">{title}</h3>
        <p className="text-[10px] text-slate font-mono uppercase tracking-wider mb-2 font-bold">{subtitle}</p>
        <p className="text-xs text-slate mb-4 leading-relaxed">{description}</p>

        <ul className="space-y-1.5 mb-6">
          {features.map((f, i) => (
            <li key={i} className="flex items-center gap-2 text-xs text-walnut font-medium">
              <CheckCircle2 size={12} className={color === 'forest' ? 'text-forest shrink-0' : 'text-terracotta shrink-0'} />
              <span className="text-[11.5px]">{f}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className={`flex items-center justify-between pt-3 border-t border-oatmeal-dark/60 text-xs font-bold ${
        color === 'forest' ? 'text-forest' : 'text-terracotta'
      }`}>
        <span>Enter {title.split(' ')[0]} Mode</span>
        <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
      </div>
    </button>
  );
}
