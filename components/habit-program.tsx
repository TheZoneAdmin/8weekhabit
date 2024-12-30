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
        focus: "Gym Basics",
        habits: [
          {
            habit: "Learn gym layout and equipment",
            example: "Example: Book induction, learn where machines are, practice rack/weight setup"
          },
          {
            habit: "Practice gym etiquette",
            example: "Example: Re-rack weights, wipe equipment, share during busy times"
          },
          {
            habit: "Set consistent gym schedule",
            example: "Example: Monday/Thursday 6pm, Saturday 10am - put in calendar"
          }
        ]
      },
      {
        week: 2,
        focus: "Movement Foundations",
        habits: [
          {
            habit: "Master bodyweight movements",
            example: "Example: Perfect form on squats, pushups (modified ok), planks"
          },
          {
            habit: "Learn basic machine exercises",
            example: "Example: Leg press, chest press, lat pulldown with light weights"
          },
          {
            habit: "Record workouts simply",
            example: "Example: Note exercises done and weights used in phone notes"
          }
        ]
      },
      {
        week: 3,
        focus: "Building Routine",
        habits: [
          {
            habit: "Establish pre-workout routine",
            example: "Example: Pack gym bag night before,Create playlist, 5min walking warmup"
          },
          {
            habit: "Focus on protein intake",
            example: "Example: Add protein to breakfast"
          },
          {
            habit: "Practice proper breathing",
            example: "Example: Breathe out on contraction, in on return movement"
          }
        ]
      },
      {
        week: 4,
        focus: "Recovery Basics",
        habits: [
          {
            habit: "Learn stretching basics",
            example: "Example: 5min daily stretch focusing on worked muscles or tight points"
          },
          {
            habit: "Monitor workout recovery",
            example: "Example: Note muscle soreness levels, adjust next workout volume if needed"
          },
          {
            habit: "Prioritize sleep",
            example: "Example: Aim for 7+ hours, consistent bedtime routine"
          }
        ]
      },
      {
        week: 5,
        focus: "Simple Nutrition",
        habits: [
          {
            habit: "Plan pre-workout meals",
            example: "Example: Light meal 1-2 hours before gym (oats with whey or yoghurt and nut bowl)"
          },
          {
            habit: "Stay hydrated",
            example: "Example: Water bottle at desk, during workout, and after"
          },
          {
            habit: "Add healthy snacks",
            example: "Example: Pack fruit, nuts, or protein bar for post-workout"
          }
        ]
      },
      {
        week: 6,
        focus: "Form Focus",
        habits: [
          {
            habit: "Record exercise form",
            example: "Example: Video one main exercise per workout, check form with a coach"
          },
          {
            habit: "Learn weight increases",
            example: "Example: When you hit top end of rep ranges, add smallest weight increment"
          },
          {
            habit: "Practice mind-muscle connection",
            example: "Example: Focus on feeling target muscles working"
          }
        ]
      },
      {
        week: 7,
        focus: "Consistency",
        habits: [
          {
            habit: "Plan for busy days",
            example: "Example: Have backup shorter workout, morning/evening options"
          },
          {
            habit: "Track workout completion",
            example: "Example: Mark calendar for completed workouts, aim for 80%"
          },
          {
            habit: "Prepare for obstacles",
            example: "Example: Plan home workout if can't make gym, rainy day gear"
          }
        ]
      },
      {
        week: 8,
        focus: "Progress Check",
        habits: [
          {
            habit: "Review exercise progress",
            example: "Example: Compare weights/reps to first week, note improvements"
          },
          {
            habit: "Set next month's schedule",
            example: "Example: Plan next 4 weeks of workouts in calendar"
          },
          {
            habit: "Celebrate achievements",
            example: "Example: Note new exercises learned, consistency wins"
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
        focus: "Getting Started",
        habits: [
          {
            habit: "Start daily walking",
            example: "Example: 10min walks, gradually increase to 20min"
          },
          {
            habit: "Learn basic stretches",
            example: "Example: Simple morning stretches for major muscle groups"
          },
          {
            habit: "Track daily movement",
            example: "Example: Note daily steps, active minutes in phone"
          }
        ]
      },
      {
        week: 2,
        focus: "Building Activity",
        habits: [
          {
            habit: "Try beginner bodyweight exercises",
            example: "Example: Modified pushups, Assisted squats, modified chin up"
          },
          {
            habit: "Practice good posture",
            example: "Example: Shoulder blades back, chin tucked, core engaged"
          },
          {
            habit: "Add movement breaks",
            example: "Example: 5min stretch/walk every 2 hours of sitting"
          }
        ]
      },
      {
        week: 3,
        focus: "Cardio Basics",
        habits: [
          {
            habit: "Start interval walking",
            example: "Example: Alternate 2min normal pace, 1min faster pace"
          },
          {
            habit: "Try different cardio machines",
            example: "Example: 5min each on bike, treadmill, elliptical"
          },
          {
            habit: "Zone 2 champ",
            example: "Example: Maintain conversation pace for most activity"
          }
        ]
      },
      {
        week: 4,
        focus: "Movement Skills",
        habits: [
          {
            habit: "Learn proper squat form",
            example: "Example: Practice bodyweight squats with mirror check"
          },
          {
            habit: "Master plank position",
            example: "Example: Hold modified plank 20sec, rest, repeat"
          },
          {
            habit: "Practice balance exercises",
            example: "Example: Single-leg stand, heel-to-toe walk"
          }
        ]
      },
      {
        week: 5,
        focus: "Building Endurance",
        habits: [
          {
            habit: "Increase walking duration",
            example: "Example: Build to 30min continuous walking"
          },
          {
            habit: "Add light resistance",
            example: "Example: Try resistance bands, light dumbbells"
          },
          {
            habit: "Practice recovery",
            example: "Example: Gentle stretching on rest days"
          }
        ]
      },
      {
        week: 6,
        focus: "Daily Movement",
        habits: [
          {
            habit: "Find enjoyable activities",
            example: "Example: Try swimming, dancing, or recreational sports"
          },
          {
            habit: "Add a weekend activity",
            example: "Example: Nature walk, bike ride, active housework"
          },
          {
            habit: "Track energy levels",
            example: "Example: Note mood and energy before/after movement"
          }
        ]
      },
      {
        week: 7,
        focus: "Lifestyle Integration",
        habits: [
          {
            habit: "Create active routines",
            example: "Example: Morning stretches, lunch walk, evening exercises"
          },
          {
            habit: "Plan active social time",
            example: "Example: Walking meetups, active family time"
          },
          {
            habit: "Prepare for the weather",
            example: "Example: Indoor backup plans, appropriate gear"
          }
        ]
      },
      {
        week: 8,
        focus: "Moving Forward",
        habits: [
          {
            habit: "Review activity log",
            example: "Example: Compare week 1 vs week 8 activity levels"
          },
          {
            habit: "Plan next phase",
            example: "Example: Choose activities to continue, new ones to try"
          },
          {
            habit: "Set realistic goals",
            example: "Example: Daily step goal, weekly activity minutes"
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
        focus: "Class Introduction",
        habits: [
          {
            habit: "Tour fitness facility",
            example: "Example: Locate lockers, water, classes, learn check-in"
          },
          {
            habit: "Try first class",
            example: "Example: Weight training to learn form and technique"
          },
          {
            habit: "Meet instructors",
            example: "Example: Arrive early, introduce yourself, mention new"
          }
        ]
      },
      {
        week: 2,
        focus: "Class Basics",
        habits: [
          {
            habit: "Learn class setup",
            example: "Example: Proper station setup, mat placement, equipment needed"
          },
          {
            habit: "Practice modifications",
            example: "Example: Learn easier versions of moves, use lighter weights"
          },
          {
            habit: "Pack class essentials",
            example: "Example: Water bottle, towel, appropriate clothes"
          }
        ]
      },
      {
        week: 3,
        focus: "Building Comfort",
        habits: [
          {
            habit: "Learn basic moves",
            example: "Example: Common class movements, cardio equipment, basic steps"
          },
          {
            habit: "Find a comfortable spot",
            example: "Example: Middle-back of room to see others and mirror"
          },
          {
            habit: "Use instructor cues",
            example: "Example: Listen for form tips, rhythm cues, modifications"
          }
        ]
      },
      {
        week: 4,
        focus: "Energy Management",
        habits: [
          {
            habit: "Pace yourself",
            example: "Example: Take breaks when needed, modify intense parts"
          },
          {
            habit: "Listen to the body",
            example: "Example: Note energy levels, adjust the intensity accordingly"
          },
          {
            habit: "Stay hydrated",
            example: "Example: Drink before, during, and after class"
          }
        ]
      },
      {
        week: 5,
        focus: "Class Variety",
        habits: [
          {
            habit: "Try different formats",
            example: "Example: Sample 2-3 different classes"
          },
          {
            habit: "Note preferences",
            example: "Example: Track enjoyment, energy, difficulty of each class"
          },
          {
            habit: "Build class schedule",
            example: "Example: Pick 2-3 regular classes that fit your schedule"
          }
        ]
      },
      {
        week: 6,
        focus: "Social Connection",
        habits: [
          {
            habit: "Meet class regulars",
            example: "Example: Say hi to neighbours, join pre-class chat"
          },
          {
            habit: "Share experiences",
            example: "Example: Ask questions, share challenges with classmates"
          },
          {
            habit: "Give feedback",
            example: "Example: Thank instructor, note helpful cues ask for guidance"
          }
        ]
      },
      {
        week: 7,
        focus: "Progress Steps",
        habits: [
          {
            habit: "Try regular modifications",
            example: "Example: Full pushup instead of knee, add small weights to movement"
          },
          {
            habit: "Track improvements",
            example: "Example: Note longer holds, better balance, more endurance"
          },
          {
            habit: "Set class goals",
            example: "Example: Complete full class, try front row, new progression"
          }
        ]
      },
      {
        week: 8,
        focus: "Routine Building",
        habits: [
          {
            habit: "Plan regular schedule",
            example: "Example: Book next week's classes, set backup options"
          },
          {
            habit: "Review progress",
            example: "Example: Compare week 1 vs week 8 abilities and comfort"
          },
          {
            habit: "Celebrate wins",
            example: "Example: Note new moves learned, classes completed"
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
