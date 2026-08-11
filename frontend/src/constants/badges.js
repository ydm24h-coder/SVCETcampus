import { 
  Footprints, CheckCircle, CheckSquare, Shield, Flame, 
  Calendar, Crown, Star, Brain, Sparkles, 
  Target, Dumbbell, Sunrise, Moon, Coffee, 
  Zap, FastForward, Clock, Medal, Trophy 
} from 'lucide-react';

export const BADGE_DATA = [
  { id: 'first_steps', title: 'First Steps', description: 'Complete your first task.', icon: Footprints, color: 'from-green-400 to-emerald-600' },
  { id: 'task_master', title: 'Task Master', description: 'Complete 10 tasks total.', icon: CheckCircle, color: 'from-blue-400 to-indigo-600' },
  { id: 'completionist', title: 'Completionist', description: 'Complete 50 tasks total.', icon: CheckSquare, color: 'from-purple-500 to-fuchsia-600' },
  { id: 'unstoppable', title: 'Unstoppable', description: 'Complete 100 tasks total.', icon: Shield, color: 'from-red-500 to-rose-700' },
  
  { id: 'hot_streak', title: 'Hot Streak', description: 'Maintain a 3-day task streak.', icon: Flame, color: 'from-orange-400 to-red-500' },
  { id: 'week_warrior', title: 'Week Warrior', description: 'Maintain a 7-day task streak.', icon: Calendar, color: 'from-blue-500 to-cyan-600' },
  { id: 'consistency_king', title: 'Consistency King', description: 'Maintain a 30-day task streak.', icon: Crown, color: 'from-yellow-400 to-amber-600' },
  
  { id: 'star_scholar', title: 'Star Scholar', description: 'Earn 500 total stars.', icon: Star, color: 'from-yellow-300 to-yellow-500' },
  { id: 'galaxy_brain', title: 'Galaxy Brain', description: 'Earn 2,000 total stars.', icon: Brain, color: 'from-fuchsia-500 to-purple-700' },
  { id: 'supernova', title: 'Supernova', description: 'Earn 5,000 total stars.', icon: Sparkles, color: 'from-pink-500 to-rose-600' },
  
  { id: 'practice_makes_perfect', title: 'Practice Perfect', description: 'Complete 5 practice tasks.', icon: Target, color: 'from-teal-400 to-emerald-500' },
  { id: 'training_regimen', title: 'Training Regimen', description: 'Complete 20 practice tasks.', icon: Dumbbell, color: 'from-slate-600 to-slate-800' },
  
  { id: 'early_bird', title: 'Early Bird', description: 'Complete a task before 7:00 AM.', icon: Sunrise, color: 'from-orange-300 to-yellow-400' },
  { id: 'night_owl', title: 'Night Owl', description: 'Complete a task after 10:00 PM.', icon: Moon, color: 'from-indigo-700 to-blue-900' },
  { id: 'weekend_warrior', title: 'Weekend Warrior', description: 'Complete a task on a Saturday or Sunday.', icon: Coffee, color: 'from-amber-600 to-orange-800' },
  
  { id: 'overachiever', title: 'Overachiever', description: 'Complete 5 tasks in a single day.', icon: Zap, color: 'from-yellow-400 to-orange-500' },
  { id: 'quick_learner', title: 'Quick Learner', description: 'Earn 100 stars in a single day.', icon: FastForward, color: 'from-cyan-400 to-blue-500' },
  
  { id: 'the_regular', title: 'The Regular', description: 'Log activity on 10 different days.', icon: Clock, color: 'from-sky-400 to-blue-600' },
  { id: 'veteran', title: 'Veteran', description: 'Log activity on 50 different days.', icon: Medal, color: 'from-amber-400 to-yellow-600' },
  { id: 'elite_status', title: 'Elite Status', description: 'Reach the Top 3 on the global leaderboard.', icon: Trophy, color: 'from-yellow-400 to-yellow-600' }
];
