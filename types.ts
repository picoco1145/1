export interface Habit {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string; // Lucide icon name
  targetFrequency: number; // Days per week target
  createdAt: string;
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
}

export interface Retrospective {
  id: string;
  createdAt: string;
  period: 'WEEKLY' | 'MONTHLY';
  startDate: string;
  endDate: string;
  content: string;
}

export interface AIAnalysisResult {
  summary: string;
  tips: string[];
  motivation: string;
}

export enum ViewMode {
  DASHBOARD = 'DASHBOARD',
  ANALYTICS = 'ANALYTICS',
  AI_COACH = 'AI_COACH',
}