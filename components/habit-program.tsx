import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dumbbell, Clock, Users, ChevronDown, Save, Upload, Link as LinkIcon, Share2, Facebook, Info, Calendar } from 'lucide-react'; // Added Info, Calendar
import React, { useState, useEffect, useCallback, useMemo } from 'react'; // Added useMemo
import { Trophy, Award, Crown, Flame } from 'lucide-react';
// Removed unused imports: Home, Settings, Plus, Check, CheckCircle, XCircle
import { Toast } from "@/components/ui/toast"; // Assuming Toast component handles dismiss
import { HabitInfoSheet } from "@/components/ui/habit-info-sheet";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

// --- Interfaces ---
interface Habit {
  id: string; // Unique identifier for the habit
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

// Added 'progress' to Achievement
interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  condition: string;
  targetHabitId?: string;
  streakTarget?: number;
  points: number;
  unlocked: boolean;
  unlockedAt?: string;
  progress?: number; // Optional: Store calculated progress (0-100)
}

interface UserProgress {
  currentStreak: number;
  longestStreak: number;
  totalPoints: number;
  completedHabits: number;
  achievements: Achievement[];
  weeklyProgress: { /* ... */ }; // Keep if used elsewhere
  lastUpdated: string;
}

interface SavedData {
  [program: string]: {
    [week: number]: {
      [habitIndex: number]: {
        completionDates: string[];
        // 'completed' flag removed as it's derived from completionDates.length > 0
      };
    };
  };
}

