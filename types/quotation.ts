export interface QuotationItem {
  id: string;
  description: string;
}

export interface QuotationData {
  quotationNumber: string;
  date: string;

  // Emisor (Oficial Grupo Leovoltaje)
  companyName: string;
  companySub: string;
  companyWeb: string;
  adminName: string;
  adminEmail: string;
  adminPhone: string;
  adminRole: string;
  logoUrl: string;
  signatureUrl: string;

  // Cliente / Receptor
  clientName: string;
  clientPhone: string;
  clientNit: string;

  // Partidas Técnicas (Alcance)
  items: QuotationItem[];

  // Cierre Económico (Modelo Llave en Mano / Precio Global)
  totalPrice: number;

  // Notas
  introText?: string;
  closingNote?: string;
}
