import React, { useState } from 'react';
import { LogIn, UserPlus, X, Lock, Mail, User, Sparkles, AlertCircle } from 'lucide-react';

export default function AuthModal({
  isOpen,
  onClose,
  onLogin,
  onRegister,
  canClose = true
}) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        await onLogin(email.trim(), password);
      } else {
        await onRegister(email.trim(), password, fullName.trim());
      }
      setEmail('');
      setPassword('');
      setFullName('');
    } catch (err) {
      setError(err.message || 'Error en la autenticación. Verifica tus datos.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await onLogin('demo@example.com', 'password123');
    } catch (err) {
      setError('No se pudo iniciar con el usuario demo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-card" style={{ maxWidth: '440px', padding: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {mode === 'login' ? (
              <LogIn className="text-blue-400" size={24} />
            ) : (
              <UserPlus className="text-emerald-400" size={24} />
            )}
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>
              {mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
            </h2>
          </div>
          {canClose && (
            <button
              onClick={onClose}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Mode Selector Tabs */}
        <div style={{ display: 'flex', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '10px', padding: '4px', marginBottom: '20px' }}>
          <button
            type="button"
            onClick={() => { setMode('login'); setError(null); }}
            style={{
              flex: 1,
              padding: '8px 12px',
              border: 'none',
              borderRadius: '8px',
              background: mode === 'login' ? 'var(--primary)' : 'transparent',
              color: mode === 'login' ? '#fff' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Iniciar Sesión
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError(null); }}
            style={{
              flex: 1,
              padding: '8px 12px',
              border: 'none',
              borderRadius: '8px',
              background: mode === 'register' ? 'var(--primary)' : 'transparent',
              color: mode === 'register' ? '#fff' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Registrarse
          </button>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#FCA5A5',
            padding: '10px 14px',
            borderRadius: '8px',
            fontSize: '13px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={14} />
                <span>Nombre Completo</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="Ej. Kevin Cangas"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Mail size={14} />
              <span>Correo Electrónico</span>
            </label>
            <input
              type="email"
              required
              className="form-input"
              placeholder="tu_correo@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Lock size={14} />
              <span>Contraseña</span>
            </label>
            <input
              type="password"
              required
              minLength={6}
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', marginTop: '12px', padding: '12px' }}
          >
            {loading ? (
              <span>Procesando...</span>
            ) : mode === 'login' ? (
              <>
                <LogIn size={16} />
                <span>Entrar a mi Cuenta</span>
              </>
            ) : (
              <>
                <UserPlus size={16} />
                <span>Crear Cuenta</span>
              </>
            )}
          </button>
        </form>

        <div style={{ margin: '20px 0 16px 0', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }} />

        {/* Demo Fast Access Button */}
        <button
          type="button"
          onClick={handleDemoLogin}
          disabled={loading}
          className="btn-secondary"
          style={{
            width: '100%',
            justifyContent: 'center',
            fontSize: '13px',
            color: '#93C5FD',
            border: '1px dashed rgba(96, 165, 250, 0.4)',
            background: 'rgba(59, 130, 246, 0.08)'
          }}
        >
          <Sparkles size={15} color="#60A5FA" />
          <span>Acceso Rápido con Usuario Demo</span>
        </button>
      </div>
    </div>
  );
}
