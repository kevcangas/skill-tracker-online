import React, { useState } from 'react';
import { CheckSquare, Plus, CheckCircle2, Circle, Calendar, Filter, ChevronDown, ChevronUp, Edit2, Trash2 } from 'lucide-react';
import EditTaskModal from './EditTaskModal';

export default function TasksList({
  tasks = [],
  skills = [],
  selectedSkillFilter = '',
  onSkillFilterChange,
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
  onToggleTaskComplete
}) {
  const [filterId, setFilterId] = useState(selectedSkillFilter);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const [skillId, setSkillId] = useState('');
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('Media');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSelectChange = (id) => {
    setFilterId(id);
    if (onSkillFilterChange) {
      onSkillFilterChange(id);
    }
  };

  const filteredTasks = filterId
    ? tasks.filter((t) => t.skill_id === filterId)
    : tasks;

  const pendingTasks = filteredTasks.filter((t) => !t.is_completed);
  const completedTasks = filteredTasks.filter((t) => t.is_completed);

  const getPriorityBadge = (prio) => {
    switch (prio) {
      case 'Alta':
        return <span style={{ fontSize: '11px', background: 'rgba(239, 68, 68, 0.2)', color: '#FCA5A5', border: '1px solid rgba(239,68,68,0.4)', padding: '1px 8px', borderRadius: '10px', fontWeight: 600 }}>Alta</span>;
      case 'Baja':
        return <span style={{ fontSize: '11px', background: 'rgba(16, 185, 129, 0.2)', color: '#6EE7B7', border: '1px solid rgba(16,185,129,0.4)', padding: '1px 8px', borderRadius: '10px', fontWeight: 600 }}>Baja</span>;
      default:
        return <span style={{ fontSize: '11px', background: 'rgba(245, 158, 11, 0.2)', color: '#FDE047', border: '1px solid rgba(245,158,11,0.4)', padding: '1px 8px', borderRadius: '10px', fontWeight: 600 }}>Media</span>;
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !skillId) return;
    setLoading(true);
    try {
      await onCreateTask({
        skill_id: skillId,
        title: title.trim(),
        priority: priority,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        type: 'task'
      });
      setTitle('');
      setDueDate('');
      setIsFormOpen(false);
    } catch (err) {
      console.error("Create task error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card" style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckSquare size={20} color="#34D399" />
          <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Tareas de Habilidades</h3>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Skill Filter Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
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

          <button
            className="btn-secondary"
            style={{ padding: '6px 12px', fontSize: '12px' }}
            onClick={() => {
              setSkillId(filterId || skills[0]?.id || '');
              setIsFormOpen(!isFormOpen);
            }}
          >
            <Plus size={14} />
            <span>{isFormOpen ? 'Cancelar' : '+ Nueva Tarea'}</span>
          </button>
        </div>
      </div>

      {isFormOpen && (
        <form onSubmit={handleSubmit} style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(52, 211, 153, 0.3)', borderRadius: '10px', padding: '14px', marginBottom: '16px' }}>
          <div className="form-group" style={{ marginBottom: '10px' }}>
            <label className="form-label">Seleccionar Habilidad</label>
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

          <div className="form-group" style={{ marginBottom: '10px' }}>
            <label className="form-label">Descripción de la Tarea</label>
            <input
              type="text"
              className="form-input"
              placeholder="Ej. Practicar 20 mins de escalas / Resolver ejercicios"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
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
              <label className="form-label">Fecha Límite (Opcional)</label>
              <input
                type="date"
                className="form-input"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', padding: '8px', fontSize: '13px', backgroundColor: '#059669' }}
            disabled={loading || !title.trim()}
          >
            {loading ? 'Guardando...' : 'Guardar Tarea'}
          </button>
        </form>
      )}

      {/* Summary Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(52, 211, 153, 0.08)', border: '1px solid rgba(52, 211, 153, 0.2)', padding: '8px 12px', borderRadius: '8px', marginBottom: '16px', fontSize: '12px', color: '#94A3B8' }}>
        <span>
          Pendientes: <strong>{pendingTasks.length}</strong> | Completadas: <strong>{completedTasks.length}</strong>
        </span>
      </div>

      {/* Active Pending Tasks */}
      {pendingTasks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px', color: '#94A3B8', fontSize: '13px' }}>
          No hay tareas pendientes. ¡Excelente trabajo!
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
          {pendingTasks.map((t) => (
            <div
              key={t.id}
              style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: '8px',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  onClick={() => onToggleTaskComplete && onToggleTaskComplete(t.id, true)}
                  title="Marcar como completada"
                >
                  <Circle size={18} color="#94A3B8" />
                </button>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#F8FAFC', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{t.title}</span>
                    {getPriorityBadge(t.priority)}
                  </div>
                  <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: t.category_color }} />
                    <span>{t.skill_name}</span>
                    {t.due_date && (
                      <span style={{ marginLeft: '8px', color: '#FCA5A5' }}>
                        📅 Límite: {formatDate(t.due_date)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button
                  style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}
                  onClick={() => setEditingTask(t)}
                  title="Editar tarea"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  style={{ background: 'none', border: 'none', color: '#FCA5A5', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}
                  onClick={() => {
                    if (window.confirm('¿Estás seguro de que deseas eliminar esta tarea?')) {
                      onDeleteTask && onDeleteTask(t.id);
                    }
                  }}
                  title="Eliminar tarea"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Collapsible Completed Tasks Section */}
      {completedTasks.length > 0 && (
        <div style={{ marginTop: '16px', borderTop: '1px dashed rgba(255, 255, 255, 0.1)', paddingTop: '12px' }}>
          <button
            style={{
              background: 'none',
              border: 'none',
              color: '#34D399',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            onClick={() => setShowCompleted(!showCompleted)}
          >
            <span>✓ Tareas Completadas ({completedTasks.length})</span>
            {showCompleted ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showCompleted && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
              {completedTasks.map((t) => (
                <div
                  key={t.id}
                  style={{
                    background: 'rgba(15, 23, 42, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.03)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    opacity: 0.7
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                      onClick={() => onToggleTaskComplete && onToggleTaskComplete(t.id, false)}
                      title="Marcar como pendiente"
                    >
                      <CheckCircle2 size={18} color="#34D399" />
                    </button>
                    <div>
                      <div style={{ fontSize: '13px', textDecoration: 'line-through', color: '#94A3B8' }}>{t.title}</div>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>{t.skill_name}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <button
                      style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}
                      onClick={() => setEditingTask(t)}
                      title="Editar tarea"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      style={{ background: 'none', border: 'none', color: '#FCA5A5', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}
                      onClick={() => {
                        if (window.confirm('¿Estás seguro de que deseas eliminar esta tarea?')) {
                          onDeleteTask && onDeleteTask(t.id);
                        }
                      }}
                      title="Eliminar tarea"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Edit Task Modal */}
      <EditTaskModal
        isOpen={!!editingTask}
        onClose={() => setEditingTask(null)}
        task={editingTask}
        skills={skills}
        onSubmit={onUpdateTask}
        onDelete={onDeleteTask}
      />
    </div>
  );
}
