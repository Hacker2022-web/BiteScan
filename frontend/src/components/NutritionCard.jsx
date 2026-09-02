import React from 'react';

export default function NutritionCard({ nutrition }) {
  if (!nutrition) return null;

  const items = [
    { label: 'Energy', value: nutrition.energy_kcal, unit: 'kcal', max: 500, color: 'terracotta' },
    { label: 'Sugar', value: nutrition.sugar_g, unit: 'g', max: 15, color: 'crimson' },
    { label: 'Fat', value: nutrition.fat_g, unit: 'g', max: 30, color: 'amber' },
    { label: 'Sat. Fat', value: nutrition.saturated_fat_g, unit: 'g', max: 10, color: 'crimson' },
    { label: 'Trans Fat', value: nutrition.trans_fat_g, unit: 'g', max: 0.5, color: 'crimson' },
    { label: 'Sodium', value: nutrition.sodium_mg, unit: 'mg', max: 1500, color: 'amber' },
    { label: 'Protein', value: nutrition.protein_g, unit: 'g', max: 20, color: 'forest' },
    { label: 'Fiber', value: nutrition.fiber_g, unit: 'g', max: 10, color: 'forest' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-oatmeal-dark shadow-sm overflow-hidden animate-slide-up">
      <div className="px-5 py-3 border-b border-oatmeal-dark">
        <h3 className="font-bold text-walnut text-sm">Nutrition per 100g</h3>
      </div>
      <div className="px-5 py-3 grid grid-cols-2 gap-2">
        {items.map((item, i) => {
          const pct = Math.min((item.value / item.max) * 100, 100);
          const barColor = item.color === 'forest' ? 'bg-forest' :
                          item.color === 'crimson' ? 'bg-crimson' :
                          item.color === 'amber' ? 'bg-amber' : 'bg-terracotta';

          return (
            <div key={i} className="flex items-center gap-2">
              <span className="text-[10px] text-slate w-14 shrink-0">{item.label}</span>
              <div className="flex-1 bg-oatmeal rounded-full h-1.5 overflow-hidden">
                <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
              </div>
              <span className="text-[10px] font-mono font-bold text-walnut w-12 text-right">
                {item.value}{item.unit}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
