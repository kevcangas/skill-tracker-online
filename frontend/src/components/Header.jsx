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

      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
        <button className="btn-secondary" onClick={onToggleTheme} title="Cambiar Tema (Claro / Oscuro)">
          {isDarkMode ? <Sun size={16} color="#FDE047" /> : <Moon size={16} color="#A78BFA" />}
        </button>

        <button className="btn-secondary" onClick={onOpenBackup} title="Respaldo JSON">
          <FileJson size={16} color="#60A5FA" />
          <span>Respaldo</span>
        </button>

        <button className="btn-secondary" onClick={onSync} disabled={syncLoading} title="Sincronizar Datos">
          <RefreshCw size={16} className={syncLoading ? 'animate-spin' : ''} />
          <span>{syncLoading ? 'Sincronizando...' : 'Sincronizar'}</span>
        </button>

        <button className="btn-secondary" onClick={onOpenSkill}>
          <Plus size={16} />
          <span>Nueva Habilidad</span>
        </button>

        <button className="btn-primary" onClick={onOpenLog}>
          <Layers size={16} />
          <span>+ Registrar Práctica</span>
        </button>

        {/* User Session Info & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '6px', borderLeft: '1px solid var(--bg-card-border)', paddingLeft: '12px' }}>
          {currentUser ? (
            <>
              <div
                title={`Usuario activo: ${currentUser.email}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.25)',
                  padding: '5px 10px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  color: '#93C5FD',
                  maxWidth: '180px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                <User size={13} color="#60A5FA" />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {currentUser.full_name || currentUser.email}
                </span>
              </div>

              <button
                className="btn-secondary"
                onClick={onLogout}
                title="Cerrar Sesión"
                style={{ padding: '7px 10px', color: '#F87171' }}
              >
                <LogOut size={15} />
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
