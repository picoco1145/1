import React, { useState, useEffect } from 'react';
import { LayoutDashboard, BarChart3, Plus, Bot } from 'lucide-react';
import { Habit, HabitLog, ViewMode, Retrospective } from './types';
import { INITIAL_HABITS } from './constants';
import { HabitList } from './components/HabitList';
import { Analytics } from './components/Analytics';
import { AICoach } from './components/AICoach';
import { AddHabitModal } from './components/AddHabitModal';

// Safe ID generator for environments where crypto.randomUUID might not be available
const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

function App() {
  const [habits, setHabits] = useState<Habit[]>(() => {
    const saved = localStorage.getItem('habits');
    return saved ? JSON.parse(saved) : INITIAL_HABITS;
  });

  const [logs, setLogs] = useState<HabitLog[]>(() => {
    const saved = localStorage.getItem('logs');
    return saved ? JSON.parse(saved) : [];
  });

  const [retrospectives, setRetrospectives] = useState<Retrospective[]>(() => {
    const saved = localStorage.getItem('retrospectives');
    return saved ? JSON.parse(saved) : [];
  });

  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.DASHBOARD);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  // Confirmation Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem('habits', JSON.stringify(habits));
  }, [habits]);

  useEffect(() => {
    localStorage.setItem('logs', JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    localStorage.setItem('retrospectives', JSON.stringify(retrospectives));
  }, [retrospectives]);

  // Handlers
  const handleAddHabit = (newHabitData: Omit<Habit, 'id' | 'createdAt'>) => {
    const newHabit: Habit = {
      ...newHabitData,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    setHabits(prev => [...prev, newHabit]);
  };

  const handleUpdateHabit = (updatedHabit: Habit) => {
    setHabits(prev => prev.map(h => h.id === updatedHabit.id ? updatedHabit : h));
    setEditingHabit(null);
  };

  const handleEditClick = (habit: Habit) => {
    setEditingHabit(habit);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingHabit(null);
  };

  const handleDeleteHabit = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: '습관 삭제',
      message: '정말 이 습관을 삭제하시겠습니까? 관련된 모든 기록이 영구적으로 삭제됩니다.',
      onConfirm: () => {
        setHabits(prev => prev.filter(h => h.id !== id));
        setLogs(prev => prev.filter(l => l.habitId !== id));
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleToggleHabit = (habitId: string, date: string) => {
    setLogs(prev => {
      const exists = prev.find(l => l.habitId === habitId && l.date === date);
      if (exists) {
        if (exists.completed) {
          return prev.filter(l => !(l.habitId === habitId && l.date === date));
        }
        return prev;
      } else {
        return [...prev, { id: generateId(), habitId, date, completed: true }];
      }
    });
  };

  const handleAddRetrospective = (retro: Omit<Retrospective, 'id' | 'createdAt'>) => {
    const newRetro: Retrospective = {
      ...retro,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    setRetrospectives(prev => [newRetro, ...prev]); // Add to top
  };

  const handleDeleteRetrospective = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: '회고 삭제',
      message: '이 회고 기록을 삭제하시겠습니까?',
      onConfirm: () => {
        setRetrospectives(prev => prev.filter(r => r.id !== id));
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const renderContent = () => {
    switch (viewMode) {
      case ViewMode.DASHBOARD:
        return (
          <HabitList 
            habits={habits} 
            logs={logs} 
            onToggle={handleToggleHabit} 
            onDelete={handleDeleteHabit}
            onEdit={handleEditClick}
          />
        );
      case ViewMode.ANALYTICS:
        return (
          <Analytics 
            habits={habits} 
            logs={logs} 
            retrospectives={retrospectives}
            onSaveRetrospective={handleAddRetrospective}
            onDeleteRetrospective={handleDeleteRetrospective}
          />
        );
      case ViewMode.AI_COACH:
        return <AICoach habits={habits} logs={logs} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24 sm:pb-0">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
               <span className="text-white font-bold text-lg">H</span>
             </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">HabitFlow AI</h1>
          </div>
          <div className="text-sm text-slate-500 hidden sm:block">
             {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'})}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-6">
        {/* Greeting */}
        {viewMode === ViewMode.DASHBOARD && (
          <div className="mb-6">
             <h2 className="text-2xl font-bold text-slate-800">오늘도 성장을 위해<br />작은 발걸음을 떼어볼까요?</h2>
          </div>
        )}
        
        {renderContent()}
      </main>

      {/* Floating Action Button (Mobile Add) */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-24 right-4 sm:bottom-8 sm:right-8 w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg shadow-indigo-300 flex items-center justify-center transition-transform hover:scale-110 active:scale-95 z-40"
      >
        <Plus size={28} />
      </button>

      {/* Bottom Navigation (Mobile First) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-3 z-40 sm:hidden">
        <div className="flex justify-between items-center max-w-md mx-auto">
          <NavButton 
            active={viewMode === ViewMode.DASHBOARD} 
            onClick={() => setViewMode(ViewMode.DASHBOARD)} 
            icon={LayoutDashboard} 
            label="오늘" 
          />
          <NavButton 
            active={viewMode === ViewMode.ANALYTICS} 
            onClick={() => setViewMode(ViewMode.ANALYTICS)} 
            icon={BarChart3} 
            label="통계" 
          />
          <NavButton 
            active={viewMode === ViewMode.AI_COACH} 
            onClick={() => setViewMode(ViewMode.AI_COACH)} 
            icon={Bot} 
            label="AI 코치" 
          />
        </div>
      </nav>

      {/* Desktop Navigation */}
      <div className="hidden sm:flex fixed bottom-8 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-md border border-slate-200 shadow-2xl rounded-full px-6 py-2 gap-8 z-40">
         <NavButton 
            active={viewMode === ViewMode.DASHBOARD} 
            onClick={() => setViewMode(ViewMode.DASHBOARD)} 
            icon={LayoutDashboard} 
            label="오늘의 습관" 
          />
          <NavButton 
            active={viewMode === ViewMode.ANALYTICS} 
            onClick={() => setViewMode(ViewMode.ANALYTICS)} 
            icon={BarChart3} 
            label="성장 통계" 
          />
          <NavButton 
            active={viewMode === ViewMode.AI_COACH} 
            onClick={() => setViewMode(ViewMode.AI_COACH)} 
            icon={Bot} 
            label="AI 코치" 
          />
      </div>

      <AddHabitModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        onAdd={handleAddHabit} 
        onUpdate={handleUpdateHabit}
        habitToEdit={editingHabit}
      />

      {/* Custom Confirmation Modal */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200 scale-100">
              <h3 className="text-lg font-bold text-slate-800 mb-2">{confirmDialog.title}</h3>
              <p className="text-slate-600 mb-6 leading-relaxed text-sm">{confirmDialog.message}</p>
              <div className="flex gap-3 justify-end">
                 <button 
                   onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))} 
                   className="px-4 py-2.5 text-slate-500 font-bold text-sm bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                 >
                   취소
                 </button>
                 <button 
                   onClick={confirmDialog.onConfirm} 
                   className="px-4 py-2.5 bg-red-500 text-white font-bold text-sm rounded-xl hover:bg-red-600 shadow-lg shadow-red-200 transition-colors"
                 >
                   삭제하기
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

interface NavButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
}

const NavButton: React.FC<NavButtonProps> = ({ active, onClick, icon: Icon, label }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center gap-1 transition-colors ${
      active ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
    }`}
  >
    <Icon size={24} className={active ? 'fill-current' : ''} strokeWidth={active ? 2.5 : 2} />
    <span className="text-[10px] font-medium">{label}</span>
  </button>
);

export default App;