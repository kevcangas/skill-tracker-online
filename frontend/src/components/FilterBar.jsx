import React from 'react';
import { Calendar, Filter } from 'lucide-react';

export default function FilterBar({
  timeFilter,
  setTimeFilter,
  onOpenCustomFilter,
  customFilterSummary = ''
}) {
  const filterOptions = [
    { id: 'all', label: 'Todo' },
    { id: 'week', label: 'Esta Semana' },
    { id: 'month', label: 'Este Mes' },
    { id: 'year', label: 'Este Año' }
  ];

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '20px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '12px 16px', borderRadius: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Filter size={18} color="#60A5FA" />
        <span style={{ fontSize: '14px', fontWeight: 600, color: '#F8FAFC' }}>Filtro de Tiempo:</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        {filterOptions.map((f) => {
          const isActive = timeFilter === f.id;
          return (
            <button
              key={f.id}
              style={{
                background: isActive ? '#3B82F6' : 'rgba(255, 255, 255, 0.05)',
                color: isActive ? '#FFFFFF' : '#94A3B8',
                border: isActive ? '1px solid #60A5FA' : '1px solid rgba(255, 255, 255, 0.1)',
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: isActive ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onClick={() => setTimeFilter(f.id)}
            >
              {f.label}
            </button>
          );
        })}

        <button
          style={{
            background: timeFilter === 'custom' ? '#3B82F6' : 'rgba(255, 255, 255, 0.05)',
            color: timeFilter === 'custom' ? '#FFFFFF' : '#94A3B8',
            border: timeFilter === 'custom' ? '1px solid #60A5FA' : '1px solid rgba(255, 255, 255, 0.1)',
            padding: '6px 14px',
            borderRadius: '20px',
            fontSize: '13px',
            fontWeight: timeFilter === 'custom' ? 700 : 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s ease'
          }}
          onClick={() => {
            setTimeFilter('custom');
            if (onOpenCustomFilter) onOpenCustomFilter();
          }}
        >
          <Calendar size={14} />
          <span>{timeFilter === 'custom' && customFilterSummary ? `Custom: ${customFilterSummary}` : '🗓️ Personalizado...'}</span>
        </button>
      </div>
    </div>
  );
}
