import React from 'react';
import { Facebook, Share2 } from 'lucide-react';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ShareAchievementProps {
  achievement: Achievement;
  isOpen: boolean;
  onClose: () => void;
}

const ShareAchievement = ({ achievement, isOpen, onClose }: ShareAchievementProps) => {
  const shareToFacebook = () => {
    const achievementDate = new Date(achievement.unlockedAt || '').toLocaleDateString();
    const shareText = `🏆 Just unlocked "${achievement.title}" in my fitness journey!\n\n${achievement.description}\n\nJoin me in building better habits!`;
    
    // Create Facebook share URL
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}&quote=${encodeURIComponent(shareText)}`;
    
    // Open Facebook share dialog
    window.open(url, '_blank', 'width=600,height=400');
    onClose();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="bg-gray-800 text-white">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-[#CCBA78]">
            Share Achievement
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-300">
            Celebrate your success by sharing this achievement with your fitness community!
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="my-4 p-4 bg-gray-700 rounded-lg">
          <h3 className="text-lg font-semibold text-[#CCBA78] mb-2">
            {achievement.title}
          </h3>
          <p className="text-gray-300 mb-2">{achievement.description}</p>
          <p className="text-sm text-gray-400">
            Unlocked: {new Date(achievement.unlockedAt || '').toLocaleDateString()}
          </p>
        </div>

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
  );
};

// Update the achievement card to include a share button
const AchievementCard = ({ achievement }: { achievement: Achievement }) => {
  const [showShareDialog, setShowShareDialog] = React.useState(false);

  return (
    <div 
      className={`p-4 rounded-lg ${
        achievement.unlocked 
          ? 'bg-[#CCBA78] bg-opacity-20 border border-[#CCBA78]' 
          : 'bg-gray-700 bg-opacity-50'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Existing achievement icon logic */}
          <div>
            <h4 className={`font-semibold ${achievement.unlocked ? 'text-[#CCBA78]' : 'text-gray-300'}`}>
              {achievement.title}
            </h4>
            <p className="text-sm text-gray-400">{achievement.description}</p>
          </div>
        </div>
        {achievement.unlocked && (
          <button
            onClick={() => setShowShareDialog(true)}
            className="p-2 text-[#CCBA78] hover:bg-gray-700 rounded-full transition-colors"
            title="Share achievement"
          >
            <Share2 className="w-5 h-5" />
          </button>
        )}
      </div>
      
      {/* Existing achievement card content */}
      
      <ShareAchievement 
        achievement={achievement}
        isOpen={showShareDialog}
        onClose={() => setShowShareDialog(false)}
      />
    </div>
  );
};

export { ShareAchievement, AchievementCard };
