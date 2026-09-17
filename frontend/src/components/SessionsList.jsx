import React, { useState } from 'react';
import { Clock, FileText, Calendar, Filter, Edit2, Trash2 } from 'lucide-react';
import EditSessionModal from './EditSessionModal';

export default function SessionsList({
  logs = [],
  skills = [],
  selectedSkillFilter = '',
  onSkillFilterChange,
  onUpdateLog,
  onDeleteLog
}) {
  const [filterId, setFilterId] = useState(selectedSkillFilter);
  const [editingLog, setEditingLog] = useState(null);

  const handleSelectChange = (id) => {
    setFilterId(id);
    if (onSkillFilterChange) {
      onSkillFilterChange(id);
    }
  };

  const filteredLogs = filterId
    ? logs.filter((l) => l.skill_id === filterId)
    : logs;

  const totalFilteredMins = filteredLogs.reduce((acc, curr) => acc + (curr.duration_minutes || 0), 0);
  const totalFilteredHours = (totalFilteredMins / 60.0).toFixed(1);

  const formatDate = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="glass-card" style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={20} color="#60A5FA" />
          <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Sesiones de Práctica</h3>
        </div>

        {/* Skill Filter Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={14} color="#94A3B8" />
          <select
            className="form-input"
            style={{ width: 'auto', padding: '6px 12px', fontSize: '13px' }}
            value={filterId}
            onChange={(e) => handleSelectChange(e.target.value)}
          >
            <option value="">Todas las Habilidades</option>
            {skills.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Filter Summary Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
        <span style={{ color: '#94A3B8' }}>
          Mostrando {filteredLogs.length} sesión(es) {filterId ? 'para la habilidad seleccionada' : 'en total'}
        </span>
        <span style={{ fontWeight: 700, color: '#60A5FA' }}>
          Acumulado: {totalFilteredHours} hrs ({totalFilteredMins} mins)
        </span>
      </div>

      {filteredLogs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '30px 20px', color: '#94A3B8', fontSize: '13px' }}>
          No hay sesiones de práctica registradas para esta selección.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '450px', overflowY: 'auto', paddingRight: '4px' }}>
          {filteredLogs.map((log) => (
            <div
              key={log.id}
              style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: '10px',
                padding: '12px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: log.category_color || '#3B82F6'
                    }}
                  />
                  <span style={{ fontSize: '14px', fontWeight: 700 }}>{log.skill_name}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: '#94A3B8' }}>
                  <span style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60A5FA', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
                    {log.duration_minutes} mins
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={13} />
                    {formatDate(log.logged_at)}
                  </span>
                  {/* Action buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '4px' }}>
                    <button
                      style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}
                      onClick={() => setEditingLog(log)}
                      title="Editar sesión"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      style={{ background: 'none', border: 'none', color: '#FCA5A5', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}
                      onClick={() => {
                        if (window.confirm('¿Estás seguro de que deseas eliminar esta sesión?')) {
                          onDeleteLog && onDeleteLog(log.id);
                        }
                      }}
                      title="Eliminar sesión"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {log.notes && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '13px', color: '#CBD5E1', marginTop: '4px', background: 'rgba(255,255,255,0.02)', padding: '6px 10px', borderRadius: '6px' }}>
                  <FileText size={14} color="#94A3B8" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <span>{log.notes}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Edit Session Modal */}
      <EditSessionModal
        isOpen={!!editingLog}
        onClose={() => setEditingLog(null)}
        log={editingLog}
        skills={skills}
        onSubmit={onUpdateLog}
        onDelete={onDeleteLog}
      />
    </div>
  );
}
