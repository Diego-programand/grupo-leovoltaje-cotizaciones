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
  const docWrapRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [isAutoFit, setIsAutoFit] = useState<boolean>(true);
  const [docHeight, setDocHeight] = useState<number>(A4_HEIGHT_PX);

  // Medir la altura real no escalada del documento para evitar vacíos en móvil
  const measureDocHeight = useCallback(() => {
    if (docWrapRef.current) {
      const measured = docWrapRef.current.offsetHeight;
      if (measured > 100) {
        setDocHeight(measured);
      }
    }
  }, []);

  // Calcular el factor de escala óptimo según el ancho disponible real
  const calculateFitScale = useCallback(() => {
    if (!containerRef.current) {
      if (typeof window !== 'undefined') {
        const screenW = window.innerWidth;
        const padding = screenW < 480 ? 16 : (screenW < 768 ? 32 : 48);
        const avail = Math.max(260, screenW - padding);
        return Math.min(1.02, Math.max(0.28, Number((avail / A4_WIDTH_PX).toFixed(3))));
      }
      return 1;
    }
    const rect = containerRef.current.getBoundingClientRect();
    const width = rect.width > 0 ? rect.width : (typeof window !== 'undefined' ? window.innerWidth : 800);
    const isMobile = (typeof window !== 'undefined' ? window.innerWidth : 800) < 640;
    // Margen de seguridad para no provocar barra de scroll horizontal involuntaria
    const safetyMargin = isMobile ? 12 : 20;
    const availableWidth = width - safetyMargin;
    if (availableWidth <= 0) return 1;

    const scale = availableWidth / A4_WIDTH_PX;
    return Math.min(1.02, Math.max(0.28, Number(scale.toFixed(3))));
  }, []);

  // Actualizar escala y altura cuando cambian los datos o la visibilidad de la pestaña
  useEffect(() => {
    measureDocHeight();
  }, [data, measureDocHeight, isActive]);

  useEffect(() => {
    const update = () => {
      measureDocHeight();
      if (isAutoFit) {
        const fitScale = calculateFitScale();
        if (fitScale > 0) {
          setZoom(fitScale);
        }
      }
    };

    update();

    // Re-chequeo con frame diferido por si la pestaña móvil recién conmutó su display
    const raf = requestAnimationFrame(() => {
      update();
    });

    const el = containerRef.current;
    let resizeObserver: ResizeObserver | null = null;
    if (el) {
      resizeObserver = new ResizeObserver(() => {
        update();
      });
      resizeObserver.observe(el);
    }

    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);

    return () => {
      cancelAnimationFrame(raf);
      if (resizeObserver) resizeObserver.disconnect();
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, [isAutoFit, calculateFitScale, measureDocHeight, isActive]);

  const handleToggleAutoFit = () => {
    setIsAutoFit(true);
    const fit = calculateFitScale();
    setZoom(fit);
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
    setZoom((prev) => Math.max(0.28, Number((prev - 0.1).toFixed(2))));
  };

  const scaledWidth = Math.round(A4_WIDTH_PX * zoom);
  const scaledHeight = Math.round(docHeight * zoom);

  return (
    <div className="pdf-viewer-root" ref={containerRef}>
      {/* Barra de herramientas superior del visor con soporte compacto móvil */}
      <div className="pdf-viewer-toolbar no-print">
        <div className="toolbar-group">
          <button
            type="button"
            className={`toolbar-btn ${isAutoFit ? 'toolbar-btn-active' : ''}`}
            onClick={handleToggleAutoFit}
            title="Ajustar al ancho de la pantalla"
          >
            <Maximize2 size={15} />
            <span className="toolbar-btn-text">Ajustar</span>
          </button>

          <button
            type="button"
            className={`toolbar-btn ${!isAutoFit && Math.abs(zoom - 1) < 0.02 ? 'toolbar-btn-active' : ''}`}
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

      {/* Viewport del documento con escalado proporcional y altura exacta calculada */}
      <div className="pdf-viewer-viewport">
        <div
          className="pdf-page-scaler"
          style={{
            width: `${scaledWidth}px`,
            height: `${scaledHeight}px`,
            minHeight: `${scaledHeight}px`,
          }}
        >
          <div
            ref={docWrapRef}
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
