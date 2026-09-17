import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import StatsCards from './components/StatsCards';
import Heatmap from './components/Heatmap';
import SkillList from './components/SkillList';
import SessionsList from './components/SessionsList';
import MilestonesList from './components/MilestonesList';
import TasksList from './components/TasksList';
import LogModal from './components/LogModal';
import NewSkillModal from './components/NewSkillModal';
import EditSkillModal from './components/EditSkillModal';
import DataBackupModal from './components/DataBackupModal';
import FilterBar from './components/FilterBar';
import CustomFilterModal from './components/CustomFilterModal';
import SkillSessionsChart from './components/SkillSessionsChart';
import { getTodayString, getCurrentYear, getCurrentMonth, isSessionInTimeFilter } from './utils/dateUtils';
import { RefreshCw, Server, AlertCircle, Target, Clock, Award, CheckSquare } from 'lucide-react';

export default function App() {
  const [stats, setStats] = useState({
    total_hours: 0,
    total_skills: 0,
    heatmap: [],
    categories: [],
    skills: [],
    logs: [],
    milestones: [],
    tasks: []
  });

  const [categoriesList, setCategoriesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncLoading, setSyncLoading] = useState(false);
  const [error, setError] = useState(null);
  const [authToken, setAuthToken] = useState(localStorage.getItem('token') || '');

  const [activeTab, setActiveTab] = useState('skills'); // 'skills' | 'sessions' | 'milestones' | 'tasks'
  const [selectedSkillFilter, setSelectedSkillFilter] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(true);

  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState(null);
  const [selectedSkillId, setSelectedSkillId] = useState('');

  // Time Filter State matching Android version
  const [timeFilter, setTimeFilter] = useState('all'); // 'all' | 'week' | 'month' | 'year' | 'custom'
  const [isCustomFilterOpen, setIsCustomFilterOpen] = useState(false);
  const [customFilterMode, setCustomFilterMode] = useState('day'); // 'day' | 'week' | 'month' | 'year'
  const [selectedDayDate, setSelectedDayDate] = useState(getTodayString());
  const [selectedWeekDate, setSelectedWeekDate] = useState(getTodayString());
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [selectedYear, setSelectedYear] = useState(getCurrentYear());

  // Initial authentication & fetch
  useEffect(() => {
    async function initAuthAndFetch() {
      try {
        setLoading(true);
        let token = authToken;

        // Auto login or register demo user if not authenticated
        if (!token) {
          const loginRes = await fetch('/api/v1/auth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ username: 'demo@example.com', password: 'password123' })
          });

          if (loginRes.ok) {
            const data = await loginRes.json();
            token = data.access_token;
            localStorage.setItem('token', token);
            setAuthToken(token);
          } else {
            // Register demo user
            await fetch('/api/v1/auth/register', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: 'demo@example.com', password: 'password123', full_name: 'Demo Homelab User' })
            });
            const retryRes = await fetch('/api/v1/auth/token', {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: new URLSearchParams({ username: 'demo@example.com', password: 'password123' })
            });
            const data = await retryRes.json();
            token = data.access_token;
            localStorage.setItem('token', token);
            setAuthToken(token);
          }
        }

        await fetchCategories(token);
        await fetchDashboardData(token);
      } catch (err) {
        console.error("Dashboard init error:", err);
        setError("Could not connect to FastAPI backend server.");
      } finally {
        setLoading(false);
      }
    }

    initAuthAndFetch();
  }, []);

  const fetchCategories = async (token = authToken) => {
    try {
      const res = await fetch('/api/v1/categories', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCategoriesList(data);
      }
    } catch (err) {
      console.error("Fetch categories error:", err);
    }
  };

  const fetchDashboardData = async (token = authToken) => {
    try {
      const res = await fetch('/api/v1/stats/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
        setError(null);
      }
    } catch (err) {
      console.error("Fetch dashboard error:", err);
    }
  };

  const handleSync = async () => {
    setSyncLoading(true);
    try {
      const res = await fetch('/api/v1/sync/pull', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
        await fetchCategories();
        await fetchDashboardData();
      }
    } catch (err) {
      console.error("Sync error:", err);
    } finally {
      setSyncLoading(false);
    }
  };

  const handleCreateCategory = async (catData) => {
    try {
      const res = await fetch('/api/v1/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify(catData)
      });
      if (res.ok) {
        const newCat = await res.json();
        await fetchCategories();
        await fetchDashboardData();
        return newCat;
      }
    } catch (err) {
      console.error("Create category error:", err);
    }
  };

  const handleCreateLog = async (logData) => {
    try {
      const res = await fetch('/api/v1/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify(logData)
      });
      if (res.ok) {
        await fetchDashboardData();
      }
    } catch (err) {
      console.error("Create log error:", err);
    }
  };

  const handleUpdateLog = async (logId, logData) => {
    try {
      const res = await fetch(`/api/v1/logs/${logId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify(logData)
      });
      if (res.ok) {
        await fetchDashboardData();
      }
    } catch (err) {
      console.error("Update log error:", err);
    }
  };

  const handleDeleteLog = async (logId) => {
    try {
      const res = await fetch(`/api/v1/logs/${logId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });
      if (res.ok) {
        await fetchDashboardData();
      }
    } catch (err) {
      console.error("Delete log error:", err);
    }
  };

  const handleCreateSkill = async (skillData) => {
    try {
      const res = await fetch('/api/v1/skills', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify(skillData)
      });
      if (res.ok) {
        await fetchDashboardData();
      }
    } catch (err) {
      console.error("Create skill error:", err);
    }
  };

  const handleUpdateSkill = async (skillId, skillData) => {
    try {
      const res = await fetch(`/api/v1/skills/${skillId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify(skillData)
      });
      if (res.ok) {
        await fetchDashboardData();
      }
    } catch (err) {
      console.error("Update skill error:", err);
    }
  };

  const handleToggleArchiveSkill = async (skill) => {
    await handleUpdateSkill(skill.id, { is_archived: !skill.is_archived });
  };

  const handleDeleteSkill = async (skillId) => {
    try {
      const res = await fetch(`/api/v1/skills/${skillId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });
      if (res.ok) {
        await fetchDashboardData();
      }
    } catch (err) {
      console.error("Delete skill error:", err);
    }
  };

  const handleCreateMilestone = async (msData) => {
    try {
      const res = await fetch('/api/v1/milestones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify(msData)
      });
      if (res.ok) {
        await fetchDashboardData();
      }
    } catch (err) {
      console.error("Create milestone error:", err);
    }
  };

  const handleUpdateMilestone = async (msId, msData) => {
    try {
      const res = await fetch(`/api/v1/milestones/${msId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify(msData)
      });
      if (res.ok) {
        await fetchDashboardData();
      }
    } catch (err) {
      console.error("Update milestone error:", err);
    }
  };

  const handleDeleteMilestone = async (msId) => {
    try {
      const res = await fetch(`/api/v1/milestones/${msId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });
      if (res.ok) {
        await fetchDashboardData();
      }
    } catch (err) {
      console.error("Delete milestone error:", err);
    }
  };

  const handleToggleTaskComplete = async (taskId, isCompleted) => {
    try {
      const res = await fetch(`/api/v1/milestones/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ is_completed: isCompleted })
      });
      if (res.ok) {
        await fetchDashboardData();
      }
    } catch (err) {
      console.error("Toggle task complete error:", err);
    }
  };

  const handleQuickLog = (skillId) => {
    setSelectedSkillId(skillId);
    setIsLogModalOpen(true);
  };

  const handleEditSkill = (skill) => {
    setEditingSkill(skill);
    setIsEditModalOpen(true);
  };

  const handleViewSkillSessions = (skillId) => {
    setSelectedSkillFilter(skillId);
    setActiveTab('sessions');
  };

  const handleViewSkillMilestones = (skillId) => {
    setSelectedSkillFilter(skillId);
    setActiveTab('milestones');
  };

  const handleViewSkillTasks = (skillId) => {
    setSelectedSkillFilter(skillId);
    setActiveTab('tasks');
  };

  // Filter practice logs based on selected timeFilter
  const filteredLogs = (stats.logs || []).filter((log) =>
    isSessionInTimeFilter(
      log.logged_at,
      timeFilter,
      customFilterMode,
      selectedDayDate,
      selectedYear,
      selectedMonth,
      selectedWeekDate
    )
  );

  const filteredTotalHours = timeFilter === 'all'
    ? stats.total_hours
    : parseFloat((filteredLogs.reduce((acc, curr) => acc + (curr.duration_minutes || 0), 0) / 60.0).toFixed(1));

  const getCustomFilterSummary = () => {
    if (customFilterMode === 'day') return selectedDayDate;
    if (customFilterMode === 'week') return `Semana ${selectedWeekDate}`;
    if (customFilterMode === 'month') return `Mes ${selectedMonth}/${selectedYear}`;
    if (customFilterMode === 'year') return `Año ${selectedYear}`;
    return '';
  };

  return (
    <div className={`app-layout ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      <Header
        onOpenLog={() => { setSelectedSkillId(stats.skills[0]?.id || ''); setIsLogModalOpen(true); }}
        onOpenSkill={() => setIsSkillModalOpen(true)}
        onOpenBackup={() => setIsBackupModalOpen(true)}
        onSync={handleSync}
        syncLoading={syncLoading}
        isDarkMode={isDarkMode}
        onToggleTheme={() => setIsDarkMode(!isDarkMode)}
      />

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#FCA5A5', padding: '12px 16px', borderRadius: '12px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: '#94A3B8' }}>
          <RefreshCw size={32} className="animate-spin" style={{ margin: '0 auto 16px auto', display: 'block' }} />
          <span>Conectando al servidor Homelab...</span>
        </div>
      ) : (
        <>
          <FilterBar
            timeFilter={timeFilter}
            setTimeFilter={setTimeFilter}
            onOpenCustomFilter={() => setIsCustomFilterOpen(true)}
            customFilterSummary={getCustomFilterSummary()}
          />

          <StatsCards
            totalHours={filteredTotalHours}
            totalSkills={stats.skills.filter(s => !s.is_archived).length}
            categoryCount={stats.categories.length}
            streakDays={14}
          />

          {/* Navigation Tabs */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '12px', flexWrap: 'wrap' }}>
            <button
              style={{
                background: activeTab === 'skills' ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                border: activeTab === 'skills' ? '1px solid #3B82F6' : '1px solid transparent',
                color: activeTab === 'skills' ? '#F8FAFC' : '#94A3B8',
                padding: '8px 16px',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onClick={() => setActiveTab('skills')}
            >
              <Target size={16} color="#60A5FA" />
              <span>Habilidades ({stats.skills.filter(s => !s.is_archived).length})</span>
            </button>

            <button
              style={{
                background: activeTab === 'sessions' ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                border: activeTab === 'sessions' ? '1px solid #3B82F6' : '1px solid transparent',
                color: activeTab === 'sessions' ? '#F8FAFC' : '#94A3B8',
                padding: '8px 16px',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onClick={() => setActiveTab('sessions')}
            >
              <Clock size={16} color="#34D399" />
              <span>Sesiones ({stats.logs.length})</span>
            </button>

            <button
              style={{
                background: activeTab === 'milestones' ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                border: activeTab === 'milestones' ? '1px solid #3B82F6' : '1px solid transparent',
                color: activeTab === 'milestones' ? '#F8FAFC' : '#94A3B8',
                padding: '8px 16px',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onClick={() => setActiveTab('milestones')}
            >
              <Award size={16} color="#A78BFA" />
              <span>Hitos ({stats.milestones.length})</span>
            </button>

            <button
              style={{
                background: activeTab === 'tasks' ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                border: activeTab === 'tasks' ? '1px solid #3B82F6' : '1px solid transparent',
                color: activeTab === 'tasks' ? '#F8FAFC' : '#94A3B8',
                padding: '8px 16px',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onClick={() => setActiveTab('tasks')}
            >
              <CheckSquare size={16} color="#34D399" />
              <span>Tareas ({stats.tasks.length})</span>
            </button>
          </div>

          <div className="main-dashboard-grid">
            <div>
              {activeTab === 'skills' && (
                <>
                  <SkillSessionsChart
                    skills={stats.skills}
                    logs={filteredLogs}
                    filterLabel={timeFilter === 'all' ? '' : (getCustomFilterSummary() || timeFilter)}
                  />
                  <Heatmap heatmapData={stats.heatmap} />
                  <SkillList
                    skills={stats.skills}
                    onQuickLog={handleQuickLog}
                    onEditSkill={handleEditSkill}
                    onDeleteSkill={handleDeleteSkill}
                    onToggleArchiveSkill={handleToggleArchiveSkill}
                    onViewSkillSessions={handleViewSkillSessions}
                    onViewSkillMilestones={handleViewSkillMilestones}
                    onViewSkillTasks={handleViewSkillTasks}
                  />
                </>
              )}

              {activeTab === 'sessions' && (
                <SessionsList
                  logs={filteredLogs}
                  skills={stats.skills}
                  selectedSkillFilter={selectedSkillFilter}
                  onSkillFilterChange={setSelectedSkillFilter}
                  onUpdateLog={handleUpdateLog}
                  onDeleteLog={handleDeleteLog}
                />
              )}

              {activeTab === 'milestones' && (
                <MilestonesList
                  milestones={stats.milestones}
                  skills={stats.skills}
                  selectedSkillFilter={selectedSkillFilter}
                  onSkillFilterChange={setSelectedSkillFilter}
                  onCreateMilestone={handleCreateMilestone}
                  onUpdateMilestone={handleUpdateMilestone}
                  onDeleteMilestone={handleDeleteMilestone}
                />
              )}

              {activeTab === 'tasks' && (
                <TasksList
                  tasks={stats.tasks}
                  skills={stats.skills}
                  selectedSkillFilter={selectedSkillFilter}
                  onSkillFilterChange={setSelectedSkillFilter}
                  onCreateTask={handleCreateMilestone}
                  onUpdateTask={handleUpdateMilestone}
                  onDeleteTask={handleDeleteMilestone}
                  onToggleTaskComplete={handleToggleTaskComplete}
                />
              )}
            </div>

            <div>
              {/* Category Hours Breakdown Card */}
              <div className="glass-card" style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Distribución por Categorías</h3>
                {stats.categories.length === 0 ? (
                  <div style={{ fontSize: '13px', color: '#94A3B8' }}>Sin datos de categorías aún.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {stats.categories.map((c, idx) => (
                      <div key={idx}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: c.color }} />
                            <span>{c.category}</span>
                          </span>
                          <span style={{ fontWeight: 600 }}>{c.hours} hrs</span>
                        </div>
                        <div className="progress-bar-bg" style={{ height: 6 }}>
                          <div
                            className="progress-bar-fill"
                            style={{
                              width: `${Math.min(100, (c.hours / (stats.total_hours || 1)) * 100)}%`,
                              backgroundColor: c.color
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sync Metadata Card */}
              <div className="glass-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <Server size={18} color="#A78BFA" />
                  <h3 style={{ fontSize: '15px', fontWeight: 700 }}>Motor de Sincronización</h3>
                </div>
                <p style={{ fontSize: '13px', color: '#94A3B8', lineHeight: 1.5 }}>
                  El servidor central resuelve conflictos vía <strong>Last-Write-Wins (LWW)</strong>. Los clientes Android Room SQLite y Web comunican usando claves <strong>UUIDv4</strong> y borrado suave.
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modals */}
      <LogModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        skills={stats.skills}
        defaultSkillId={selectedSkillId}
        onSubmit={handleCreateLog}
      />

      <NewSkillModal
        isOpen={isSkillModalOpen}
        onClose={() => setIsSkillModalOpen(false)}
        onSubmit={handleCreateSkill}
        categories={categoriesList}
        onCreateCategory={handleCreateCategory}
      />

      <EditSkillModal
        isOpen={isEditModalOpen}
        onClose={() => { setIsEditModalOpen(false); setEditingSkill(null); }}
        skill={editingSkill}
        categories={categoriesList}
        onSubmit={handleUpdateSkill}
        onDelete={handleDeleteSkill}
        onCreateCategory={handleCreateCategory}
      />

      <DataBackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        stats={stats}
        authToken={authToken}
        onImportSuccess={() => { fetchCategories(); fetchDashboardData(); }}
      />

      <CustomFilterModal
        isOpen={isCustomFilterOpen}
        onClose={() => setIsCustomFilterOpen(false)}
        customFilterMode={customFilterMode}
        setCustomFilterMode={setCustomFilterMode}
        selectedDayDate={selectedDayDate}
        setSelectedDayDate={setSelectedDayDate}
        selectedWeekDate={selectedWeekDate}
        setSelectedWeekDate={setSelectedWeekDate}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        onApply={() => setTimeFilter('custom')}
      />
    </div>
  );
}
