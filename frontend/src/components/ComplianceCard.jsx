import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, Scale } from 'lucide-react';

export default function ComplianceCard({ compliance }) {
  if (!compliance) return null;

  const { checks, compliance_score, violations_count, overall_status } = compliance;

  return (
    <div className="bg-white rounded-2xl border border-oatmeal-dark shadow-sm overflow-hidden animate-slide-up">
      <div className="px-5 py-4 border-b border-oatmeal-dark bg-gradient-to-r from-terracotta/5 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale size={18} className="text-terracotta" />
            <h3 className="font-bold text-walnut">Legal Metrology Compliance</h3>
          </div>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
            overall_status === 'COMPLIANT'
              ? 'bg-forest-soft text-forest'
              : 'bg-crimson-soft text-crimson'
          }`}>
            {overall_status}
          </span>
        </div>
        <p className="text-xs text-slate mt-1">Legal Metrology (Packaged Commodities) Rules, 2011</p>
      </div>

      <div className="px-5 py-4 border-b border-oatmeal-dark">
        <div className="flex items-center gap-4 mb-2">
          <div className="flex-1 bg-oatmeal rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                compliance_score >= 80 ? 'bg-forest' : compliance_score >= 50 ? 'bg-amber' : 'bg-crimson'
              }`}
              style={{ width: `${compliance_score}%` }}
            />
          </div>
          <span className="text-sm font-bold text-walnut font-mono">{compliance_score}%</span>
        </div>
        <div className="flex justify-between text-xs text-slate">
          <span>{checks.length - violations_count} of {checks.length} passed</span>
          <span>{violations_count} violation{violations_count !== 1 ? 's' : ''}</span>
        </div>
      </div>

      <div className="px-5 py-3">
        <p className="text-xs font-semibold text-walnut mb-3 uppercase tracking-wider">Clause Breakdown</p>
        <div className="space-y-2">
          {checks.map((check, i) => (
            <div key={i} className={`flex items-start gap-3 p-2.5 rounded-lg transition-colors ${
              check.passed ? 'bg-forest-soft/30' : 'bg-crimson-soft/30'
            }`}>
              {check.passed ? (
                <CheckCircle size={16} className="text-forest mt-0.5 shrink-0" />
              ) : (
                <XCircle size={16} className="text-crimson mt-0.5 shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold font-mono text-walnut">{check.rule}</span>
                  {!check.passed && check.severity && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      check.severity === 'high' ? 'bg-crimson text-white' : 'bg-amber text-white'
                    }`}>
                      {check.severity.toUpperCase()}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate mt-0.5">{check.description}</p>
                {!check.passed && (
                  <div className="mt-1.5 space-y-0.5">
                    <p className="text-[11px]">
                      <span className="text-slate">Found: </span>
                      <span className="text-crimson font-medium">{check.found}</span>
                    </p>
                    <p className="text-[11px]">
                      <span className="text-slate">Expected: </span>
                      <span className="text-forest font-medium">{check.expected}</span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
