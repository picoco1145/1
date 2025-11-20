import React, { useState } from 'react';
import { Habit, HabitLog, AIAnalysisResult } from '../types';
import { analyzeHabits } from '../services/geminiService';
import { Sparkles, Loader2, Quote, CheckCircle2, Lightbulb } from 'lucide-react';

interface AICoachProps {
  habits: Habit[];
  logs: HabitLog[];
}

export const AICoach: React.FC<AICoachProps> = ({ habits, logs }) => {
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const result = await analyzeHabits(habits, logs);
      setAnalysis(result);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      {/* Hero Section - Light & Soft Theme */}
      <div className="bg-white rounded-3xl p-8 border border-indigo-100 shadow-xl shadow-indigo-50/50 relative overflow-hidden">
        {/* Decorative Gradients */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-full blur-3xl opacity-70 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-48 h-48 bg-gradient-to-tr from-blue-50 to-teal-50 rounded-full blur-3xl opacity-70 pointer-events-none"></div>
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold mb-4 border border-indigo-100">
            <Sparkles size={14} />
            HabitFlow AI
          </div>
          <h2 className="text-3xl font-bold text-slate-800 mb-3 tracking-tight">
             AI 습관 코치
          </h2>
          <p className="text-slate-500 mb-8 max-w-lg leading-relaxed">
            Gemini AI가 당신의 기록을 꼼꼼히 분석하여<br className="hidden sm:block"/> 
            더 나은 내일을 위한 맞춤형 조언과 동기를 선물합니다.
          </p>
          
          {!analysis && (
            <button
              onClick={handleAnalyze}
              disabled={loading || habits.length === 0}
              className="bg-indigo-600 text-white px-8 py-3.5 rounded-2xl font-bold hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-200"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} className="text-indigo-200" />}
              {loading ? '데이터 분석 중...' : '지금 분석 시작하기'}
            </button>
          )}
        </div>
      </div>

      {analysis && (
        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-8 duration-700">
          {/* Summary */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
                 <CheckCircle2 size={20} />
              </div>
              분석 요약
            </h3>
            <p className="text-slate-600 leading-relaxed text-sm sm:text-base">{analysis.summary}</p>
          </div>

          {/* Tips */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
              <div className="p-2 bg-amber-100 text-amber-600 rounded-xl">
                <Lightbulb size={20} />
              </div>
              맞춤형 팁
            </h3>
            <ul className="space-y-4">
              {analysis.tips.map((tip, idx) => (
                <li key={idx} className="flex gap-4 items-start">
                  <span className="bg-amber-50 text-amber-600 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 border border-amber-100">
                    {idx + 1}
                  </span>
                  <span className="text-slate-700 text-sm sm:text-base leading-relaxed">{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Motivation */}
          <div className="bg-gradient-to-r from-indigo-500 to-violet-600 p-8 rounded-3xl shadow-xl shadow-indigo-200 relative overflow-hidden text-white">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
            <Quote className="absolute top-6 right-6 text-indigo-200 opacity-30" size={60} />
            
            <h3 className="text-xs font-bold text-indigo-200 mb-3 uppercase tracking-widest relative z-10">Today's Motivation</h3>
            <p className="text-xl sm:text-2xl font-medium italic leading-relaxed relative z-10 font-serif">
              "{analysis.motivation}"
            </p>
          </div>
        </div>
      )}
    </div>
  );
};