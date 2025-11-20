import React, { useState, useEffect } from 'react';
import { X, Check, Sparkles } from 'lucide-react';
import { Habit } from '../types';
import { HABIT_COLORS, HABIT_ICONS } from '../constants';
import { getHabitSuggestion } from '../services/geminiService';

interface AddHabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (habit: Omit<Habit, 'id' | 'createdAt'>) => void;
  onUpdate?: (habit: Habit) => void;
  habitToEdit?: Habit | null;
}

export const AddHabitModal: React.FC<AddHabitModalProps> = ({ 
  isOpen, 
  onClose, 
  onAdd, 
  onUpdate,
  habitToEdit 
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(HABIT_COLORS[0]);
  const [icon, setIcon] = useState('Activity');
  const [frequency, setFrequency] = useState(7);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestions, setSuggestions] = useState<Partial<Habit>[]>([]);

  useEffect(() => {
    if (isOpen) {
      if (habitToEdit) {
        setName(habitToEdit.name);
        setDescription(habitToEdit.description || '');
        setColor(habitToEdit.color);
        setIcon(habitToEdit.icon);
        setFrequency(habitToEdit.targetFrequency);
      } else {
        setName('');
        setDescription('');
        setColor(HABIT_COLORS[0]);
        setIcon('Activity');
        setFrequency(7);
        setSuggestions([]);
      }
    }
  }, [isOpen, habitToEdit]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    const habitData = {
      name,
      description,
      color,
      icon,
      targetFrequency: frequency
    };

    if (habitToEdit && onUpdate) {
      onUpdate({
        ...habitToEdit,
        ...habitData
      });
    } else {
      onAdd(habitData);
    }
    handleClose();
  };

  const handleClose = () => {
    onClose();
  };

  const handleAISuggestion = async () => {
    if (!name) return;
    setIsSuggesting(true);
    try {
      const results = await getHabitSuggestion(name);
      setSuggestions(results);
    } catch (e) {
      // Error handling silently
    } finally {
      setIsSuggesting(false);
    }
  };

  const applySuggestion = (s: Partial<Habit>) => {
    setName(s.name || name);
    setDescription(s.description || '');
    if (s.targetFrequency) setFrequency(s.targetFrequency);
    setSuggestions([]);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800">
            {habitToEdit ? '습관 수정하기' : '새로운 습관 만들기'}
          </h2>
          <button onClick={handleClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Name & AI Suggestion */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">습관 이름 / 목표</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="예: 건강해지기, 매일 러닝..."
                  className="flex-1 px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
                {!habitToEdit && (
                  <button
                    type="button"
                    onClick={handleAISuggestion}
                    disabled={!name || isSuggesting}
                    className="px-3 py-2 bg-violet-100 text-violet-700 rounded-xl hover:bg-violet-200 transition-colors disabled:opacity-50 flex items-center gap-1 text-sm font-medium"
                  >
                    <Sparkles size={16} />
                    {isSuggesting ? '...' : 'AI 제안'}
                  </button>
                )}
              </div>
              
              {suggestions.length > 0 && (
                <div className="mt-2 bg-violet-50 p-3 rounded-xl space-y-2 animate-in fade-in slide-in-from-top-2">
                  <p className="text-xs font-bold text-violet-800 uppercase tracking-wider">AI 추천 습관</p>
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => applySuggestion(s)}
                      className="w-full text-left p-2 bg-white rounded-lg border border-violet-100 hover:border-violet-300 hover:shadow-sm transition-all text-sm"
                    >
                      <span className="font-medium text-slate-800 block">{s.name}</span>
                      <span className="text-slate-500 text-xs">{s.description}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">설명 (선택)</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="나를 위한 동기부여 메시지"
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>

            {/* Frequency */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="block text-sm font-medium text-slate-700">주간 목표 횟수</label>
                <span className="text-sm font-bold text-indigo-600">{frequency}일 / 주</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="7" 
                value={frequency} 
                onChange={(e) => setFrequency(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div className="flex justify-between text-xs text-slate-400 px-1">
                <span>1일</span>
                <span>매일</span>
              </div>
            </div>

            {/* Color Picker */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">색상 선택</label>
              <div className="flex flex-wrap gap-3">
                {HABIT_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${c} ${
                      color === c ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : ''
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Icon Picker */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">아이콘 선택</label>
              <div className="grid grid-cols-6 gap-2">
                {HABIT_ICONS.map((ic) => {
                  const IconComp = ic.component;
                  return (
                    <button
                      key={ic.name}
                      type="button"
                      onClick={() => setIcon(ic.name)}
                      className={`p-2 rounded-lg flex items-center justify-center transition-colors ${
                        icon === ic.name 
                          ? 'bg-indigo-100 text-indigo-600 ring-2 ring-indigo-500' 
                          : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      <IconComp size={20} />
                    </button>
                  );
                })}
              </div>
            </div>

          </form>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50">
          <button
            onClick={handleSubmit}
            disabled={!name}
            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Check size={20} />
            {habitToEdit ? '수정 완료' : '습관 시작하기'}
          </button>
        </div>
      </div>
    </div>
  );
};