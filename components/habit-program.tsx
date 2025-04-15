// Import statements at the top
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dumbbell, Clock, Users, ChevronDown, Save, Upload, Share2, Facebook, Info, Calendar, HelpCircle } from 'lucide-react';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Trophy, Award, Crown, Flame, AlertCircle } from 'lucide-react';
import { Toast } from "@/components/ui/toast";
import { HabitInfoSheet } from "@/components/ui/habit-info-sheet";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Import the custom hook
import useUserStorage from '@/hooks/useUserStorage';

// Import the DataManagement component
import DataManagement from '@/components/data-management';

// All the types, constants, and helper components as in your original file...
// [Keep your existing habitIconMapping, habitDescriptions, interfaces, etc.]

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

    // Function to check and update achievements
    const checkAndUpdateAchievements = (
      currentAchievements: Achievement[],
      savedData: SavedData,
      completedHabitsCount: number,
      currentStreak: number
    ): Achievement[] => {
      // Create a copy of the achievements to avoid direct state mutation
      const updatedAchievements = [...currentAchievements];
      
      // Initialize an array to store newly unlocked achievements for notifications
      const newlyUnlocked: Achievement[] = [];
      
      // Check each achievement
      updatedAchievements.forEach((achievement, index) => {
        // Skip if already unlocked
        if (achievement.unlocked) return;
        
        let progress = 0;
        let isUnlocked = false;
        
        // Calculate progress based on achievement type
        switch (achievement.id) {
          // First Week Champion
          case 'first-week':
            // Count how many days in a week have habits completed
            let weeklyHabitsCount = 0;
            let totalWeeklyHabits = 21; // 3 habits per day * 7 days
            
            // Count habits completed in each program's first week
            Object.values(savedData).forEach(program => {
              const weekOne = program[1]; // Week 1
              if (weekOne) {
                Object.values(weekOne).forEach(habit => {
                  weeklyHabitsCount += habit.completionDates.length;
                });
              }
            });
            
            progress = Math.min(100, (weeklyHabitsCount / totalWeeklyHabits) * 100);
            isUnlocked = weeklyHabitsCount >= totalWeeklyHabits;
            break;
            
          // Habit Warrior (50 total habits)
          case 'habit-warrior':
            progress = Math.min(100, (completedHabitsCount / 50) * 100);
            isUnlocked = completedHabitsCount >= 50;
            break;
            
          // Century Club (100 total habits)
          case 'century-club':
            progress = Math.min(100, (completedHabitsCount / 100) * 100);
            isUnlocked = completedHabitsCount >= 100;
            break;
            
          // Halfway There (Weeks 1-4 complete)
          case 'halfway-there':
            let halfwayHabitsCount = 0;
            let totalHalfwayHabits = 84; // 3 habits * 4 weeks * 7 days
            
            // Count habits completed in the first 4 weeks of any program
            Object.values(savedData).forEach(program => {
              for (let week = 1; week <= 4; week++) {
                const weekData = program[week];
                if (weekData) {
                  Object.values(weekData).forEach(habit => {
                    halfwayHabitsCount += habit.completionDates.length;
                  });
                }
              }
            });
            
            progress = Math.min(100, (halfwayHabitsCount / totalHalfwayHabits) * 100);
            isUnlocked = halfwayHabitsCount >= totalHalfwayHabits;
            break;
            
          // Program Master (complete entire 8-week program)
          case 'program-master':
            let programHabitsCount = 0;
            let totalProgramHabits = 168; // 3 habits * 8 weeks * 7 days
            
            // Count all habits completed in any program
            Object.values(savedData).forEach(program => {
              for (let week = 1; week <= 8; week++) {
                const weekData = program[week];
                if (weekData) {
                  Object.values(weekData).forEach(habit => {
                    programHabitsCount += habit.completionDates.length;
                  });
                }
              }
            });
            
            progress = Math.min(100, (programHabitsCount / totalProgramHabits) * 100);
            isUnlocked = programHabitsCount >= totalProgramHabits;
            break;
            
          // Streak Master (7-day check-in streak)
          case 'streak-master-login':
            const streakTarget = achievement.streakTarget || 7;
            progress = Math.min(100, (currentStreak / streakTarget) * 100);
            isUnlocked = currentStreak >= streakTarget;
            break;
            
          // Habit-specific streaks
          default:
            if (achievement.targetHabitId && achievement.streakTarget) {
              // Find the habit in the data
              let habitStreak = 0;
              
              // Look through all programs to find the habit
              Object.entries(savedData).forEach(([programKey, program]) => {
                Object.entries(program).forEach(([weekKey, week]) => {
                  Object.entries(week).forEach(([habitIdxKey, habit]) => {
                    // Get the corresponding habit ID from the programs data
                    const programType = programKey as keyof typeof programs;
                    const weekNum = parseInt(weekKey);
                    const habitIdx = parseInt(habitIdxKey);
                    
                    if (programs[programType]?.weeks?.[weekNum - 1]?.habits?.[habitIdx]?.id === achievement.targetHabitId) {
                      const { currentStreak: habStreak } = calculateHabitStreak(habit.completionDates);
                      habitStreak = Math.max(habitStreak, habStreak);
                    }
                  });
                });
              });
              
              progress = Math.min(100, (habitStreak / achievement.streakTarget) * 100);
              isUnlocked = habitStreak >= achievement.streakTarget;
            }
            break;
        }
        
        // Update progress
        updatedAchievements[index] = {
          ...achievement,
          progress: progress
        };
        
        // Check if newly unlocked
        if (isUnlocked && !achievement.unlocked) {
          updatedAchievements[index] = {
            ...updatedAchievements[index],
            unlocked: true,
            unlockedAt: new Date().toISOString()
          };
          
          // Add to newly unlocked list for notification
          newlyUnlocked.push(updatedAchievements[index]);
        }
      });
      
      // Show notifications for newly unlocked achievements
      newlyUnlocked.forEach(achievement => {
        showToastCallback(`🏆 Achievement Unlocked: ${achievement.title} (${achievement.points} pts)`, 'success');
      });
      
      return updatedAchievements;
    };

    // Handle checkbox state changes
    const handleCheckbox = (program: keyof typeof programs, weekNum: number, habitIndex: number, isChecked: boolean) => {
      // Get today's date in ISO format (YYYY-MM-DD)
      const today = new Date().toISOString().split('T')[0];
      
      // Create a deep copy of the savedData to avoid direct state mutation
      const updatedSavedData = JSON.parse(JSON.stringify(savedData));
      
      // Ensure the program, week, and habit objects exist
      if (!updatedSavedData[program]) {
        updatedSavedData[program] = {};
      }
      
      if (!updatedSavedData[program][weekNum]) {
        updatedSavedData[program][weekNum] = {};
      }
      
      if (!updatedSavedData[program][weekNum][habitIndex]) {
        updatedSavedData[program][weekNum][habitIndex] = {
          completionDates: []
        };
      }
      
      // Get the completion dates array for this habit
      const completionDates = updatedSavedData[program][weekNum][habitIndex].completionDates;
      
      // Check if today's date is already in the array
      const todayIndex = completionDates.indexOf(today);
      
      if (isChecked && todayIndex === -1) {
        // Add today's date if checked and not already present
        completionDates.push(today);
        showToastCallback('Habit completed today!', 'success');
        
        // Update user data
        const updatedUserData = { ...userData };
        updatedUserData.completedHabits += 1;
        
        // Update points
        const pointsForHabit = 10; // Base points per habit
        updatedUserData.totalPoints += pointsForHabit;
        
        // Update streaks
        const { currentStreak, longestStreak } = calculateStreak(updatedSavedData);
        updatedUserData.currentStreak = currentStreak;
        updatedUserData.longestStreak = Math.max(longestStreak, updatedUserData.longestStreak);
        
        // Update achievements
        const updatedAchievements = checkAndUpdateAchievements(
          updatedUserData.achievements || ACHIEVEMENTS,
          updatedSavedData,
          updatedUserData.completedHabits,
          currentStreak
        );
        
        updatedUserData.achievements = updatedAchievements;
        updatedUserData.lastUpdated = new Date().toISOString();
        
        // Update state
        setUserData(updatedUserData);
      } else if (!isChecked && todayIndex !== -1) {
        // Remove today's date if unchecked and present
        completionDates.splice(todayIndex, 1);
        showToastCallback('Habit marked incomplete', 'success');
        
        // Update user data
        const updatedUserData = { ...userData };
        updatedUserData.completedHabits = Math.max(0, updatedUserData.completedHabits - 1);
        
        // Deduct points
        const pointsForHabit = 10; // Base points per habit
        updatedUserData.totalPoints = Math.max(0, updatedUserData.totalPoints - pointsForHabit);
        
        // Update streaks
        const { currentStreak, longestStreak } = calculateStreak(updatedSavedData);
        updatedUserData.currentStreak = currentStreak;
        
        // Update achievements (recalculate progress)
        const updatedAchievements = checkAndUpdateAchievements(
          updatedUserData.achievements || ACHIEVEMENTS,
          updatedSavedData,
          updatedUserData.completedHabits,
          currentStreak
        );
        
        updatedUserData.achievements = updatedAchievements;
        updatedUserData.lastUpdated = new Date().toISOString();
        
        // Update state
        setUserData(updatedUserData);
      }
      
      // Update savedData state
      setSavedData(updatedSavedData);
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
                                <button 
                                  className="text-gray-400 hover:text-[#CCBA78] transition-colors"
                                  aria-label="Learn why this habit matters"
                                  onClick={() => {
                                    showToastCallback(
                                      `Why this matters: ${habitDescription || "Building this habit helps create a foundation for your fitness success."}`, 
                                      'success'
                                    )
                                  }}
                                >
                                  <HelpCircle className="w-3.5 h-3.5" />
                                </button>
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
