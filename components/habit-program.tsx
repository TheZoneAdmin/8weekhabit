import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dumbbell, Clock, Users, ChevronDown, Save, Upload, Share2, Facebook, Info, Calendar, HelpCircle } from 'lucide-react';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Trophy, Award, Crown, Flame, AlertCircle } from 'lucide-react';
import { Toast } from "@/components/ui/toast";
import { HabitInfoSheet } from "@/components/ui/habit-info-sheet";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// --- Icon Mapping for Habits ---
const habitIconMapping = {
  // Strength Track
  "str-w1-h1": "dumbbell", // Complete scheduled workout
  "str-w1-h2": "baggage", // Pack gym bag
  "str-w1-h3": "sparkles", // Etiquette champ
  "str-w2-h1": "stretching", // 5-min mobility warm-up
  "str-w2-h2": "clipboard-list", // Record exercises/weights
  "str-w2-h3": "scan", // Check form in mirror
  "str-w3-h1": "egg", // Track daily protein
  "str-w3-h2": "droplets", // Drink water
  "str-w3-h3": "utensils", // Eat pre/post workout
  "str-w4-h1": "moon", // Get 7+ hours sleep
  "str-w4-h2": "stretch", // 10-min daily stretch
  "str-w4-h3": "activity", // Rate muscle soreness
  "str-w5-h1": "list-checks", // Follow program exactly
  "str-w5-h2": "trending-up", // Track weight increases
  "str-w5-h3": "bar-chart", // Rate workout intensity
  "str-w6-h1": "lungs", // Practice breathing
  "str-w6-h2": "zap", // Focus on contraction
  "str-w6-h3": "check-circle", // Maintain form always
  "str-w7-h1": "footprints", // Hit daily step goal
  "str-w7-h2": "check-square", // Complete all exercises
  "str-w7-h3": "timer", // Follow meal timing
  "str-w8-h1": "list-todo", // Complete full protocol
  "str-w8-h2": "target", // Meet nutrition targets
  "str-w8-h3": "clipboard-data", // Log all metrics
  
  // Hybrid Track
  "hyb-w1-h1": "squat", // Practice air squats
  "hyb-w1-h2": "timer", // Hold plank
  "hyb-w1-h3": "movement", // Mobility routine
  "hyb-w2-h1": "calendar-check", // Complete WOD/Rest
  "hyb-w2-h2": "pencil", // Record scores
  "hyb-w2-h3": "scale", // Practice scaling
  "hyb-w3-h1": "dumbbell", // Daily skill work
  "hyb-w3-h2": "timer", // Complete MetCon
  "hyb-w3-h3": "target", // Work on weakness
  "hyb-w4-h1": "heart-pulse", // Rate workout intensity
  "hyb-w4-h2": "heart", // Track HR recovery
  "hyb-w4-h3": "wind", // Complete cooldown
  "hyb-w5-h1": "clock", // Time meals
  "hyb-w5-h2": "pie-chart", // Track macros
  "hyb-w5-h3": "droplet", // Follow hydration
  "hyb-w6-h1": "file-text", // Record benchmarks
  "hyb-w6-h2": "dumbbell", // Track key lifts
  "hyb-w6-h3": "gauge", // Measure intensity
  "hyb-w7-h1": "barbell", // Oly lift drills
  "hyb-w7-h2": "gymnastics", // Gymnastics skills
  "hyb-w7-h3": "puzzle", // Accessory work
  "hyb-w8-h1": "flame", // Full WOD warmup
  "hyb-w8-h2": "strategy", // Execute strategy
  "hyb-w8-h3": "database", // Record all data
  
  // Cardio/Classes Track
  "cls-w1-h1": "backpack", // Pack class bag
  "cls-w1-h2": "clock", // Arrive 10 min early
  "cls-w1-h3": "spray-can", // Clean equipment
  "cls-w2-h1": "flame", // Pre-class warmup
  "cls-w2-h2": "user-check", // Follow instructor
  "cls-w2-h3": "activity", // Track intensity
  "cls-w3-h1": "clipboard", // Practice form
  "cls-w3-h2": "sliders", // Use modifications
  "cls-w3-h3": "battery", // Record energy levels
  "cls-w4-h1": "shield", // Maintain form
  "cls-w4-h2": "heart", // Monitor HR zones
  "cls-w4-h3": "droplet", // Track water intake
  "cls-w5-h1": "arrow-up-circle", // Try new mod
  "cls-w5-h2": "target", // Meet intensity targets
  "cls-w5-h3": "clipboard-data", // Record metrics
  "cls-w6-h1": "users", // Meet someone new
  "cls-w6-h2": "sunset", // Stay for cooldown
  "cls-w6-h3": "zap", // Max effort
  "cls-w7-h1": "award", // Advanced moves
  "cls-w7-h2": "shield-check", // Form under fatigue
  "cls-w7-h3": "trending-up", // Track improvements
  "cls-w8-h1": "star", // Lead by example
  "cls-w8-h2": "share", // Share milestones
  "cls-w8-h3": "trophy", // Record achievements
};

