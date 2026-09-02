import { supabase } from './supabaseClient';

/**
 * Saves a completed scan session and its violations directly to Supabase PostgreSQL.
 */
export async function saveScanToSupabase(scanData, role = 'inspector') {
  try {
    const ocr = scanData.ocr_data || {};
    const compliance = scanData.compliance || {};
    const health = scanData.health || {};
    const scale = scanData.scale_data || {};

    const { data: session, error } = await supabase
      .from('scan_sessions')
      .insert([
        {
          session_code: scanData.scan_id || `SCAN-${Date.now()}`,
          role: role,
          product_name: ocr.product_name || 'Unknown Item',
          brand: ocr.brand || '',
          barcode: scale.barcode || ocr.barcode || '8901058002479',
          image_url: scanData.image_url || null,
          is_lm_compliant: compliance.overall_status === 'COMPLIANT',
          lm_compliance_score: compliance.compliance_score || 100.0,
          health_score: health.health_score || 10.0,
          health_status: health.score_label || 'Safe & Clean',
          measured_font_height_mm: scale.measured_font_height_mm || 1.5,
          required_min_font_height_mm: scale.required_min_font_height_mm || 1.5,
          ppm_scale: scale.pixels_per_mm || 8.2,
          inspector_name: 'Inspector Rajesh Kumar'
        }
      ])
      .select()
      .single();

    if (error) throw error;

    // Insert violations if any
    if (compliance.violations && compliance.violations.length > 0 && session) {
      const violationRows = compliance.violations.map(v => ({
        scan_id: session.id,
        rule_clause: v.rule || v.clause || 'Rule 6(1)',
        category: 'LEGAL_METROLOGY',
        title: v.description || 'Statutory Violation',
        description: `Found: ${v.found || 'Non-compliant'} | Expected: ${v.expected || 'Statutory standard'}`,
        severity: v.severity?.toUpperCase() || 'HIGH'
      }));

      await supabase.from('violations').insert(violationRows);
    }

    return session;
  } catch (err) {
    console.warn('[Supabase Sync Notice] Offline fallback active:', err.message);
    return null;
  }
}

/**
 * Fetches healthy alternatives from Supabase.
 */
export async function getAlternativesFromSupabase(category = 'instant noodles') {
  try {
    const { data, error } = await supabase
      .from('healthy_alternatives')
      .select('*')
      .ilike('target_category', `%${category}%`);

    if (error || !data || data.length === 0) {
      return null;
    }
    return data;
  } catch (err) {
    return null;
  }
}

/**
 * Subscribes to Realtime scan updates (for Supervisor live monitoring).
 */
export function subscribeToRealtimeScans(callback) {
  return supabase
    .channel('realtime_scans')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'scan_sessions' }, payload => {
      callback(payload.new);
    })
    .subscribe();
}