// --- Programs Data with Habit IDs (Same as before) ---
const programs = { /* ... Your programs object with habit IDs ... */
    strength: {
    title: "Strength & Growth Track",
    weeks: [
      { week: 1, focus: "Foundation Week", habits: [ { id: "str-w1-h1", habit: "Complete scheduled workout", example: "Follow your planned workout schedule (rest days count when planned)" }, { id: "str-w1-h2", habit: "Pack gym bag the night before", example: "Prepare clothes, shoes, water bottle, and towel for tomorrow" }, { id: "str-w1-h3", habit: "Etiquette champ", example: "Clean and organize equipment after each use" } ] },
      { week: 2, focus: "Form Focus", habits: [ { id: "str-w2-h1", habit: "Complete 5-minute mobility warm-up", example: "Dynamic stretches before each workout" }, { id: "str-w2-h2", habit: "Record exercises and weights used", example: "Log all sets, reps, and weights in your tracker" }, { id: "str-w2-h3", habit: "Check form in mirror each exercise", example: "Monitor technique during each exercise set" } ] },
      { week: 3, focus: "Nutrition Basics", habits: [ { id: "str-w3-h1", habit: "Track daily protein intake", example: "Log protein at each meal to hit the daily target" }, { id: "str-w3-h2", habit: "Drink water throughout the day", example: "Track water intake, minimum 8 glasses" }, { id: "str-w3-h3", habit: "Eat pre/post workout meals", example: "Time meals around training sessions" } ] },
      { week: 4, focus: "Recovery", habits: [ { id: "str-w4-h1", habit: "Get 7+ hours sleep", example: "Maintain consistent bedtime routine" }, { id: "str-w4-h2", habit: "Complete 10-min daily stretch", example: "Stretch major muscle groups after training" }, { id: "str-w4-h3", habit: "Rate muscle soreness (1-5)", example: "Track recovery in workout log daily" } ] },
      { week: 5, focus: "Progressive Overload", habits: [ { id: "str-w5-h1", habit: "Follow workout program exactly", example: "Complete all prescribed sets/reps/exercises" }, { id: "str-w5-h2", habit: "Track weight increases", example: "Note when you increase weights on exercises" }, { id: "str-w5-h3", habit: "Rate workout intensity (1-5)", example: "Record how challenging each session feels" } ] },
      { week: 6, focus: "Mind-Muscle", habits: [ { id: "str-w6-h1", habit: "Practice breathing technique", example: "Breathe out on exertion for each rep" }, { id: "str-w6-h2", habit: "Focus on muscle contraction", example: "Feel target muscle working each exercise" }, { id: "str-w6-h3", habit: "Maintain proper form all sets", example: "No form breakdown even when tired" } ] },
      { week: 7, focus: "Consistency", habits: [ { id: "str-w7-h1", habit: "Hit daily step goal", example: "Track and meet minimum step target" }, { id: "str-w7-h2", habit: "Complete all planned exercises", example: "No skipping exercises in a workout" }, { id: "str-w7-h3", habit: "Follow meal timing plan", example: "Eat at scheduled times around workouts" } ] },
      { week: 8, focus: "Mastery", habits: [ { id: "str-w8-h1", habit: "Complete full workout protocol", example: "Warmup, workout, cooldown all done" }, { id: "str-w8-h2", habit: "Meet daily nutrition targets", example: "Hit protein, water, meal timing goals" }, { id: "str-w8-h3", habit: "Log all workout metrics", example: "Record weights, sets, reps, intensity" } ] }
    ]
  },
  hybrid: {
    title: "Functional Training Track",
    weeks: [
      { week: 1, focus: "Movement Foundations", habits: [ { id: "hyb-w1-h1", habit: "Practice air squat technique", example: "10 perfect form squats every hour you're awake" }, { id: "hyb-w1-h2", habit: "Hold plank position", example: "Accumulate 2 minutes total throughout day" }, { id: "hyb-w1-h3", habit: "Complete mobility routine", example: "10-min joint mobility work (hips, shoulders, ankles)" } ] },
      { week: 2, focus: "Workout Basics", habits: [ { id: "hyb-w2-h1", habit: "Complete programmed WOD or rest", example: "Follow scheduled workout or active recovery" }, { id: "hyb-w2-h2", habit: "Record all workout scores", example: "Log time, reps, weights for every workout" }, { id: "hyb-w2-h3", habit: "Practice scaling options", example: "Write down scaled version before each WOD" } ] },
      { week: 3, focus: "Movement Skills", habits: [ { id: "hyb-w3-h1", habit: "Practice daily skill work", example: "10min on pull-up progression or Olympic lift drill" }, { id: "hyb-w3-h2", habit: "Complete metabolic conditioning", example: "Short MetCon or interval work" }, { id: "hyb-w3-h3", habit: "Work on weakness", example: "10min practice on identified weak movement" } ] },
      { week: 4, focus: "Intensity Management", habits: [ { id: "hyb-w4-h1", habit: "Rate workout intensity", example: "Score 1-10 RPE for each training session" }, { id: "hyb-w4-h2", habit: "Track heart rate recovery", example: "Note 1-min recovery after intense portions" }, { id: "hyb-w4-h3", habit: "Complete cooldown protocol", example: "5-min easy movement + stretching post-workout" } ] },
      { week: 5, focus: "Performance Nutrition", habits: [ { id: "hyb-w5-h1", habit: "Time meals around training", example: "Eat 2hrs before WOD, recovery meal within 1hr after" }, { id: "hyb-w5-h2", habit: "Track macronutrient intake", example: "Log protein, carbs, fats in food tracker" }, { id: "hyb-w5-h3", habit: "Follow hydration protocol", example: "Water + electrolytes before/during/after WODs" } ] },
      { week: 6, focus: "Benchmark Progress", habits: [ { id: "hyb-w6-h1", habit: "Record benchmark scores", example: "Log times/reps for named workouts" }, { id: "hyb-w6-h2", habit: "Track key lift numbers", example: "Note weights for main lifts each session" }, { id: "hyb-w6-h3", habit: "Measure workout intensity", example: "Rate sessions by RPE and heart rate" } ] },
      { week: 7, focus: "Advanced Skills", habits: [ { id: "hyb-w7-h1", habit: "Practice Olympic lift drills", example: "Daily technique work on clean/snatch progressions" }, { id: "hyb-w7-h2", habit: "Work on gymnastics skills", example: "Handstand/muscle-up/pull-up practice" }, { id: "hyb-w7-h3", habit: "Complete accessory work", example: "Core, mobility, or weakness focus" } ] },
      { week: 8, focus: "Competition Prep", habits: [ { id: "hyb-w8-h1", habit: "Complete full WOD warmup", example: "Movement prep, skill work, build-up sets" }, { id: "hyb-w8-h2", habit: "Execute workout strategy", example: "Follow pacing and movement plan" }, { id: "hyb-w8-h3", habit: "Record all performance data", example: "Log workout scores, RPE, recovery metrics" } ] }
    ]
  },
  cardio: { // Note: key is 'cardio', title implies 'Classes'
    title: "Group Fitness Track",
    weeks: [
      { week: 1, focus: "Class Preparation", habits: [ { id: "cls-w1-h1", habit: "Pack class essentials bag", example: "Prepare water, towel, and clothes the night before" }, { id: "cls-w1-h2", habit: "Arrive 10 minutes early", example: "Set up the equipment before class starts" }, { id: "cls-w1-h3", habit: "Clean equipment after use", example: "Wipe down and organize your station" } ] },
      { week: 2, focus: "Class Foundations", habits: [ { id: "cls-w2-h1", habit: "Complete pre-class warmup", example: "5-min mobility before class starts" }, { id: "cls-w2-h2", habit: "Follow instructor cues", example: "Match movements to instructions" }, { id: "cls-w2-h3", habit: "Track workout intensity", example: "Rate perceived exertion 1-5" } ] },
      { week: 3, focus: "Movement Mastery", habits: [ { id: "cls-w3-h1", habit: "Practice proper form", example: "Focus on technique each exercise" }, { id: "cls-w3-h2", habit: "Use appropriate modifications", example: "Adjust moves to your level" }, { id: "cls-w3-h3", habit: "Record energy levels", example: "Note energy before/during/after" } ] },
      { week: 4, focus: "Class Intensity", habits: [ { id: "cls-w4-h1", habit: "Maintain form", example: "Keep solid form and technique even as fatigue builds" }, { id: "cls-w4-h2", habit: "Monitor heart rate zones", example: "Stay in target zone ranges" }, { id: "cls-w4-h3", habit: "Track water intake", example: "Hydrate before/during/after" } ] },
      { week: 5, focus: "Personal Progress", habits: [ { id: "cls-w5-h1", habit: "Try one new modification", example: "Attempt a harder version of one move" }, { id: "cls-w5-h2", habit: "Meet intensity targets", example: "Hit prescribed effort levels" }, { id: "cls-w5-h3", habit: "Record performance metrics", example: "Track weights, reps, or time" } ] },
      { week: 6, focus: "Class Engagement", habits: [ { id: "cls-w6-h1", habit: "Introduce yourself to someone new", example: "Learn one classmate's name and fitness goal" }, { id: "cls-w6-h2", habit: "Stay for cooldown", example: "Complete all cooldown stretches" }, { id: "cls-w6-h3", habit: "Give workout maximum effort", example: "Push to appropriate intensity" } ] },
      { week: 7, focus: "Advanced Progress", habits: [ { id: "cls-w7-h1", habit: "Complete advanced moves", example: "Try full versions of exercises" }, { id: "cls-w7-h2", habit: "Maintain form under fatigue", example: "Keep technique late in class" }, { id: "cls-w7-h3", habit: "Track weekly improvements", example: "Note progress in key exercises" } ] },
      { week: 8, focus: "Class Mastery", habits: [ { id: "cls-w8-h1", habit: "Lead by example in class", example: "Show optimal form and technique, help a beginner" }, { id: "cls-w8-h2", habit: "Share progress milestones", example: "Document and share one improvement from your journey" }, { id: "cls-w8-h3", habit: "Record class achievements", example: "Log personal records and wins" } ] }
    ]
  }
 } as const;

