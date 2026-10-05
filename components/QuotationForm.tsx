'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { QuotationData, QuotationItem } from '@/types/quotation';
import {
  formatConsecutive,
  parseConsecutiveNumber,
  setStoredConsecutive,
  createEmptyItem,
} from '@/data/defaults';
import { formatCOP } from './QuotationDocument';
import ConsecutiveModal from './ConsecutiveModal';
import {
  User,
  Zap,
  Plus,
  Trash2,
  Calendar,
  DollarSign,
  Edit3,
  ArrowRight,
} from 'lucide-react';

interface Props {
  data: QuotationData;
  onChange: (newData: QuotationData) => void;
  onGoToPreview?: () => void;
}

function formatShortDate(dateStr: string): string {
  if (!dateStr) return 'Elegir fecha';
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) return dateStr;

  const today = new Date();
  const isToday =
    today.getFullYear() === year &&
    today.getMonth() === month - 1 &&
    today.getDate() === day;

  const monthNames = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
  ];

  if (isToday) return `Hoy (${day} ${monthNames[month - 1]})`;
  return `${day} ${monthNames[month - 1]} ${year}`;
}

/**
 * Textarea autoajustable que nunca corta el contenido.
 * Se adapta de inmediato a cualquier longitud de texto.
 */
function AutoResizeTextarea({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = '0px';
      // Extra 8px buffer so line-height and letter descenders are never clipped
      const scrollH = el.scrollHeight;
      el.style.height = `${Math.max(54, scrollH + 8)}px`;
    }
  }, []);

  useEffect(() => {
    adjustHeight();
    if (typeof document !== 'undefined' && 'fonts' in document) {
      document.fonts.ready.then(adjustHeight);
    }
    window.addEventListener('resize', adjustHeight);
    return () => window.removeEventListener('resize', adjustHeight);
  }, [value, adjustHeight]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      placeholder={placeholder}
      className={className}
      rows={1}
      style={{ overflow: 'hidden', resize: 'none' }}
      onChange={(e) => {
        onChange(e.target.value);
        adjustHeight();
      }}
    />
  );
}

