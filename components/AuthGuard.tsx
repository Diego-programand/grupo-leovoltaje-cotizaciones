'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Lock, Eye, EyeOff, ShieldCheck, ArrowRight, Loader2, Zap } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
  onLogoutReady?: (logoutFn: () => void) => void;
}

export default function AuthGuard({ children, onLogoutReady }: AuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [pin, setPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLocked, setIsLocked] = useState(false);

  const checkSession = useCallback(async () => {
    try {
      const res = await fetch('/api/auth', { method: 'GET' });
      if (res.ok) {
        const data = await res.json();
        setIsAuthenticated(Boolean(data.authenticated));
      } else {
        setIsAuthenticated(false);
      }
    } catch {
      setIsAuthenticated(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const handleLogout = useCallback(async () => {
    try {
      await fetch('/api/auth', { method: 'DELETE' });
    } catch {}
    setIsAuthenticated(false);
    setPin('');
    setErrorMessage('');
    setIsLocked(false);
  }, []);

  useEffect(() => {
    if (onLogoutReady) {
      onLogoutReady(handleLogout);
    }
  }, [onLogoutReady, handleLogout]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;
    if (!pin.trim()) {
      setErrorMessage('Por favor ingresa la clave de acceso.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pin: pin.trim(),
          remember: rememberMe,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setIsAuthenticated(true);
        setPin('');
        setErrorMessage('');
      } else {
        setErrorMessage(data.message || 'Contraseña incorrecta.');
        if (data.locked) {
          setIsLocked(true);
        }
      }
    } catch {
      setErrorMessage('Error de red al validar credenciales.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isAuthenticated === null) {
    return (
      <div className="auth-loading-screen">
        <Loader2 className="spinner" size={32} color="#232357" />
        <p>Iniciando sistema de cotización Grupo Leovoltaje...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="auth-fullscreen-wrap">
      <div className="auth-card-box">
        <div className="auth-header">
          <div className="auth-logo-badge">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/favicon.svg"
              alt="Grupo Leovoltaje"
              className="auth-logo-img"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const fb = e.currentTarget.parentElement?.querySelector('.auth-logo-fallback') as HTMLElement;
                if (fb) fb.style.display = 'block';
              }}
            />
            <Zap size={28} color="#E5A93C" className="auth-logo-fallback" style={{ display: 'none' }} />
          </div>
          <h1>Grupo Leovoltaje</h1>
          <p className="auth-brand-sub">Servicios eléctricos • grupoleovoltaje.com</p>
          <span className="auth-portal-badge">Panel Administrativo de Cotizaciones</span>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-input-group">
            <label className="auth-label">Clave de Acceso Administrativo</label>
            <div className="auth-input-wrapper">
              <Lock size={16} className="auth-input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                className="auth-input"
                placeholder="Ingresa el PIN de seguridad"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                disabled={isLoading || isLocked}
                autoFocus
              />
              <button
                type="button"
                className="auth-eye-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <label className="auth-checkbox-label">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={isLoading || isLocked}
            />
            <span>Mantener sesión iniciada en este dispositivo</span>
          </label>

          {errorMessage && <div className="auth-error-alert">{errorMessage}</div>}

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={isLoading || isLocked}
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="spinner" />
                <span>Validando...</span>
              </>
            ) : (
              <>
                <span>Ingresar al Cotizador</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="auth-security-footer">
          <ShieldCheck size={14} />
          <span>Acceso restringido • Grupo Leovoltaje</span>
        </div>
      </div>
    </div>
  );
}