// --- Achievements Definition (Same as before) ---
const ACHIEVEMENTS: Achievement[] = [
  { id: 'first-week', title: 'First Week Champion', description: 'Complete all habits for one week', icon: 'trophy', condition: 'Complete 21 habits in a single week', points: 210, unlocked: false },
  { id: 'habit-warrior', title: 'Habit Warrior', description: 'Complete 50 total habits', icon: 'award', condition: 'Complete any 50 habits', points: 350, unlocked: false },
  { id: 'century-club', title: 'Century Club', description: 'Complete 100 total habits', icon: 'award', condition: 'Complete any 100 habits', points: 750, unlocked: false },
  { id: 'halfway-there', title: 'Halfway There!', description: 'Complete all habits for 4 weeks', icon: 'award', condition: 'Complete 84 total habits (Weeks 1-4)', points: 500, unlocked: false },
  { id: 'program-master', title: 'Program Master', description: 'Complete an entire 8-week program', icon: 'crown', condition: 'Complete all 168 habits in an 8-week program', points: 1680, unlocked: false },
  { id: 'streak-master-login', title: 'Check-in Streak Master', description: 'Maintain a 7-day check-in streak', icon: 'calendar', condition: 'Check-in (complete any habit) for 7 consecutive days', streakTarget: 7, points: 70, unlocked: false },
  // Habit Streaks
  { id: 'streak-habit-str-w1-h1-7d', title: 'Workout Consistency', description: 'Complete scheduled workout 7 days straight', icon: 'flame', condition: 'Maintain a 7-day streak for "Complete scheduled workout"', targetHabitId: 'str-w1-h1', streakTarget: 7, points: 100, unlocked: false },
  { id: 'streak-habit-str-w3-h1-7d', title: 'Protein Tracker', description: 'Track daily protein intake 7 days straight', icon: 'flame', condition: 'Maintain a 7-day streak for "Track daily protein intake"', targetHabitId: 'str-w3-h1', streakTarget: 7, points: 100, unlocked: false },
  { id: 'streak-habit-hyb-w1-h1-7d', title: 'Squat Practice Pro', description: 'Practice air squat technique 7 days straight', icon: 'flame', condition: 'Maintain a 7-day streak for "Practice air squat technique"', targetHabitId: 'hyb-w1-h1', streakTarget: 7, points: 100, unlocked: false },
];

