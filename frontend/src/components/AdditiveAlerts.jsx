import React from 'react';
import { AlertTriangle, AlertCircle, ShieldAlert, Droplets, Wheat, Flame } from 'lucide-react';

const iconMap = {
  palm_oil: Droplets,
  excessive_sugar: Flame,
  banned_additive: ShieldAlert,
  restricted_additive: AlertTriangle,
  excess_sodium: AlertCircle,
  excess_saturated_fat: AlertCircle,
  trans_fat: ShieldAlert
};

const colorMap = {
  high: {
    bg: 'bg-crimson-soft',
    border: 'border-crimson/20',
    icon: 'text-crimson',
    badge: 'bg-crimson text-white'
  },
  medium: {
    bg: 'bg-amber-soft',
    border: 'border-amber/20',
    icon: 'text-amber',
    badge: 'bg-amber text-white'
  },
  low: {
    bg: 'bg-oatmeal',
    border: 'border-oatmeal-dark',
    icon: 'text-slate',
    badge: 'bg-slate text-white'
  }
};

export default function AdditiveAlerts({ alerts }) {
  if (!alerts || alerts.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-oatmeal-dark shadow-sm p-5 animate-slide-up">
        <div className="flex items-center gap-2 mb-2">
          <ShieldAlert size={18} className="text-forest" />
          <h3 className="font-bold text-walnut">Ingredient Safety</h3>
        </div>
        <div className="flex items-center gap-3 p-4 bg-forest-soft rounded-xl">
          <div className="w-10 h-10 bg-forest/10 rounded-lg flex items-center justify-center">
            <span className="text-xl">✅</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-forest">No harmful ingredients detected</p>
            <p className="text-xs text-slate">This product appears to have a clean ingredient profile</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-oatmeal-dark shadow-sm overflow-hidden animate-slide-up">
      <div className="px-5 py-4 border-b border-oatmeal-dark bg-gradient-to-r from-crimson/5 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-crimson" />
            <h3 className="font-bold text-walnut">Harmful Ingredients Detected</h3>
          </div>
          <span className="text-xs font-bold bg-crimson text-white px-2 py-0.5 rounded-full">
            {alerts.length} alert{alerts.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <div className="px-5 py-3 space-y-2">
        {alerts.map((alert, i) => {
          const Icon = iconMap[alert.type] || AlertTriangle;
          const colors = colorMap[alert.severity] || colorMap.medium;

          return (
            <div key={i} className={`${colors.bg} border ${colors.border} rounded-xl p-3.5`}>
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-white/70`}>
                  <Icon size={18} className={colors.icon} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-walnut">{alert.title}</p>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${colors.badge}`}>
                      {alert.severity.toUpperCase()}
                    </span>
                    {alert.code && (
                      <span className="text-[10px] font-mono font-bold text-slate bg-white/70 px-1.5 py-0.5 rounded">
                        {alert.code}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate mt-1 leading-relaxed">{alert.message}</p>
                  {alert.ingredient_position > 0 && (
                    <p className="text-[10px] text-crimson font-medium mt-1">
                      Ingredient #{alert.ingredient_position} in list
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
