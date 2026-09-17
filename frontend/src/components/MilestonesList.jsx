import React, { useState } from 'react';
import { Award, Plus, CheckCircle2, Calendar, Filter, Edit2, Trash2 } from 'lucide-react';
import EditMilestoneModal from './EditMilestoneModal';

export default function MilestonesList({
  milestones = [],
  skills = [],
  selectedSkillFilter = '',
  onSkillFilterChange,
  onCreateMilestone,
  onUpdateMilestone,
  onDeleteMilestone
}) {
  const [filterId, setFilterId] = useState(selectedSkillFilter);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState(null);
  const [skillId, setSkillId] = useState('');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSelectChange = (id) => {
    setFilterId(id);
    if (onSkillFilterChange) {
      onSkillFilterChange(id);
    }
  };

  const filteredMilestones = filterId
    ? milestones.filter((m) => m.skill_id === filterId)
    : milestones;

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
      await onCreateMilestone({
        skill_id: skillId,
        title: title.trim(),
        type: 'milestone'
      });
      setTitle('');
      setIsFormOpen(false);
    } catch (err) {
      console.error("Create milestone error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card" style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Award size={20} color="#A78BFA" />
          <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Hitos Logrados</h3>
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
            <span>{isFormOpen ? 'Cancelar' : '+ Nuevo Hito'}</span>
          </button>
        </div>
      </div>

      {isFormOpen && (
        <form onSubmit={handleSubmit} style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(167, 139, 250, 0.3)', borderRadius: '10px', padding: '14px', marginBottom: '16px' }}>
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
          <div className="form-group" style={{ marginBottom: '12px' }}>
            <label className="form-label">Título del Hito</label>
            <input
              type="text"
              className="form-input"
              placeholder="Ej. Completar certificación en AWS / Lanzar primera app"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', padding: '8px', fontSize: '13px' }}
            disabled={loading || !title.trim()}
          >
            {loading ? 'Guardando...' : 'Guardar Hito'}
          </button>
        </form>
      )}

      {/* Filter Summary */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(167, 139, 250, 0.08)', border: '1px solid rgba(167, 139, 250, 0.2)', padding: '8px 12px', borderRadius: '8px', marginBottom: '16px', fontSize: '12px', color: '#94A3B8' }}>
        <span>
          Mostrando {filteredMilestones.length} hito(s) {filterId ? 'para la habilidad seleccionada' : 'en total'}
        </span>
      </div>

      {filteredMilestones.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '30px 20px', color: '#94A3B8', fontSize: '13px' }}>
          No hay hitos registrados para esta habilidad. ¡Haz clic en "+ Nuevo Hito" arriba para registrar uno!
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '400px', overflowY: 'auto', paddingRight: '4px' }}>
          {filteredMilestones.map((ms) => (
            <div
              key={ms.id}
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
                <CheckCircle2 size={18} color="#A78BFA" style={{ flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#F8FAFC' }}>{ms.title}</div>
                  <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: ms.category_color }} />
                    <span>{ms.skill_name}</span>
                  </div>
                </div>
              </div>
              <div style={{ fontSize: '11px', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={12} />
                  {formatDate(ms.achieved_at)}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <button
                    style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}
                    onClick={() => setEditingMilestone(ms)}
                    title="Editar hito"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    style={{ background: 'none', border: 'none', color: '#FCA5A5', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}
                    onClick={() => {
                      if (window.confirm('¿Estás seguro de que deseas eliminar este hito?')) {
                        onDeleteMilestone && onDeleteMilestone(ms.id);
                      }
                    }}
                    title="Eliminar hito"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Milestone Modal */}
      <EditMilestoneModal
        isOpen={!!editingMilestone}
        onClose={() => setEditingMilestone(null)}
        milestone={editingMilestone}
        skills={skills}
        onSubmit={onUpdateMilestone}
        onDelete={onDeleteMilestone}
      />
    </div>
  );
}
