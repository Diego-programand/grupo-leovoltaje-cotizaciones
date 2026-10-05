'use client';

import React from 'react';
import { QuotationData } from '@/types/quotation';

interface Props {
  data: QuotationData;
}

export function formatCOP(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatFormalDate(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) return dateStr;

  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function QuotationDocument({ data }: Props) {
  const isNitProvided = Boolean(data.clientNit && data.clientNit.trim().length > 0);
  const formalDate = formatFormalDate(data.date);
  const items = data.items && data.items.length > 0 ? data.items : [];

  return (
    <div id="quotation-document" className="a4-sheet doc-canvas">
      {/* Contenido superior y cuerpo fluido */}
      <div className="document-flow">
        {/* 1. ENCABEZADO / HEADER */}
        <header className="header-section">
          <div className="brand-identity">
            <div className="brand-logo-container" data-field="logo_empresa_container">
              {/* Logotipo oficial de Grupo Leovoltaje */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={data.logoUrl || '/favicon.svg'}
                alt="Grupo Leovoltaje"
                className="brand-logo-img"
                data-field="logo_empresa"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const fb = e.currentTarget.parentElement?.querySelector('.brand-logo-fallback') as HTMLElement;
                  if (fb) fb.style.display = 'block';
                }}
              />
              <svg className="brand-logo-fallback" viewBox="0 0 40 40" style={{ display: 'none' }} aria-hidden="true">
                <path d="M20 4L23 14H29L21 24H26L15 36L18 22H12L20 4Z" fill="#E5A93C" />
                <path
                  d="M7 12C9 8 14 5 20 5C26 5 31 8 33 12C35 16 35 22 31 28C28 32 24 35 20 35C16 35 12 32 9 28C5 22 5 16 7 12Z"
                  stroke="#FFFFFF"
                  strokeWidth="1.8"
                  fill="none"
                  opacity="0.85"
                />
              </svg>
            </div>
            <div className="brand-text">
              <h1 className="brand-name">Grupo</h1>
              <h1 className="brand-name">Leovoltaje</h1>
              <span className="brand-web">grupoleovoltaje.com</span>
            </div>
          </div>

          <div className="quotation-badge-card">
            <h2 className="quotation-main-title">COTIZACIÓN</h2>
            <div className="quotation-meta-grid">
              <span className="meta-label">No. Cotización:</span>
              <span className="meta-val" id="field-quotation-number" data-field="consecutivo_cotizacion">
                {data.quotationNumber}
              </span>

              <span className="meta-label">Fecha de Emisión:</span>
              <span className="meta-val" id="field-quotation-date" data-field="fecha_cotizacion">
                {formalDate || data.date}
              </span>
            </div>
          </div>
        </header>

        {/* 2. BLOQUE DE ENTIDADES (EMISOR Y RECEPTOR) */}
        <section className="entities-section">
          {/* Emisor (Grupo Leovoltaje) */}
          <article className="entity-card" id="card-issuer" data-field="emisor_container">
            <div className="entity-header">Emisor</div>
            <div className="entity-row">
              <span className="entity-label">Atención:</span>
              <span className="entity-value" id="field-issuer-name" data-field="nombre_administrador">
                {data.adminName || 'Administrador'}
              </span>
            </div>
            <div className="entity-row">
              <span className="entity-label">Correo:</span>
              <span className="entity-value" id="field-issuer-email" data-field="correo_administrador">
                {data.adminEmail || 'contacto@grupoleovoltaje.com'}
              </span>
            </div>
            <div className="entity-row">
              <span className="entity-label">Teléfono:</span>
              <span className="entity-value" id="field-issuer-phone" data-field="telefono_administrador">
                {data.adminPhone || '+57 300 000 0000'}
              </span>
            </div>
          </article>

          {/* Receptor (Cliente) */}
          <article className="entity-card" id="card-client" data-field="receptor_container">
            <div className="entity-header">Cliente</div>
            <div className="entity-row">
              <span className="entity-label">Nombre:</span>
              <span className="entity-value" id="field-client-name" data-field="nombre_cliente">
                {data.clientName || 'Cliente'}
              </span>
            </div>
            <div className="entity-row">
              <span className="entity-label">Teléfono:</span>
              <span className="entity-value" id="field-client-phone" data-field="telefono_cliente">
                {data.clientPhone || 'No registrado'}
              </span>
            </div>
            {isNitProvided && (
              <div className="entity-row" id="field-client-nit-row" data-field="nit_cliente_container">
                <span className="entity-label">NIT / C.C.:</span>
                <span className="entity-value" id="field-client-nit" data-field="nit_cliente">
                  {data.clientNit}
                </span>
              </div>
            )}
          </article>
        </section>

        {/* 3. TEXTO INTRODUCTORIO FORMAL (CONCISO) */}
        <section className="intro-section" data-field="introduccion_container">
          <p className="intro-paragraph">
            Agradecemos su interés en <strong>Grupo Leovoltaje</strong>. Ponemos a su disposición la presente propuesta técnica y económica conforme al consecutivo <strong>{data.quotationNumber}</strong> emitido el <strong>{formalDate || data.date}</strong>.
          </p>
        </section>

        {/* 4. TABLA DE COTIZACIÓN (COLUMNA ÚNICA AL 100% - DESCRIPCIÓN) */}
        <section className="table-container">
          <table className="quotation-table" aria-label="Descripción de Labores Cotizadas">
            <thead>
              <tr>
                <th scope="col">DESCRIPCIÓN</th>
              </tr>
            </thead>

            <tbody id="field-items-body" data-field="items_container">
              {items.map((item, idx) => (
                <tr key={item.id || idx} className="item-row" data-field="item_row">
                  <td className="td-item-desc" data-field="item_descripcion">
                    <div className="item-desc-cell">
                      <span className="item-bullet">›</span>
                      <div className="item-desc-text">{item.description}</div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>

            {/* FRANJA DE CIERRE / TOTAL CONSOLIDADO */}
            <tfoot>
              <tr className="total-row" data-field="total_container">
                <td>
                  <div className="total-banner">
                    <span className="total-label">TOTAL</span>
                    <div className="total-value-wrapper">
                      <span id="field-total-value" data-field="valor_total">
                        {formatCOP(data.totalPrice)} COP
                      </span>
                    </div>
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        </section>

        {/* Mensaje de Cierre Breve */}
        <p className="closing-note" data-field="nota_cierre">
          Quedamos a su entera disposición para resolver cualquier duda o ajustar detalles técnicos. Para una atención inmediata, puede contactarnos directamente a nuestros canales de atención. Cualquier medio de comunicacion no especificado en este documento, por favor consideralo no válido.
        </p>
      </div>

      {/* CONTENEDOR INFERIOR: FIRMA Y FOOTER */}
      <div className="document-footer-block">
        {/* 5. BLOQUE DE FIRMA DEL ADMINISTRADOR */}
        <section className="closing-section">
          <div className="signature-container" data-field="firma_container">
            <div className="signature-image-box">
              {/* Firma gráfica digitalizada del administrador */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={data.signatureUrl || '/firma-admin.svg'}
                alt="Firma Administrador"
                className="signature-img"
                data-field="firma_administrador"
                onError={(e) => {
                  e.currentTarget.style.visibility = 'hidden';
                }}
              />
            </div>
            <div className="signature-line"></div>
            <span className="signature-name" id="field-signature-name" data-field="nombre_administrador">
              {data.adminName || 'Administrador'}
            </span>
            <span className="signature-role">{data.adminRole || 'Administrador'}</span>
            <span className="signature-company">Grupo Leovoltaje</span>
          </div>
        </section>

        {/* 6. FOOTER INSTITUCIONAL DEL DOCUMENTO */}
        <footer className="footer-section">
          <div className="footer-left">
            <strong>Grupo Leovoltaje</strong> • Servicios eléctricos
          </div>
          <div className="footer-right">
            <strong>grupoleovoltaje.com</strong> • Documento emitido electrónicamente
          </div>
        </footer>
      </div>
    </div>
  );
}
