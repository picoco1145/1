import React, { useState, useEffect } from 'react';
import { Habit, HabitLog, Retrospective } from '../types';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, BarChart3, FileText, Download, Sparkles, Loader2, Save, History, Trash2, FileDown } from 'lucide-react';
import { generateRetrospective } from '../services/geminiService';

interface AnalyticsProps {
  habits: Habit[];
  logs: HabitLog[];
  retrospectives: Retrospective[];
  onSaveRetrospective: (retro: Omit<Retrospective, 'id' | 'createdAt'>) => void;
  onDeleteRetrospective: (id: string) => void;
}

// Tailwind colors map for Recharts
const TAILWIND_COLORS: Record<string, string> = {
  'bg-red-500': '#ef4444',
  'bg-orange-500': '#f97316',
  'bg-amber-500': '#f59e0b',
  'bg-green-500': '#22c55e',
  'bg-emerald-500': '#10b981',
  'bg-teal-500': '#14b8a6',
  'bg-cyan-500': '#06b6d4',
  'bg-blue-500': '#3b82f6',
  'bg-indigo-500': '#6366f1',
  'bg-violet-500': '#8b5cf6',
  'bg-purple-500': '#a855f7',
  'bg-fuchsia-500': '#d946ef',
  'bg-pink-500': '#ec4899',
  'bg-rose-500': '#f43f5e',
  'bg-slate-500': '#64748b', // Fallback
};

