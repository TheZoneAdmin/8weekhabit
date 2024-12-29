import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dumbbell, Clock, Users, ChevronDown, Save, Upload, Link as LinkIcon } from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';
import { Trophy, Award, Crown, Flame } from 'lucide-react';
import { Home, Calendar, Settings, Plus, Check, Info, CheckCircle, XCircle } from 'lucide-react';
import { Toast } from "@/components/ui/toast";
import { SwipeableHabit } from "@/components/ui/swipeable-habit";
import { HabitInfoSheet } from "@/components/ui/habit-info-sheet";

interface Habit {
  habit: string;
  example: string;
}

interface Week {
  week: number;
  focus: string;
  habits: ReadonlyArray<Habit>;
}

interface Program {
  title: string;
  weeks: ReadonlyArray<Week>;
}

interface CollapsibleCardProps {
  week: Week;
  children: React.ReactNode;
}

interface UserProgress {
  currentStreak: number;
  longestStreak: number;
  totalPoints: number;
  completedHabits: number;
  achievements: Achievement[];
  weeklyProgress: {
    [weekNumber: number]: {
      completedTasks: number;
      totalTasks: number;
      notes: string[];
    };
  };
  lastUpdated: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  condition: string;
  points: number;
  unlocked: boolean;
  unlockedAt?: string;
}

