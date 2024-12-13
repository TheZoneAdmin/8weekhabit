import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dumbbell, Clock, Users, ChevronDown, Save, Upload, Link as LinkIcon } from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';
import { Trophy, Award, Crown, Flame } from 'lucide-react';

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

interface HabitCompletion {
  completed: boolean;
  completionDates: string[];
}

interface ProgramData {
  [week: number]: {
    [habitIndex: number]: HabitCompletion;
  };
}

interface CustomHabitData extends HabitCompletion {
  id: string;
  habit: string;
  example: string;
  category: string;
  frequency: 'daily' | 'weekly';
  created: string;
}

interface SavedData {
  programs: {
    [program: string]: ProgramData;
  };
  customHabits: {
    [id: string]: CustomHabitData;
  };
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
const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-week',
    title: 'First Week Champion',
    description: 'Complete all habits for one week',
    icon: 'trophy',
    condition: 'Complete 21 habits in a week (3 habits for 7 days)',
    points: 210,  // 3 habits × 7 days × 10 points
    unlocked: false
  },
  {
    id: 'streak-master',
    title: 'Streak Master',
    description: 'Maintain a 7-day streak',
    icon: 'fire',
    condition: 'Check in for 7 consecutive days',
    points: 70,   // 1 habit minimum × 7 days × 10 points
    unlocked: false
  },
  {
    id: 'habit-warrior',
    title: 'Habit Warrior',
    description: 'Complete 50 total habits',
    icon: 'award',
    condition: 'Complete any 50 habits',
    points: 500,  // 50 habits × 10 points
    unlocked: false
  },
  {
    id: 'program-master',
    title: 'Program Master',
    description: 'Complete an entire 8-week program',
    icon: 'crown',
    condition: 'Complete all habits in one program',
    points: 1680, // 8 weeks × 3 habits × 7 days × 10 points
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
        // Count max completions in any week
        const maxWeekCompletions = Object.values(savedData.programs)
          .flatMap(program => Object.values(program))
          .map(week => {
            const uniqueDates = new Set<string>();
            Object.values(week || {}).forEach((habit: HabitCompletion) => {
              habit.completionDates.forEach(date => uniqueDates.add(date));
            });
            return uniqueDates.size;
          })
          .reduce((max, curr) => Math.max(max, curr), 0);
        return (maxWeekCompletions / 21) * 100;

      case 'habit-warrior':
        const totalCompletions = Object.values(savedData.programs)
          .flatMap(program => Object.values(program))
          .flatMap(week => Object.values(week))
          .reduce((total, habit) => total + habit.completionDates.length, 0);
        return (totalCompletions / 50) * 100;

      case 'program-master':
        // Check if any program is complete
        const programCompletions = Object.values(savedData.programs)
          .map(program => 
            Object.values(program)
              .reduce((total, week) => 
                total + Object.values(week)
                  .filter(habit => habit.completionDates.length >= 7).length, 0)
          )
          .reduce((max, curr) => Math.max(max, curr), 0);
        return (programCompletions / (8 * 3 * 7)) * 100;

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
        {/* ID Container */}
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

        {/* Buttons Container */}
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

const CustomHabitManager = ({ savedData, setSavedData }: { 
  savedData: SavedData;
  setSavedData: (data: SavedData) => void;
}) => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    habit: '',
    example: '',
    frequency: 'daily' as const,
    category: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newHabit: CustomHabitData = {
      ...formData,
      id: crypto.randomUUID(),
      created: new Date().toISOString(),
      completed: false,
      completionDates: []
    };

    setSavedData((prev: SavedData) => ({
      ...prev,
      customHabits: {
        ...prev.customHabits,
        [newHabit.id]: newHabit
      }
    }));

    setShowForm(false);
    setFormData({ habit: '', example: '', frequency: 'daily', category: '' });
  };

  return (
    <Card className="bg-gray-800 mb-8">
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-[#CCBA78] text-xl font-semibold">Custom Habits</h3>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-[#CCBA78] text-gray-900 rounded hover:bg-[#CCBA78]/90"
          >
            Add Custom Habit
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Habit name"
              value={formData.habit}
              onChange={e => setFormData(prev => ({ ...prev, habit: e.target.value }))}
              className="w-full bg-gray-700 border-gray-600 rounded p-2 text-white"
              required
            />
            <textarea
              placeholder="Example/Notes"
              value={formData.example}
              onChange={e => setFormData(prev => ({ ...prev, example: e.target.value }))}
              className="w-full bg-gray-700 border-gray-600 rounded p-2 text-white"
              required
            />
            <select
              value={formData.frequency}
              onChange={e => setFormData(prev => ({ ...prev, frequency: e.target.value as 'daily' | 'weekly' }))}
              className="w-full bg-gray-700 border-gray-600 rounded p-2 text-white"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
            <input
              type="text"
              placeholder="Category"
              value={formData.category}
              onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
              className="w-full bg-gray-700 border-gray-600 rounded p-2 text-white"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-gray-700 text-white rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#CCBA78] text-gray-900 rounded"
              >
                Add Habit
              </button>
            </div>
          </form>
        )}

        {/* Display existing custom habits */}
        <div className="mt-4 space-y-4">
          {Object.entries(savedData.customHabits || {}).map(([id, habit]) => (
            <div key={id} className="p-4 bg-gray-700 rounded">
              <h4 className="font-medium text-white">{habit.habit}</h4>
              <p className="text-sm text-gray-400">{habit.example}</p>
              <div className="mt-2 flex justify-between text-sm">
                <span className="text-gray-400">{habit.frequency}</span>
                <span className="text-gray-400">{habit.category}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};