export const Analytics: React.FC<AnalyticsProps> = ({ 
  habits, 
  logs, 
  retrospectives, 
  onSaveRetrospective,
  onDeleteRetrospective 
}) => {
  const [viewMode, setViewMode] = useState<'WEEKLY' | 'MONTHLY'>('WEEKLY');
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Retrospective State
  const [reviewContent, setReviewContent] = useState<string>('');
  const [isReviewLoading, setIsReviewLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [activeDateRange, setActiveDateRange] = useState<{start: string, end: string}>({start: '', end: ''});

  // Reset review content when view changes
  useEffect(() => {
    setReviewContent('');
    setShowHistory(false);
  }, [viewMode, currentDate]);

  // --- Date & Navigation Logic ---
  
  // Get the Monday of the week for the given date
  const getMonday = (d: Date) => {
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    return new Date(d.setDate(diff));
  };

  const getDateRange = () => {
    if (viewMode === 'WEEKLY') {
      const monday = getMonday(new Date(currentDate));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      return {
        start: monday.toISOString().split('T')[0],
        end: sunday.toISOString().split('T')[0]
      };
    } else {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      return {
        start: new Date(year, month, 1).toISOString().split('T')[0],
        end: new Date(year, month + 1, 0).toISOString().split('T')[0]
      };
    }
  };

  const handlePrev = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'WEEKLY') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'WEEKLY') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  // --- Weekly Chart Data Logic (Stacked) ---
  const getWeeklyData = () => {
    const monday = getMonday(new Date(currentDate));
    const data = [];
    const days = ['일', '월', '화', '수', '목', '금', '토'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      
      // Base entry
      const entry: any = {
        day: days[d.getDay()], // Display label
        date: dateStr,
        fullDate: d,
        totalCompleted: 0
      };

      // Add property for each habit if completed
      let dayCompletedCount = 0;
      habits.forEach(habit => {
        const isCompleted = logs.some(l => l.habitId === habit.id && l.date === dateStr && l.completed);
        if (isCompleted) {
          entry[habit.id] = 1; // Value 1 for stack height
          dayCompletedCount++;
        } else {
          entry[habit.id] = 0;
        }
      });
      entry.totalCompleted = dayCompletedCount;
      
      data.push(entry);
    }
    return data;
  };

  const weeklyData = getWeeklyData();
  
  // Stats for top cards
  const currentRange = getDateRange();
  const rangeLogs = logs.filter(l => l.date >= currentRange.start && l.date <= currentRange.end && l.completed);
  const totalCompletedInRange = rangeLogs.length;

  // --- Monthly Calendar Logic ---
  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay(); // 0 (Sun) - 6 (Sat)

    const days = [];
    
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      const yearStr = d.getFullYear();
      const monthStr = String(d.getMonth() + 1).padStart(2, '0');
      const dayStr = String(d.getDate()).padStart(2, '0');
      const dateStr = `${yearStr}-${monthStr}-${dayStr}`;
      
      days.push({ date: i, fullDate: dateStr });
    }

    return days;
  };

  const calendarDays = getDaysInMonth();
  
  const headerTitle = viewMode === 'WEEKLY' 
    ? (() => {
        const range = getDateRange();
        const s = new Date(range.start);
        const e = new Date(range.end);
        return `${s.getMonth() + 1}월 ${s.getDate()}일 ~ ${e.getMonth() + 1}월 ${e.getDate()}일`;
      })()
    : currentDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' });


  // --- Donut Chart Component ---
  const DayDonut = ({ dateStr, dayNumber }: { dateStr: string, dayNumber: number }) => {
    const activeHabits = habits.filter(h => h.createdAt.split('T')[0] <= dateStr);
    const completedCount = logs.filter(l => l.date === dateStr && l.completed).length;
    const total = activeHabits.length;
    const percentage = total === 0 ? 0 : Math.min(1, completedCount / total);
    const isFuture = new Date(dateStr) > new Date();
    const isToday = dateStr === new Date().toISOString().split('T')[0];

    if (isFuture) {
       return (
         <div className="w-full h-full flex items-center justify-center bg-slate-50/50 rounded-lg">
           <span className="text-slate-300 text-sm font-medium">{dayNumber}</span>
         </div>
       );
    }

    if (total === 0) {
        return (
         <div className="w-full h-full flex items-center justify-center bg-slate-50 rounded-lg">
           <span className="text-slate-400 text-sm font-medium">{dayNumber}</span>
         </div>
       );
    }

    const size = 36; 
    const strokeWidth = 3.5;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (percentage * circumference);
    const strokeColor = percentage === 1 ? 'text-emerald-500' : 'text-indigo-500';

    return (
      <div className="relative flex items-center justify-center w-full h-full p-1 hover:bg-slate-50 rounded-lg transition-colors cursor-default group">
        <div className="relative" style={{ width: size, height: size }}>
            <svg className="transform -rotate-90 w-full h-full">
            <circle
                className="text-slate-100"
                strokeWidth={strokeWidth}
                stroke="currentColor"
                fill="transparent"
                r={radius}
                cx={size / 2}
                cy={size / 2}
            />
            {percentage > 0 && (
              <circle
                  className={`${strokeColor} transition-all duration-700 ease-out`}
                  strokeWidth={strokeWidth}
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                  r={radius}
                  cx={size / 2}
                  cy={size / 2}
              />
            )}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className={`text-[10px] font-bold ${isToday ? 'text-indigo-700' : 'text-slate-600'}`}>
                    {dayNumber}
                </span>
            </div>
        </div>
        <div className="hidden sm:block absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10 whitespace-nowrap shadow-lg">
          {Math.round(percentage * 100)}% 달성
        </div>
      </div>
    );
  };

  // --- Export Stats (Raw Data Markdown) ---
  const handleExportStats = () => {
    const range = getDateRange();
    let markdown = `# 습관 기록 통계\n\n`;
    markdown += `**기간**: ${range.start} ~ ${range.end}\n\n`;

    // Table Header
    markdown += `| 날짜 | ${habits.map(h => h.name).join(' | ')} | 달성률 |\n`;
    markdown += `| :---: | ${habits.map(() => ':---:').join(' | ')} | :---: |\n`;

    // Table Body
    const startDate = new Date(range.start);
    const endDate = new Date(range.end);
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      if (new Date(dateStr) > new Date()) continue;

      const rowData = habits.map(h => {
        if (h.createdAt.split('T')[0] > dateStr) return '-'; 
        const isDone = logs.some(l => l.habitId === h.id && l.date === dateStr && l.completed);
        return isDone ? '✅' : '⬜';
      });

      const activeHabitsCount = habits.filter(h => h.createdAt.split('T')[0] <= dateStr).length;
      const completedCount = logs.filter(l => l.date === dateStr && l.completed).length;
      const rate = activeHabitsCount > 0 ? Math.round((completedCount / activeHabitsCount) * 100) : 0;

      markdown += `| ${dateStr} | ${rowData.join(' | ')} | ${rate}% |\n`;
    }

    const fileName = `${range.start}_${range.end}_HabitStats.md`;
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // --- AI Retrospective Logic ---
  const handleGenerateRetrospective = async () => {
    setIsReviewLoading(true);
    setShowHistory(false);
    try {
      const range = getDateRange();
      setActiveDateRange(range);
      const content = await generateRetrospective(viewMode, range, habits, logs);
      setReviewContent(content);
    } catch (e) {
      console.error(e);
      setReviewContent('회고를 생성하는 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsReviewLoading(false);
    }
  };

  const handleSaveRetrospective = () => {
    if (!reviewContent || !activeDateRange.start) return;
    onSaveRetrospective({
      period: viewMode,
      startDate: activeDateRange.start,
      endDate: activeDateRange.end,
      content: reviewContent
    });
    alert("회고가 저장되었습니다!");
  };

  const handleDownloadMarkdown = (content: string, period: string) => {
    if (!content) return;
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const fileName = `${dateStr}-${period === 'WEEKLY' ? 'Weekly' : 'Monthly'}-Review.md`;
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const relevantRetrospectives = retrospectives.filter(r => r.period === viewMode);

  // Custom Tooltip for Stacked Bar
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      // Filter payload to find which habits are completed (value = 1)
      const completedHabits = payload.filter((p: any) => p.value === 1);
      
      return (
        <div className="bg-white p-3 rounded-xl shadow-lg border border-slate-100 text-sm z-50">
          <p className="font-bold text-slate-800 mb-2">{label}</p>
          {completedHabits.length > 0 ? (
            <div className="space-y-1">
              {completedHabits.map((p: any) => {
                const habit = habits.find(h => h.id === p.dataKey);
                return (
                  <div key={p.dataKey} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                    <span className="text-slate-600 text-xs">{habit?.name}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-slate-400 text-xs">완료한 습관 없음</p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      
      {/* Top Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-indigo-50 shadow-sm shadow-indigo-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
          <p className="text-slate-500 text-sm font-medium mb-1 relative z-10">기간 내 완료</p>
          <h3 className="text-3xl font-bold text-indigo-600 relative z-10">{totalCompletedInRange}회</h3>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-slate-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
          <p className="text-slate-500 text-sm font-medium mb-1 relative z-10">전체 습관</p>
          <h3 className="text-3xl font-bold text-slate-800 relative z-10">{habits.length}개</h3>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="bg-white p-1.5 rounded-xl border border-slate-200 flex shadow-sm">
        <button
          onClick={() => setViewMode('WEEKLY')}
          className={`flex-1 py-2.5 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${
            viewMode === 'WEEKLY' 
              ? 'bg-indigo-50 text-indigo-600 shadow-sm ring-1 ring-indigo-100' 
              : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
          }`}
        >
          <BarChart3 size={18} />
          주간 통계
        </button>
        <button
          onClick={() => setViewMode('MONTHLY')}
          className={`flex-1 py-2.5 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${
            viewMode === 'MONTHLY' 
              ? 'bg-indigo-50 text-indigo-600 shadow-sm ring-1 ring-indigo-100' 
              : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
          }`}
        >
          <CalendarIcon size={18} />
          월간 캘린더
        </button>
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-lg shadow-slate-100/50 min-h-[300px] p-6">
        
        {/* Header Row with Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <h3 className="text-xl font-bold text-slate-800">{headerTitle}</h3>
            <div className="flex bg-slate-50 rounded-lg p-1">
              <button onClick={handlePrev} className="p-1.5 hover:bg-white hover:shadow-sm rounded-md text-slate-500 transition-all">
                <ChevronLeft size={18} />
              </button>
              <button onClick={handleNext} className="p-1.5 hover:bg-white hover:shadow-sm rounded-md text-slate-500 transition-all">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
          
          <button 
            onClick={handleExportStats}
            className="self-start sm:self-auto flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 rounded-xl text-xs font-bold transition-colors border border-transparent hover:border-indigo-100"
          >
            <FileDown size={16} />
            데이터 내보내기
          </button>
        </div>

        {/* Chart / Calendar Display */}
        <div className="w-full">
          {viewMode === 'WEEKLY' ? (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis 
                    dataKey="day" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 12 }} 
                    dy={10}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                  
                  {/* Create a Bar for each habit to allow stacking with unique colors */}
                  {habits.map((habit) => (
                    <Bar 
                      key={habit.id}
                      dataKey={habit.id}
                      stackId="habitStack"
                      fill={TAILWIND_COLORS[habit.color] || '#cbd5e1'}
                      radius={[2, 2, 2, 2]}
                      barSize={32}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="w-full">
              <div className="grid grid-cols-7 mb-3 border-b border-slate-100 pb-2">
                 {['일', '월', '화', '수', '목', '금', '토'].map(d => (
                    <div key={d} className="text-center text-xs text-slate-400 font-medium">
                      {d}
                    </div>
                  ))}
              </div>

              <div className="grid grid-cols-7 gap-2 sm:gap-3">
                 {calendarDays.map((day, idx) => {
                    if (!day) return <div key={`empty-${idx}`} className="aspect-square" />;
                    return (
                      <div key={day.fullDate} className="aspect-square">
                         <DayDonut dateStr={day.fullDate} dayNumber={day.date} />
                      </div>
                    );
                 })}
              </div>
              
              <div className="mt-8 flex items-center justify-center gap-6 text-xs text-slate-500 bg-slate-50 py-3 rounded-xl">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-slate-200"></div>
                  <span>0%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full border-2 border-indigo-500 border-t-transparent transform rotate-45"></div>
                  <span>진행 중</span>
                </div>
                <div className="flex items-center gap-2">
                   <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200"></div>
                   <span>완료</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Retrospective Section - New Light Design */}
      <div className="relative bg-white rounded-3xl p-1 border border-indigo-100 shadow-xl shadow-indigo-50/50 overflow-hidden mt-8">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white via-white to-indigo-50/30 z-0" />
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-purple-100 rounded-full blur-3xl opacity-50 z-0" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-100 rounded-full blur-3xl opacity-50 z-0" />

        <div className="relative z-10 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div>
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2.5">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
                  <Sparkles size={20} />
                </div>
                AI {viewMode === 'WEEKLY' ? '주간' : '월간'} 회고
              </h3>
              <p className="text-slate-500 text-sm mt-1 ml-1">
                AI가 분석한 성취도와 피드백을 확인하세요.
              </p>
            </div>
            
            {relevantRetrospectives.length > 0 && (
              <button 
                onClick={() => { setShowHistory(!showHistory); setReviewContent(''); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-sm ${
                  showHistory 
                    ? 'bg-slate-800 text-white shadow-slate-300' 
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <History size={16} />
                저장된 기록 ({relevantRetrospectives.length})
              </button>
            )}
          </div>

          {showHistory ? (
            <div className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-bold text-slate-700">히스토리 목록</p>
                <button onClick={() => setShowHistory(false)} className="text-xs text-slate-400 underline">닫기</button>
              </div>
              
              <div className="grid gap-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                {relevantRetrospectives.map(retro => (
                  <div key={retro.id} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all group">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className="inline-block px-2 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-md mb-1.5">
                          {retro.startDate} ~ {retro.endDate}
                        </span>
                        <p className="text-xs text-slate-400">작성일: {new Date(retro.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDownloadMarkdown(retro.content, retro.period); }}
                          className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors"
                          title="다운로드"
                        >
                          <Download size={16} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); onDeleteRetrospective(retro.id); }}
                          className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                          title="삭제"
                        >
                           <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                          setReviewContent(retro.content);
                          setShowHistory(false);
                      }}
                      className="w-full text-left text-sm text-slate-600 line-clamp-2 hover:text-indigo-600 transition-colors"
                    >
                      {retro.content}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              {!reviewContent ? (
                <div className="text-center py-12 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mx-auto mb-4 text-indigo-200">
                    <FileText size={32} />
                  </div>
                  <p className="text-slate-600 font-medium mb-1">아직 작성된 회고가 없습니다</p>
                  <p className="text-slate-400 text-sm mb-6">
                    {viewMode === 'WEEKLY' 
                      ? '이번 주의 습관 기록을 분석해볼까요?' 
                      : '이번 달의 성과를 AI와 함께 정리해보세요.'}
                  </p>
                  <button
                    onClick={handleGenerateRetrospective}
                    disabled={isReviewLoading}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-2xl font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center gap-2.5 mx-auto disabled:opacity-70 disabled:cursor-not-allowed disabled:shadow-none"
                  >
                    {isReviewLoading ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
                    {isReviewLoading ? 'AI가 회고 작성 중...' : 'AI 회고록 생성하기'}
                  </button>
                </div>
              ) : (
                <div className="animate-in fade-in zoom-in-95 duration-300">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-bold border border-green-100">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                      {activeDateRange.start ? `${activeDateRange.start} ~ ${activeDateRange.end}` : '생성 완료'}
                    </div>
                    
                    <div className="flex gap-2 ml-auto">
                       <button 
                         onClick={() => handleDownloadMarkdown(reviewContent, viewMode)}
                         className="flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl text-sm font-medium text-slate-600 transition-all shadow-sm hover:shadow-md"
                       >
                         <Download size={16} />
                         .md 저장
                       </button>
                       {activeDateRange.start && (
                         <button 
                           onClick={handleSaveRetrospective}
                           className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-xl text-sm font-medium text-white transition-all shadow-lg shadow-indigo-200 hover:shadow-indigo-300 active:scale-95"
                         >
                           <Save size={16} />
                           앱에 저장
                         </button>
                       )}
                    </div>
                  </div>
                  
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-inner max-h-[400px] overflow-y-auto custom-scrollbar">
                    <pre className="whitespace-pre-wrap font-mono text-sm text-slate-700 leading-relaxed">
                      {reviewContent}
                    </pre>
                  </div>
                  
                  <div className="flex justify-center mt-6">
                     <button
                        onClick={() => setReviewContent('')}
                        className="text-sm text-slate-400 hover:text-slate-600 underline decoration-slate-300 underline-offset-4 transition-colors"
                     >
                       닫기 및 다시 작성하기
                     </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};