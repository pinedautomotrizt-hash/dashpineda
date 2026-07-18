import { BILLING_AREAS } from '../config/billingRules';

export function resolveBillingArea(row, advisorConfig = []) {
  if (row.area) return row.area;
  const advisor = String(row.asesor || '').trim().toUpperCase();
  const local = String(row.local_nombre || '').trim().toUpperCase();
  const match = advisorConfig.find((item) => (
    String(item.nombre_origen || '').trim().toUpperCase() === advisor
    && String(item.local_nombre || '').trim().toUpperCase() === local
  ));
  return match?.area_codigo || BILLING_AREAS.unclassified;
}
