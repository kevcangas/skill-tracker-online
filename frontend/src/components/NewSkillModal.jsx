import React, { useState, useEffect } from 'react';
import { X, Target, FolderPlus, Check } from 'lucide-react';

export default function NewSkillModal({
  isOpen,
  onClose,
  onSubmit,
  initialSkill = null,
  categories = [],
  onCreateCategory
}) {
  const isEditMode = Boolean(initialSkill && initialSkill.id);

  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');

  // Inline category creation mode
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#3B82F6');
  const [catLoading, setCatLoading] = useState(false);

  useEffect(() => {
    if (initialSkill) {
      setName(initialSkill.name || '');
      setCategoryId(initialSkill.category_id || '');
      setDescription(initialSkill.description || '');
    } else {
      setName('');
      setCategoryId(categories[0]?.id || '');
      setDescription('');
    }
    setIsCreatingCategory(false);
    setNewCatName('');
  }, [initialSkill, isOpen, categories]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const payload = {
      name: name.trim(),
      category_id: categoryId || null,
      description: description.trim()
    };

    if (isEditMode) {
      payload.id = initialSkill.id;
    }

    onSubmit(payload);
    onClose();
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
            <Target size={20} color="#A78BFA" />
            <h3 style={{ fontSize: '18px', fontWeight: 700 }}>
              {isEditMode ? 'Editar Habilidad' : 'Nueva Habilidad'}
            </h3>
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
              placeholder="Ej. Python & FastAPI Backend"
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
              placeholder="Notas u objetivos de la habilidad..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Modal Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary">
              {isEditMode ? 'Guardar Cambios' : 'Crear Habilidad'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