// --- Why This Matters Descriptions ---
const habitDescriptions = {
  // Strength Track
  "str-w1-h1": "Working out consistently is the #1 factor for results. Even small workouts add up over time.",
  "str-w1-h2": "Being prepared removes barriers to working out. No last-minute excuses!",
  "str-w1-h3": "Building gym etiquette earns respect and makes you part of the community.",
  "str-w2-h1": "Proper warm-ups reduce injury risk by 54% and improve workout performance.",
  "str-w2-h2": "Tracking progress helps identify what's working and keeps you motivated as you see improvements.",
  "str-w2-h3": "Proper form maximizes muscle growth while preventing injuries. It's quality over quantity.",
  "str-w3-h1": "Most beginners only get half the protein they need. Adequate protein intake is essential for muscle repair and growth.",
  "str-w3-h2": "Even 2% dehydration reduces performance by up to 20%. Water is critical for recovery and energy.",
  "str-w3-h3": "Well-timed nutrition around workouts gives your body the fuel it needs and enhances recovery.",
  "str-w4-h1": "During sleep is when most muscle growth happens. It's as important as your workout!",
  "str-w4-h2": "Regular stretching improves flexibility, reduces soreness, and helps prevent injuries.",
  "str-w4-h3": "Tracking soreness helps identify when to push and when to recover, preventing overtraining.",
  "str-w5-h1": "Programs are designed strategically - following them exactly optimizes your results.",
  "str-w5-h2": "Progressive overload is the key principle of muscle growth. Track increases to ensure progress.",
  "str-w5-h3": "Rating intensity helps calibrate effort across different exercises and ensures proper progression.",
  "str-w6-h1": "Proper breathing stabilizes your core, increases power, and helps maintain technique under load.",
  "str-w6-h2": "Mind-muscle connection improves exercise effectiveness by up to 30% without adding weight.",
  "str-w6-h3": "Maintaining form when tired prevents injuries and ensures you're working the right muscles.",
  "str-w7-h1": "Daily steps are foundational for heart health, recovery, and fat loss, even on rest days.",
  "str-w7-h2": "Skipping exercises creates muscular imbalances. Complete all exercises for balanced development.",
  "str-w7-h3": "Consistent meal timing stabilizes energy, improves recovery, and optimizes nutrient utilization.",
  "str-w8-h1": "A complete workout protocol ensures all aspects of fitness are addressed for maximum results.",
  "str-w8-h2": "Meeting nutrition targets provides the right building blocks for muscle repair and growth.",
  "str-w8-h3": "Detailed tracking creates accountability and lets you see patterns in your performance.",
  
  // Hybrid Track
  "hyb-w1-h1": "The squat is a fundamental movement pattern. Mastering it improves all lower body strength.",
  "hyb-w1-h2": "Planks build core stability essential for all movements and help prevent back injuries.",
  "hyb-w1-h3": "Mobility work prepares joints for complex movements and prevents common injuries.",
  "hyb-w2-h1": "Following the workout/rest schedule balances intensity with recovery for optimal results.",
  "hyb-w2-h2": "Tracking performance creates a record of improvement and helps identify effective strategies.",
  "hyb-w2-h3": "Smart scaling ensures you're challenged but can maintain form and complete workouts safely.",
  "hyb-w3-h1": "Daily skill practice develops movement patterns that carry over to more complex exercises.",
  "hyb-w3-h2": "MetCons build cardiovascular capacity and mental toughness in short, efficient workouts.",
  "hyb-w3-h3": "Working on weaknesses prevents plateaus and creates balanced, functional fitness.",
  "hyb-w4-h1": "Rating intensity helps you track effort and ensures you're pushing hard enough to progress.",
  "hyb-w4-h2": "Heart rate recovery speed is a key indicator of improving fitness and reduced injury risk.",
  "hyb-w4-h3": "Proper cooldowns accelerate recovery, reduce soreness, and improve flexibility.",
  "hyb-w5-h1": "Meal timing around workouts improves performance during training and speeds recovery after.",
  "hyb-w5-h2": "Tracking macros ensures you're fueling properly for high-intensity functional training.",
  "hyb-w5-h3": "Proper hydration improves performance by up to 25% and aids recovery between workouts.",
  "hyb-w6-h1": "Benchmark workouts measure progress over time and identify areas needing improvement.",
  "hyb-w6-h2": "Core lifts build foundational strength that transfers to all functional movements.",
  "hyb-w6-h3": "Measuring intensity ensures you're working at the right level for your goals.",
  "hyb-w7-h1": "Olympic lifting drills develop power, speed, and coordination that transfer to all movements.",
  "hyb-w7-h2": "Gymnastic skills improve body control, strength-to-weight ratio, and movement efficiency.",
  "hyb-w7-h3": "Accessory work addresses muscular imbalances and strengthens areas prone to injury.",
  "hyb-w8-h1": "A complete warmup prepares all systems for optimal performance and reduces injury risk.",
  "hyb-w8-h2": "Strategic execution optimizes energy use and ensures best performance throughout workouts.",
  "hyb-w8-h3": "Detailed data tracking allows for analysis of strengths, weaknesses, and progress over time.",
  
  // Cardio/Classes Track
  "cls-w1-h1": "Coming prepared removes obstacles to participation and helps you focus on your workout.",
  "cls-w1-h2": "Arriving early reduces stress, allows proper setup, and helps you understand class goals.",
  "cls-w1-h3": "Equipment care shows respect for the community and creates a better environment for everyone.",
  "cls-w2-h1": "Pre-class warmups improve performance, reduce injury risk, and help you get more from class.",
  "cls-w2-h2": "Following instructor cues ensures proper form and helps you understand movement patterns.",
  "cls-w2-h3": "Tracking intensity helps you gauge effort appropriately and see progress over time.",
  "cls-w3-h1": "Focusing on form over speed or weight ensures effective workouts and prevents injuries.",
  "cls-w3-h2": "Smart modifications maintain workout intensity while accommodating your current fitness level.",
  "cls-w3-h3": "Energy tracking helps identify optimal workout times and effective recovery strategies.",
  "cls-w4-h1": "Maintaining form when fatigued builds muscle memory and prevents compensation injuries.",
  "cls-w4-h2": "Heart rate zone training optimizes cardiovascular benefits and helps manage workout intensity.",
  "cls-w4-h3": "Proper hydration improves performance, prevents cramps, and speeds recovery after class.",
  "cls-w5-h1": "Trying harder modifications challenges your body and leads to continued improvement.",
  "cls-w5-h2": "Meeting intensity targets ensures you're working at the right level for your fitness goals.",
  "cls-w5-h3": "Recording metrics provides concrete evidence of your progress and motivates consistency.",
  "cls-w6-h1": "Social connections increase workout enjoyment and class attendance by over 40%.",
  "cls-w6-h2": "Cooldowns accelerate recovery, improve flexibility, and reduce post-workout soreness.",
  "cls-w6-h3": "Appropriate intensity pushes your limits safely and leads to consistent improvement.",
  "cls-w7-h1": "Advanced movements build on your foundation and create new physical challenges.",
  "cls-w7-h2": "Maintaining form during fatigue is the true test of skill mastery and proper conditioning.",
  "cls-w7-h3": "Tracking key movements shows progress and helps identify effective class formats.",
  "cls-w8-h1": "Leading by example inspires others and reinforces your own knowledge and proper form.",
  "cls-w8-h2": "Sharing accomplishments creates accountability and motivates continued dedication.",
  "cls-w8-h3": "Recording achievements creates a record of your journey and builds confidence."
};


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
const PRIORITIZED_ACHIEVEMENTS = [
  { id: 'streak-master-login', title: 'Check-in Streak Master', description: 'Maintain a 7-day check-in streak', icon: 'calendar', condition: 'Check-in (complete any habit) for 7 consecutive days', streakTarget: 7, points: 70, unlocked: false },
  { id: 'streak-habit-str-w1-h1-7d', title: 'Workout Consistency', description: 'Complete scheduled workout 7 days straight', icon: 'flame', condition: 'Maintain a 7-day streak for "Complete scheduled workout"', targetHabitId: 'str-w1-h1', streakTarget: 7, points: 100, unlocked: false },
  { id: 'streak-habit-str-w3-h1-7d', title: 'Protein Tracker', description: 'Track daily protein intake 7 days straight', icon: 'flame', condition: 'Maintain a 7-day streak for "Track daily protein intake"', targetHabitId: 'str-w3-h1', streakTarget: 7, points: 100, unlocked: false },
  { id: 'streak-habit-hyb-w1-h1-7d', title: 'Squat Practice Pro', description: 'Practice air squat technique 7 days straight', icon: 'flame', condition: 'Maintain a 7-day streak for "Practice air squat technique"', targetHabitId: 'hyb-w1-h1', streakTarget: 7, points: 100, unlocked: false },
  { id: 'first-week', title: 'First Week Champion', description: 'Complete all habits for one week', icon: 'trophy', condition: 'Complete 21 habits in a single week', points: 210, unlocked: false },
  { id: 'habit-warrior', title: 'Habit Warrior', description: 'Complete 50 total habits', icon: 'award', condition: 'Complete any 50 habits', points: 350, unlocked: false },
  { id: 'halfway-there', title: 'Halfway There!', description: 'Complete all habits for 4 weeks', icon: 'award', condition: 'Complete 84 total habits (Weeks 1-4)', points: 500, unlocked: false },
  { id: 'century-club', title: 'Century Club', description: 'Complete 100 total habits', icon: 'award', condition: 'Complete any 100 habits', points: 750, unlocked: false },
  { id: 'program-master', title: 'Program Master', description: 'Complete an entire 8-week program', icon: 'crown', condition: 'Complete all 168 habits in an 8-week program', points: 1680, unlocked: false },
];

