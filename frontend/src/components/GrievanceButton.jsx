import React from 'react';
import { Phone, ExternalLink } from 'lucide-react';

export default function GrievanceButton({ productName }) {
  return (
    <div className="bg-white rounded-2xl border border-oatmeal-dark shadow-sm p-4 animate-slide-up">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-crimson-soft rounded-xl flex items-center justify-center shrink-0">
          <Phone size={18} className="text-crimson" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-walnut">Report Overcharging</p>
          <p className="text-xs text-slate">
            Dual MRP or excessive pricing? File a grievance with the National Consumer Helpline.
          </p>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <a
          href="tel:1915"
          className="flex-1 py-2 bg-crimson text-white rounded-xl text-xs font-bold hover:bg-red-700 transition-colors flex items-center justify-center gap-1.5"
        >
          <Phone size={12} />
          Call #1915
        </a>
        <a
          href="https://consumerhelpline.gov.in"
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 py-2 bg-oatmeal text-walnut rounded-xl text-xs font-semibold hover:bg-oatmeal-dark transition-colors flex items-center justify-center gap-1.5"
        >
          <ExternalLink size={12} />
          Online Portal
        </a>
      </div>
    </div>
  );
}
