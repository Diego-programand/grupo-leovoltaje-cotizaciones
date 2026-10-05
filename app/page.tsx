'use client';

import React, { useState, useEffect } from 'react';
import QuotationForm from '@/components/QuotationForm';
import PdfPreviewViewer from '@/components/PdfPreviewViewer';
import PrintControls from '@/components/PrintControls';
import AuthGuard from '@/components/AuthGuard';
import ConsecutiveModal from '@/components/ConsecutiveModal';
import {
  INITIAL_QUOTATION,
  createNewQuotation,
  formatConsecutive,
  parseConsecutiveNumber,
  getStoredConsecutive,
  setStoredConsecutive,
  getTodayDateString,
} from '@/data/defaults';
import { QuotationData } from '@/types/quotation';
import { RotateCcw, Edit3, Eye, LogOut, Zap } from 'lucide-react';

export default function HomePage() {
  const [quotation, setQuotation] = useState<QuotationData>(INITIAL_QUOTATION);
  const [activeTab, setActiveTab] = useState<'form' | 'preview'>('form');
  const [logoutTrigger, setLogoutTrigger] = useState<(() => void) | null>(null);
  const [isInitialConsecutiveModalOpen, setIsInitialConsecutiveModalOpen] = useState(false);

  useEffect(() => {
    const saved = getStoredConsecutive();
    if (!saved) {
      // Si el dispositivo (celular o navegador) no tiene consecutivo guardado, se pregunta únicamente el número
      setIsInitialConsecutiveModalOpen(true);
    } else {
      setQuotation((prev) => ({
        ...prev,
        quotationNumber: formatConsecutive(saved),
        date: getTodayDateString(),
      }));
    }
  }, []);

  const handleSaveInitialConsecutive = (num: number) => {
    setStoredConsecutive(num);
    setQuotation((prev) => ({
      ...prev,
      quotationNumber: formatConsecutive(num),
      date: getTodayDateString(),
    }));
    setIsInitialConsecutiveModalOpen(false);
  };

  const handleReset = () => {
    const currentNum = parseConsecutiveNumber(quotation.quotationNumber);
    const nextNum = currentNum + 1;
    if (confirm(`¿Crear una nueva cotización? Se asignará el consecutivo ${formatConsecutive(nextNum)}.`)) {
      setStoredConsecutive(nextNum);
      setQuotation(createNewQuotation(formatConsecutive(nextNum)));
      setActiveTab('form');
    }
  };

  const handleLogout = () => {
    if (confirm('¿Deseas cerrar la sesión administrativa?')) {
      if (logoutTrigger) {
        logoutTrigger();
      }
    }
  };

  return (
    <AuthGuard onLogoutReady={(fn) => setLogoutTrigger(() => fn)}>
      <div className="app-shell">
        {/* Barra Superior Corporativa */}
        <header className="main-nav no-print">
          <div className="nav-brand">
            <div className="nav-logo-box">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/favicon.svg"
                alt="Grupo Leovoltaje"
                className="nav-logo-img"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const fb = e.currentTarget.parentElement?.querySelector('.nav-logo-fallback') as HTMLElement;
                  if (fb) fb.style.display = 'block';
                }}
              />
              <Zap size={20} color="#E5A93C" className="nav-logo-fallback" style={{ display: 'none' }} />
            </div>
            <div className="nav-brand-titles">
              <span className="nav-brand-title">Grupo Leovoltaje</span>
              <span className="nav-brand-sub">Servicios eléctricos • grupoleovoltaje.com</span>
            </div>
          </div>

          {/* Selector de Pestaña para Móvil */}
          <div className="nav-mobile-tabs">
            <button
              type="button"
              className={`tab-btn ${activeTab === 'form' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('form')}
            >
              <Edit3 size={16} />
              <span>Datos</span>
            </button>
            <button
              type="button"
              className={`tab-btn ${activeTab === 'preview' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('preview')}
            >
              <Eye size={16} />
              <span>Ver PDF</span>
            </button>
          </div>

          <div className="nav-actions">
            <button
              type="button"
              onClick={handleReset}
              className="btn-icon-nav"
              title="Nueva Cotización"
              aria-label="Nueva Cotización"
            >
              <RotateCcw size={18} />
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="btn-icon-nav btn-icon-logout"
              title="Cerrar Sesión"
              aria-label="Cerrar Sesión"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {/* Layout Dividido / Responsive */}
        <main className="main-split-area">
          <div className={`col-form ${activeTab === 'form' ? 'show-on-mobile' : 'hide-on-mobile'}`}>
            <QuotationForm
              data={quotation}
              onChange={setQuotation}
              onGoToPreview={() => {
                setActiveTab('preview');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </div>

          <div className={`col-preview ${activeTab === 'preview' ? 'show-on-mobile' : 'hide-on-mobile'}`}>
            <PrintControls
              data={quotation}
              onBackToForm={() => {
                setActiveTab('form');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
            <PdfPreviewViewer data={quotation} />
          </div>
        </main>

        {/* Modal inicial para dispositivos sin consecutivo previo */}
        <ConsecutiveModal
          isOpen={isInitialConsecutiveModalOpen}
          isInitialSetup={true}
          initialValue={1}
          onSave={handleSaveInitialConsecutive}
        />
      </div>
    </AuthGuard>
  );
}
