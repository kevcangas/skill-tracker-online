import React, { useState } from 'react';
import { X, Download, Upload, ShieldCheck, FileJson } from 'lucide-react';

export default function DataBackupModal({ isOpen, onClose, stats, authToken, onImportSuccess }) {
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState('');

  if (!isOpen) return null;

  // Export JSON Backup
  const handleExport = () => {
    const backupData = {
      version: 1,
      exported_at: new Date().toISOString(),
      skills: stats.skills || [],
      categories: stats.categories || [],
      logs: stats.logs || [],
      milestones: stats.milestones || [],
      tasks: stats.tasks || []
    };

    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SkillTracker_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage('¡Respaldo JSON descargado correctamente!');
  };

  // Import JSON Backup
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setMessage('');

    try {
      const text = await file.text();
      // Sanitize unicode BOM and wrappers matching Android app parser
      const cleanText = text.replace(/^\uFEFF/, '').trim();
      const parsed = JSON.parse(cleanText);

      // Convert arrays to SyncPushPayload format
      const pushPayload = {
        categories: (parsed.categories || []).map(c => ({
          id: c.id || String(Math.random()),
          name: c.name || c.category || 'General',
          color: c.color || '#3B82F6',
          icon: c.icon || 'folder',
          updated_at: c.updated_at || new Date().toISOString(),
          is_deleted: Boolean(c.is_deleted)
        })),
        skills: (parsed.skills || []).map(s => ({
          id: s.id || String(Math.random()),
          category_id: s.category_id || null,
          name: s.name || 'Habilidad',
          description: s.description || '',
          is_archived: Boolean(s.is_archived),
          target_hours: s.target_hours || 100.0,
          current_level: s.current_level || 'Beginner',
          updated_at: s.updated_at || new Date().toISOString(),
          is_deleted: Boolean(s.is_deleted)
        })),
        logs: (parsed.logs || parsed.sessions || []).map(l => ({
          id: l.id || l.id_session || String(Math.random()),
          skill_id: l.skill_id || l.id_skill,
          duration_minutes: l.duration_minutes || l.duration || 30,
          notes: l.notes || l.topic || '',
          logged_at: l.logged_at || l.date || new Date().toISOString(),
          updated_at: l.updated_at || new Date().toISOString(),
          is_deleted: Boolean(l.is_deleted)
        })),
        milestones: [...(parsed.milestones || []), ...(parsed.tasks || parsed.skillTasks || [])].map(m => ({
          id: m.id || m.id_milestone || m.id_task || String(Math.random()),
          skill_id: m.skill_id || m.id_skill,
          title: m.title || 'Hito/Tarea',
          type: m.type || (m.id_task ? 'task' : 'milestone'),
          priority: m.priority || 'Media',
          is_completed: Boolean(m.is_completed),
          due_date: m.due_date || null,
          achieved_at: m.achieved_at || m.target_date || new Date().toISOString(),
          updated_at: m.updated_at || new Date().toISOString(),
          is_deleted: Boolean(m.is_deleted)
        }))
      };

      const res = await fetch('/api/v1/sync/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify(pushPayload)
      });

      if (res.ok) {
        setMessage('¡Datos restaurados e importados correctamente!');
        if (onImportSuccess) onImportSuccess();
      } else {
        setMessage('Error al procesar el respaldo en el servidor.');
      }
    } catch (err) {
      console.error('Import backup error:', err);
      setMessage('Archivo JSON inválido o corrupto.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '480px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileJson size={20} color="#60A5FA" />
            <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Respaldo de Datos (JSON)</h3>
          </div>
          <button style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <p style={{ fontSize: '13px', color: '#94A3B8', lineHeight: 1.5, marginBottom: '20px' }}>
          Exporta o restaura tus habilidades, sesiones, hitos y tareas. Compatible con los archivos JSON de respaldo de la versión Android.
        </p>

        {message && (
          <div style={{ background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)', color: '#93C5FD', padding: '10px 12px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={16} />
            <span>{message}</span>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button
            className="btn-primary"
            style={{ width: '100%', padding: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
            onClick={handleExport}
          >
            <Download size={18} />
            <span>Exportar Respaldo (JSON)</span>
          </button>

          <label
            className="btn-secondary"
            style={{ width: '100%', padding: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', cursor: 'pointer', boxSizing: 'border-box' }}
          >
            <Upload size={18} />
            <span>{importing ? 'Importando...' : 'Importar Respaldo (JSON)'}</span>
            <input type="file" accept=".json" onChange={handleFileChange} style={{ display: 'none' }} disabled={importing} />
          </label>
        </div>

        <div style={{ marginTop: '24px', textAlign: 'right' }}>
          <button className="btn-secondary" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}