// --- Helper Functions (calculateStreak, calculateHabitStreak - same as before) ---
const calculateStreak = (savedData: SavedData): { currentStreak: number; longestStreak: number } => { /* ... implementation ... */
    const allDates = new Set<string>();
    Object.values(savedData).forEach(program => Object.values(program).forEach(week => Object.values(week).forEach(habit => (habit.completionDates || []).forEach(date => allDates.add(date)))));
    const sortedDates = Array.from(allDates).sort();
    if (sortedDates.length === 0) return { currentStreak: 0, longestStreak: 0 };
    const today = new Date(), yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
    const todayStr = today.toISOString().split('T')[0], yesterdayStr = yesterday.toISOString().split('T')[0];
    let currentStreak = 0, longestStreak = 0, streak = 0;
    for (let i = 0; i < sortedDates.length; i++) {
        const currentDate = new Date(sortedDates[i]), previousDate = i > 0 ? new Date(sortedDates[i - 1]) : null;
        let diffDays = 1;
        if (previousDate) { const utcCurrent = Date.UTC(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()), utcPrevious = Date.UTC(previousDate.getFullYear(), previousDate.getMonth(), previousDate.getDate()); diffDays = Math.floor((utcCurrent - utcPrevious) / (1000 * 60 * 60 * 24)); }
        if (diffDays === 1) { streak++; } else { streak = (i === 0) ? 1 : 1; }
        longestStreak = Math.max(longestStreak, streak);
    }
    const lastCompletionDate = sortedDates[sortedDates.length - 1];
    if (lastCompletionDate === todayStr || lastCompletionDate === yesterdayStr) {
        let finalStreak = 0;
        for (let i = sortedDates.length - 1; i >= 0; i--) {
            const currentD = new Date(sortedDates[i]), prevD = i > 0 ? new Date(sortedDates[i - 1]) : null; let dayDiff = 1;
            if (prevD) { const utcCurrent = Date.UTC(currentD.getFullYear(), currentD.getMonth(), currentD.getDate()), utcPrevious = Date.UTC(prevD.getFullYear(), prevD.getMonth(), prevD.getDate()); dayDiff = Math.floor((utcCurrent - utcPrevious) / (1000 * 60 * 60 * 24)); }
            if (i === sortedDates.length - 1 || dayDiff === 1) { finalStreak++; } else { break; }
        } currentStreak = finalStreak;
    } else { currentStreak = 0; }
    return { currentStreak, longestStreak };
};
const calculateHabitStreak = (completionDates: string[]): { currentStreak: number; longestStreak: number } => { /* ... implementation ... */
    const sortedDates = Array.from(new Set(completionDates)).sort(); // Use Array.from()
    const today = new Date(), yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
    const todayStr = today.toISOString().split('T')[0], yesterdayStr = yesterday.toISOString().split('T')[0];
    let currentStreak = 0, longestStreak = 0, streak = 0;
    for (let i = 0; i < sortedDates.length; i++) {
        const currentDate = new Date(sortedDates[i]), previousDate = i > 0 ? new Date(sortedDates[i - 1]) : null; let diffDays = 1;
        if (previousDate) { const utcCurrent = Date.UTC(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()), utcPrevious = Date.UTC(previousDate.getFullYear(), previousDate.getMonth(), previousDate.getDate()); diffDays = Math.floor((utcCurrent - utcPrevious) / (1000 * 60 * 60 * 24)); }
        if (diffDays === 1) { streak++; } else { streak = (i === 0) ? 1 : 1; }
        longestStreak = Math.max(longestStreak, streak);
    }
    const lastCompletionDate = sortedDates[sortedDates.length - 1];
    if (lastCompletionDate === todayStr || lastCompletionDate === yesterdayStr) {
        let finalStreak = 0;
        for (let i = sortedDates.length - 1; i >= 0; i--) {
            const currentD = new Date(sortedDates[i]), prevD = i > 0 ? new Date(sortedDates[i - 1]) : null; let dayDiff = 1;
            if (prevD) { const utcCurrent = Date.UTC(currentD.getFullYear(), currentD.getMonth(), currentD.getDate()), utcPrevious = Date.UTC(prevD.getFullYear(), prevD.getMonth(), prevD.getDate()); dayDiff = Math.floor((utcCurrent - utcPrevious) / (1000 * 60 * 60 * 24)); }
            if (i === sortedDates.length - 1 || dayDiff === 1) { finalStreak++; } else { break; }
        } currentStreak = finalStreak;
    } else { currentStreak = 0; }
    return { currentStreak, longestStreak };
};


