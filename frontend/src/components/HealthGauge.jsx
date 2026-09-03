import React from 'react';

export default function HealthGauge({ score, label }) {
  const numScore = typeof score === 'number' ? score : (!isNaN(parseFloat(score)) ? parseFloat(score) : 0);
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.max(0, Math.min(100, (numScore / 10) * 100));
  const offset = circumference - (percentage / 100) * circumference;

  const getColor = (s) => {
    if (s >= 8.0) return { stroke: '#5B7038', bg: '#EBF0DE', text: 'text-forest' };
    if (s >= 5.0) return { stroke: '#D97706', bg: '#FEF3C7', text: 'text-amber' };
    return { stroke: '#DC2626', bg: '#FEE2E2', text: 'text-crimson' };
  };

  const colors = getColor(numScore);

  return (
    <div className="bg-white rounded-2xl border border-oatmeal-dark shadow-sm p-6 flex flex-col items-center animate-slide-up">
      <h3 className="text-sm font-bold text-walnut mb-4">FSSAI Health & Safety Score</h3>

      <div className="relative w-32 h-32">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle
            cx="50" cy="50" r={radius}
            fill="none"
            stroke="#F7F4EE"
            strokeWidth="8"
          />
          <circle
            cx="50" cy="50" r={radius}
            fill="none"
            stroke={colors.stroke}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="animate-gauge transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-3xl font-extrabold font-mono ${colors.text}`}>
            {numScore > 0 ? numScore.toFixed(1) : '—'}
          </span>
          <span className="text-[10px] text-slate font-medium">/ 10.0</span>
        </div>
      </div>

      <div className={`mt-3 px-3 py-1 rounded-full text-xs font-bold ${colors.text}`} style={{ backgroundColor: colors.bg }}>
        {label || (numScore >= 8.0 ? 'Excellent' : numScore >= 5.0 ? 'Moderate' : numScore >= 3.0 ? 'Poor' : 'Harmful')}
      </div>

      <div className="mt-4 w-full">
        <div className="flex justify-between text-[10px] text-slate mb-1">
          <span>Harmful</span>
          <span>Poor</span>
          <span>Moderate</span>
          <span>Good</span>
          <span>Excellent</span>
        </div>
        <div className="h-1.5 rounded-full bg-gradient-to-r from-crimson via-amber to-forest" />
      </div>
    </div>
  );
}
