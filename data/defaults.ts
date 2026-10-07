import { QuotationData, QuotationItem } from '@/types/quotation';

export const OFFICIAL_COMPANY_INFO = {
  name: process.env.NEXT_PUBLIC_COMPANY_NAME || 'Grupo Leovoltaje',
  sub: process.env.NEXT_PUBLIC_COMPANY_SUB || 'Servicios eléctricos',
  web: process.env.NEXT_PUBLIC_COMPANY_WEB || 'grupoleovoltaje.com',
  email: process.env.NEXT_PUBLIC_ADMIN_EMAIL || process.env.NEXT_PUBLIC_COMPANY_EMAIL || 'contacto@grupoleovoltaje.com',
  phone: process.env.NEXT_PUBLIC_ADMIN_PHONE || process.env.NEXT_PUBLIC_COMPANY_PHONE || '+57 300 000 0000',
  adminName: process.env.NEXT_PUBLIC_ADMIN_NAME || 'Administrador General',
  adminRole: process.env.NEXT_PUBLIC_ADMIN_ROLE || 'Administrador',
  logoUrl: process.env.NEXT_PUBLIC_LOGO_URL || '/favicon.svg',
  signatureUrl: process.env.NEXT_PUBLIC_SIGNATURE_URL || '/firma_admin.png',
};

export function getTodayDateString(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const STORAGE_KEY_CONSECUTIVE = 'leovoltaje_consecutive_num';

export function formatConsecutive(num: number | string): string {
  const clean = String(num).replace(/\D/g, '');
  const parsed = parseInt(clean, 10);
  if (isNaN(parsed) || parsed < 1) return 'COT-001';
  return `COT-${String(parsed).padStart(3, '0')}`;
}

export function parseConsecutiveNumber(cotStr: string): number {
  const clean = String(cotStr).replace(/\D/g, '');
  const parsed = parseInt(clean, 10);
  return isNaN(parsed) || parsed < 1 ? 1 : parsed;
}

export function generateQuotationNumber(): string {
  const current = getStoredConsecutive() || 1;
  return formatConsecutive(current);
}

export function getStoredConsecutive(): number | null {
  if (typeof window === 'undefined') return null;
  try {
    const val = localStorage.getItem(STORAGE_KEY_CONSECUTIVE);
    if (!val) return null;
    const parsed = parseInt(val, 10);
    return isNaN(parsed) || parsed < 1 ? null : parsed;
  } catch {
    return null;
  }
}

export function setStoredConsecutive(num: number): void {
  if (typeof window === 'undefined') return;
  try {
    const valid = Math.max(1, Math.floor(num));
    localStorage.setItem(STORAGE_KEY_CONSECUTIVE, String(valid));
  } catch { }
}

export function createEmptyItem(text: string = ''): QuotationItem {
  return {
    id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    description: text,
  };
}

export function createNewQuotation(customNumber?: string): QuotationData {
  const finalNumber = customNumber || (getStoredConsecutive() ? formatConsecutive(getStoredConsecutive()!) : 'COT-001');
  return {
    quotationNumber: finalNumber,
    date: getTodayDateString(),

    companyName: OFFICIAL_COMPANY_INFO.name,
    companySub: OFFICIAL_COMPANY_INFO.sub,
    companyWeb: OFFICIAL_COMPANY_INFO.web,
    adminName: OFFICIAL_COMPANY_INFO.adminName,
    adminEmail: OFFICIAL_COMPANY_INFO.email,
    adminPhone: OFFICIAL_COMPANY_INFO.phone,
    adminRole: OFFICIAL_COMPANY_INFO.adminRole,
    logoUrl: OFFICIAL_COMPANY_INFO.logoUrl,
    signatureUrl: OFFICIAL_COMPANY_INFO.signatureUrl,

    clientName: '',
    clientPhone: '',
    clientNit: '',

    items: [
      createEmptyItem('Adecuación, suministro y tendido de acometida eléctrica principal trifásica bajo norma técnica NTC 2050.'),
      createEmptyItem('Instalación y conexionado de tablero general de distribución con protecciones termomagnéticas.'),
    ],

    totalPrice: 2850000,
  };
}

export const INITIAL_QUOTATION: QuotationData = createNewQuotation();

