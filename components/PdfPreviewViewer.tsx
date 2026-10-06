'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { QuotationData } from '@/types/quotation';
import QuotationDocument from './QuotationDocument';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface Props {
  data: QuotationData;
  isActive?: boolean;
}

const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = 1123;

export default function PdfPreviewViewer({ data, isActive }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [isAutoFit, setIsAutoFit] = useState<boolean>(true);

  // Calcular el factor de escala óptimo según el ancho disponible real
  const calculateFitScale = useCallback(() => {
    if (!containerRef.current) {
      if (typeof window !== 'undefined') {
        const screenW = window.innerWidth;
        const avail = Math.max(280, screenW - (screenW < 768 ? 28 : 64));
        return Math.min(1.05, Math.max(0.25, Number((avail / A4_WIDTH_PX).toFixed(3))));
      }
      return 1;
    }
    const rect = containerRef.current.getBoundingClientRect();
    const width = rect.width > 0 ? rect.width : (typeof window !== 'undefined' ? window.innerWidth : 800);
    const isMobile = (typeof window !== 'undefined' ? window.innerWidth : 800) < 640;
    const safetyMargin = isMobile ? 8 : 16;
    const availableWidth = width - safetyMargin;
    if (availableWidth <= 0) return 1;

    const scale = availableWidth / A4_WIDTH_PX;
    return Math.min(1.05, Math.max(0.25, Number(scale.toFixed(3))));
  }, []);

  // Observador de cambio de tamaño (ResizeObserver)
  // Se activa automáticamente cuando se hace visible la pestaña en móvil o se rota la pantalla
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateScale = () => {
      if (isAutoFit) {
        const fitScale = calculateFitScale();
        if (fitScale > 0) {
          setZoom(fitScale);
        }
      }
    };

    updateScale();

    const resizeObserver = new ResizeObserver(() => {
      updateScale();
    });

    resizeObserver.observe(el);
    window.addEventListener('resize', updateScale);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateScale);
    };
  }, [isAutoFit, calculateFitScale, isActive]);

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
    setZoom((prev) => Math.max(0.25, Number((prev - 0.1).toFixed(2))));
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
