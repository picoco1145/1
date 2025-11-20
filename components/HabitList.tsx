import React, { useState } from 'react';
import { Habit, HabitLog } from '../types';
import { HABIT_ICONS } from '../constants';
import { Check, Flame, Trash2, Pencil, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface HabitListProps {
  habits: Habit[];
  logs: HabitLog[];
  onToggle: (habitId: string, date: string) => void;
  onDelete: (habitId: string) => void;
  onEdit: (habit: Habit) => void;
}

export const HabitList: React.FC<HabitListProps> = ({ habits, logs, onToggle, onDelete, onEdit }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Helper to get YYYY-MM-DD in local time
  const getLocalDateStr = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const dateStr = getLocalDateStr(currentDate);
  const todayStr = getLocalDateStr(new Date());
  const isToday = dateStr === todayStr;

  const handlePrevDate = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 1);
    setCurrentDate(newDate);
  };

  const handleNextDate = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 1);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Streak calculation (Always relative to Real Today)
  const getStreak = (habitId: string) => {
    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dStr = getLocalDateStr(d);
      
      const hasLog = logs.find(l => l.habitId === habitId && l.date === dStr && l.completed);
      
      if (i === 0 && !hasLog) continue; // Skip today if not done yet

      if (hasLog) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  return (
    <div className="space-y-4">
      {/* Date Navigation */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-sm mb-6">
        <button 
            onClick={handlePrevDate} 
            className="p-2 hover:bg-slate-50 rounded-full text-slate-400 hover:text-indigo-600 transition-colors"
        >
            <ChevronLeft size={24} />
        </button>
        
        <div className="flex flex-col items-center cursor-pointer select-none" onClick={goToToday}>
            <div className="flex items-center gap-2 text-lg font-bold text-slate-800">
                <Calendar size={20} className="text-indigo-500 mb-0.5"/>
                {currentDate.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}
            </div>
            {!isToday && (
                <span className="text-xs text-indigo-500 font-bold mt-1 bg-indigo-50 px-2 py-0.5 rounded-full animate-pulse">
                    오늘로 이동
                </span>
            )}
        </div>

        <button 
            onClick={handleNextDate} 
            className="p-2 hover:bg-slate-50 rounded-full text-slate-400 hover:text-indigo-600 transition-colors"
        >
            <ChevronRight size={24} />
        </button>
      </div>

      {/* List */}
      {habits.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
          <p className="text-slate-400 font-medium">아직 등록된 습관이 없습니다.</p>
          <p className="text-slate-400 text-sm mt-2">우측 하단의 + 버튼을 눌러 시작해보세요!</p>
        </div>
      ) : (
        habits.map((habit) => {
          const IconComponent = HABIT_ICONS.find(i => i.name === habit.icon)?.component || HABIT_ICONS[0].component;
          const isCompleted = logs.some(
            l => l.habitId === habit.id && l.date === dateStr && l.completed
          );
          const streak = getStreak(habit.id);

          return (
            <div 
              key={habit.id} 
              className="group bg-white p-4 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all flex items-center gap-4"
            >
              {/* Icon */}
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md transition-transform group-hover:scale-105 ${habit.color}`}>
                <IconComponent size={24} />
              </div>

              {/* Content */}
              <div className="flex-1">
                <h3 className="font-bold text-slate-800">{habit.name}</h3>
                {habit.description && (
                  <p className="text-xs text-slate-500 truncate max-w-[180px] sm:max-w-xs">{habit.description}</p>
                )}
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex items-center gap-1 text-xs font-medium text-orange-500 bg-orange-50 px-2 py-0.5 rounded-md">
                    <Flame size={12} className={streak > 0 ? "fill-orange-500" : ""} />
                    {streak}일 연속
                  </div>
                  <div className="text-xs text-slate-400">
                     {habit.targetFrequency}회/주
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit(habit); }}
                  className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                  title="습관 수정"
                >
                  <Pencil size={20} />
                </button>

                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(habit.id); }}
                  className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                  title="습관 삭제"
                >
                  <Trash2 size={20} />
                </button>
                
                <button
                  onClick={(e) => { e.stopPropagation(); onToggle(habit.id, dateStr); }}
                  className={`ml-2 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isCompleted 
                      ? 'bg-indigo-600 text-white shadow-indigo-200 shadow-lg scale-105' 
                      : 'bg-slate-100 text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  <Check size={24} strokeWidth={3} className={isCompleted ? 'animate-in zoom-in duration-300' : ''}/>
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};