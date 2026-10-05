'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { QuotationData } from '@/types/quotation';
import QuotationDocument from './QuotationDocument';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface Props {
  data: QuotationData;
}

const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = 1123;

export default function PdfPreviewViewer({ data }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [isAutoFit, setIsAutoFit] = useState<boolean>(true);

  // Calcular el factor de escala óptimo según el ancho disponible
  const calculateFitScale = useCallback(() => {
    if (!containerRef.current) return 1;
    // Margen lateral de seguridad (32px total)
    const availableWidth = containerRef.current.clientWidth - 32;
    if (availableWidth <= 0) return 1;

    // Si la pantalla es pequeña (móvil/tablet), ajustar al ancho exacto disponible
    // Si la pantalla es muy ancha, limitar a máximo 1.1x para no desbordar
    const scale = availableWidth / A4_WIDTH_PX;
    return Math.min(1.05, Math.max(0.3, Number(scale.toFixed(3))));
  }, []);

  // Ajustar escala al montar y al redimensionar la ventana
  useEffect(() => {
    const handleResize = () => {
      if (isAutoFit) {
        const fitScale = calculateFitScale();
        setZoom(fitScale);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isAutoFit, calculateFitScale]);

  // Al cambiar datos (o cambiar pestaña), reevaluar auto-fit
  useEffect(() => {
    if (isAutoFit) {
      // Pequeño retardo para asegurar que el DOM calculó clientWidth
      const timer = setTimeout(() => {
        setZoom(calculateFitScale());
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isAutoFit, calculateFitScale]);

  const handleToggleAutoFit = () => {
    setIsAutoFit(true);
    setZoom(calculateFitScale());
  };

  const handleSet100 = () => {
    setIsAutoFit(false);
    setZoom(1);
  };

  const handleZoomIn = () => {
    setIsAutoFit(false);
    setZoom((prev) => Math.min(1.6, Number((prev + 0.1).toFixed(2))));
  };

  const handleZoomOut = () => {
    setIsAutoFit(false);
    setZoom((prev) => Math.max(0.3, Number((prev - 0.1).toFixed(2))));
  };

  return (
    <div className="pdf-viewer-root" ref={containerRef}>
      {/* Barra de herramientas flotante / superior del visor */}
      <div className="pdf-viewer-toolbar no-print">
        <div className="toolbar-group">
          <button
            type="button"
            className={`toolbar-btn ${isAutoFit ? 'toolbar-btn-active' : ''}`}
            onClick={handleToggleAutoFit}
            title="Ajustar al ancho de la pantalla"
          >
            <Maximize2 size={15} />
            <span>Ajustar ancho</span>
          </button>

          <button
            type="button"
            className={`toolbar-btn ${!isAutoFit && zoom === 1 ? 'toolbar-btn-active' : ''}`}
            onClick={handleSet100}
            title="Ver en escala real 100%"
          >
            <span>100%</span>
          </button>
        </div>

        <div className="toolbar-group zoom-stepper">
          <button
            type="button"
            className="toolbar-icon-btn"
            onClick={handleZoomOut}
            disabled={zoom <= 0.3}
            title="Reducir escala"
            aria-label="Reducir escala"
          >
            <ZoomOut size={16} />
          </button>

          <span className="zoom-percentage-badge">
            {Math.round(zoom * 100)}%
          </span>

          <button
            type="button"
            className="toolbar-icon-btn"
            onClick={handleZoomIn}
            disabled={zoom >= 1.6}
            title="Aumentar escala"
            aria-label="Aumentar escala"
          >
            <ZoomIn size={16} />
          </button>
        </div>
      </div>

      {/* Viewport del documento con escalado proporcional determinista */}
      <div className="pdf-viewer-viewport">
        <div
          className="pdf-page-scaler"
          style={{
            width: `${Math.round(A4_WIDTH_PX * zoom)}px`,
            minHeight: `${Math.round(A4_HEIGHT_PX * zoom)}px`,
          }}
        >
          <div
            className="pdf-page-transform"
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'top left',
              width: `${A4_WIDTH_PX}px`,
            }}
          >
            <QuotationDocument data={data} />
          </div>
        </div>
      </div>
    </div>
  );
}
