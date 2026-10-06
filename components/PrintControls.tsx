'use client';

import React, { useState } from 'react';
import { QuotationData } from '@/types/quotation';
import { Download, Printer, Share2, Check, Loader2, ArrowLeft } from 'lucide-react';

interface Props {
  data: QuotationData;
  onBackToForm?: () => void;
}

export default function PrintControls({ data, onBackToForm }: Props) {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isSharingWhatsApp, setIsSharingWhatsApp] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Helper para generar el PDF completo en formato estricto A4 de alta definición
  const generatePdfBlob = async (): Promise<{ blob: Blob; fileName: string; pdf: any } | null> => {
    const docElement = document.getElementById('quotation-document');
    if (!docElement) return null;

    const html2canvas = (await import('html2canvas')).default;
    const { jsPDF } = await import('jspdf');

    // Forzar ancho estándar A4 (794px ~ 210mm a 96DPI) en el clon y remover transforms
    const canvas = await html2canvas(docElement, {
      scale: 2.5,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      scrollX: 0,
      scrollY: 0,
      windowWidth: 840,
      onclone: (clonedDoc) => {
        const el = clonedDoc.getElementById('quotation-document');
        if (el) {
          el.style.width = '794px';
          el.style.maxWidth = '794px';
          el.style.minWidth = '794px';
          el.style.margin = '0 auto';
          el.style.boxShadow = 'none';
          el.style.transform = 'none';
        }
        const scalers = clonedDoc.querySelectorAll('.pdf-page-scaler, .pdf-page-transform');
        scalers.forEach((s: any) => {
          s.style.width = '794px';
          s.style.transform = 'none';
        });
      },
    });

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidthMm = 210;
    const pageHeightMm = 297;
    const marginMm = 0; // El padding interno de la plantilla maneja los márgenes de seguridad

    const imgHeightMm = (canvas.height * pageWidthMm) / canvas.width;

    if (imgHeightMm <= pageHeightMm) {
      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      pdf.addImage(imgData, 'JPEG', marginMm, marginMm, pageWidthMm, imgHeightMm);
    } else {
      // Paginación si supera 1 hoja
      const pxPerMm = canvas.width / pageWidthMm;
      const pageHeightPx = Math.floor(pageHeightMm * pxPerMm);

      let currentSourceY = 0;
      let isFirstPage = true;

      while (currentSourceY < canvas.height) {
        const sliceHeightPx = Math.min(pageHeightPx, canvas.height - currentSourceY);
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = sliceHeightPx;
        const ctx = pageCanvas.getContext('2d');

        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
          ctx.drawImage(
            canvas,
            0,
            currentSourceY,
            canvas.width,
            sliceHeightPx,
            0,
            0,
            canvas.width,
            sliceHeightPx
          );

          const sliceImgData = pageCanvas.toDataURL('image/jpeg', 0.98);
          const sliceHeightMm = sliceHeightPx / pxPerMm;

          if (!isFirstPage) {
            pdf.addPage();
          }
          pdf.addImage(sliceImgData, 'JPEG', 0, 0, pageWidthMm, sliceHeightMm);
          isFirstPage = false;
        }

        currentSourceY += sliceHeightPx;
      }
    }

    const clientClean = (data.clientName || 'Cliente')
      .replace(/[^a-zA-Z0-9]/g, '_')
      .substring(0, 18);
    const fileName = `Cotizacion_${data.quotationNumber}_${clientClean}.pdf`;
    const blob = pdf.output('blob');

    return { blob, fileName, pdf };
  };

  // Descargar PDF
  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const result = await generatePdfBlob();
      if (!result) {
        alert('No se encontró el documento para compilar.');
        return;
      }
      result.pdf.save(result.fileName);
      showToast('¡Documento PDF de Grupo Leovoltaje descargado con éxito!');
    } catch (err) {
      console.error('Error generando PDF:', err);
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Compartir por WhatsApp
  // Compartir PDF directamente por WhatsApp (únicamente el documento PDF)
  const handleShareWhatsAppPdf = async () => {
    setIsSharingWhatsApp(true);
    try {
      const result = await generatePdfBlob();
      if (!result) {
        alert('No se pudo generar el documento PDF.');
        setIsSharingWhatsApp(false);
        return;
      }

      const { blob, fileName, pdf } = result;
      const pdfFile = new File([blob], fileName, { type: 'application/pdf' });

      // Si el navegador soporta compartir archivos directamente (iOS Safari, Chrome Móvil):
      if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        await navigator.share({
          files: [pdfFile],
          title: fileName,
        });
        showToast('¡Documento PDF enviado para compartir!');
      } else {
        // En computadores de escritorio donde el navegador no soporta Web Share de archivos:
        pdf.save(fileName);
        setTimeout(() => {
          window.open('https://web.whatsapp.com/', '_blank');
        }, 500);
        showToast('PDF descargado. Adjúntalo en el chat de WhatsApp que se acaba de abrir.');
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Error al compartir por WhatsApp:', err);
      }
    } finally {
      setIsSharingWhatsApp(false);
    }
  };

  return (
    <div className="mobile-actions-panel no-print">
      <div className="actions-row-top">
        {onBackToForm && (
          <button
            type="button"
            onClick={onBackToForm}
            className="btn-touch btn-touch-secondary"
          >
            <ArrowLeft size={18} />
            <span>Editar Datos</span>
          </button>
        )}

        <button
          type="button"
          onClick={handleShareWhatsAppPdf}
          disabled={isSharingWhatsApp}
          className="btn-touch btn-touch-whatsapp"
          title="Compartir el documento PDF completo por WhatsApp"
        >
          {isSharingWhatsApp ? (
            <>
              <Loader2 size={18} className="spinner" />
              <span>Preparando...</span>
            </>
          ) : (
            <>
              <Share2 size={18} />
              <span>WhatsApp (PDF)</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => window.print()}
          className="btn-touch btn-touch-secondary desktop-only-inline"
        >
          <Printer size={18} />
          <span>Imprimir</span>
        </button>
      </div>

      <button
        type="button"
        onClick={handleDownloadPdf}
        disabled={isGeneratingPdf}
        className="btn-touch btn-touch-primary"
      >
        {isGeneratingPdf ? (
          <>
            <Loader2 size={20} className="spinner" />
            <span>Compilando PDF A4...</span>
          </>
        ) : (
          <>
            <Download size={20} />
            <span>Descargar PDF Oficial</span>
          </>
        )}
      </button>

      {toastMessage && (
        <div className="share-toast-notification">
          <Check size={15} color="#2e7d32" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
