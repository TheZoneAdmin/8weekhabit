import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dumbbell, Clock, Users, ChevronDown, Save, Upload, Link as LinkIcon, Share2, Facebook } from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';
import { Trophy, Award, Crown, Flame } from 'lucide-react';
import { Home, Calendar, Settings, Plus, Check, Info, CheckCircle, XCircle } from 'lucide-react';
import { Toast } from "@/components/ui/toast";
import { SwipeableHabit } from "@/components/ui/swipeable-habit";
import { HabitInfoSheet } from "@/components/ui/habit-info-sheet";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

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
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [showShareDialog, setShowShareDialog] = useState(false);

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

  const shareToFacebook = () => {
    if (!selectedAchievement) return;
    
    const shareText = `🏆 Just unlocked "${selectedAchievement.title}" in my fitness journey!\n\n${selectedAchievement.description}\n\nJoin me in building better habits!`;
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}&quote=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank', 'width=600,height=400');
    setShowShareDialog(false);
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
              <div className="flex items-center justify-between">
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
                {achievement.unlocked && (
                  <button
                    onClick={() => {
                      setSelectedAchievement(achievement);
                      setShowShareDialog(true);
                    }}
                    className="p-2 text-[#CCBA78] hover:bg-gray-700 rounded-full transition-colors"
                    title="Share achievement"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                )}
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

      <AlertDialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <AlertDialogContent className="bg-gray-800 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#CCBA78]">
              Share Achievement
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              Celebrate your success by sharing this achievement with your fitness community!
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          {selectedAchievement && (
            <div className="my-4 p-4 bg-gray-700 rounded-lg">
              <h3 className="text-lg font-semibold text-[#CCBA78] mb-2">
                {selectedAchievement.title}
              </h3>
              <p className="text-gray-300 mb-2">{selectedAchievement.description}</p>
              <p className="text-sm text-gray-400">
                Unlocked: {new Date(selectedAchievement.unlockedAt || '').toLocaleDateString()}
              </p>
            </div>
          )}

          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="bg-gray-700 text-white hover:bg-gray-600">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={shareToFacebook}
              className="bg-[#1877F2] hover:bg-[#1877F2]/90 text-white flex items-center gap-2"
            >
              <Facebook className="w-4 h-4" />
              Share to Facebook
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
    title: "Strength & Growth Track",
    weeks: [
      {
        week: 1,
        focus: "Foundation Week",
        habits: [
          {
            habit: "Complete scheduled workout",
            example: "Follow your planned workout schedule (rest days count when planned)"
          },
          {
            habit: "Pack gym bag the night before",
            example: "Prepare clothes, shoes, water bottle, and towel for tomorrow"
          },
          {
            habit: "Etiquette champ",
            example: "Clean and organize equipment after each use"
          }
        ]
      },
      {
        week: 2,
        focus: "Form Focus",
        habits: [
          {
            habit: "Complete 5-minute mobility warm-up",
            example: "Dynamic stretches before each workout"
          },
          {
            habit: "Record exercises and weights used",
            example: "Log all sets, reps, and weights in your tracker"
          },
          {
            habit: "Check form in mirror each exercise",
            example: "Monitor technique during each exercise set"
          }
        ]
      },
      {
        week: 3,
        focus: "Nutrition Basics",
        habits: [
          {
            habit: "Track daily protein intake",
            example: "Log protein at each meal to hit the daily target"
          },
          {
            habit: "Drink water throughout the day",
            example: "Track water intake, minimum 8 glasses"
          },
          {
            habit: "Eat pre/post workout meals",
            example: "Time meals around training sessions"
          }
        ]
      },
      {
        week: 4,
        focus: "Recovery",
        habits: [
          {
            habit: "Get 7+ hours sleep",
            example: "Maintain consistent bedtime routine"
          },
          {
            habit: "Complete 10-min daily stretch",
            example: "Stretch major muscle groups after training"
          },
          {
            habit: "Rate muscle soreness (1-5)",
            example: "Track recovery in workout log daily"
          }
        ]
      },
      {
        week: 5,
        focus: "Progressive Overload",
        habits: [
          {
            habit: "Follow workout program exactly",
            example: "Complete all prescribed sets/reps/exercises"
          },
          {
            habit: "Track weight increases",
            example: "Note when you increase weights on exercises"
          },
          {
            habit: "Rate workout intensity (1-5)",
            example: "Record how challenging each session feels"
          }
        ]
      },
      {
        week: 6,
        focus: "Mind-Muscle",
        habits: [
          {
            habit: "Practice breathing technique",
            example: "Breathe out on exertion for each rep"
          },
          {
            habit: "Focus on muscle contraction",
            example: "Feel target muscle working each exercise"
          },
          {
            habit: "Maintain proper form all sets",
            example: "No form breakdown even when tired"
          }
        ]
      },
      {
        week: 7,
        focus: "Consistency",
        habits: [
          {
            habit: "Hit daily step goal",
            example: "Track and meet minimum step target"
          },
          {
            habit: "Complete all planned exercises",
            example: "No skipping exercises in a workout"
          },
          {
            habit: "Follow meal timing plan",
            example: "Eat at scheduled times around workouts"
          }
        ]
      },
      {
        week: 8,
        focus: "Mastery",
        habits: [
          {
            habit: "Complete full workout protocol",
            example: "Warmup, workout, cooldown all done"
          },
          {
            habit: "Meet daily nutrition targets",
            example: "Hit protein, water, meal timing goals"
          },
          {
            habit: "Log all workout metrics",
            example: "Record weights, sets, reps, intensity"
          }
        ]
      }
    ]
  },
 hybrid: {
    title: "Functional Training Track",
    weeks: [
      {
        week: 1,
        focus: "Movement Foundations",
        habits: [
          {
            habit: "Practice air squat technique",
            example: "10 perfect form squats every hour you're awake"
          },
          {
            habit: "Hold plank position",
            example: "Accumulate 2 minutes total throughout day"
          },
          {
            habit: "Complete mobility routine",
            example: "10-min joint mobility work (hips, shoulders, ankles)"
          }
        ]
      },
      {
        week: 2,
        focus: "Workout Basics",
        habits: [
          {
            habit: "Complete programmed WOD or rest",
            example: "Follow scheduled workout or active recovery"
          },
          {
            habit: "Record all workout scores",
            example: "Log time, reps, weights for every workout"
          },
          {
            habit: "Practice scaling options",
            example: "Write down scaled version before each WOD"
          }
        ]
      },
      {
        week: 3,
        focus: "Movement Skills",
        habits: [
          {
            habit: "Practice daily skill work",
            example: "10min on pull-up progression or Olympic lift drill"
          },
          {
            habit: "Complete metabolic conditioning",
            example: "Short MetCon or interval work"
          },
          {
            habit: "Work on weakness",
            example: "10min practice on identified weak movement"
          }
        ]
      },
      {
        week: 4,
        focus: "Intensity Management",
        habits: [
          {
            habit: "Rate workout intensity",
            example: "Score 1-10 RPE for each training session"
          },
          {
            habit: "Track heart rate recovery",
            example: "Note 1-min recovery after intense portions"
          },
          {
            habit: "Complete cooldown protocol",
            example: "5-min easy movement + stretching post-workout"
          }
        ]
      },
      {
        week: 5,
        focus: "Performance Nutrition",
        habits: [
          {
            habit: "Time meals around training",
            example: "Eat 2hrs before WOD, recovery meal within 1hr after"
          },
          {
            habit: "Track macronutrient intake",
            example: "Log protein, carbs, fats in food tracker"
          },
          {
            habit: "Follow hydration protocol",
            example: "Water + electrolytes before/during/after WODs"
          }
        ]
      },
      {
        week: 6,
        focus: "Benchmark Progress",
        habits: [
          {
            habit: "Record benchmark scores",
            example: "Log times/reps for named workouts"
          },
          {
            habit: "Track key lift numbers",
            example: "Note weights for main lifts each session"
          },
          {
            habit: "Measure workout intensity",
            example: "Rate sessions by RPE and heart rate"
          }
        ]
      },
      {
        week: 7,
        focus: "Advanced Skills",
        habits: [
          {
            habit: "Practice Olympic lift drills",
            example: "Daily technique work on clean/snatch progressions"
          },
          {
            habit: "Work on gymnastics skills",
            example: "Handstand/muscle-up/pull-up practice"
          },
          {
            habit: "Complete accessory work",
            example: "Core, mobility, or weakness focus"
          }
        ]
      },
      {
        week: 8,
        focus: "Competition Prep",
        habits: [
          {
            habit: "Complete full WOD warmup",
            example: "Movement prep, skill work, build-up sets"
          },
          {
            habit: "Execute workout strategy",
            example: "Follow pacing and movement plan"
          },
          {
            habit: "Record all performance data",
            example: "Log workout scores, RPE, recovery metrics"
          }
        ]
      }
    ]
  },
  cardio: {
    title: "Group Fitness Track",
    weeks: [
      {
        week: 1,
        focus: "Class Preparation",
        habits: [
          {
            habit: "Pack class essentials bag",
            example: "Prepare water, towel, and clothes the night before"
          },
          {
            habit: "Arrive 10 minutes early",
            example: "Set up the equipment before class starts"
          },
          {
            habit: "Clean equipment after use",
            example: "Wipe down and organize your station"
          }
        ]
      },
      {
        week: 2,
        focus: "Class Foundations",
        habits: [
          {
            habit: "Complete pre-class warmup",
            example: "5-min mobility before class starts"
          },
          {
            habit: "Follow instructor cues",
            example: "Match movements to instructions"
          },
          {
            habit: "Track workout intensity",
            example: "Rate perceived exertion 1-5"
          }
        ]
      },
      {
        week: 3,
        focus: "Movement Mastery",
        habits: [
          {
            habit: "Practice proper form",
            example: "Focus on technique each exercise"
          },
          {
            habit: "Use appropriate modifications",
            example: "Adjust moves to your level"
          },
          {
            habit: "Record energy levels",
            example: "Note energy before/during/after"
          }
        ]
      },
      {
        week: 4,
        focus: "Class Intensity",
        habits: [
          {
            habit: "Maintain form",
            example: "Keep solid form and technique even as fatigue builds"
          },
          {
            habit: "Monitor heart rate zones",
            example: "Stay in target zone ranges"
          },
          {
            habit: "Track water intake",
            example: "Hydrate before/during/after"
          }
        ]
      },
      {
        week: 5,
        focus: "Personal Progress",
        habits: [
          {
            habit: "Try one new modification",
            example: "Attempt a harder version of one move"
          },
          {
            habit: "Meet intensity targets",
            example: "Hit prescribed effort levels"
          },
          {
            habit: "Record performance metrics",
            example: "Track weights, reps, or time"
          }
        ]
      },
      {
        week: 6,
        focus: "Class Engagement",
        habits: [
          {
            habit: "Introduce yourself to someone new",
            example: "Learn one classmate's name and fitness goal"
          },
          {
            habit: "Stay for cooldown",
            example: "Complete all cooldown stretches"
          },
          {
            habit: "Give workout maximum effort",
            example: "Push to appropriate intensity"
          }
        ]
      },
      {
        week: 7,
        focus: "Advanced Progress",
        habits: [
          {
            habit: "Complete advanced moves",
            example: "Try full versions of exercises"
          },
          {
            habit: "Maintain form under fatigue",
            example: "Keep technique late in class"
          },
          {
            habit: "Track weekly improvements",
            example: "Note progress in key exercises"
          }
        ]
      },
      {
        week: 8,
        focus: "Class Mastery",
        habits: [
          {
            habit: "Lead by example in class",
            example: "Show optimal form and technique, help a beginner"
          },
          {
            habit: "Share progress milestones",
            example: "Document and share one improvement from your journey"
          },
          {
            habit: "Record class achievements",
            example: "Log personal records and wins"
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
};

export default HabitProgram;
