import { Check, Info } from 'lucide-react';
import { useState } from 'react';

interface SwipeableHabitProps {
  habit: {
    habit: string;
    example: string;
  };
  onComplete: () => void;
  onInfo: () => void;
}

export const SwipeableHabit = ({ habit, onComplete, onInfo }: SwipeableHabitProps) => {
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [swiping, setSwiping] = useState(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
    setSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    setSwiping(false);
    if (touchStart - touchEnd > 100) { // Swipe left
      onComplete();
    } else if (touchEnd - touchStart > 100) { // Swipe right
      onInfo();
    }
  };

  const swipeOffset = swiping ? Math.max(-100, Math.min(100, touchEnd - touchStart)) : 0;

  return (
    <div 
      className="relative overflow-hidden touch-pan-y"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div 
        className="bg-gray-800 p-4 transition-transform"
        style={{ transform: `translateX(${swipeOffset}px)` }}
      >
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <p className="text-sm font-medium text-white">{habit.habit}</p>
            <p className="text-xs text-gray-400 mt-1">{habit.example}</p>
          </div>
        </div>
      </div>
      <div className="absolute inset-y-0 left-0 flex items-center justify-center px-4 text-green-500 bg-green-900 bg-opacity-50">
        <Check className="w-5 h-5" />
      </div>
      <div className="absolute inset-y-0 right-0 flex items-center justify-center px-4 text-blue-500 bg-blue-900 bg-opacity-50">
        <Info className="w-5 h-5" />
      </div>
    </div>
  );
};
