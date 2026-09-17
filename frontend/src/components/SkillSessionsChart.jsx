import React from 'react';
import { BarChart2 } from 'lucide-react';

export default function SkillSessionsChart({
  skills = [],
  logs = [],
  filterLabel = ''
}) {
  const activeSkills = skills.filter((s) => !s.is_archived);

  if (skills.length === 0) {
    return (
      <div className="glass-card" style={{ marginBottom: '24px', textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>
        No hay habilidades registradas para mostrar estadísticas de sesiones.
      </div>
    );
  }

  // Calculate session count for each skill using the filtered logs
  const skillSessionCounts = activeSkills.map((skill) => {
    const count = logs.filter((log) => log.skill_id === skill.id).length;
    return {
      id: skill.id,
      name: skill.name,
      category: skill.category_name || 'General',
      count: count
    };
  });

  const maxSessionCount = Math.max(...skillSessionCounts.map((s) => s.count), 1);
  const totalSessionsCount = skillSessionCounts.reduce((acc, s) => acc + s.count, 0);

  return (
    <div className="glass-card" style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BarChart2 size={20} color="#3B82F6" />
          <h3 style={{ fontSize: '17px', fontWeight: 700 }}>Número de Sesiones por Habilidad</h3>
        </div>

        <div style={{ fontSize: '12px', background: 'rgba(59, 130, 246, 0.15)', color: '#60A5FA', padding: '4px 10px', borderRadius: '12px', fontWeight: 600 }}>
          Total Sesiones: {totalSessionsCount} {filterLabel ? `(${filterLabel})` : ''}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {skillSessionCounts.map((skill) => {
          const widthPercent = (skill.count / maxSessionCount) * 100;

          return (
            <div key={skill.id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '130px', flexShrink: 0, fontSize: '13px', fontWeight: 600, color: '#F8FAFC', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={skill.name}>
                {skill.name}
              </div>

              <div
                style={{
                  flex: 1,
                  height: '22px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '11px',
                  overflow: 'hidden',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${Math.max(widthPercent, skill.count > 0 ? 8 : 0)}%`,
                    background: 'linear-gradient(90deg, #3B82F6 0%, #60A5FA 100%)',
                    borderRadius: '11px',
                    transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    paddingRight: '8px'
                  }}
                >
                  {skill.count > 0 && (
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#FFFFFF' }}>
                      {skill.count}
                    </span>
                  )}
                </div>

                {skill.count === 0 && (
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748B', paddingLeft: '10px' }}>
                    0 sesiones
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
