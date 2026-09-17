import React from 'react';
import { Clock, Award, Flame, Target } from 'lucide-react';

export default function StatsCards({ totalHours, totalSkills, categoryCount, streakDays = 7 }) {
  return (
    <div className="stats-grid">
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '13px', color: '#94A3B8', fontWeight: 600 }}>TOTAL PRACTICE</span>
          <Clock size={20} color="#60A5FA" />
        </div>
        <div style={{ fontSize: '32px', fontWeight: 800, color: '#F8FAFC' }}>
          {totalHours} <span style={{ fontSize: '16px', color: '#94A3B8', fontWeight: 500 }}>hrs</span>
        </div>
        <div style={{ fontSize: '12px', color: '#10B981', marginTop: '4px' }}>
          ↑ Syncing across Homelab & Mobile
        </div>
      </div>

      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '13px', color: '#94A3B8', fontWeight: 600 }}>ACTIVE SKILLS</span>
          <Target size={20} color="#A78BFA" />
        </div>
        <div style={{ fontSize: '32px', fontWeight: 800, color: '#F8FAFC' }}>
          {totalSkills}
        </div>
        <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px' }}>
          Across {categoryCount || 4} Categories
        </div>
      </div>

      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '13px', color: '#94A3B8', fontWeight: 600 }}>CURRENT STREAK</span>
          <Flame size={20} color="#F59E0B" />
        </div>
        <div style={{ fontSize: '32px', fontWeight: 800, color: '#F8FAFC' }}>
          {streakDays} <span style={{ fontSize: '16px', color: '#94A3B8', fontWeight: 500 }}>days</span>
        </div>
        <div style={{ fontSize: '12px', color: '#F59E0B', marginTop: '4px' }}>
          🔥 Consistent growth streak
        </div>
      </div>

      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '13px', color: '#94A3B8', fontWeight: 600 }}>HOMELAB STATUS</span>
          <Award size={20} color="#34D399" />
        </div>
        <div style={{ fontSize: '20px', fontWeight: 700, color: '#34D399', marginTop: '6px' }}>
          ONLINE
        </div>
        <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px' }}>
          PostgreSQL & FastAPI Active
        </div>
      </div>
    </div>
  );
}
