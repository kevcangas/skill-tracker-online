import React from 'react';
import { X, Calendar } from 'lucide-react';
import { getTodayString, getCurrentYear, getCurrentMonth } from '../utils/dateUtils';

export default function CustomFilterModal({
  isOpen,
  onClose,
  customFilterMode,
  setCustomFilterMode,
  selectedDayDate,
  setSelectedDayDate,
  selectedWeekDate,
  setSelectedWeekDate,
  selectedMonth,
  setSelectedMonth,
  selectedYear,
  setSelectedYear,
  onApply
}) {
  if (!isOpen) return null;

  const handleApply = (e) => {
    e.preventDefault();
    onApply();
    onClose();
  };

  const monthsList = [
    { num: 1, name: 'Enero' },
    { num: 2, name: 'Febrero' },
    { num: 3, name: 'Marzo' },
    { num: 4, name: 'Abril' },
    { num: 5, name: 'Mayo' },
    { num: 6, name: 'Junio' },
    { num: 7, name: 'Julio' },
    { num: 8, name: 'Agosto' },
    { num: 9, name: 'Septiembre' },
    { num: 10, name: 'Octubre' },
    { num: 11, name: 'Noviembre' },
    { num: 12, name: 'Diciembre' }
  ];

  const yearsList = [2024, 2025, 2026, 2027, 2028];

  return (
    <div className="modal-backdrop">
      <div className="modal-content glass-card" style={{ maxWidth: '480px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={22} color="#60A5FA" />
            <h2 style={{ fontSize: '20px', fontWeight: 700 }}>🗓️ Filtro de Fecha Personalizado</h2>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleApply}>
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label">Selecciona modalidad:</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {[
                { id: 'day', label: 'Día Específico' },
                { id: 'week', label: 'Semana' },
                { id: 'month', label: 'Mes Específico' },
                { id: 'year', label: 'Año Específico' }
              ].map((f) => (
                <button
                  type="button"
                  key={f.id}
                  style={{
                    background: customFilterMode === f.id ? '#3B82F6' : 'rgba(255, 255, 255, 0.05)',
                    color: customFilterMode === f.id ? '#FFFFFF' : '#94A3B8',
                    border: customFilterMode === f.id ? '1px solid #60A5FA' : '1px solid rgba(255, 255, 255, 0.1)',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: customFilterMode === f.id ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onClick={() => setCustomFilterMode(f.id)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '16px', marginBottom: '20px' }}>
            {customFilterMode === 'day' && (
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Seleccionar Fecha del Día:</label>
                <input
                  type="date"
                  className="form-input"
                  value={selectedDayDate || getTodayString()}
                  onChange={(e) => setSelectedDayDate(e.target.value)}
                  required
                />
              </div>
            )}

            {customFilterMode === 'week' && (
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Semana comenzando desde:</label>
                <input
                  type="date"
                  className="form-input"
                  value={selectedWeekDate || getTodayString()}
                  onChange={(e) => setSelectedWeekDate(e.target.value)}
                  required
                />
                <span style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px', display: 'block' }}>
                  Filtra sesiones en un rango de 7 días a partir de esta fecha.
                </span>
              </div>
            )}

            {customFilterMode === 'month' && (
              <div>
                <div className="form-group" style={{ marginBottom: '12px' }}>
                  <label className="form-label">Año:</label>
                  <select
                    className="form-input"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                  >
                    {yearsList.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Mes:</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                    {monthsList.map((m) => (
                      <button
                        type="button"
                        key={m.num}
                        style={{
                          background: selectedMonth === m.num ? '#3B82F6' : 'rgba(255, 255, 255, 0.05)',
                          color: selectedMonth === m.num ? '#FFFFFF' : '#94A3B8',
                          border: selectedMonth === m.num ? '1px solid #60A5FA' : '1px solid rgba(255, 255, 255, 0.1)',
                          padding: '6px 8px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: selectedMonth === m.num ? 700 : 500,
                          cursor: 'pointer'
                        }}
                        onClick={() => setSelectedMonth(m.num)}
                      >
                        {m.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {customFilterMode === 'year' && (
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Año Específico:</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                  {yearsList.map((y) => (
                    <button
                      type="button"
                      key={y}
                      style={{
                        background: selectedYear === y ? '#3B82F6' : 'rgba(255, 255, 255, 0.05)',
                        color: selectedYear === y ? '#FFFFFF' : '#94A3B8',
                        border: selectedYear === y ? '1px solid #60A5FA' : '1px solid rgba(255, 255, 255, 0.1)',
                        padding: '10px 8px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: selectedYear === y ? 700 : 500,
                        cursor: 'pointer'
                      }}
                      onClick={() => setSelectedYear(y)}
                    >
                      {y}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary"
            >
              Aplicar Filtro Personalizado
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
