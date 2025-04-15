import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dumbbell, Clock, Users, ChevronDown, Save, Upload, Share2, Facebook, Info, Calendar } from 'lucide-react';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Trophy, Award, Crown, Flame } from 'lucide-react';
import { Toast } from "@/components/ui/toast"; // Assuming this component exists and works
import { HabitInfoSheet } from "@/components/ui/habit-info-sheet"; // Assuming this exists
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
  progress?: number; // Store calculated progress (0-100)
}
interface UserProgress {
  currentStreak: number; // Login/Activity Streak
  longestStreak: number; // Login/Activity Streak
  totalPoints: number;
  completedHabits: number;
  achievements: Achievement[];
  weeklyProgress: Record<number, any>; // Using Record<number, any> for simplicity
  lastUpdated: string;
}
interface SavedData {
  [program: string]: {
    [week: number]: {
      // Use habit ID as key instead of index for robustness? Requires data migration if format changes.
      // Stick with index for now as per previous code.
      [habitIndex: number]: {
        completionDates: string[];
      };
    };
  };
}

// --- Programs Data with Habit IDs ---
// Ensure this object is complete and correct in your actual file
const programs = {
    strength: {
        title: "Strength & Growth Track", weeks: [
            { week: 1, focus: "Foundation Week", habits: [{ id: "str-w1-h1", habit: "Complete scheduled workout", example: "Follow planned schedule (rest days count)" }, { id: "str-w1-h2", habit: "Pack gym bag", example: "Prepare clothes, shoes, water, towel" }, { id: "str-w1-h3", habit: "Etiquette champ", example: "Clean/organize equipment after use" }] },
            { week: 2, focus: "Form Focus", habits: [{ id: "str-w2-h1", habit: "5-min mobility warm-up", example: "Dynamic stretches before workout" }, { id: "str-w2-h2", habit: "Record exercises/weights", example: "Log sets, reps, weights" }, { id: "str-w2-h3", habit: "Check form in mirror", example: "Monitor technique during sets" }] },
            { week: 3, focus: "Nutrition Basics", habits: [{ id: "str-w3-h1", habit: "Track daily protein", example: "Log protein at each meal" }, { id: "str-w3-h2", habit: "Drink water", example: "Track intake, min 8 glasses" }, { id: "str-w3-h3", habit: "Eat pre/post workout", example: "Time meals around training" }] },
            { week: 4, focus: "Recovery", habits: [{ id: "str-w4-h1", habit: "Get 7+ hours sleep", example: "Maintain consistent bedtime" }, { id: "str-w4-h2", habit: "10-min daily stretch", example: "Stretch major groups post-training" }, { id: "str-w4-h3", habit: "Rate muscle soreness", example: "Track recovery (1-5) daily" }] },
            { week: 5, focus: "Progressive Overload", habits: [{ id: "str-w5-h1", habit: "Follow program exactly", example: "Complete prescribed sets/reps" }, { id: "str-w5-h2", habit: "Track weight increases", example: "Note when weights increase" }, { id: "str-w5-h3", habit: "Rate workout intensity", example: "Record RPE (1-5) per session" }] },
            { week: 6, focus: "Mind-Muscle", habits: [{ id: "str-w6-h1", habit: "Practice breathing", example: "Breathe out on exertion" }, { id: "str-w6-h2", habit: "Focus on contraction", example: "Feel target muscle working" }, { id: "str-w6-h3", habit: "Maintain form always", example: "No form breakdown when tired" }] },
            { week: 7, focus: "Consistency", habits: [{ id: "str-w7-h1", habit: "Hit daily step goal", example: "Track & meet minimum steps" }, { id: "str-w7-h2", habit: "Complete all exercises", example: "No skipping exercises" }, { id: "str-w7-h3", habit: "Follow meal timing", example: "Eat at scheduled times" }] },
            { week: 8, focus: "Mastery", habits: [{ id: "str-w8-h1", habit: "Complete full protocol", example: "Warmup, workout, cooldown" }, { id: "str-w8-h2", habit: "Meet nutrition targets", example: "Hit protein, water, timing" }, { id: "str-w8-h3", habit: "Log all metrics", example: "Record weights, sets, reps, RPE" }] }
        ]
    },
    hybrid: {
        title: "Functional Training Track", weeks: [
            { week: 1, focus: "Movement Foundations", habits: [{ id: "hyb-w1-h1", habit: "Practice air squats", example: "10 perfect squats hourly" }, { id: "hyb-w1-h2", habit: "Hold plank", example: "Accumulate 2 min total daily" }, { id: "hyb-w1-h3", habit: "Mobility routine", example: "10-min joint work daily" }] },
            { week: 2, focus: "Workout Basics", habits: [{ id: "hyb-w2-h1", habit: "Complete WOD/Rest", example: "Follow schedule or active recovery" }, { id: "hyb-w2-h2", habit: "Record scores", example: "Log time/reps/weights" }, { id: "hyb-w2-h3", habit: "Practice scaling", example: "Write down scaled version first" }] },
            { week: 3, focus: "Movement Skills", habits: [{ id: "hyb-w3-h1", habit: "Daily skill work", example: "10min pull-up/Oly drill" }, { id: "hyb-w3-h2", habit: "Complete MetCon", example: "Short metabolic conditioning" }, { id: "hyb-w3-h3", habit: "Work on weakness", example: "10min practice on weak move" }] },
            { week: 4, focus: "Intensity Management", habits: [{ id: "hyb-w4-h1", habit: "Rate workout intensity", example: "Score RPE (1-10) per session" }, { id: "hyb-w4-h2", habit: "Track HR recovery", example: "Note 1-min recovery post-effort" }, { id: "hyb-w4-h3", habit: "Complete cooldown", example: "5-min easy move + stretch" }] },
            { week: 5, focus: "Performance Nutrition", habits: [{ id: "hyb-w5-h1", habit: "Time meals", example: "Eat 2hrs pre, <1hr post WOD" }, { id: "hyb-w5-h2", habit: "Track macros", example: "Log P/C/F daily" }, { id: "hyb-w5-h3", habit: "Follow hydration", example: "Water + electrolytes around WODs" }] },
            { week: 6, focus: "Benchmark Progress", habits: [{ id: "hyb-w6-h1", habit: "Record benchmarks", example: "Log scores for named WODs" }, { id: "hyb-w6-h2", habit: "Track key lifts", example: "Note weights for main lifts" }, { id: "hyb-w6-h3", habit: "Measure intensity", example: "Rate sessions by RPE/HR" }] },
            { week: 7, focus: "Advanced Skills", habits: [{ id: "hyb-w7-h1", habit: "Oly lift drills", example: "Daily clean/snatch technique" }, { id: "hyb-w7-h2", habit: "Gymnastics skills", example: "HS/MU/Pull-up practice" }, { id: "hyb-w7-h3", habit: "Accessory work", example: "Core, mobility, weakness focus" }] },
            { week: 8, focus: "Competition Prep", habits: [{ id: "hyb-w8-h1", habit: "Full WOD warmup", example: "Movement prep, skills, build-up" }, { id: "hyb-w8-h2", habit: "Execute strategy", example: "Follow pacing/movement plan" }, { id: "hyb-w8-h3", habit: "Record all data", example: "Log scores, RPE, recovery" }] }
        ]
    },
    cardio: {
        title: "Group Fitness Track", weeks: [
            { week: 1, focus: "Class Preparation", habits: [{ id: "cls-w1-h1", habit: "Pack class bag", example: "Water, towel, clothes prepped" }, { id: "cls-w1-h2", habit: "Arrive 10 min early", example: "Set up before class" }, { id: "cls-w1-h3", habit: "Clean equipment", example: "Wipe down & organize station" }] },
            { week: 2, focus: "Class Foundations", habits: [{ id: "cls-w2-h1", habit: "Pre-class warmup", example: "5-min mobility before start" }, { id: "cls-w2-h2", habit: "Follow instructor", example: "Match cues/movements" }, { id: "cls-w2-h3", habit: "Track intensity", example: "Rate RPE (1-5)" }] },
            { week: 3, focus: "Movement Mastery", habits: [{ id: "cls-w3-h1", habit: "Practice form", example: "Focus on technique" }, { id: "cls-w3-h2", habit: "Use modifications", example: "Adjust moves to your level" }, { id: "cls-w3-h3", habit: "Record energy levels", example: "Note energy pre/during/post" }] },
            { week: 4, focus: "Class Intensity", habits: [{ id: "cls-w4-h1", habit: "Maintain form", example: "Keep technique under fatigue" }, { id: "cls-w4-h2", habit: "Monitor HR zones", example: "Stay in target ranges" }, { id: "cls-w4-h3", habit: "Track water intake", example: "Hydrate before/during/after" }] },
            { week: 5, focus: "Personal Progress", habits: [{ id: "cls-w5-h1", habit: "Try new mod", example: "Attempt harder version" }, { id: "cls-w5-h2", habit: "Meet intensity targets", example: "Hit prescribed effort" }, { id: "cls-w5-h3", habit: "Record metrics", example: "Track weights/reps/time" }] },
            { week: 6, focus: "Class Engagement", habits: [{ id: "cls-w6-h1", habit: "Meet someone new", example: "Learn classmate's name/goal" }, { id: "cls-w6-h2", habit: "Stay for cooldown", example: "Complete all stretches" }, { id: "cls-w6-h3", habit: "Max effort", example: "Push to appropriate intensity" }] },
            { week: 7, focus: "Advanced Progress", habits: [{ id: "cls-w7-h1", habit: "Advanced moves", example: "Try full exercise versions" }, { id: "cls-w7-h2", habit: "Form under fatigue", example: "Keep technique late in class" }, { id: "cls-w7-h3", habit: "Track improvements", example: "Note progress in key moves" }] },
            { week: 8, focus: "Class Mastery", habits: [{ id: "cls-w8-h1", habit: "Lead by example", example: "Show form, help beginner" }, { id: "cls-w8-h2", habit: "Share milestones", example: "Document/share 1 improvement" }, { id: "cls-w8-h3", habit: "Record achievements", example: "Log PRs and wins" }] }
        ]
    }
} as const;