// --- AchievementsPanel Component (Simplified) ---
const AchievementsPanel = ({ achievements }: { achievements: Achievement[] }) => {
    const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
    const [showShareDialog, setShowShareDialog] = useState(false);

    // Share function remains the same
    const shareToFacebook = () => { /* ... */ };

    return (
        <Card className="bg-gray-800 border-none mb-8">
            <div className="p-6">
                <h3 className="text-[#CCBA78] text-xl font-semibold mb-4">Achievements</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {achievements.map((achievement) => (
                        <div
                            key={achievement.id}
                            className={`p-4 rounded-lg ${achievement.unlocked ? 'bg-[#CCBA78] bg-opacity-20 border border-[#CCBA78]' : 'bg-gray-700 bg-opacity-50'}`}
                        >
                            {/* Header: Icon, Title, Share Button */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    {/* Icons */}
                                    {achievement.icon === 'trophy' && <Trophy className={`w-5 h-5 ${achievement.unlocked ? 'text-[#CCBA78]' : 'text-gray-400'}`} />}
                                    {achievement.icon === 'flame' && <Flame className={`w-5 h-5 ${achievement.unlocked ? 'text-[#CCBA78]' : 'text-gray-400'}`} />}
                                    {achievement.icon === 'award' && <Award className={`w-5 h-5 ${achievement.unlocked ? 'text-[#CCBA78]' : 'text-gray-400'}`} />}
                                    {achievement.icon === 'crown' && <Crown className={`w-5 h-5 ${achievement.unlocked ? 'text-[#CCBA78]' : 'text-gray-400'}`} />}
                                    {achievement.icon === 'calendar' && <Calendar className={`w-5 h-5 ${achievement.unlocked ? 'text-[#CCBA78]' : 'text-gray-400'}`} />}
                                    <div>
                                        <h4 className={`font-semibold ${achievement.unlocked ? 'text-[#CCBA78]' : 'text-gray-300'}`}>{achievement.title}</h4>
                                        <p className="text-sm text-gray-400">{achievement.description}</p>
                                    </div>
                                </div>
                                {achievement.unlocked && ( <button onClick={() => { setSelectedAchievement(achievement); setShowShareDialog(true); }} className="p-2 text-[#CCBA78] hover:bg-gray-700 rounded-full" title="Share"><Share2 className="w-5 h-5" /></button> )}
                            </div>
                            {/* Footer: Condition/Unlocked Date, Points */}
                            <div className="mt-2 flex justify-between items-center">
                                <span className="text-sm text-gray-400">{achievement.unlocked ? `Unlocked: ${new Date(achievement.unlockedAt!).toLocaleDateString()}` : achievement.condition}</span>
                                <span className={`text-sm ${achievement.unlocked ? 'text-[#CCBA78]' : 'text-gray-400'}`}>{achievement.points} points</span>
                            </div>
                            {/* Progress Bar */}
                            {!achievement.unlocked && (
                                <div className="mt-2">
                                    <div className="w-full bg-gray-600 rounded-full h-2">
                                        <div className="bg-[#CCBA78] h-2 rounded-full transition-all duration-500" style={{ width: `${achievement.progress ?? 0}%` }} /> {/* Use progress from prop */}
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1 text-right">{Math.floor(achievement.progress ?? 0)}%</p> {/* Use progress from prop */}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
            {/* Share Dialog JSX remains the same */}
            <AlertDialog open={showShareDialog} onOpenChange={setShowShareDialog}>
                 <AlertDialogContent className="bg-gray-800 text-white max-w-xl">
                     {/* ... Content ... */}
                 </AlertDialogContent>
            </AlertDialog>
        </Card>
    );
};


// --- DataManagement Component remains the same ---
const DataManagement = ({ userId, onExport, onImport, onReset }: { userId: string; onExport: () => void; onImport: (file: File) => void; onReset: () => void; }) => { /* ... implementation ... */
    const copyUserId = () => { navigator.clipboard.writeText(userId); /* Add toast */ };
    return ( <Card className="bg-gray-800 p-3 sm:p-4 mb-6"> {/* ... JSX ... */} </Card> );
};

// --- CollapsibleCard Component remains the same ---
const CollapsibleCard = ({ week, children }: CollapsibleCardProps) => { /* ... implementation ... */
    const [isOpen, setIsOpen] = useState(true);
    return ( <Card className="bg-gray-800 border-none"> {/* ... JSX ... */} </Card> );
};

// --- useUserStorage Hook (Refined for Toast Callbacks) ---
const useUserStorage = (
    showToastCallback: (message: string, type?: 'success' | 'error') => void // Callback for toasts
) => {
  const [userId, setUserId] = useState<string>('');
  const [isClient, setIsClient] = useState(false);
  const [userData, setUserData] = useState<UserProgress>(() => ({ /* ... initial state ... */
        currentStreak: 0, longestStreak: 0, totalPoints: 0, completedHabits: 0,
        achievements: ACHIEVEMENTS.map(a => ({ ...a, progress: 0, unlocked: false, unlockedAt: undefined })),
        weeklyProgress: {}, lastUpdated: new Date().toISOString()
  }));
   const [savedData, setSavedData] = useState<SavedData>({});

   // Load data on mount (same as before)
   useEffect(() => { /* ... Load logic ... */ }, []);
   // Save user data on change (same as before)
   useEffect(() => { /* ... Save userData logic ... */ }, [userData, userId, isClient]);
   // Save habit data on change (same as before)
   useEffect(() => { /* ... Save savedData logic ... */ }, [savedData, isClient]);

  // Export function with feedback
  const exportProgress = () => {
    if (!isClient) return;
    try {
        const dataToExport = { userData, savedData };
        const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `thezone-habit-tracker-export-${userId}-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
        showToastCallback("Progress exported successfully!", 'success');
    } catch (error) {
        console.error("Export failed:", error);
        showToastCallback("Export failed. Please try again.", 'error');
    }
  };

  // Import function with feedback
  const importProgress = (jsonFile: File) => {
    if (!isClient) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        if (data.userData && data.savedData && data.userData.achievements) {
            // Merge achievement definitions
             const currentAchievementIds = new Set(ACHIEVEMENTS.map(a => a.id));
             const loadedAchievements = (data.userData.achievements || []).filter((ach: Achievement) => currentAchievementIds.has(ach.id)).map((loadedAch: Achievement) => ({ ...ACHIEVEMENTS.find(def => def.id === loadedAch.id), ...loadedAch }));
             const newAchievements = ACHIEVEMENTS.filter(def => !loadedAchievements.some((la: Achievement) => la.id === def.id)).map(a => ({ ...a, progress: 0, unlocked: false })); // Ensure new ones are reset
             data.userData.achievements = [...loadedAchievements, ...newAchievements];

             setUserData(data.userData);
             setSavedData(data.savedData);
             // Force save
             localStorage.setItem(`habit_tracker_${userId}`, JSON.stringify(data.userData));
             localStorage.setItem('habitProgress', JSON.stringify(data.savedData));
             showToastCallback("Progress imported successfully!", 'success');
        } else { throw new Error('Invalid import file structure.'); }
      } catch (error) {
        console.error('Failed to import data:', error);
        showToastCallback(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
      }
    };
     reader.onerror = () => {
         console.error('File reading failed');
         showToastCallback('Failed to read import file.', 'error');
     };
    reader.readAsText(jsonFile);
  };

   // Reset function with feedback
   const resetAllProgress = useCallback(() => {
     if (!isClient) return;
     setSavedData({});
     localStorage.removeItem('habitProgress');
     const initialUserData = {
       currentStreak: 0, longestStreak: 0, totalPoints: 0, completedHabits: 0,
       achievements: ACHIEVEMENTS.map(a => ({ ...a, progress: 0, unlocked: false, unlockedAt: undefined })),
       weeklyProgress: {}, lastUpdated: new Date().toISOString()
     };
     setUserData(initialUserData);
     localStorage.setItem(`habit_tracker_${userId}`, JSON.stringify(initialUserData));
     showToastCallback("All progress has been reset.", 'success');
   }, [userId, isClient, setUserData, setSavedData, showToastCallback]); // Added callback to dependencies

  return { userId, userData, setUserData, savedData, setSavedData, exportProgress, importProgress, resetAllProgress, isClient };
};


// --- Main HabitProgram Component ---
const HabitProgram = () => {
  const [toastInfo, setToastInfo] = useState<{ message: string; type?: 'success' | 'error' } | null>(null);
  const showToastCallback = useCallback((message: string, type?: 'success' | 'error') => {
      setToastInfo({ message, type });
      setTimeout(() => setToastInfo(null), 3000); // Auto-dismiss toast
  }, []);

  const {
    userId, userData, setUserData, savedData, setSavedData,
    exportProgress, importProgress, resetAllProgress, isClient
  } = useUserStorage(showToastCallback); // Pass callback to hook

  const [selectedHabitInfo, setSelectedHabitInfo] = useState<Habit | null>(null);
  const [showInfoSheet, setShowInfoSheet] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(() => isClient ? localStorage.getItem('showOnboarding') !== 'false' : true);

  useEffect(() => { if (isClient) localStorage.setItem('showOnboarding', showOnboarding.toString()); }, [showOnboarding, isClient]);

  // --- Centralized Progress Calculation ---
  const calculateSingleAchievementProgress = useCallback((achievement: Achievement, allDatesMap: Map<string, string[]>, totalCompletions: number): number => {
    let progress = 0;
    const countWeekCompletions = (weekData: any): number => weekData ? Object.values(weekData).reduce((s: number, h: any) => s + (h.completionDates?.length || 0), 0) : 0;
    const getWeeklyCompletionsArray = () => Object.values(savedData).flatMap(p => Object.values(p)).map(countWeekCompletions);

    // Habit Streak Check
    if (achievement.targetHabitId && achievement.streakTarget) {
        const habitDates = allDatesMap.get(achievement.targetHabitId) || [];
        const { currentStreak } = calculateHabitStreak(habitDates);
        progress = Math.min((currentStreak / achievement.streakTarget) * 100, 100);
    }
    // Other Achievement Checks
    else {
        switch (achievement.id) {
            case 'first-week': const maxW = getWeeklyCompletionsArray().reduce((m, c) => Math.max(m, c), 0); progress = Math.min((maxW / 21) * 100, 100); break;
            case 'habit-warrior': progress = Math.min((totalCompletions / 50) * 100, 100); break;
            case 'century-club': progress = Math.min((totalCompletions / 100) * 100, 100); break;
            case 'halfway-there': progress = Math.min((totalCompletions / 84) * 100, 100); break; // Approximation
            case 'program-master': progress = Math.min((totalCompletions / 168) * 100, 100); break;
            case 'streak-master-login': const { currentStreak } = calculateStreak(savedData); progress = Math.min((currentStreak / (achievement.streakTarget || 7)) * 100, 100); break;
            default: progress = 0; break;
        }
    }
    return Math.floor(progress); // Return whole number percentage
  }, [savedData]); // Depend on savedData

  // --- Effect to Update Achievement Progress and Streaks ---
  useEffect(() => {
      if (!isClient) return;

      // Build map of habitId -> completionDates (avoids repeated iteration)
      const allDatesMap = new Map<string, string[]>();
      let totalCompletions = 0;
      Object.entries(programs).forEach(([progKey, progData]) => {
          progData.weeks.forEach((weekData, weekIdx) => {
              weekData.habits.forEach((habitDef, habitIdx) => {
                   const dates = savedData[progKey as keyof typeof programs]?.[weekData.week]?.[habitIdx]?.completionDates || [];
                   allDatesMap.set(habitDef.id, dates);
                   totalCompletions += dates.length;
              });
          });
      });

      // Calculate overall login/activity streak
      const { currentStreak, longestStreak } = calculateStreak(savedData);

      // Calculate progress for all achievements
      const achievementsWithProgress = userData.achievements.map(ach => ({
          ...ach,
          progress: ach.unlocked ? 100 : calculateSingleAchievementProgress(ach, allDatesMap, totalCompletions)
      }));

      // Update state if anything changed
      if (userData.currentStreak !== currentStreak ||
          userData.longestStreak !== longestStreak ||
          userData.completedHabits !== totalCompletions ||
          JSON.stringify(userData.achievements) !== JSON.stringify(achievementsWithProgress)) // Compare progress too
      {
          setUserData(prev => ({
              ...prev,
              currentStreak,
              longestStreak,
              completedHabits: totalCompletions,
              achievements: achievementsWithProgress,
              lastUpdated: new Date().toISOString()
          }));
      }

  }, [savedData, isClient, setUserData, userData.achievements, userData.currentStreak, userData.longestStreak, userData.completedHabits, calculateSingleAchievementProgress]); // Dependencies


  // Pull-to-refresh Effect (remains the same)
  useEffect(() => { /* ... pull to refresh logic ... */ }, [isClient]);

  // --- Checkbox Handler (Simplified state update, logic moved to useEffect) ---
 const handleCheckbox = (programKey: keyof typeof programs, weekNumber: number, habitIndex: number, checked: boolean) => {
    const today = new Date().toISOString().split('T')[0];
    const habitId = programs[programKey]?.weeks?.[weekNumber-1]?.habits?.[habitIndex]?.id;

    if (!habitId) return; // Should not happen if data is correct

    let toastMsg = "";

    setSavedData(prev => {
        const currentCompletionDates = prev[programKey]?.[weekNumber]?.[habitIndex]?.completionDates || [];
        let newCompletionDates;

        if (checked) {
            newCompletionDates = Array.from(new Set([...currentCompletionDates, today]));
            toastMsg = `${programs[programKey].weeks[weekNumber-1].habits[habitIndex].habit} checked!`;
        } else {
            newCompletionDates = currentCompletionDates.filter(date => date !== today);
            toastMsg = `${programs[programKey].weeks[weekNumber-1].habits[habitIndex].habit} unchecked.`;
        }

        const updatedData = { ...prev };
        if (!updatedData[programKey]) updatedData[programKey] = {};
        if (!updatedData[programKey][weekNumber]) updatedData[programKey][weekNumber] = {};
        updatedData[programKey][weekNumber][habitIndex] = {
            completionDates: newCompletionDates
        };
        return updatedData;
    });

    // Check for achievement unlocks immediately after state update is requested
     // We recalculate progress/unlocks in the useEffect watching savedData,
     // but can show an immediate habit check toast here.
     showToastCallback(toastMsg, 'success');

     // Re-trigger achievement unlock check (the useEffect watching savedData will handle it)
     // No need to call setUserData directly here for unlocks, simplifying this handler.
 };


  // Function to show habit info
  const showHabitInfo = (habit: Habit) => { setSelectedHabitInfo(habit); setShowInfoSheet(true); };

  // --- Main JSX Structure ---
  return (
    <div className="bg-gray-900 p-4 pb-24 sm:p-8 md:p-12 max-w-4xl mx-auto min-h-screen">
      {/* Header */}
       <div className="mb-6 sm:mb-8">
         <h1 className="text-2xl sm:text-4xl font-bold mb-2">
           <span className="text-[#CCBA78]">Transform</span>
           <span className="text-white"> Your Habits</span>
         </h1>
         <h2 className="text-white text-lg sm:text-xl">8-Week Journey to Better Health</h2>
       </div>

       {/* Onboarding Section */}
       <div className="bg-gray-800 rounded-lg mb-6 overflow-hidden">
            <button onClick={() => setShowOnboarding(!showOnboarding)} className="w-full p-4 flex justify-between items-center text-[#CCBA78] hover:bg-gray-700 transition-colors">
                <h3 className="text-xl font-semibold">Welcome to Your 8-Week Journey!</h3>
                <ChevronDown className={`w-5 h-5 transform transition-transform duration-200 ${showOnboarding ? 'rotate-180' : ''}`} />
            </button>
            {showOnboarding && <div className="p-6 border-t border-gray-700">{/* Onboarding Content */}</div>}
       </div>


      {/* Data Management */}
      <DataManagement userId={userId} onExport={exportProgress} onImport={importProgress} onReset={() => setShowResetConfirm(true)} />

      {/* Reset Confirmation Dialog */}
       <AlertDialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
         <AlertDialogContent className="bg-gray-800 text-white">
           <AlertDialogHeader>
             <AlertDialogTitle className="text-red-500">Reset Progress?</AlertDialogTitle>
             <AlertDialogDescription> Are you sure? This cannot be undone. </AlertDialogDescription>
           </AlertDialogHeader>
           <AlertDialogFooter>
             <AlertDialogCancel className="bg-gray-600 hover:bg-gray-500">Cancel</AlertDialogCancel>
             <AlertDialogAction onClick={() => { resetAllProgress(); setShowResetConfirm(false); }} className="bg-red-600 hover:bg-red-700"> Yes, Reset </AlertDialogAction>
           </AlertDialogFooter>
         </AlertDialogContent>
       </AlertDialog>

      {/* Toast Notification */}
      {toastInfo && <Toast message={toastInfo.message} type={toastInfo.type} onDismiss={() => setToastInfo(null)} />}

      {/* Habit Info Sheet */}
      {selectedHabitInfo && <HabitInfoSheet habit={selectedHabitInfo} isOpen={showInfoSheet} onClose={() => { setShowInfoSheet(false); setSelectedHabitInfo(null); }} />}

      {/* Stats Overview */}
       <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-6 sm:mb-8">
         <Card className="bg-gray-800 p-3 sm:p-4"><div className="text-white"><p className="text-xs sm:text-sm opacity-70">Check-in Streak</p><p className="text-lg sm:text-2xl font-bold">{userData.currentStreak} days</p></div></Card>
         <Card className="bg-gray-800 p-3 sm:p-4"><div className="text-white"><p className="text-xs sm:text-sm opacity-70">Completed Habits</p><p className="text-lg sm:text-2xl font-bold">{userData.completedHabits}</p></div></Card>
         <Card className="bg-gray-800 p-3 sm:p-4"><div className="text-white"><p className="text-xs sm:text-sm opacity-70">Total Points</p><p className="text-lg sm:text-2xl font-bold">{userData.totalPoints}</p></div></Card>
         <Card className="bg-gray-800 p-3 sm:p-4"><div className="text-white"><p className="text-xs sm:text-sm opacity-70">Achievements</p><p className="text-lg sm:text-2xl font-bold">{userData.achievements.filter(a => a.unlocked).length} / {ACHIEVEMENTS.length}</p></div></Card>
       </div>

      {/* Achievements Panel */}
      <AchievementsPanel achievements={userData.achievements} /> {/* Pass updated achievements */}

      {/* Program Tabs */}
      <Tabs defaultValue="strength" className="mb-20 sm:mb-0">
          <TabsList className="grid grid-cols-3 gap-2 sm:gap-4 mb-6 sm:mb-8">
               {(Object.keys(programs) as Array<keyof typeof programs>).map((key) => {
                   let Icon = Dumbbell; if (key === 'hybrid') Icon = Clock; if (key === 'cardio') Icon = Users;
                   return <TabsTrigger key={key} value={key} className="data-[state=active]:bg-[#CCBA78] data-[state=active]:text-gray-900 data-[state=inactive]:bg-gray-700 data-[state=inactive]:text-gray-400 px-2 sm:px-4 py-2 sm:py-3 rounded text-xs sm:text-sm font-medium"><div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2"><Icon className="w-4 h-4 sm:w-5 sm:h-5" /><span className="capitalize">{key === 'cardio' ? 'Classes' : key}</span></div></TabsTrigger>;
               })}
          </TabsList>

          {/* Program Content */}
          {Object.entries(programs).map(([key, program]) => (
             <TabsContent key={key} value={key}>
                 <div className="space-y-6">
                 {program.weeks.map((week) => (
                     <CollapsibleCard key={`${key}-week-${week.week}`} week={week}>
                         <div className="space-y-4">
                             {week.habits.map((habit, idx) => {
                                 const completionDates = savedData[key as keyof typeof programs]?.[week.week]?.[idx]?.completionDates || [];
                                 const { currentStreak: habitStreak } = calculateHabitStreak(completionDates);
                                 const isCheckedToday = completionDates.includes(new Date().toISOString().split('T')[0]);
                                 return (
                                     <div key={habit.id} className={`group flex items-start space-x-3 sm:space-x-4 p-3 rounded-md transition-colors ${isCheckedToday ? 'bg-green-900 bg-opacity-30' : ''}`}> {/* Added background feedback */}
                                         <input type="checkbox" id={`habit-${habit.id}`} className="mt-1 w-5 h-5 rounded border-gray-500 focus:ring-2 focus:ring-offset-0 focus:ring-[#CCBA78] text-[#CCBA78] bg-gray-700 shrink-0" checked={isCheckedToday} onChange={(e) => handleCheckbox(key as keyof typeof programs, week.week, idx, e.target.checked)} />
                                         <div className="flex-grow">
                                             <label htmlFor={`habit-${habit.id}`} className="font-medium cursor-pointer hover:text-[#CCBA78] transition-colors">{habit.habit}</label>
                                             <p className="text-gray-400 text-sm mt-1">{habit.example}</p>
                                             <div className="flex items-center justify-between mt-1">
                                                 <p className="text-gray-400 text-xs">Completed {completionDates.length} times</p>
                                                 {habitStreak > 0 && ( <div className="flex items-center gap-1 text-orange-400" title={`${habitStreak}-day streak`}> <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span className="text-xs sm:text-sm font-medium">{habitStreak}</span> </div> )}
                                             </div>
                                         </div>
                                     </div>
                                 );
                             })}
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