export default function QuotationForm({ data, onChange, onGoToPreview }: Props) {
  const [isConsecutiveModalOpen, setIsConsecutiveModalOpen] = useState(false);

  const updateField = (field: keyof QuotationData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const updateItem = (index: number, description: string) => {
    const updated = [...data.items];
    updated[index] = { ...updated[index], description };
    onChange({ ...data, items: updated });
  };

  const handleAddItem = (presetDescription?: string) => {
    const newItem = createEmptyItem(presetDescription || '');
    onChange({
      ...data,
      items: [...data.items, newItem],
    });
  };

  const handleRemoveItem = (index: number) => {
    if (data.items.length <= 1) return;
    const updated = data.items.filter((_, i) => i !== index);
    onChange({ ...data, items: updated });
  };

  return (
    <div className="mobile-form-wrap">
      {/* 1. Barra de Consecutivo & Fecha */}
      <div className="quote-id-bar">
        <div
          className="quote-id-badge"
          onClick={() => setIsConsecutiveModalOpen(true)}
          style={{ cursor: 'pointer' }}
          title="Toca para calibrar o cambiar el número de cotización"
        >
          <span className="badge-tag">N°</span>
          <span className="badge-number">{data.quotationNumber}</span>
          <button
            type="button"
            className="btn-dice"
            onClick={(e) => {
              e.stopPropagation();
              setIsConsecutiveModalOpen(true);
            }}
            title="Calibrar número de cotización"
            aria-label="Calibrar número de cotización"
          >
            <Edit3 size={15} />
          </button>
        </div>

        <label className="date-picker-btn" title="Toca para cambiar la fecha de emisión">
          <Calendar size={16} className="date-picker-icon" />
          <span className="date-picker-text">{formatShortDate(data.date)}</span>
          <input
            type="date"
            className="native-date-input-overlay"
            value={data.date}
            onChange={(e) => updateField('date', e.target.value)}
          />
        </label>
      </div>

      {/* 2. Datos del Cliente */}
      <section className="form-card">
        <div className="card-header">
          <User size={18} className="card-icon" />
          <h2>Datos del Cliente</h2>
        </div>

        <div className="input-group">
          <label className="input-label">Nombre del Cliente / Entidad *</label>
          <input
            type="text"
            className="input-control"
            placeholder="Ej: Constructora Andina S.A.S. / Particular"
            value={data.clientName}
            onChange={(e) => updateField('clientName', e.target.value)}
          />
        </div>

        <div className="form-grid-responsive">
          <div className="input-group">
            <label className="input-label">Teléfono de Contacto</label>
            <input
              type="tel"
              className="input-control"
              placeholder="Ej: 310 123 4567"
              value={data.clientPhone}
              onChange={(e) => updateField('clientPhone', e.target.value)}
            />
          </div>

          <div className="input-group">
            <label className="input-label">NIT / C.C. (Opcional)</label>
            <input
              type="text"
              className="input-control"
              placeholder="Ej: 901.234.567-8"
              value={data.clientNit}
              onChange={(e) => updateField('clientNit', e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* 3. Partidas y Labores Técnicas */}
      <section className="form-card">
        <div className="card-header">
          <Zap size={18} className="card-icon" />
          <h2>Partidas y Labores Técnicas ({data.items.length})</h2>
        </div>

        {/* Lista de Partidas */}
        <div className="items-list">
          {data.items.map((item, idx) => (
            <div key={item.id || idx} className="item-row-edit">
              <span className="item-index-badge">{idx + 1}</span>
              <div className="item-text-wrap">
                <AutoResizeTextarea
                  className="item-textarea"
                  value={item.description}
                  placeholder="Descripción detallada de la labor técnica..."
                  onChange={(val) => updateItem(idx, val)}
                />
              </div>
              {data.items.length > 1 && (
                <button
                  type="button"
                  className="btn-trash"
                  onClick={() => handleRemoveItem(idx)}
                  title="Eliminar partida"
                  aria-label="Eliminar partida"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          ))}
        </div>

        <button
          type="button"
          className="btn-add-item"
          onClick={() => handleAddItem()}
        >
          <Plus size={18} />
          <span>Agregar otro labor / producto</span>
        </button>
      </section>

      {/* 5. Cierre Económico (Modelo Llave en Mano / Precio Global) */}
      <section className="form-card total-card">
        <div className="card-header">
          <DollarSign size={18} className="card-icon" />
          <h2>TOTAL</h2>
        </div>

        <div className="input-group">

          <div className="currency-input-wrap">
            <span className="currency-symbol">$</span>
            <input
              type="number"
              className="input-control currency-input"
              placeholder="0"
              value={data.totalPrice || ''}
              onChange={(e) => updateField('totalPrice', Math.max(0, Number(e.target.value)))}
            />
            <span className="currency-tag-inner">COP</span>
          </div>
        </div>

        <div className="total-preview-box">
          <span className="total-preview-label">Total a mostrar en documento:</span>
          <span className="total-preview-num">{formatCOP(data.totalPrice)} COP</span>
        </div>
      </section>

      {/* Botón inferior para ir a previsualización */}
      {onGoToPreview && (
        <button
          type="button"
          className="btn-go-preview"
          onClick={onGoToPreview}
        >
          <span>Ver Documento PDF</span>
          <ArrowRight size={18} />
        </button>
      )}

      {/* Modal para calibrar número de cotización */}
      <ConsecutiveModal
        isOpen={isConsecutiveModalOpen}
        initialValue={parseConsecutiveNumber(data.quotationNumber)}
        onSave={(num) => {
          setStoredConsecutive(num);
          updateField('quotationNumber', formatConsecutive(num));
          setIsConsecutiveModalOpen(false);
        }}
        onClose={() => setIsConsecutiveModalOpen(false)}
      />
    </div>
  );
}