/ --- First-Timer Walkthrough Component ---
const WalkthroughTour = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(1);
  const totalSteps = 3;

  const nextStep = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      onClose();
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative bg-gray-800 rounded-lg p-6 max-w-md w-full">
        <div className="absolute top-3 right-3">
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-white"
            aria-label="Close walkthrough"
          >
            &times;
          </button>
        </div>
        
        <div className="mb-4">
          <h3 className="text-[#CCBA78] text-xl font-semibold">Getting Started</h3>
          <div className="flex mt-2">
            {Array.from({length: totalSteps}).map((_, i) => (
              <div 
                key={i} 
                className={`h-1 flex-1 mx-1 rounded-full ${i + 1 === step ? 'bg-[#CCBA78]' : 'bg-gray-600'}`}
              />
            ))}
          </div>
        </div>
        
        {step === 1 && (
          <div className="text-white">
            <h4 className="font-semibold mb-2">Step 1: Checking off habits</h4>
            <p className="text-gray-300 mb-4">
              Check off each habit daily to build your streak. The checkbox turns green when completed for today.
            </p>
            <div className="bg-gray-700 p-4 rounded-lg mb-4 flex items-start space-x-3">
              <div className="mt-1 w-5 h-5 rounded border-gray-500 bg-green-800 shrink-0" />
              <div>
                <p className="font-medium text-gray-100">Complete scheduled workout</p>
                <p className="text-gray-400 text-sm">Follow planned schedule (rest days count)</p>
              </div>
            </div>
            <p className="text-gray-300 text-sm italic">
              Tip: Be consistent! Daily check-ins are key to your success.
            </p>
          </div>
        )}
        
        {step === 2 && (
          <div className="text-white">
            <h4 className="font-semibold mb-2">Step 2: Building streaks</h4>
            <p className="text-gray-300 mb-4">
              Checking a habit on consecutive days builds a streak. Streaks are shown with a flame icon.
            </p>
            <div className="bg-gray-700 p-4 rounded-lg mb-4">
              <div className="flex items-center justify-between">
                <p className="text-gray-400 text-xs">Completed 5 times</p>
                <div className="flex items-center gap-1 text-orange-400">
                  <Flame className="w-3.5 h-3.5" />
                  <span className="text-xs font-medium">3</span>
                </div>
              </div>
            </div>
            <p className="text-gray-300 text-sm italic">
              Tip: A 7-day streak unlocks special achievements!
            </p>
          </div>
        )}
        
        {step === 3 && (
          <div className="text-white">
            <h4 className="font-semibold mb-2">Step 3: Earning achievements</h4>
            <p className="text-gray-300 mb-4">
              Unlock achievements by completing habits consistently. Track your progress in the Achievements section.
            </p>
            <div className="bg-gray-700 p-4 rounded-lg mb-4">
              <div className="flex items-center gap-3">
                <Trophy className="w-5 h-5 text-[#CCBA78]" />
                <div>
                  <h4 className="font-semibold text-[#CCBA78]">First Week Champion</h4>
                  <p className="text-sm text-gray-400">Complete all habits for one week</p>
                </div>
              </div>
              <div className="mt-2">
                <div className="w-full bg-gray-600 rounded-full h-2 overflow-hidden">
                  <div className="bg-[#CCBA78] h-full rounded-full" style={{ width: '45%' }} />
                </div>
                <p className="text-xs text-gray-400 mt-1 text-right">45%</p>
              </div>
            </div>
            <p className="text-gray-300 text-sm italic">
              Tip: Start with Week 1 habits to build a strong foundation!
            </p>
          </div>
        )}
        
        <div className="flex justify-between mt-6">
          {step > 1 ? (
            <button 
              onClick={prevStep} 
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded"
            >
              Back
            </button>
          ) : (
            <div></div> // Empty div to maintain layout
          )}
          
          <button 
            onClick={nextStep} 
            className="px-4 py-2 bg-[#CCBA78] hover:bg-[#CCBA78]/90 text-gray-900 rounded"
          >
            {step === totalSteps ? "Get Started!" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
};

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

