'use client';

import React, { useState, useEffect } from 'react';
import { formatConsecutive } from '@/data/defaults';
import { Hash, Check, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  initialValue?: number | string;
  isInitialSetup?: boolean;
  onSave: (num: number) => void;
  onClose?: () => void;
}

export default function ConsecutiveModal({
  isOpen,
  initialValue,
  isInitialSetup = false,
  onSave,
  onClose,
}: Props) {
  const [inputValue, setInputValue] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialValue) {
        const clean = String(initialValue).replace(/\D/g, '');
        setInputValue(clean || '1');
      } else {
        setInputValue('1');
      }
      setError(null);
    }
  }, [isOpen, initialValue]);

  if (!isOpen) return null;

  const numericVal = parseInt(inputValue, 10);
  const preview = !isNaN(numericVal) && numericVal > 0 ? formatConsecutive(numericVal) : 'COT-001';

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isNaN(numericVal) || numericVal < 1) {
      setError('Por favor ingresa un número válido mayor a 0');
      return;
    }
    onSave(numericVal);
  };

  return (
    <div className="modal-backdrop">
      <div className="consecutive-modal-card">
        <div className="consecutive-modal-header">
          <div className="consecutive-modal-icon-wrap">
            <Hash size={22} className="text-gold" />
          </div>
          <div>
            <h3 className="consecutive-modal-title">
              {isInitialSetup ? 'Configurar Consecutivo' : 'Calibrar Consecutivo'}
            </h3>
            <p className="consecutive-modal-sub">
              {isInitialSetup
                ? 'Ingresa el número de cotización para este dispositivo.'
                : 'Modifica el número de tu consecutivo actual:'}
            </p>
          </div>
          {!isInitialSetup && onClose && (
            <button
              type="button"
              className="btn-modal-close"
              onClick={onClose}
              aria-label="Cerrar modal"
            >
              <X size={18} />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="consecutive-modal-body">
          <div className="consecutive-input-group">
            <label className="consecutive-input-label">
              Número de Cotización (solo dígitos)
            </label>
            <div className="consecutive-input-wrap">
              <span className="consecutive-prefix">N°</span>
              <input
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                min="1"
                className="consecutive-input"
                placeholder="Ej: 1, 15 o 120"
                value={inputValue}
                autoFocus
                onChange={(e) => {
                  setInputValue(e.target.value);
                  if (error) setError(null);
                }}
              />
            </div>
            {error && <span className="consecutive-error">{error}</span>}
          </div>

          {/* Vista previa en tiempo real */}
          <div className="consecutive-preview-box">
            <span className="preview-label">Formato que se guardará en tu dispositivo:</span>
            <div className="preview-badge">
              <span className="preview-code">{preview}</span>
              <span className="preview-format-tag">Oficial Grupo Leovoltaje</span>
            </div>
          </div>

          <div className="consecutive-actions">
            {!isInitialSetup && onClose && (
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={onClose}
              >
                Cancelar
              </button>
            )}
            <button type="submit" className="btn-modal-save">
              <Check size={18} />
              <span>Guardar Consecutivo</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
