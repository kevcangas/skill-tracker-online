import React from 'react';
import { Calendar } from 'lucide-react';

export default function Heatmap({ heatmapData = [] }) {
  // Generate 60 days grid
  const days = [];
  const today = new Date();
  const dataMap = new Map();

  heatmapData.forEach(item => {
    dataMap.set(item.date, item.duration_minutes);
  });

  for (let i = 59; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const mins = dataMap.get(dateStr) || 0;
    days.push({ date: dateStr, mins });
  }

  const getLevelClass = (mins) => {
    if (mins === 0) return 'heatmap-lvl-0';
    if (mins <= 30) return 'heatmap-lvl-1';
    if (mins <= 60) return 'heatmap-lvl-2';
    if (mins <= 120) return 'heatmap-lvl-3';
    return 'heatmap-lvl-4';
  };

  return (
    <div className="glass-card" style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={18} color="#60A5FA" />
          <span style={{ fontWeight: 700, fontSize: '15px' }}>Consistency Heatmap (Last 60 Days)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#94A3B8' }}>
          <span>Less</span>
          <span className="heatmap-cell heatmap-lvl-0" style={{ width: 10, height: 10, display: 'inline-block' }}></span>
          <span className="heatmap-cell heatmap-lvl-1" style={{ width: 10, height: 10, display: 'inline-block' }}></span>
          <span className="heatmap-cell heatmap-lvl-2" style={{ width: 10, height: 10, display: 'inline-block' }}></span>
          <span className="heatmap-cell heatmap-lvl-3" style={{ width: 10, height: 10, display: 'inline-block' }}></span>
          <span className="heatmap-cell heatmap-lvl-4" style={{ width: 10, height: 10, display: 'inline-block' }}></span>
          <span>More</span>
        </div>
      </div>

      <div className="heatmap-container">
        {days.map((d, idx) => (
          <div
            key={idx}
            className={`heatmap-cell ${getLevelClass(d.mins)}`}
            title={`${d.date}: ${d.mins} minutes practiced`}
          />
        ))}
      </div>
    </div>
  );
}