// --- Achievements Definition ---
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

// --- Helper Functions ---
const calculateStreak = (savedData: SavedData): { currentStreak: number; longestStreak: number } => {
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

const calculateHabitStreak = (completionDates: string[]): { currentStreak: number; longestStreak: number } => {
    const sortedDates = Array.from(new Set(completionDates)).sort();
    if (sortedDates.length === 0) return { currentStreak: 0, longestStreak: 0 };
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

// --- AchievementsPanel Component ---
const AchievementsPanel = ({ achievements }: { achievements: Achievement[] }) => {
    const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
    const [showShareDialog, setShowShareDialog] = useState(false);

    // Simple share function (replace with actual image generation/hosting if needed)
    const shareToFacebook = () => {
        if (!selectedAchievement) return;
        const shareText = `🏆 Achievement Unlocked at The Zone! 💪\n\nI earned "${selectedAchievement.title}"!\n\n#TheZone #FitnessGoals`;
        // Ideally share a URL that has OG tags for the image, title, description
        const urlToShare = window.location.href; // Or a specific achievement page URL
        const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(urlToShare)}&quote=${encodeURIComponent(shareText)}`;
        window.open(url, '_blank', 'width=600,height=400');
        setShowShareDialog(false);
    };

    if (!achievements) { return <div className="text-center text-gray-500 p-4">Loading achievements...</div>; }

    return (
        <Card className="bg-gray-800 border-none mb-8">
            <div className="p-4 sm:p-6"> {/* Adjusted padding */}
                <h3 className="text-[#CCBA78] text-xl font-semibold mb-4">Achievements</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {achievements.map((achievement) => (
                        <div key={achievement.id} className={`p-4 rounded-lg ${achievement.unlocked ? 'bg-[#CCBA78] bg-opacity-20 border border-[#CCBA78]' : 'bg-gray-700 bg-opacity-50'}`}>
                            <div className="flex items-center justify-between min-h-[40px]">
                                <div className="flex items-center gap-3">
                                    {achievement.icon === 'trophy' && <Trophy className={`w-5 h-5 ${achievement.unlocked ? 'text-[#CCBA78]' : 'text-gray-400'}`} />}
                                    {achievement.icon === 'flame' && <Flame className={`w-5 h-5 ${achievement.unlocked ? 'text-orange-400' : 'text-gray-400'}`} />} {/* Orange flame when unlocked */}
                                    {achievement.icon === 'award' && <Award className={`w-5 h-5 ${achievement.unlocked ? 'text-[#CCBA78]' : 'text-gray-400'}`} />}
                                    {achievement.icon === 'crown' && <Crown className={`w-5 h-5 ${achievement.unlocked ? 'text-[#CCBA78]' : 'text-gray-400'}`} />}
                                    {achievement.icon === 'calendar' && <Calendar className={`w-5 h-5 ${achievement.unlocked ? 'text-[#CCBA78]' : 'text-gray-400'}`} />}
                                    <div className="flex-1"> {/* Allow text to wrap */}
                                        <h4 className={`font-semibold ${achievement.unlocked ? 'text-[#CCBA78]' : 'text-gray-300'}`}>{achievement.title}</h4>
                                        <p className="text-sm text-gray-400">{achievement.description}</p>
                                    </div>
                                </div>
                                {achievement.unlocked && (<button onClick={() => { setSelectedAchievement(achievement); setShowShareDialog(true); }} className="p-1.5 text-[#CCBA78] hover:bg-gray-600 rounded-full flex-shrink-0 ml-2" title="Share"><Share2 className="w-4 h-4" /></button>)}
                            </div>
                            <div className="mt-2 flex justify-between items-center text-xs sm:text-sm"> {/* Responsive text size */}
                                <span className="text-gray-400 italic">{achievement.unlocked ? `Unlocked: ${new Date(achievement.unlockedAt!).toLocaleDateString()}` : achievement.condition}</span>
                                <span className={`font-medium ${achievement.unlocked ? 'text-[#CCBA78]' : 'text-gray-400'}`}>{achievement.points} pts</span>
                            </div>
                            {!achievement.unlocked && (
                                <div className="mt-2">
                                    <div className="w-full bg-gray-600 rounded-full h-1.5 sm:h-2 overflow-hidden"> {/* Adjusted height */}
                                        <div className="bg-[#CCBA78] h-full rounded-full transition-all duration-300 ease-out" style={{ width: `${achievement.progress ?? 0}%` }} />
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1 text-right">{Math.floor(achievement.progress ?? 0)}%</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
            {/* Share Dialog */}
            <AlertDialog open={showShareDialog} onOpenChange={setShowShareDialog}>
                <AlertDialogContent className="bg-gray-800 text-white max-w-md"> {/* Adjusted max-width */}
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-[#CCBA78] text-lg">Share Achievement</AlertDialogTitle> {/* Adjusted size */}
                        <AlertDialogDescription className="text-gray-300 text-sm">Celebrate your success!</AlertDialogDescription> {/* Adjusted size */}
                    </AlertDialogHeader>
                    {selectedAchievement && (
                        <div className="my-4 p-4 bg-gray-700 rounded-lg text-center">
                            {/* Icon */}
                             <div className="flex justify-center mb-2">
                                 {selectedAchievement.icon === 'trophy' && <Trophy className="w-10 h-10 text-[#CCBA78]" />}
                                 {selectedAchievement.icon === 'flame' && <Flame className="w-10 h-10 text-orange-400" />}
                                 {selectedAchievement.icon === 'award' && <Award className="w-10 h-10 text-[#CCBA78]" />}
                                 {selectedAchievement.icon === 'crown' && <Crown className="w-10 h-10 text-[#CCBA78]" />}
                                 {selectedAchievement.icon === 'calendar' && <Calendar className="w-10 h-10 text-[#CCBA78]" />}
                             </div>
                             <h3 className="text-lg font-semibold text-[#CCBA78] mb-1">{selectedAchievement.title}</h3>
                             <p className="text-gray-300 text-sm mb-2">{selectedAchievement.description}</p>
                             <p className="text-xs text-gray-400">Unlocked: {new Date(selectedAchievement.unlockedAt || Date.now()).toLocaleDateString()}</p>
                        </div>
                    )}
                    <AlertDialogFooter className="gap-2 flex-col sm:flex-row"> {/* Adjusted flex direction */}
                        <AlertDialogCancel className="w-full sm:w-auto bg-gray-600 text-white hover:bg-gray-500 border-none">Cancel</AlertDialogCancel> {/* Adjusted style */}
                        <AlertDialogAction onClick={shareToFacebook} className="w-full sm:w-auto bg-[#1877F2] hover:bg-[#1877F2]/90 text-white flex items-center justify-center gap-2"> <Facebook className="w-4 h-4" /> Share </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    );
};

// --- DataManagement Component ---
const DataManagement = ({ userId, onExport, onImport, onReset }: { userId: string; onExport: () => void; onImport: (file: File) => void; onReset: () => void; }) => {
    const copyUserId = () => { if(navigator.clipboard) { navigator.clipboard.writeText(userId); /* Add toast feedback */ } };
    return (
        <Card className="bg-gray-800 p-3 sm:p-4 mb-6 rounded-lg"> {/* Added rounded-lg */}
            <div className="text-white">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-2 sm:p-3 bg-gray-700 rounded-lg mb-3">
                    <span className="font-mono text-xs sm:text-sm break-all mb-2 sm:mb-0 mr-2" title="Your unique tracker ID">ID: {userId || "loading..."}</span> {/* Handle loading state */}
                    <button onClick={copyUserId} className="text-[#CCBA78] hover:text-[#CCBA78]/80 p-1 sm:p-2 text-sm whitespace-nowrap flex-shrink-0 rounded hover:bg-gray-600 transition-colors" title="Copy ID">Copy ID</button> {/* Added hover bg */}
                </div>
                <div className="grid grid-cols-3 gap-1 sm:gap-2 w-full text-center">
                    <button onClick={onExport} title="Export progress" className="px-2 sm:px-3 py-2 bg-[#CCBA78] text-gray-900 rounded hover:bg-[#CCBA78]/90 text-xs sm:text-sm transition-colors">Export</button>
                    <label title="Import progress" className="px-2 sm:px-3 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 cursor-pointer text-xs sm:text-sm transition-colors"> Import <input type="file" accept=".json" className="hidden" onChange={(e) => { if (e.target.files?.[0]) { onImport(e.target.files[0]); } e.target.value = ''; }} /> </label>
                    <button onClick={onReset} title="Reset all progress" className="px-2 sm:px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-xs sm:text-sm transition-colors">Reset</button>
                </div>
            </div>
        </Card>
    );
};

// --- CollapsibleCard Component ---
const CollapsibleCard = ({ week, children }: CollapsibleCardProps) => {
    const [isOpen, setIsOpen] = useState(week.week === 1); // Default open only for week 1
    return (
        <Card className="bg-gray-800 border border-gray-700/50 overflow-hidden rounded-lg"> {/* Added border */}
            <div className="flex items-center justify-between p-4 sm:p-6 cursor-pointer hover:bg-gray-700/50 transition-colors" onClick={() => setIsOpen(!isOpen)} role="button" aria-expanded={isOpen} aria-controls={`week-${week.week}-content`}>
                <h3 className="text-[#CCBA78] text-lg font-semibold">Week {week.week} - {week.focus}</h3>
                <ChevronDown className={`w-5 h-5 text-[#CCBA78] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </div>
            {/* Conditional Rendering with explicit check */}
            {isOpen === true && (
               <CardContent id={`week-${week.week}-content`} className="p-4 sm:p-6 pt-4 border-t border-gray-700"> {/* Adjusted padding */}
                   {children}
               </CardContent>
             )}
        </Card>
    );
};


// --- useUserStorage Hook ---
const showToastCallback = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToastInfo(null); // Clear previous toast immediately
    setTimeout(() => {
        setToastInfo({ message, type });
    }, 50); // Short delay to allow DOM update if needed
    setTimeout(() => setToastInfo(null), type === 'error' ? 4000 : 3000); // Auto-dismiss
}, []); // Dependencies are empty as it only uses setters/constants
    const [userId, setUserId] = useState<string>('');
    const [isClient, setIsClient] = useState(false);
    const [isLoading, setIsLoading] = useState(true); // Added loading state
    const [userData, setUserData] = useState<UserProgress>(() => ({ currentStreak: 0, longestStreak: 0, totalPoints: 0, completedHabits: 0, achievements: ACHIEVEMENTS.map(a => ({ ...a, progress: 0, unlocked: false, unlockedAt: undefined })), weeklyProgress: {}, lastUpdated: new Date().toISOString() }));
    const [savedData, setSavedData] = useState<SavedData>({});

    // Load data on mount
    useEffect(() => {
        setIsClient(true);
        setIsLoading(true); // Start loading
        let id = localStorage.getItem('habit_tracker_user_id');
        if (!id) { id = crypto.randomUUID(); localStorage.setItem('habit_tracker_user_id', id); }
        setUserId(id);

        try {
            const savedUserStr = localStorage.getItem(`habit_tracker_${id}`);
            if (savedUserStr) {
                const parsedUser = JSON.parse(savedUserStr);
                const currentIds = new Set(ACHIEVEMENTS.map(a => a.id));
                const loadedAch = (parsedUser.achievements || []).filter((a: Achievement) => currentIds.has(a.id)).map((la: Achievement) => ({ ...ACHIEVEMENTS.find(d => d.id === la.id), ...la }));
                const newAch = ACHIEVEMENTS.filter(d => !loadedAch.some((la: Achievement) => la.id === d.id)).map(a => ({ ...a, progress: 0, unlocked: false }));
                parsedUser.achievements = [...loadedAch, ...newAch];
                setUserData(parsedUser);
            } // Keep default if no saved data

            const savedProgressStr = localStorage.getItem('habitProgress');
            if (savedProgressStr) {
                setSavedData(JSON.parse(savedProgressStr));
            } // Keep default if no saved data
        } catch (error) {
            console.error("Error loading data from localStorage:", error);
             // Reset to defaults if loading fails? Or notify user?
             showToastCallback("Error loading previous progress.", 'error');
             localStorage.removeItem(`habit_tracker_${id}`); // Clear potentially corrupt data
             localStorage.removeItem('habitProgress');
             setUserId(crypto.randomUUID()); // Generate a new ID maybe?
             setUserData({ currentStreak: 0, longestStreak: 0, totalPoints: 0, completedHabits: 0, achievements: ACHIEVEMENTS.map(a => ({ ...a, progress: 0, unlocked: false, unlockedAt: undefined })), weeklyProgress: {}, lastUpdated: new Date().toISOString() });
             setSavedData({});
        } finally {
             setIsLoading(false); // Finish loading
        }
    }, [showToastCallback]); // Added showToastCallback dependency

    // Save userData on change
    useEffect(() => { if (isClient && !isLoading && userId) { localStorage.setItem(`habit_tracker_${userId}`, JSON.stringify(userData)); } }, [userData, userId, isClient, isLoading]);
    // Save savedData on change
    useEffect(() => { if (isClient && !isLoading) { localStorage.setItem('habitProgress', JSON.stringify(savedData)); } }, [savedData, isClient, isLoading]);

    // Export function
    const exportProgress = () => { if (!isClient) return; try { const data = { userData, savedData }; const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `thezone-progress-${userId}.json`; a.click(); URL.revokeObjectURL(url); showToastCallback("Progress exported!", 'success'); } catch (e) { console.error(e); showToastCallback("Export failed.", 'error'); } };
    // Import function
    const importProgress = (file: File) => { if (!isClient) return; const reader = new FileReader(); reader.onload = (e) => { try { const data = JSON.parse(e.target?.result as string); if (data.userData && data.savedData) { const currentIds = new Set(ACHIEVEMENTS.map(a => a.id)); const loadedAch = (data.userData.achievements || []).filter((a: Achievement) => currentIds.has(a.id)).map((la: Achievement) => ({ ...ACHIEVEMENTS.find(d => d.id === la.id), ...la })); const newAch = ACHIEVEMENTS.filter(d => !loadedAch.some((la: Achievement) => la.id === d.id)).map(a => ({ ...a, progress: 0, unlocked: false })); data.userData.achievements = [...loadedAch, ...newAch]; setUserData(data.userData); setSavedData(data.savedData); showToastCallback("Progress imported!", 'success'); } else { throw new Error("Invalid file"); } } catch (err) { console.error(err); showToastCallback(`Import failed: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error'); } }; reader.onerror = () => { showToastCallback('Failed to read file.', 'error'); }; reader.readAsText(file); };
    // Reset function
    const resetAllProgress = useCallback(() => { if (!isClient) return; setSavedData({}); const initialUserData = { currentStreak: 0, longestStreak: 0, totalPoints: 0, completedHabits: 0, achievements: ACHIEVEMENTS.map(a => ({ ...a, progress: 0, unlocked: false, unlockedAt: undefined })), weeklyProgress: {}, lastUpdated: new Date().toISOString() }; setUserData(initialUserData); showToastCallback("Progress reset.", 'success'); }, [userId, isClient, setUserData, setSavedData, showToastCallback]);

    return { userId, userData, setUserData, savedData, setSavedData, exportProgress, importProgress, resetAllProgress, isClient, isLoading };
};

// --- Main HabitProgram Component ---
const HabitProgram = () => {
    const [toastInfo, setToastInfo] = useState<{ message: string; type?: 'success' | 'error' } | null>(null);
    const showToastCallback = useCallback((message: string, type?: 'success' | 'error' = 'success') => { setToastInfo(null); setTimeout(() => { setToastInfo({ message, type }); }, 50); setTimeout(() => setToastInfo(null), type === 'error' ? 4000 : 3000); }, []); // Reset before showing, longer errors
    const { userId, userData, setUserData, savedData, setSavedData, exportProgress, importProgress, resetAllProgress, isClient, isLoading } = useUserStorage(showToastCallback);
    const [selectedHabitInfo, setSelectedHabitInfo] = useState<Habit | null>(null);
    const [showInfoSheet, setShowInfoSheet] = useState(false);
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(() => isClient ? localStorage.getItem('showOnboarding') !== 'false' : true);
    useEffect(() => { if (isClient) localStorage.setItem('showOnboarding', showOnboarding.toString()); }, [showOnboarding, isClient]);

    // Memoized values to prevent unnecessary recalculations
    const allDatesMap = useMemo(() => {
        const map = new Map<string, string[]>();
        if (isLoading || !savedData) return map; // Don't calculate if loading or no data
        Object.entries(programs).forEach(([progKey, progData]) => {
            progData.weeks.forEach((weekData) => {
                weekData.habits.forEach((habitDef, habitIdx) => {
                    const dates = savedData[progKey as keyof typeof programs]?.[weekData.week]?.[habitIdx]?.completionDates || [];
                    map.set(habitDef.id, dates);
                });
            });
        });
        return map;
    }, [savedData, isLoading]);

    const totalCompletions = useMemo(() => {
        if (isLoading) return 0;
        return Array.from(allDatesMap.values()).reduce((sum, dates) => sum + dates.length, 0);
    }, [allDatesMap, isLoading]);

    // Centralized Progress Calculation Hook
    const calculateSingleAchievementProgress = useCallback((achievement: Achievement): number => {
        let progress = 0;
        const countWeekCompletions = (weekData: any): number => weekData ? Object.values(weekData).reduce((s: number, h: any) => s + (h.completionDates?.length || 0), 0) : 0;
        const getWeeklyCompletionsArray = () => Object.values(savedData).flatMap(p => Object.values(p)).map(countWeekCompletions);

        if (achievement.targetHabitId && achievement.streakTarget) {
            const habitDates = allDatesMap.get(achievement.targetHabitId) || [];
            const { currentStreak } = calculateHabitStreak(habitDates);
            progress = Math.min((currentStreak / achievement.streakTarget) * 100, 100);
        } else {
            switch (achievement.id) {
                case 'first-week': const maxW = getWeeklyCompletionsArray().reduce((m, c) => Math.max(m, c), 0); progress = Math.min((maxW / 21) * 100, 100); break;
                case 'habit-warrior': progress = Math.min((totalCompletions / 50) * 100, 100); break;
                case 'century-club': progress = Math.min((totalCompletions / 100) * 100, 100); break;
                case 'halfway-there': progress = Math.min((totalCompletions / 84) * 100, 100); break;
                case 'program-master': progress = Math.min((totalCompletions / 168) * 100, 100); break;
                case 'streak-master-login': const { currentStreak } = calculateStreak(savedData); progress = Math.min((currentStreak / (achievement.streakTarget || 7)) * 100, 100); break;
                default: progress = 0; break;
            }
        }
        return Math.floor(progress);
     }, [savedData, allDatesMap, totalCompletions]); // Dependencies

    // Effect to Update Achievement Progress and Overall Streaks
    useEffect(() => {
        if (!isClient || isLoading) return; // Don't run if server-side or still loading initial data

        const { currentStreak, longestStreak } = calculateStreak(savedData);
        const achievementsWithProgress = userData.achievements.map(ach => ({ ...ach, progress: ach.unlocked ? 100 : calculateSingleAchievementProgress(ach) }));
        const basePoints = totalCompletions * 10; // Moved points calculation here
        const achievementPoints = achievementsWithProgress.filter(a => a.unlocked).reduce((s, a) => s + a.points, 0);
        const totalPoints = basePoints + achievementPoints;


        // Update state only if values have actually changed
        if (userData.currentStreak !== currentStreak || userData.longestStreak !== longestStreak || userData.completedHabits !== totalCompletions || userData.totalPoints !== totalPoints || JSON.stringify(userData.achievements) !== JSON.stringify(achievementsWithProgress)) {
             setUserData(prev => ({ ...prev, currentStreak, longestStreak, completedHabits: totalCompletions, totalPoints, achievements: achievementsWithProgress, lastUpdated: new Date().toISOString() }));
        }
    }, [savedData, isClient, isLoading, setUserData, userData.achievements, userData.currentStreak, userData.longestStreak, userData.completedHabits, userData.totalPoints, calculateSingleAchievementProgress, totalCompletions]); // Added isLoading


    // Pull-to-refresh Effect (remains the same)
    useEffect(() => { /* ... pull to refresh logic ... */ }, [isClient]);

    // Checkbox Handler - Checks for immediate unlocks for toast, main update via useEffect
     const handleCheckbox = (programKey: keyof typeof programs, weekNumber: number, habitIndex: number, checked: boolean) => {
         const today = new Date().toISOString().split('T')[0];
         const habit = programs[programKey]?.weeks?.[weekNumber - 1]?.habits?.[habitIndex];
         if (!habit) return;
         const habitId = habit.id;
         let toastMsg = checked ? `${habit.habit} checked!` : `${habit.habit} unchecked.`;

         // --- Update savedData State ---
         setSavedData(prev => {
             const currentDates = prev[programKey]?.[weekNumber]?.[habitIndex]?.completionDates || [];
             const newDates = checked ? Array.from(new Set([...currentDates, today])) : currentDates.filter(date => date !== today);
             const updatedData = { ...prev }; // Shallow copy previous state
              // Deep copy necessary levels before modification
             if (!updatedData[programKey]) updatedData[programKey] = {}; else updatedData[programKey] = { ...updatedData[programKey] };
             if (!updatedData[programKey][weekNumber]) updatedData[programKey][weekNumber] = {}; else updatedData[programKey][weekNumber] = { ...updatedData[programKey][weekNumber] };
             // Assign new data for the specific habit
             updatedData[programKey][weekNumber][habitIndex] = { completionDates: newDates };
             return updatedData; // Return the new state object
         });

         // Show immediate habit check/uncheck feedback
         showToastCallback(toastMsg, 'success');

         // --- Check for immediate achievement unlock TOAST ---
         // (Actual state update happens in useEffect reacting to savedData change)
         const finalDates = checked
            ? Array.from(new Set([...(savedData[programKey]?.[weekNumber]?.[habitIndex]?.completionDates || []), today]))
            : (savedData[programKey]?.[weekNumber]?.[habitIndex]?.completionDates || []).filter(date => date !== today);
         const { currentStreak: specificHabitStreak } = calculateHabitStreak(finalDates);
         let newlyUnlocked: string[] = [];
         userData.achievements.forEach(ach => {
             if (!ach.unlocked && ach.targetHabitId === habitId && ach.streakTarget && specificHabitStreak >= ach.streakTarget) {
                 newlyUnlocked.push(ach.title);
             }
             // You could add immediate checks for other simple achievements here if needed
             // e.g., check for totalCompletions === 50 for Habit Warrior toast
             // Note: totalCompletions used here would be based on the *previous* state before this update finishes
         });
         if (newlyUnlocked.length > 0) {
             showToastCallback(`Achievement Unlocked: ${newlyUnlocked.join(', ')}! 🎉`, 'success');
         }
     };

    // Function to show habit info
    const showHabitInfo = (habit: Habit) => { setSelectedHabitInfo(habit); setShowInfoSheet(true); };

    // Loading state handling
    if (isLoading && isClient) {
        return <div className="flex justify-center items-center min-h-screen bg-gray-900 text-white">Loading Your Progress...</div>;
    }

    // --- Main JSX Structure ---
    return (
        <div className="bg-gray-900 p-4 pb-24 sm:p-6 md:p-8 max-w-4xl mx-auto min-h-screen"> {/* Adjusted padding */}
            {/* Header */}
            <div className="mb-6 sm:mb-8">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1 sm:mb-2"><span className="text-[#CCBA78]">Transform</span><span className="text-white"> Your Habits</span></h1>
                <h2 className="text-white text-base sm:text-lg">8-Week Journey to Better Health</h2> {/* Adjusted size */}
            </div>

            {/* Onboarding Section */}
            <div className="bg-gray-800 rounded-lg mb-6 overflow-hidden border border-gray-700/50"> {/* Added subtle border */}
                <button onClick={() => setShowOnboarding(!showOnboarding)} className="w-full p-4 flex justify-between items-center text-[#CCBA78] hover:bg-gray-700/50 transition-colors">
                    <h3 className="text-lg sm:text-xl font-semibold">Welcome to Your 8-Week Journey!</h3> {/* Adjusted size */}
                    <ChevronDown className={`w-5 h-5 transform transition-transform duration-200 ${showOnboarding ? 'rotate-180' : ''}`} />
                </button>
                {showOnboarding && (
                    <div className="p-4 sm:p-6 border-t border-gray-700"> {/* Adjusted padding */}
                        <div className="space-y-4 text-gray-300 text-sm sm:text-base"> {/* Base text lighter */}
                            <p>Choose your path:</p>
                            <ul className="list-disc pl-5 space-y-1.5"> {/* Adjusted spacing */}
                                <li><span className="text-[#CCBA78] font-medium">Strength & Growth</span> - For building muscle & strength.</li>
                                <li><span className="text-[#CCBA78] font-medium">Functional Training (Hybrid)</span> - For overall fitness, strength & cardio.</li>
                                <li><span className="text-[#CCBA78] font-medium">Group Fitness (Classes)</span> - For guided workouts & community.</li>
                            </ul>
                            <div className="mt-4"> {/* Adjusted spacing */}
                                <p className="font-medium text-[#CCBA78] mb-1">How it works:</p>
                                <ul className="list-disc pl-5 space-y-1.5">
                                    <li>Select your track below</li>
                                    <li>Track 3 daily habits each week</li>
                                    <li>Check off completed habits daily</li>
                                    <li>Build streaks (🔥) & earn achievements (🏆)</li>
                                </ul>
                            </div>
                            <div className="mt-4">
                                <p className="font-medium text-[#CCBA78] mb-1">Tips:</p>
                                <ul className="list-disc pl-5 space-y-1.5">
                                    <li>Consistency Beats Perfection</li>
                                    <li>Use examples as guides</li>
                                    <li>Don't worry if you miss a day!</li>
                                    <li>Check in daily</li>
                                </ul>
                            </div>
                            <p className="mt-4 text-xs sm:text-sm italic text-gray-400">Need help? Ask any staff member!</p> {/* Adjusted text */}
                        </div>
                    </div>
                )}
            </div>

            {/* Data Management */}
            <DataManagement userId={userId} onExport={exportProgress} onImport={importProgress} onReset={() => setShowResetConfirm(true)} />

            {/* Reset Dialog */}
            <AlertDialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
                 <AlertDialogContent className="bg-gray-800 text-white"><AlertDialogHeader><AlertDialogTitle className="text-red-500">Reset Progress?</AlertDialogTitle><AlertDialogDescription>This cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel className="bg-gray-600 hover:bg-gray-500 border-none">Cancel</AlertDialogCancel><AlertDialogAction onClick={()=>{resetAllProgress(); setShowResetConfirm(false);}} className="bg-red-600 hover:bg-red-700">Reset</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
             </AlertDialog>

            {/* Toast Area - Position fixed at bottom center */}
            <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-xs sm:max-w-sm px-4">
                {toastInfo && <Toast message={toastInfo.message} type={toastInfo.type} />}
            </div>

            {/* Habit Info Sheet */}
            {selectedHabitInfo && <HabitInfoSheet habit={selectedHabitInfo} isOpen={showInfoSheet} onClose={() => { setShowInfoSheet(false); setSelectedHabitInfo(null); }} />}

             {/* Achievements Panel */}
             {/* Render only if achievements array is not empty */}
             {(userData?.achievements && userData.achievements.length > 0) &&
                 <AchievementsPanel achievements={userData.achievements} />
             }

            {/* Program Tabs */}
            <Tabs defaultValue="strength" className="mb-20 sm:mb-0">
                <TabsList className="grid grid-cols-3 gap-2 mb-6">
                    {(Object.keys(programs) as Array<keyof typeof programs>).map((key) => {
                        let Icon = Dumbbell; if (key === 'hybrid') Icon = Clock; if (key === 'cardio') Icon = Users;
                        const title = key === 'cardio' ? 'Classes' : key.charAt(0).toUpperCase() + key.slice(1);
                        return <TabsTrigger key={key} value={key} className="data-[state=active]:bg-[#CCBA78] data-[state=active]:text-gray-900 data-[state=inactive]:bg-gray-700 data-[state=inactive]:text-gray-400 data-[state=inactive]:hover:bg-gray-600/70 px-3 py-2.5 rounded text-xs sm:text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-[#CCBA78] focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"><div className="flex flex-col items-center gap-1 sm:gap-1.5"><Icon className="w-4 h-4 sm:w-5 sm:h-5" /><span>{title}</span></div></TabsTrigger>;
                    })}
                </TabsList>

                {/* Program Content */}
                {Object.entries(programs).map(([key, program]) => (
                    <TabsContent key={key} value={key}>
                        <div className="space-y-4 sm:space-y-6"> {/* Adjusted spacing */}
                            {program.weeks.map((week) => (
                                <CollapsibleCard key={`${key}-week-${week.week}`} week={week}>
                                    <div className="space-y-3 sm:space-y-4"> {/* Adjusted spacing */}
                                        {week.habits.map((habit, idx) => {
                                            const completionDates = savedData[key as keyof typeof programs]?.[week.week]?.[idx]?.completionDates || [];
                                            const { currentStreak: habitStreak } = calculateHabitStreak(completionDates);
                                            const isCheckedToday = completionDates.includes(new Date().toISOString().split('T')[0]);
                                            return (
                                                <div key={habit.id} className={`group flex items-start space-x-3 p-3 rounded-md transition-colors duration-150 ${isCheckedToday ? 'bg-green-900/40 hover:bg-green-900/50' : 'hover:bg-gray-700/40'}`}>
                                                    <input type="checkbox" id={`habit-${habit.id}`} className="mt-1 w-5 h-5 rounded border-gray-500 focus:ring-2 focus:ring-offset-0 focus:ring-offset-gray-800 focus:ring-[#CCBA78] text-[#CCBA78] bg-gray-700 shrink-0 cursor-pointer" checked={isCheckedToday} onChange={(e) => handleCheckbox(key as keyof typeof programs, week.week, idx, e.target.checked)} />
                                                    <div className="flex-grow">
                                                        <label htmlFor={`habit-${habit.id}`} className="font-medium text-gray-100 hover:text-[#CCBA78] transition-colors cursor-pointer">{habit.habit}</label> {/* Habit text slightly lighter */}
                                                        <p className="text-gray-400 text-sm mt-0.5 sm:mt-1">{habit.example}</p> {/* Example slightly darker */}
                                                        <div className="flex items-center justify-between mt-1.5"> {/* Adjusted spacing */}
                                                             <p className="text-gray-500 text-xs">Completed {completionDates.length} times</p> {/* Completion count darker */}
                                                             {habitStreak > 0 && (<div className="flex items-center gap-1 text-orange-400 animate-pulse" title={`${habitStreak}-day streak`}><Flame className="w-3.5 h-3.5" /><span className="text-xs font-medium">{habitStreak}</span></div>)}
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
