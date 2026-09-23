import React from 'react';
import { Activity, Plus, RefreshCw, Layers, FileJson, Moon, Sun, User, LogOut, LogIn } from 'lucide-react';

export default function Header({
  currentUser,
  onOpenAuth,
  onLogout,
  onOpenLog,
  onOpenSkill,
  onOpenBackup,
  onSync,
  syncLoading,
  isDarkMode,
  onToggleTheme
}) {
  return (
    <header className="app-header">
      <div className="brand-title">
        <Activity size={28} className="text-blue-400" />
        <span>SkillTracker Web</span>
        <span style={{ fontSize: '11px', color: '#10B981', border: '1px solid rgba(16,185,129,0.3)', padding: '2px 8px', borderRadius: '12px', background: 'rgba(16,185,129,0.1)' }}>
          Sync Engine v1.0
        </span>
      </div>

      <div className="header-actions">
        {/* System Utilities */}
        <div className="header-group">
          <button
            className="btn-icon"
            onClick={onToggleTheme}
            title={isDarkMode ? "Cambiar a Tema Claro" : "Cambiar a Tema Oscuro"}
          >
            {isDarkMode ? <Sun size={17} color="#FDE047" /> : <Moon size={17} color="#A78BFA" />}
          </button>

          <button className="btn-secondary" onClick={onOpenBackup} title="Respaldo y Restauración JSON">
            <FileJson size={16} color="#60A5FA" />
            <span>Respaldo</span>
          </button>

          <button
            className="btn-secondary"
            onClick={onSync}
            disabled={syncLoading}
            title="Sincronizar Datos con el Servidor"
          >
            <RefreshCw size={15} className={syncLoading ? 'animate-spin' : ''} />
            <span>{syncLoading ? 'Sincronizando...' : 'Sincronizar'}</span>
          </button>
        </div>

        <div className="header-divider" />

        {/* Primary Creation Actions */}
        <div className="header-group">
          <button className="btn-secondary" onClick={onOpenSkill} title="Crear Nueva Habilidad">
            <Plus size={16} />
            <span>Nueva Habilidad</span>
          </button>

          <button className="btn-primary" onClick={onOpenLog} title="Registrar Sesión de Práctica">
            <Layers size={16} />
            <span>+ Registrar Práctica</span>
          </button>
        </div>

        <div className="header-divider" />

        {/* User Session Info & Actions */}
        <div className="header-group">
          {currentUser ? (
            <>
              <div className="user-badge" title={`Usuario activo: ${currentUser.email}`}>
                <User size={14} color="#60A5FA" />
                <span className="user-name">
                  {currentUser.full_name || currentUser.email}
                </span>
              </div>

              <button
                className="btn-icon btn-icon-danger"
                onClick={onLogout}
                title="Cerrar Sesión"
              >
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <button
              className="btn-secondary"
              onClick={onOpenAuth}
              style={{
                borderColor: 'rgba(59, 130, 246, 0.4)',
                background: 'rgba(59, 130, 246, 0.15)',
                color: '#93C5FD'
              }}
            >
              <LogIn size={15} />
              <span>Iniciar Sesión</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
