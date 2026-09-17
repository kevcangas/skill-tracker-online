import React, { useState, useEffect } from 'react';
import { X, Award, Trash2 } from 'lucide-react';

export default function EditMilestoneModal({ isOpen, onClose, milestone, skills = [], onSubmit, onDelete }) {
  const [skillId, setSkillId] = useState('');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (milestone) {
      setSkillId(milestone.skill_id || '');
      setTitle(milestone.title || '');
    }
  }, [milestone]);

  if (!isOpen || !milestone) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    try {
      await onSubmit(milestone.id, {
        skill_id: skillId,
        title: title.trim()
      });
      onClose();
    } catch (err) {
      console.error("Update milestone error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este hito?')) {
      setLoading(true);
      try {
        await onDelete(milestone.id);
        onClose();
      } catch (err) {
        console.error("Delete milestone error:", err);
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
            <Award size={22} color="#A78BFA" />
            <h2 style={{ fontSize: '20px', fontWeight: 700 }}>Editar Hito Logrado</h2>
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
            <label className="form-label">Habilidad Asociada</label>
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

          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label className="form-label">Título del Hito</label>
            <input
              type="text"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
            <button
              type="button"
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
                disabled={loading || !title.trim()}
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
