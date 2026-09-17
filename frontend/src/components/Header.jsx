import React from 'react';
import { Activity, Plus, RefreshCw, Layers, FileJson, Moon, Sun } from 'lucide-react';

export default function Header({
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

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button className="btn-secondary" onClick={onToggleTheme} title="Cambiar Tema (Claro / Oscuro)">
          {isDarkMode ? <Sun size={16} color="#FDE047" /> : <Moon size={16} color="#A78BFA" />}
        </button>

        <button className="btn-secondary" onClick={onOpenBackup} title="Respaldo JSON">
          <FileJson size={16} color="#60A5FA" />
          <span>Respaldo</span>
        </button>

        <button className="btn-secondary" onClick={onSync} disabled={syncLoading}>
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
      </div>
    </header>
  );
}