const AchievementsPanel = ({ 
    achievements, 
    selectedTrack 
}: { 
    achievements: Achievement[];
    selectedTrack?: keyof typeof programs | 'all'; 
}) => {
    const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
    const [showShareDialog, setShowShareDialog] = useState(false);

    // Filter achievements based on selectedTrack
    const filteredAchievements = useMemo(() => {
        if (!selectedTrack || selectedTrack === 'all') {
            return achievements;
        }

        // Map achievement IDs to their track prefixes
        const trackPrefixes = {
            'strength': 'str-',
            'hybrid': 'hyb-',
            'cardio': 'cls-'
        };

        const currentPrefix = trackPrefixes[selectedTrack];
        
        return achievements.filter(achievement => {
            // Always include generic achievements that aren't track-specific
            if (!achievement.targetHabitId) {
                return true;
            }
            
            // Include achievements specific to the current track
            return achievement.targetHabitId.startsWith(currentPrefix);
        });
    }, [achievements, selectedTrack]);

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
                <h3 className="text-[#CCBA78] text-xl font-semibold mb-4">
                    {selectedTrack && selectedTrack !== 'all' 
                        ? `${programs[selectedTrack].title} Achievements` 
                        : 'All Achievements'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {processedAchievements.map((achievement) => (
                        <div 
                            key={achievement.id} 
                            className={`p-4 rounded-lg ${
                                achievement.unlocked 
                                    ? 'bg-[#CCBA78] bg-opacity-20 border border-[#CCBA78]' 
                                    : nextAchievementToUnlock?.id === achievement.id
                                        ? 'bg-gray-700 bg-opacity-70 border border-[#CCBA78] border-dashed'
                                        : 'bg-gray-700 bg-opacity-50'
                            }`}
                        >
                            <div className="flex items-center justify-between min-h-[40px]">
                                <div className="flex items-center gap-3">
                                    {achievement.icon === 'trophy' && <Trophy className={`w-5 h-5 ${achievement.unlocked ? 'text-[#CCBA78]' : 'text-gray-400'}`} />}
                                    {achievement.icon === 'flame' && <Flame className={`w-5 h-5 ${achievement.unlocked ? 'text-orange-400' : 'text-gray-400'}`} />} {/* Orange flame when unlocked */}
                                    {achievement.icon === 'award' && <Award className={`w-5 h-5 ${achievement.unlocked ? 'text-[#CCBA78]' : 'text-gray-400'}`} />}
                                    {achievement.icon === 'crown' && <Crown className={`w-5 h-5 ${achievement.unlocked ? 'text-[#CCBA78]' : 'text-gray-400'}`} />}
                                    {achievement.icon === 'calendar' && <Calendar className={`w-5 h-5 ${achievement.unlocked ? 'text-[#CCBA78]' : 'text-gray-400'}`} />}
                                    <div className="flex-1"> {/* Allow text to wrap */}
                                        <h4 className={`font-semibold ${achievement.unlocked ? 'text-[#CCBA78]' : nextAchievementToUnlock?.id === achievement.id ? 'text-[#CCBA78]/80' : 'text-gray-300'}`}>{achievement.title}</h4>
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
                                        <div 
                                            className={`h-full rounded-full transition-all duration-300 ease-out ${
                                                nextAchievementToUnlock?.id === achievement.id 
                                                    ? 'bg-[#CCBA78] animate-pulse' 
                                                    : 'bg-[#CCBA78]'
                                            }`} 
                                            style={{ width: `${achievement.progress ?? 0}%` }} 
                                        />
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1 text-right">
                                        {Math.floor(achievement.progress ?? 0)}%
                                        {nextAchievementToUnlock?.id === achievement.id && (
                                            <span className="text-[#CCBA78] ml-1">Next up!</span>
                                        )}
                                    </p>
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

// --- Modified CollapsibleCard Component ---
const CollapsibleCard = ({ week, children }: CollapsibleCardProps) => {
    const [isOpen, setIsOpen] = useState(week.week === 1); // Default open only for week 1
    
    // Add highlight for Week 1 for beginners
    const isWeekOne = week.week === 1;
    
    return (
        <Card className={`bg-gray-800 overflow-hidden rounded-lg ${isWeekOne ? 'border-2 border-[#CCBA78]/50' : 'border border-gray-700/50'}`}> {/* Added conditional border */}
            <div className="flex items-center justify-between p-4 sm:p-6 cursor-pointer hover:bg-gray-700/50 transition-colors" onClick={() => setIsOpen(!isOpen)} role="button" aria-expanded={isOpen} aria-controls={`week-${week.week}-content`}>
                <div className="flex items-center">
                    <h3 className="text-[#CCBA78] text-lg font-semibold">Week {week.week} - {week.focus}</h3>
                    {isWeekOne && <span className="ml-2 text-xs bg-[#CCBA78] text-gray-900 px-2 py-0.5 rounded-full">Start here!</span>}
                </div>
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

// --- Main HabitProgram Component ---
const HabitProgram = () => {
    const [toastInfo, setToastInfo] = useState<{ message: string; type?: 'success' | 'error' } | null>(null);
    const [selectedTrack, setSelectedTrack] = useState<keyof typeof programs | 'all'>('strength'); // Default to 'strength'
    const [showWalkthrough, setShowWalkthrough] = useState(false);
    
    const showToastCallback = useCallback((message: string, type: 'success' | 'error' = 'success') => {
        setToastInfo(null);
        setTimeout(() => { setToastInfo({ message, type }); }, 50);
        setTimeout(() => setToastInfo(null), type === 'error' ? 4000 : 3000);
    }, []);
    
    const { userId, userData, setUserData, savedData, setSavedData, exportProgress, importProgress, resetAllProgress, isClient, isLoading } = useUserStorage(showToastCallback);
    const [selectedHabitInfo, setSelectedHabitInfo] = useState<Habit | null>(null);
    const [showInfoSheet, setShowInfoSheet] = useState(false);
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(() => isClient ? localStorage.getItem('showOnboarding') !== 'false' : true);
    
    // Track first-time users
    const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);
    
    useEffect(() => { 
        if (isClient) {
            localStorage.setItem('showOnboarding', showOnboarding.toString());
            
            // Check if first time user
            const hasVisitedBefore = localStorage.getItem('hasVisitedBefore');
            if (!hasVisitedBefore) {
                setIsFirstTimeUser(true);
                setShowWalkthrough(true);
                localStorage.setItem('hasVisitedBefore', 'true');
            }
        }
    }, [showOnboarding, isClient]);

    // [Keep your existing memoized values, effects, and handlers]

    // Function to show habit info
    const showHabitInfo = (habit: Habit) => { setSelectedHabitInfo(habit); setShowInfoSheet(true); };

    // Loading state handling
    if (isLoading && isClient) {
        return <div className="flex justify-center items-center min-h-screen bg-gray-900 text-white">Loading Your Progress...</div>;
    }

    // --- Main JSX Structure ---
    return (
        <div className="bg-gray-900 p-4 pb-24 sm:p-6 md:p-8 max-w-4xl mx-auto min-h-screen"> {/* Adjusted padding */}
            {/* First-Timer Walkthrough */}
            <WalkthroughTour isOpen={showWalkthrough} onClose={() => setShowWalkthrough(false)} />
            
            {/* Header */}
            <div className="mb-6 sm:mb-8">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1 sm:mb-2"><span className="text-[#CCBA78]">Transform</span><span className="text-white"> Your Habits</span></h1>
                <h2 className="text-white text-base sm:text-lg">8-Week Journey to Better Health</h2> {/* Adjusted size */}
                
                {/* Help button to reopen walkthrough */}
                <button 
                    onClick={() => setShowWalkthrough(true)}
                    className="mt-2 flex items-center text-sm text-gray-400 hover:text-[#CCBA78] transition-colors"
                >
                    <HelpCircle className="w-4 h-4 mr-1" />
                    <span>How it works</span>
                </button>
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
                 <AchievementsPanel achievements={userData.achievements} selectedTrack={selectedTrack} />
             }
{/* Program Tabs */}
<Tabs 
  defaultValue="strength" 
  className="mb-20 sm:mb-0"
  onValueChange={(value) => setSelectedTrack(value as keyof typeof programs)}
>
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
                
                // Get the corresponding icon for this habit
                const iconName = habitIconMapping[habit.id];
                // Get the "Why This Matters" description
                const habitDescription = habitDescriptions[habit.id];
                
                return (
                  <div key={habit.id} className={`group flex items-start space-x-3 p-3 rounded-md transition-colors duration-150 ${isCheckedToday ? 'bg-green-900/40 hover:bg-green-900/50' : 'hover:bg-gray-700/40'}`}>
                    <input 
                      type="checkbox" 
                      id={`habit-${habit.id}`} 
                      className="mt-1 w-5 h-5 rounded border-gray-500 focus:ring-2 focus:ring-offset-0 focus:ring-offset-gray-800 focus:ring-[#CCBA78] text-[#CCBA78] bg-gray-700 shrink-0 cursor-pointer" 
                      checked={isCheckedToday} 
                      onChange={(e) => handleCheckbox(key as keyof typeof programs, week.week, idx, e.target.checked)} 
                    />
                    <div className="flex-grow">
                      <div className="flex items-center gap-2">
                        <label 
                          htmlFor={`habit-${habit.id}`} 
                          className="font-medium text-gray-100 hover:text-[#CCBA78] transition-colors cursor-pointer"
                        >
                          {habit.habit}
                        </label>
                        
                        {/* Why This Matters tooltip */}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button 
                                className="text-gray-400 hover:text-[#CCBA78] transition-colors"
                                aria-label="Learn why this habit matters"
                              >
                                <HelpCircle className="w-3.5 h-3.5" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent className="bg-gray-800 border-gray-700 text-white p-3 max-w-xs">
                              <p className="text-sm">
                                <span className="text-[#CCBA78] font-medium">Why this matters:</span><br />
                                {habitDescription || "Building this habit helps create a foundation for your fitness success."}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      
                      <p className="text-gray-400 text-sm mt-0.5 sm:mt-1">{habit.example}</p> {/* Example slightly darker */}
                      <div className="flex items-center justify-between mt-1.5"> {/* Adjusted spacing */}
                        <p className="text-gray-500 text-xs">Completed {completionDates.length} times</p> {/* Completion count darker */}
                        {habitStreak > 0 && (
                          <div className="flex items-center gap-1 text-orange-400 animate-pulse" title={`${habitStreak}-day streak`}>
                            <Flame className="w-3.5 h-3.5" />
                            <span className="text-xs font-medium">{habitStreak}</span>
                          </div>
                        )}
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
