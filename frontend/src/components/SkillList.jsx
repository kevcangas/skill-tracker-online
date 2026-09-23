import React, { useState } from 'react';
import { Target, Play, Edit3, Trash2, Clock, ListFilter, Award, CheckSquare, Archive, RefreshCw, ChevronDown, ChevronUp, Flame } from 'lucide-react';


export default function SkillList({
  skills = [],
  onQuickLog,
  onEditSkill,
  onDeleteSkill,
  onToggleArchiveSkill,
  onViewSkillSessions,
  onViewSkillMilestones,
  onViewSkillTasks
}) {
  const [showArchived, setShowArchived] = useState(false);
  const [expandedSkillIds, setExpandedSkillIds] = useState({});

  const toggleExpand = (skillId) => {
    setExpandedSkillIds(prev => ({
      ...prev,
      [skillId]: !prev[skillId]
    }));
  };

  const activeSkills = skills.filter(s => !s.is_archived);
  const archivedSkills = skills.filter(s => s.is_archived);
  const displayedSkills = showArchived ? archivedSkills : activeSkills;

  return (
    <div className="glass-card" style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Tus Habilidades</h2>

        {/* Active vs Archived Toggle */}
        <div style={{ display: 'flex', gap: '6px', background: 'rgba(15, 23, 42, 0.8)', padding: '4px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <button
            style={{
              background: !showArchived ? '#3B82F6' : 'transparent',
              color: !showArchived ? '#FFFFFF' : '#94A3B8',
              border: 'none',
              padding: '4px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
            onClick={() => setShowArchived(false)}
          >
            Activas ({activeSkills.length})
          </button>
          <button
            style={{
              background: showArchived ? '#3B82F6' : 'transparent',
              color: showArchived ? '#FFFFFF' : '#94A3B8',
              border: 'none',
              padding: '4px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
            onClick={() => setShowArchived(true)}
          >
            Archivadas ({archivedSkills.length})
          </button>
        </div>
      </div>

      {displayedSkills.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94A3B8' }}>
          {showArchived
            ? 'No hay habilidades archivadas.'
            : 'No hay habilidades activas. ¡Haz clic en "Nueva Habilidad" arriba para empezar!'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {displayedSkills.map((skill) => {
            const isExpanded = Boolean(expandedSkillIds[skill.id]);

            return (
              <div
                key={skill.id}
                style={{
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                {/* Summary Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, cursor: 'pointer' }} onClick={() => toggleExpand(skill.id)}>
                    <span
                      style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        backgroundColor: skill.category_color || '#3B82F6',
                        flexShrink: 0
                      }}
                    />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 700 }}>{skill.name}</h3>
                        <span style={{ fontSize: '11px', color: '#94A3B8', background: 'rgba(255, 255, 255, 0.05)', padding: '1px 6px', borderRadius: '4px' }}>
                          {skill.category_name || 'General'}
                        </span>
                      </div>
                      {skill.description && (
                        <p style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>{skill.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Top Action Row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#60A5FA', background: 'rgba(59, 130, 246, 0.1)', padding: '4px 10px', borderRadius: '8px', fontWeight: 700 }}>
                      <Clock size={13} />
                      <span>{skill.practiced_hours} hrs</span>
                    </div>

                    {skill.current_streak > 0 && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                          fontSize: '12px',
                          color: '#F59E0B',
                          background: 'rgba(245, 158, 11, 0.12)',
                          padding: '4px 8px',
                          borderRadius: '8px',
                          fontWeight: 700
                        }}
                        title={`Racha activa para esta habilidad: ${skill.current_streak} días`}
                      >
                        <Flame size={13} />
                        <span>{skill.current_streak}d</span>
                      </div>
                    )}


                    <button
                      className="btn-primary"
                      style={{ padding: '6px 10px', fontSize: '11px' }}
                      onClick={() => onQuickLog(skill.id)}
                    >
                      <Play size={13} />
                      <span>+ Practicar</span>
                    </button>

                    <button
                      style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '4px' }}
                      onClick={() => toggleExpand(skill.id)}
                      title={isExpanded ? 'Contraer' : 'Expandir'}
                    >
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                  </div>
                </div>

                {/* Expanded Action Bar & Detail View */}
                {isExpanded && (
                  <div style={{ paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        className="btn-secondary"
                        style={{ padding: '6px 10px', fontSize: '11px' }}
                        onClick={() => onViewSkillSessions && onViewSkillSessions(skill.id)}
                      >
                        <ListFilter size={13} color="#60A5FA" />
                        <span>Ver Sesiones</span>
                      </button>

                      <button
                        className="btn-secondary"
                        style={{ padding: '6px 10px', fontSize: '11px' }}
                        onClick={() => onViewSkillMilestones && onViewSkillMilestones(skill.id)}
                      >
                        <Award size={13} color="#A78BFA" />
                        <span>Ver Hitos</span>
                      </button>

                      <button
                        className="btn-secondary"
                        style={{ padding: '6px 10px', fontSize: '11px' }}
                        onClick={() => onViewSkillTasks && onViewSkillTasks(skill.id)}
                      >
                        <CheckSquare size={13} color="#34D399" />
                        <span>Ver Tareas</span>
                      </button>

                      <button
                        className="btn-secondary"
                        style={{ padding: '6px 10px', fontSize: '11px' }}
                        onClick={() => onEditSkill(skill)}
                      >
                        <Edit3 size={13} color="#94A3B8" />
                        <span>Editar</span>
                      </button>

                      <button
                        className="btn-secondary"
                        style={{ padding: '6px 10px', fontSize: '11px' }}
                        onClick={() => onToggleArchiveSkill && onToggleArchiveSkill(skill)}
                      >
                        <Archive size={13} color="#F59E0B" />
                        <span>{skill.is_archived ? 'Desarchivar' : 'Archivar'}</span>
                      </button>

                      <button
                        className="btn-secondary"
                        style={{ padding: '6px 8px', fontSize: '11px' }}
                        onClick={() => {
                          if (window.confirm(`¿Estás seguro de eliminar "${skill.name}"?`)) {
                            onDeleteSkill(skill.id);
                          }
                        }}
                      >
                        <Trash2 size={13} color="#FCA5A5" />
                        <span>Eliminar</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
