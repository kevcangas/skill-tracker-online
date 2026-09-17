import React, { useState, useEffect } from 'react';
import { X, Clock, Trash2 } from 'lucide-react';

export default function EditSessionModal({ isOpen, onClose, log, skills = [], onSubmit, onDelete }) {
  const [skillId, setSkillId] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [notes, setNotes] = useState('');
  const [loggedAt, setLoggedAt] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (log) {
      setSkillId(log.skill_id || '');
      setDurationMinutes(log.duration_minutes || 30);
      setNotes(log.notes || '');
      if (log.logged_at) {
        // Format ISO date string to datetime-local input format (YYYY-MM-DDTHH:mm)
        const d = new Date(log.logged_at);
        const pad = (n) => (n < 10 ? '0' + n : n);
        const formatted = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        setLoggedAt(formatted);
      } else {
        setLoggedAt('');
      }
    }
  }, [log]);

  if (!isOpen || !log) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(log.id, {
        skill_id: skillId,
        duration_minutes: parseInt(durationMinutes, 10),
        notes: notes.trim(),
        logged_at: loggedAt ? new Date(loggedAt).toISOString() : null
      });
      onClose();
    } catch (err) {
      console.error("Update log error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta sesión de práctica?')) {
      setLoading(true);
      try {
        await onDelete(log.id);
        onClose();
      } catch (err) {
        console.error("Delete log error:", err);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={22} color="#60A5FA" />
            <h2 style={{ fontSize: '20px', fontWeight: 700 }}>Editar Sesión de Práctica</h2>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '14px' }}>
            <label className="form-label">Habilidad</label>
            <select
              className="form-input"
              value={skillId}
              onChange={(e) => setSkillId(e.target.value)}
              required
            >
              {skills.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: '14px' }}>
            <label className="form-label">Duración (minutos)</label>
            <input
              type="number"
              min="1"
              max="1440"
              className="form-input"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '14px' }}>
            <label className="form-label">Fecha y Hora</label>
            <input
              type="datetime-local"
              className="form-input"
              value={loggedAt}
              onChange={(e) => setLoggedAt(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label className="form-label">Notas / Observaciones</label>
            <textarea
              className="form-input"
              rows={3}
              placeholder="¿Qué practicaste o aprendiste en esta sesión?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
            <button
              type="button"
              className="btn-danger"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(239, 68, 68, 0.2)',
                color: '#FCA5A5',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                padding: '8px 14px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600
              }}
              onClick={handleDelete}
              disabled={loading}
            >
              <Trash2 size={16} />
              <span>Eliminar</span>
            </button>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={onClose}
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
              >
                {loading ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
