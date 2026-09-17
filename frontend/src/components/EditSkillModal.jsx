import React, { useState, useEffect } from 'react';
import { X, Edit3, Trash2, FolderPlus, Check } from 'lucide-react';

export default function EditSkillModal({
  isOpen,
  onClose,
  skill,
  categories = [],
  onSubmit,
  onDelete,
  onCreateCategory
}) {
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');

  // Inline category creation mode
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#3B82F6');
  const [catLoading, setCatLoading] = useState(false);

  useEffect(() => {
    if (skill) {
      setName(skill.name || '');
      setCategoryId(skill.category_id || '');
      setDescription(skill.description || '');
    }
    setIsCreatingCategory(false);
    setNewCatName('');
  }, [skill, isOpen]);

  if (!isOpen || !skill) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSubmit(skill.id, {
      name: name.trim(),
      category_id: categoryId || null,
      description: description.trim()
    });
    onClose();
  };

  const handleDelete = () => {
    if (window.confirm(`¿Estás seguro de eliminar "${skill.name}"?`)) {
      onDelete(skill.id);
      onClose();
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim() || !onCreateCategory) return;
    setCatLoading(true);
    try {
      const createdCat = await onCreateCategory({
        name: newCatName.trim(),
        color: newCatColor
      });
      if (createdCat && createdCat.id) {
        setCategoryId(createdCat.id);
      }
      setNewCatName('');
      setIsCreatingCategory(false);
    } catch (err) {
      console.error("Create category error:", err);
    } finally {
      setCatLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '520px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Edit3 size={20} color="#60A5FA" />
            <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Editar Habilidad</h3>
          </div>
          <button style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Skill Name */}
          <div className="form-group">
            <label className="form-label">Nombre de la Habilidad</label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* Category Dropdown & Quick Add */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Categoría</label>
              <button
                type="button"
                style={{ background: 'none', border: 'none', color: '#60A5FA', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                onClick={() => setIsCreatingCategory(!isCreatingCategory)}
              >
                <FolderPlus size={14} />
                <span>{isCreatingCategory ? 'Cancelar' : '+ Nueva Categoría'}</span>
              </button>
            </div>

            {isCreatingCategory ? (
              <div style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(59, 130, 246, 0.4)', borderRadius: '8px', padding: '12px', marginTop: '4px' }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Nombre categoría (Ej. Ciberseguridad)"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <input
                    type="color"
                    value={newCatColor}
                    onChange={(e) => setNewCatColor(e.target.value)}
                    style={{ width: '40px', height: '38px', padding: '2px', borderRadius: '6px', border: '1px solid #334155', background: '#0F172A', cursor: 'pointer' }}
                    title="Color de la Categoría"
                  />
                </div>
                <button
                  type="button"
                  className="btn-primary"
                  style={{ width: '100%', padding: '6px 12px', fontSize: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}
                  onClick={handleAddCategory}
                  disabled={catLoading || !newCatName.trim()}
                >
                  <Check size={14} />
                  <span>{catLoading ? 'Guardando...' : 'Guardar y Seleccionar'}</span>
                </button>
              </div>
            ) : (
              <select
                className="form-input"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">Sin Categoría</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label">Descripción (Opcional)</label>
            <textarea
              className="form-input"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px' }}>
            <button
              type="button"
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#FCA5A5',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
              onClick={handleDelete}
            >
              <Trash2 size={15} />
              <span>Eliminar</span>
            </button>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
              <button type="submit" className="btn-primary">Actualizar Habilidad</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