interface SavedData {
  [program: string]: {
    [week: number]: {
      [habitIndex: number]: {
        completed: boolean;
        completionDates: string[];
      };
    };
  };
}
const calculateStreak = (savedData: SavedData): { currentStreak: number; longestStreak: number } => {
  const allDates = new Set<string>();
  Object.values(savedData).forEach(program => 
    Object.values(program).forEach(week => 
      Object.values(week).forEach(habit => 
        (habit.completionDates || []).forEach(date => allDates.add(date))
      )
    )
  );

  const sortedDates = Array.from(allDates).sort();
  if (sortedDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  const today = new Date().toISOString().split('T')[0];
  let currentStreak = 0;
  let longestStreak = 0;
  let streak = 0;

  for (let i = 0; i < sortedDates.length; i++) {
    const currentDate = new Date(sortedDates[i]);
    const previousDate = i > 0 ? new Date(sortedDates[i - 1]) : currentDate;
    
    const diffDays = Math.floor((currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (i === 0 || diffDays === 1) {
      streak++;
    } else {
      streak = 1;
    }
    
    longestStreak = Math.max(longestStreak, streak);
    
    const diffFromToday = Math.floor((new Date(today).getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffFromToday <= 1) {
      currentStreak = streak;
    }
  }

  return { currentStreak, longestStreak };
};

const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-week',
    title: 'First Week Champion',
    description: 'Complete all habits for one week',
    icon: 'trophy',
    condition: 'Complete 21 habits in a week (3 habits for 7 days)',
    points: 210,
    unlocked: false
  },
  {
    id: 'streak-master',
    title: 'Streak Master',
    description: 'Maintain a 7-day streak',
    icon: 'fire',
    condition: 'Check in for 7 consecutive days',
    points: 70,
    unlocked: false
  },
  {
    id: 'habit-warrior',
    title: 'Habit Warrior',
    description: 'Complete 50 total habits',
    icon: 'award',
    condition: 'Complete any 50 habits',
    points: 500,
    unlocked: false
  },
  {
    id: 'program-master',
    title: 'Program Master',
    description: 'Complete an entire 8-week program',
    icon: 'crown',
    condition: 'Complete all habits in one program',
    points: 1680,
    unlocked: false
  }
];
const AchievementsPanel = ({ achievements, savedData }: { 
  achievements: Achievement[],
  savedData: SavedData 
}) => {
  const calculateProgress = (achievement: Achievement) => {
    switch (achievement.id) {
      case 'first-week':
        const maxWeekCompletions = Object.values(savedData)
          .flatMap(program => Object.values(program))
          .map(week => {
            const uniqueDates = new Set<string>();
            Object.values(week || {}).forEach((habit: { completionDates: string[] }) => {
              (habit.completionDates || []).forEach((date: string) => uniqueDates.add(date));
            });
            return uniqueDates.size;
          })
          .reduce((max, curr) => Math.max(max, curr), 0);
        return (maxWeekCompletions / 21) * 100;

      case 'habit-warrior':
        const totalCompletions = Object.values(savedData)
          .flatMap(program => Object.values(program))
          .flatMap(week => Object.values(week))
          .reduce((total, habit: { completionDates: string[] }) => 
            total + (habit.completionDates?.length || 0), 0);
        return (totalCompletions / 50) * 100;

      default:
        return 0;
    }
  };

  return (
    <Card className="bg-gray-800 border-none mb-8">
      <div className="p-6">
        <h3 className="text-[#CCBA78] text-xl font-semibold mb-4">Achievements</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {achievements.map((achievement) => (
            <div 
              key={achievement.id}
              className={`p-4 rounded-lg ${
                achievement.unlocked 
                  ? 'bg-[#CCBA78] bg-opacity-20 border border-[#CCBA78]' 
                  : 'bg-gray-700 bg-opacity-50'
              }`}
            >
              <div className="flex items-center gap-3">
                {achievement.icon === 'trophy' && <Trophy className={`w-5 h-5 ${achievement.unlocked ? 'text-[#CCBA78]' : 'text-gray-400'}`} />}
                {achievement.icon === 'fire' && <Flame className={`w-5 h-5 ${achievement.unlocked ? 'text-[#CCBA78]' : 'text-gray-400'}`} />}
                {achievement.icon === 'award' && <Award className={`w-5 h-5 ${achievement.unlocked ? 'text-[#CCBA78]' : 'text-gray-400'}`} />}
                {achievement.icon === 'crown' && <Crown className={`w-5 h-5 ${achievement.unlocked ? 'text-[#CCBA78]' : 'text-gray-400'}`} />}
                <div>
                  <h4 className={`font-semibold ${achievement.unlocked ? 'text-[#CCBA78]' : 'text-gray-300'}`}>
                    {achievement.title}
                  </h4>
                  <p className="text-sm text-gray-400">{achievement.description}</p>
                </div>
              </div>
              <div className="mt-2 flex justify-between items-center">
                <span className="text-sm text-gray-400">
                  {achievement.unlocked 
                    ? `Unlocked: ${new Date(achievement.unlockedAt!).toLocaleDateString()}`
                    : achievement.condition}
                </span>
                <span className={`text-sm ${achievement.unlocked ? 'text-[#CCBA78]' : 'text-gray-400'}`}>
                  {achievement.points} points
                </span>
              </div>
              
              {!achievement.unlocked && (
                <div className="mt-2">
                  <div className="w-full bg-gray-600 rounded-full h-2">
                    <div
                      className="bg-[#CCBA78] h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(calculateProgress(achievement), 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1 text-right">
                    {Math.round(calculateProgress(achievement))}%
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

const DataManagement = ({ userId, onExport, onImport, onReset }: {
  userId: string;
  onExport: () => void;
  onImport: (file: File) => void;
  onReset: () => void;
}) => {
  const copyUserId = () => {
    navigator.clipboard.writeText(userId);
  };

  return (
    <Card className="bg-gray-800 p-3 sm:p-4 mb-6">
      <div className="text-white">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-2 sm:p-3 bg-gray-700 rounded-lg mb-3">
          <span className="font-mono text-xs sm:text-sm break-all mb-2 sm:mb-0 sm:mr-2 w-full sm:w-auto">
            Your ID: {userId}
          </span>
          <button
            onClick={copyUserId}
            className="text-[#CCBA78] hover:text-[#CCBA78]/80 p-1 sm:p-2 text-sm whitespace-nowrap"
          >
            Copy ID
          </button>
        </div>

        <div className="grid grid-cols-3 gap-1 sm:gap-2 w-full text-center">
          <button
            onClick={onExport}
            className="px-2 sm:px-3 py-2 bg-[#CCBA78] text-gray-900 rounded hover:bg-[#CCBA78]/90 text-xs sm:text-sm"
          >
            Export
          </button>
          
          <label className="px-2 sm:px-3 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 cursor-pointer text-xs sm:text-sm">
            Import
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  onImport(e.target.files[0]);
                }
              }}
            />
          </label>

          <button
            onClick={onReset}
            className="px-2 sm:px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-xs sm:text-sm"
          >
            Reset
          </button>
        </div>
      </div>
    </Card>
  );
};
const CollapsibleCard = ({ week, children }: CollapsibleCardProps) => {
  const [isOpen, setIsOpen] = useState(true);
  
  return (
    <Card className="bg-gray-800 border-none">
      <div 
        className="flex items-center justify-between p-6 cursor-pointer hover:bg-gray-700 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 className="text-[#CCBA78] text-lg font-semibold flex items-center">
          Week {week.week} - {week.focus}
        </h3>
        <ChevronDown 
          className={`w-5 h-5 text-[#CCBA78] transform transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </div>
      {isOpen && (
        <CardContent className="p-6 pt-0 border-t border-gray-700">
          {children}
        </CardContent>
      )}
    </Card>
  );
};

const useUserStorage = () => {
  const [userId, setUserId] = useState<string>('');
  const [isClient, setIsClient] = useState(false);
  const [savedData, setSavedData] = useState<SavedData>({});
  const [userData, setUserData] = useState<UserProgress>({
    currentStreak: 0,
    longestStreak: 0,
    totalPoints: 0,
    completedHabits: 0,
    achievements: ACHIEVEMENTS,
    weeklyProgress: {},
    lastUpdated: new Date().toISOString()
  });

  useEffect(() => {
    setIsClient(true);
    
    let existingId = localStorage.getItem('habit_tracker_user_id');
    if (!existingId) {
      existingId = crypto.randomUUID();
      localStorage.setItem('habit_tracker_user_id', existingId);
    }
    setUserId(existingId);

    const saved = localStorage.getItem(`habit_tracker_${existingId}`);
    if (saved) {
      setUserData(JSON.parse(saved));
    }

    const savedProgress = localStorage.getItem('habitProgress');
    if (savedProgress) {
      setSavedData(JSON.parse(savedProgress));
    }
  }, []);

  const saveData = useCallback(() => {
    if (!isClient) return;
    localStorage.setItem(`habit_tracker_${userId}`, JSON.stringify({
      ...userData,
      lastUpdated: new Date().toISOString()
    }));
  }, [userData, userId, isClient]);

  const exportProgress = () => {
    if (!isClient) return;
    const data = {
      userData,
      savedData
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `habit-tracker-export-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importProgress = (jsonFile: File) => {
    if (!isClient) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        if (data.userData && data.savedData) {
          setUserData(data.userData);
          setSavedData(data.savedData);
          localStorage.setItem(`habit_tracker_${userId}`, JSON.stringify(data.userData));
          localStorage.setItem('habitProgress', JSON.stringify(data.savedData));
        }
      } catch (error) {
        console.error('Failed to import data:', error);
      }
    };
    reader.readAsText(jsonFile);
  };

  return {
    userId,
    userData,
    setUserData,
    savedData,
    setSavedData,
    saveData,
    exportProgress,
    importProgress,
    isClient
  };
};
const HabitProgram = () => {
  const { 
    userId, 
    userData, 
    setUserData, 
    savedData,
    setSavedData,
    saveData, 
    exportProgress, 
    importProgress 
  } = useUserStorage();

  const [showToast, setShowToast] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedPreference = localStorage.getItem('showOnboarding');
      return savedPreference === null ? true : savedPreference === 'true';
    }
    return true;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('showOnboarding', showOnboarding.toString());
    }
  }, [showOnboarding]);

  useEffect(() => {
    if (typeof window !== 'undefined' && savedData && Object.keys(savedData).length > 0) {
      const { currentStreak, longestStreak } = calculateStreak(savedData);
      
      setUserData(prev => {
        const updatedAchievements = prev.achievements.map(achievement => {
          if (achievement.unlocked) return achievement;
          if (achievement.id === 'streak-master' && currentStreak >= 7) {
            return { ...achievement, unlocked: true, unlockedAt: new Date().toISOString() };
          }
          return achievement;
        });

        return {
          ...prev,
          currentStreak,
          longestStreak,
          achievements: updatedAchievements
        };
      });
    }
  }, [savedData, setUserData]);

  useEffect(() => {
    let touchStart = 0;
    const handleTouchStart = (e: TouchEvent) => {
      touchStart = e.touches[0].clientY;
    };
    const handleTouchMove = (e: TouchEvent) => {
      const touchEnd = e.touches[0].clientY;
      if (window.scrollY === 0 && touchEnd > touchStart + 100) {
        window.location.reload();
      }
    };
    
    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove);
    
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('habitProgress', JSON.stringify(savedData));
    }
  }, [savedData]);
const resetProgress = useCallback(() => {
    if (window.confirm('Are you sure you want to reset all progress? This cannot be undone.')) {
      setSavedData({});
      if (typeof window !== 'undefined') {
        localStorage.removeItem('habitProgress');
      }

      const initialUserData = {
        currentStreak: 0,
        longestStreak: 0,
        totalPoints: 0,
        completedHabits: 0,
        achievements: ACHIEVEMENTS.map(achievement => ({
          ...achievement,
          unlocked: false,
          unlockedAt: undefined
        })),
        weeklyProgress: {},
        lastUpdated: new Date().toISOString()
      };
      
      setUserData(initialUserData);
      if (typeof window !== 'undefined') {
        localStorage.setItem(`habit_tracker_${userId}`, JSON.stringify(initialUserData));
      }
    }
  }, [userId, setUserData, setSavedData]);

  const handleCheckbox = (program: string, week: number, habitIndex: number, checked: boolean) => {
    const today = new Date().toISOString().split('T')[0];

    setSavedData(prev => {
      const currentHabit = prev[program]?.[week]?.[habitIndex] || { completed: false, completionDates: [] };
      
      if (checked) {
        const updatedDates = currentHabit.completionDates?.includes(today)
          ? currentHabit.completionDates
          : [...(currentHabit.completionDates || []), today];

        return {
          ...prev,
          [program]: {
            ...prev[program],
            [week]: {
              ...prev[program]?.[week],
              [habitIndex]: {
                completed: true,
                completionDates: updatedDates
              }
            }
          }
        };
      } else {
        return {
          ...prev,
          [program]: {
            ...prev[program],
            [week]: {
              ...prev[program]?.[week],
              [habitIndex]: {
                completed: false,
                completionDates: (currentHabit.completionDates || []).filter(date => date !== today)
              }
            }
          }
        };
      }
    });

    setUserData(prev => {
      const getCompletionsForWeek = (weekData: any) => {
        const uniqueDates = new Set<string>();
        Object.values(weekData || {}).forEach((habit: any) => {
          (habit.completionDates || []).forEach((date: string) => uniqueDates.add(date));
        });
        return uniqueDates.size;
      };

      const totalCompletions = Object.values(savedData)
        .flatMap(program => Object.values(program))
        .flatMap(week => Object.values(week))
        .reduce((total, habit: any) => total + (habit.completionDates?.length || 0), 0);

      const { currentStreak, longestStreak } = calculateStreak(savedData);

      const updatedAchievements = prev.achievements.map(achievement => {
        if (achievement.unlocked) return achievement;

        switch (achievement.id) {
          case 'streak-master':
            if (currentStreak >= 7) {
              return { ...achievement, unlocked: true, unlockedAt: new Date().toISOString() };
            }
            break;

          case 'first-week':
            const hasCompletedWeek = Object.values(savedData).some(program => 
              Object.values(program).some(week => getCompletionsForWeek(week) >= 21)
            );
            if (hasCompletedWeek) {
              return { ...achievement, unlocked: true, unlockedAt: new Date().toISOString() };
            }
            break;

          case 'habit-warrior':
            if (totalCompletions >= 50) {
              return { ...achievement, unlocked: true, unlockedAt: new Date().toISOString() };
            }
            break;

          case 'program-master':
            const hasCompletedProgram = Object.entries(savedData).some(([_, programData]) => {
              const weeks = Object.entries(programData);
              if (weeks.length !== 8) return false;
              
              return weeks.every(([_, weekData]) => {
                const habits = Object.values(weekData);
                return habits.length === 3 && habits.every((habit: any) => 
                  habit.completionDates?.length >= 7
                );
              });
            });
            
            if (hasCompletedProgram) {
              return { ...achievement, unlocked: true, unlockedAt: new Date().toISOString() };
            }
            break;
        }
        return achievement;
      });

      return {
        ...prev,
        currentStreak,
        longestStreak,
        completedHabits: totalCompletions,
        totalPoints: totalCompletions * 10,
        achievements: updatedAchievements
      };
    });

    saveData();
  };
const programs = {
  strength: {
    title: "Strength & Growth Habits",
    weeks: [
      {
        week: 1,
        focus: "Foundation",
        habits: [
          {
            habit: "Track protein intake daily (1.6-2.2g/kg)",
            example: "Example: 80kg person needs 128-176g protein. Track breakfast (30g), lunch (40g), dinner (40g), snacks (20g)"
          },
          {
            habit: "Plan 3 training days with rest between",
            example: "Example: Monday/Wednesday/Friday training, Tuesday/Thursday/Weekend rest"
          },
          {
            habit: "Log exercises and weights used", 
            example: "Example: Bench Press - 60kg x 8,8,8 reps, felt 7/10 difficulty"
          }
        ]
      },
      {
        week: 2,
        focus: "Consistency",
        habits: [
          {
            habit: "Meal prep basics for 3 days/week",
            example: "Example: Sunday prep - 6 chicken breasts, 3 cups rice, 600g vegetables"
          },
          {
            habit: "Establish pre-workout routine",
            example: "Example: 10min mobility, 5min light cardio, 3 warm-up sets per exercise"
          },
          {
            habit: "Sleep 7-8 hours consistently",
            example: "Example: Bed by 10:30pm, wake 6:30am, no screens after 10pm"
          }
        ]
      },
      {
        week: 3,
        focus: "Progressive Loading",
        habits: [
          {
            habit: "Track progressive overload weekly",
            example: "Example: Week 1 Squat: 80kg x 8, Week 2: 82.5kg x 8 or 80kg x 9"
          },
          {
            habit: "Add post-workout recovery routine",
            example: "Example: 10min stretching, protein shake, 10min walk, contrast shower"  
          },
          {
            habit: "Plan meals around training days",
            example: "Example: Training days +300 calories, extra 50g carbs pre/post workout"
          }
        ]
      },
      {
        week: 4,
        focus: "Recovery Focus",
        habits: [
          {
            habit: "Implement deload strategy",
            example: "Example: Reduce weights by 40%, maintain form, focus on mind-muscle connection"
          },
          {
            habit: "Track sleep quality",
            example: "Example: Rate 1-10: Falling asleep (8/10), Staying asleep (7/10), Morning energy (8/10)"
          },
          {
            habit: "Practice proper stretching",
            example: "Example: 5min dynamic pre-workout, 10min static post-workout, focus on worked muscles"
          }
        ]
      },
      {
        week: 5,
        focus: "Advanced Nutrition",
        habits: [
          {
            habit: "Time carbs around workouts",
            example: "Example: 50g carbs 2hrs pre-workout, 25g intra-workout, 50g post-workout"
          },
          {
            habit: "Track macronutrient ratios",
            example: "Example: Training days - 40% carbs, 30% protein, 30% fats. Rest days - 30/40/30"
          },
          {
            habit: "Hydration strategy",
            example: "Example: 500ml 2hrs pre-workout, 250ml every 15mins during, 1L post-workout"
          }
        ]
      },
      {
        week: 6,
        focus: "Performance",
        habits: [
          {
            habit: "Track strength progress metrics",
            example: "Example: Monthly PR tests: Squat 100kg→105kg, Bench 80kg→82.5kg, Dead 120kg→125kg"
          },
          {
            habit: "Video form check weekly",
            example: "Example: Record main lift side view, compare against previous week, note improvements"
          },
          {
            habit: "Adjust training splits",
            example: "Example: If shoulder recovery poor, move push day further from pull day"
          }
        ]
      },
      {
        week: 7,
        focus: "Lifestyle Integration",
        habits: [
          {
            habit: "Balance social life with training",
            example: "Example: Meal prep for social events, schedule morning workouts before events"
          },
          {
            habit: "Meal prep for busy days",
            example: "Example: Prepare 3 meals + 2 snacks, pack shaker with protein powder separately"
          },
          {
            habit: "Stress management techniques",
            example: "Example: 10min morning meditation, post-workout journaling, evening walking"
          }
        ]
      },
      {
        week: 8,
        focus: "Long-term Planning",
        habits: [
          {
            habit: "Set new strength goals",
            example: "Example: Next 12 weeks: Squat +10kg, Bench +5kg, Deadlift +15kg"
          },
          {
            habit: "Create next training block",
            example: "Example: 4 weeks strength focus, 2 weeks volume, 1 week deload"
          },
          {
            habit: "Review and adjust nutrition",
            example: "Example: Adjust calories based on progress, fine-tune meal timing, plan next bulk/cut"
          }
        ]
      }
    ]
  },
  hybrid: {
    title: "Functional Fitness Habits",
    weeks: [
      {
        week: 1,
        focus: "Movement Quality",
        habits: [
          {
            habit: "Practice basic movement patterns",
            example: "Example: Daily 10 air squats, 5 push-ups, 5 rows, overhead mobility drills"
          },
          {
            habit: "Track daily activity level",
            example: "Example: Log steps (8k target), active minutes (45+), workout intensity (1-10)"
          },
          {
            habit: "Focus on workout form",
            example: "Example: Video one movement per session, get coach feedback, implement cues"
          }
        ]
      },
      {
        week: 2,
        focus: "Energy Systems",
        habits: [
          {
            habit: "Balance strength and cardio days",
            example: "Example: Mon/Thu-Strength, Tue/Fri-HIIT, Wed-Steady State, Weekend-Active Recovery"
          },
          {
            habit: "Monitor heart rate recovery",
            example: "Example: Post-workout HR: 160bpm → 1min: 120bpm → 2min: 100bpm"
          },
          {
            habit: "Track daily energy levels",
            example: "Example: Morning: 7/10, Pre-workout: 8/10, Post-workout: 6/10, Evening: 7/10"
          }
        ]
      },
      {
        week: 3,
        focus: "Endurance Building",
        habits: [
          {
            habit: "Implement aerobic base training",
            example: "Example: 30-45min steady state cardio 3x/week at 65-75% max HR"
          },
          {
            habit: "Progress HIIT intervals",
            example: "Example: Week 1: 30s work/30s rest, Week 2: 40s work/20s rest"
          },
          {
            habit: "Track workout density",
            example: "Example: Complete 100 reps in 10 mins week 1, aim for 8 mins week 2"
          }
        ]
      },
      {
        week: 4,
        focus: "Skill Development",
        habits: [
          {
            habit: "Master complex movements",
            example: "Example: Practice handstand holds, muscle-ups progression, Olympic lifts"
          },
          {
            habit: "Implement mobility routine",
            example: "Example: 15min daily mobility work focusing on shoulders, hips, and ankles"
          },
          {
            habit: "Track movement quality",
            example: "Example: Film and assess one complex movement per session"
          }
        ]
      },
      {
        week: 5,
        focus: "Power Development",
        habits: [
          {
            habit: "Add plyometric training",
            example: "Example: Box jumps, med ball throws, sprint starts 2x/week"
          },
          {
            habit: "Implement contrast training",
            example: "Example: Heavy squat followed by jump squats, bench press to med ball throws"
          },
          {
            habit: "Track explosive power",
            example: "Example: Measure jump height, med ball throw distance, sprint times"
          }
        ]
      },
      {
        week: 6,
        focus: "Work Capacity",
        habits: [
          {
            habit: "Increase training density",
            example: "Example: Reduce rest periods by 10s each week, maintain movement quality"
          },
          {
            habit: "Track workout volume",
            example: "Example: Total reps, sets, weight lifted per session"
          },
          {
            habit: "Implement complexes",
            example: "Example: 5 exercises back-to-back, 3 rounds, minimal rest"
          }
        ]
      },
      {
        week: 7,
        focus: "Sport Specificity",
        habits: [
          {
            habit: "Sport-specific conditioning",
            example: "Example: Mirror sport movement patterns in training, match energy systems"
          },
          {
            habit: "Implement agility work",
            example: "Example: Cone drills, ladder work, direction changes 2x/week"
          },
          {
            habit: "Track sport performance",
            example: "Example: Sport-specific tests monthly: sprints, agility course, vertical jump"
          }
        ]
      },
      {
        week: 8,
        focus: "Performance Integration",
        habits: [
          {
            habit: "Test key benchmarks",
            example: "Example: Retest baseline metrics: max HR, work capacity, movement quality"
          },
          {
            habit: "Design next phase",
            example: "Example: Plan next 8 weeks based on progress and goals"
          },
          {
            habit: "Set new performance targets",
            example: "Example: Increase work capacity 10%, reduce rest periods 20%"
          }
        ]
      }
    ]
  },
  cardio: {
    title: "Group Fitness & Classes",
    weeks: [
      {
        week: 1,
        focus: "Class Integration",
        habits: [
          {
            habit: "Try different class formats",
            example: "Example: Mon-Spin, Wed-HIIT, Fri-Yoga, track enjoyment and difficulty"
          },
          {
            habit: "Learn class terminology",
            example: "Example: RPE scales, movement names, instructor cues"
          },
          {
            habit: "Set up equipment properly",
            example: "Example: Bike setup, step height, weight selection guidelines"
          }
        ]
      },
      {
        week: 2,
        focus: "Intensity Management",
        habits: [
          {
            habit: "Use heart rate zones",
            example: "Example: Zone 2 for base classes, Zone 4 for HIIT portions"
          },
          {
            habit: "Track perceived exertion",
            example: "Example: Rate 1-10 each class segment, compare to actual HR"
          },
          {
            habit: "Learn modification options",
            example: "Example: Low impact alternatives, weight adjustments, tempo changes"
          }
        ]
      },
      {
        week: 3,
        focus: "Technical Proficiency",
        habits: [
          {
            habit: "Master class-specific moves",
            example: "Example: Proper burpee form, spin transitions, yoga flows"
          },
          {
            habit: "Track movement progress",
            example: "Example: Film one complex movement per week, get instructor feedback"
          },
          {
            habit: "Implement instructor cues",
            example: "Example: Note key form cues, apply in next class, seek feedback"
          }
        ]
      },
      {
        week: 4,
        focus: "Recovery Integration",
        habits: [
          {
            habit: "Balance class intensity",
            example: "Example: 2 high intensity, 2 moderate, 1 recovery class per week"
          },
          {
            habit: "Implement active recovery",
            example: "Example: Light yoga between intense classes, mobility work daily"
          },
          {
            habit: "Track sleep quality",
            example: "Example: Sleep score vs class performance, adjust schedule accordingly"
          }
        ]
      },
      {
        week: 5,
        focus: "Performance Progress",
        habits: [
          {
            habit: "Increase class difficulty",
            example: "Example: Higher spin resistance, heavier weights, advanced movements"
          },
          {
            habit: "Track performance metrics",
            example: "Example: Watts in spin, weights in strength, hold times in yoga"
          },
          {
            habit: "Set class-specific goals",
            example: "Example: Lead pack in spin, full pushups in HIIT, crow pose in yoga"
          }
        ]
      },
      {
        week: 6,
        focus: "Community Engagement",
        habits: [
          {
            habit: "Join class challenges",
            example: "Example: Monthly distance challenge, workout streak, team events"
          },
          {
            habit: "Connect with classmates",
            example: "Example: Partner workouts, form check buddies, social events"
          },
          {
            habit: "Share progress journey",
            example: "Example: Post achievements, join community boards, give feedback"
          }
        ]
      },
      {
        week: 7,
        focus: "Advanced Techniques",
        habits: [
          {
            habit: "Learn advanced variations",
            example: "Example: Plyometric options, complex combinations, flow transitions"
          },
          {
            habit: "Implement class combinations",
            example: "Example: Spin+Strength, HIIT+Yoga, multiple class days"
          },
          {
            habit: "Track advanced metrics",
            example: "Example: Power output, complex movement mastery, endurance improvements"
          }
        ]
      },
      {
        week: 8,
        focus: "Lifestyle Integration",
        habits: [
          {
            habit: "Create sustainable schedule",
            example: "Example: Plan next month's classes, balance work/life/fitness"
          },
          {
            habit: "Set long-term goals",
            example: "Example: Class instructor training, competition prep, performance targets"
          },
          {
            habit: "Review and celebrate progress",
            example: "Example: Compare before/after videos, metrics improvements, testimonial"
          }
        ]
      }
    ]
  }
} as const;
return (
    <div className="bg-gray-900 p-4 pb-24 sm:p-8 md:p-12 max-w-4xl mx-auto min-h-screen">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-4xl font-bold mb-2">
          <span className="text-[#CCBA78]">Transform</span>
          <span className="text-white"> Your Habits</span>
        </h1>
        <h2 className="text-white text-lg sm:text-xl">8-Week Journey to Better Health</h2>
      </div>

      <div className="bg-gray-800 rounded-lg mb-6 overflow-hidden">
        <button 
          onClick={() => setShowOnboarding(!showOnboarding)}
          className="w-full p-4 flex justify-between items-center text-[#CCBA78] hover:bg-gray-700 transition-colors"
        >
          <h3 className="text-xl font-semibold">Welcome to Your 8-Week Journey!</h3>
          <ChevronDown 
            className={`w-5 h-5 transform transition-transform duration-200 ${
              showOnboarding ? 'rotate-180' : ''
            }`}
          />
        </button>
        
        {showOnboarding && (
          <div className="p-6 border-t border-gray-700">
            <div className="space-y-4 text-gray-200">
              <p>Choose your path:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><span className="text-[#CCBA78] font-medium">Strength & Growth</span> - Perfect for building muscle and strength through structured workouts</li>
                <li><span className="text-[#CCBA78] font-medium">Functional Fitness</span> - Ideal for overall fitness, combining strength and cardio</li>
                <li><span className="text-[#CCBA78] font-medium">Group Classes</span> - Great for those who prefer guided workouts and community support</li>
              </ul>

              <div className="mt-6">
                <p className="font-medium text-[#CCBA78] mb-2">How it works:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Track 3 daily habits each week</li>
                  <li>Check off completed habits daily</li>
                  <li>Build streaks for consistency</li>
                  <li>Earn achievements as you progress</li>
                  <li>See your total completion tally grow</li>
                </ul>
              </div>

              <div className="mt-6">
                <p className="font-medium text-[#CCBA78] mb-2">Tips for success:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Start with the habits that feel most manageable</li>
                  <li>Focus on consistency over perfection</li>
                  <li>Use the example suggestions as guidelines</li>
                  <li>Adjust the habits to fit your schedule</li>
                  <li>Check in daily to maintain your streak</li>
                </ul>
              </div>

              <p className="mt-6 text-sm italic">Need help? Reach out to any staff member for guidance on your journey!</p>
            </div>
          </div>
        )}
      </div>

      <DataManagement 
        userId={userId}
        onExport={exportProgress}
        onImport={importProgress}
        onReset={resetProgress}
      />

      {showToast && (
        <Toast message="Habit completed! Keep it up! 🎉" />
      )}

      {selectedHabit && (
        <HabitInfoSheet
          habit={selectedHabit}
          isOpen={showInfo}
          onClose={() => {
            setShowInfo(false);
            setSelectedHabit(null);
          }}
        />
      )}

      <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-6 sm:mb-8">
        <Card className="bg-gray-800 p-3 sm:p-4">
          <div className="text-white">
            <p className="text-xs sm:text-sm opacity-70">Current Streak</p>
            <p className="text-lg sm:text-2xl font-bold">{userData.currentStreak} days</p>
          </div>
        </Card>
        <Card className="bg-gray-800 p-4">
          <div className="text-white">
            <p className="text-sm opacity-70">Completed Habits</p>
            <p className="text-2xl font-bold">{userData.completedHabits}</p>
          </div>
        </Card>
        <Card className="bg-gray-800 p-4">
          <div className="text-white">
            <p className="text-sm opacity-70">Total Points</p>
            <p className="text-2xl font-bold">{userData.totalPoints}</p>
          </div>
        </Card>
        <Card className="bg-gray-800 p-4">
          <div className="text-white">
            <p className="text-sm opacity-70">Achievements</p>
            <p className="text-2xl font-bold">
              {userData.achievements.filter(a => a.unlocked).length}
            </p>
          </div>
        </Card>
      </div>

      <AchievementsPanel achievements={userData.achievements} savedData={savedData} />

      <Tabs defaultValue="strength" className="mb-20 sm:mb-0">
        <TabsList className="grid grid-cols-3 gap-2 sm:gap-4 mb-6 sm:mb-8">
          <TabsTrigger 
            value="strength" 
            className="bg-[#CCBA78] text-gray-900 data-[state=active]:bg-opacity-90 px-2 sm:px-6 py-2 sm:py-3 rounded font-medium text-xs sm:text-base"
          >
            <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
              <Dumbbell className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Strength</span>
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="hybrid" 
            className="bg-[#CCBA78] text-gray-900 data-[state=active]:bg-opacity-90 px-2 sm:px-6 py-2 sm:py-3 rounded font-medium text-xs sm:text-base"
          >
            <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Hybrid</span>
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="cardio" 
            className="bg-[#CCBA78] text-gray-900 data-[state=active]:bg-opacity-90 px-2 sm:px-6 py-2 sm:py-3 rounded font-medium text-xs sm:text-base"
          >
            <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Classes</span>
            </div>
          </TabsTrigger>
        </TabsList>

        {Object.entries(programs).map(([key, program]) => (
          <TabsContent key={key} value={key}>
            <div className="space-y-6">
              {program.weeks.map((week) => (
                <CollapsibleCard key={week.week} week={week}>
                  <div className="space-y-4">
                    {week.habits.map((habit, idx) => (
                      <div key={idx} className="group">
                        <div className="flex items-center space-x-4 text-white">
                          <input 
                            type="checkbox" 
                            className="w-5 h-5 rounded border-[#CCBA78] accent-[#CCBA78]"
                            checked={savedData[key]?.[week.week]?.[idx]?.completionDates?.includes(
                              new Date().toISOString().split('T')[0]
                            ) || false}
                            onChange={(e) => handleCheckbox(key, week.week, idx, e.target.checked)}
                          />
                          <div>
                            <p className="font-medium">{habit.habit}</p>
                            <p className="text-gray-400 text-sm mt-1">{habit.example}</p>
                            <p className="text-gray-400 text-xs mt-1">
                              Completed {savedData[key]?.[week.week]?.[idx]?.completionDates?.length || 0} times
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CollapsibleCard>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

export default HabitProgram;
