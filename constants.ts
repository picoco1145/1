import { 
  Activity, 
  BookOpen, 
  Briefcase, 
  Coffee, 
  Dumbbell, 
  Droplets, 
  Heart, 
  Moon, 
  Music, 
  Sun, 
  Utensils, 
  Zap 
} from 'lucide-react';

export const HABIT_COLORS = [
  'bg-red-500',
  'bg-orange-500',
  'bg-amber-500',
  'bg-green-500',
  'bg-emerald-500',
  'bg-teal-500',
  'bg-cyan-500',
  'bg-blue-500',
  'bg-indigo-500',
  'bg-violet-500',
  'bg-purple-500',
  'bg-fuchsia-500',
  'bg-pink-500',
  'bg-rose-500',
];

export const HABIT_ICONS = [
  { name: 'Sun', component: Sun },
  { name: 'Moon', component: Moon },
  { name: 'Dumbbell', component: Dumbbell },
  { name: 'BookOpen', component: BookOpen },
  { name: 'Droplets', component: Droplets },
  { name: 'Utensils', component: Utensils },
  { name: 'Briefcase', component: Briefcase },
  { name: 'Heart', component: Heart },
  { name: 'Music', component: Music },
  { name: 'Coffee', component: Coffee },
  { name: 'Activity', component: Activity },
  { name: 'Zap', component: Zap },
];

export const INITIAL_HABITS = [
  {
    id: '1',
    name: '물 2L 마시기',
    description: '건강을 위한 수분 섭취',
    color: 'bg-blue-500',
    icon: 'Droplets',
    targetFrequency: 7,
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: '매일 독서 30분',
    description: '자기계발 시간',
    color: 'bg-emerald-500',
    icon: 'BookOpen',
    targetFrequency: 5,
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    name: '아침 러닝',
    description: '체력 기르기',
    color: 'bg-orange-500',
    icon: 'Activity',
    targetFrequency: 3,
    createdAt: new Date().toISOString(),
  }
];
