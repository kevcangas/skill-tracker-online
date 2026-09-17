import React, { useState, useEffect } from 'react';
import { X, CheckSquare, Trash2 } from 'lucide-react';

export default function EditTaskModal({ isOpen, onClose, task, skills = [], onSubmit, onDelete }) {
  const [skillId, setSkillId] = useState('');
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('Media');
  const [dueDate, setDueDate] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (task) {
      setSkillId(task.skill_id || '');
      setTitle(task.title || '');
      setPriority(task.priority || 'Media');
      setIsCompleted(!!task.is_completed);
      if (task.due_date) {
        const d = new Date(task.due_date);
        const pad = (n) => (n < 10 ? '0' + n : n);
        const formatted = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
        setDueDate(formatted);
      } else {
        setDueDate('');
      }
    }
  }, [task]);

  if (!isOpen || !task) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    try {
      await onSubmit(task.id, {
        skill_id: skillId,
        title: title.trim(),
        priority: priority,
        is_completed: isCompleted,
        due_date: dueDate ? new Date(dueDate).toISOString() : null
      });
      onClose();
    } catch (err) {
      console.error("Update task error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta tarea?')) {
      setLoading(true);
      try {
        await onDelete(task.id);
        onClose();
      } catch (err) {
        console.error("Delete task error:", err);
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
            <CheckSquare size={22} color="#34D399" />
            <h2 style={{ fontSize: '20px', fontWeight: 700 }}>Editar Tarea</h2>
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

          <div className="form-group" style={{ marginBottom: '14px' }}>
            <label className="form-label">Descripción / Título de la Tarea</label>
            <input
              type="text"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Prioridad</label>
              <select
                className="form-input"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="Baja">Baja</option>
                <option value="Media">Media</option>
                <option value="Alta">Alta</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Fecha Límite</label>
              <input
                type="date"
                className="form-input"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              id="is_completed"
              checked={isCompleted}
              onChange={(e) => setIsCompleted(e.target.checked)}
              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
            />
            <label htmlFor="is_completed" style={{ fontSize: '14px', color: '#F8FAFC', cursor: 'pointer' }}>
              Marcar como completada
            </label>
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
                style={{ backgroundColor: '#059669' }}
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
