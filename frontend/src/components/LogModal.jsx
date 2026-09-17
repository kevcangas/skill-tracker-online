import React, { useState } from 'react';
import { X, Clock } from 'lucide-react';

export default function LogModal({ isOpen, onClose, skills = [], defaultSkillId, onSubmit }) {
  const [skillId, setSkillId] = useState(defaultSkillId || (skills[0]?.id || ''));
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!skillId) return;
    onSubmit({
      skill_id: skillId,
      duration_minutes: parseInt(durationMinutes, 10),
      notes: notes.trim()
    });
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={20} color="#3B82F6" />
            <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Log Practice Session</h3>
          </div>
          <button style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Select Skill</label>
            <select
              className="form-input"
              value={skillId}
              onChange={(e) => setSkillId(e.target.value)}
              required
            >
              {skills.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.category_name})</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Duration (Minutes)</label>
            <input
              type="number"
              className="form-input"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
              min="1"
              max="1440"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Practice Notes / Focus Areas</label>
            <textarea
              className="form-input"
              rows={3}
              placeholder="E.g., Practiced async database transactions & Alembic migrations..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">Save Session</button>
          </div>
        </form>
      </div>
    </div>
  );
}
