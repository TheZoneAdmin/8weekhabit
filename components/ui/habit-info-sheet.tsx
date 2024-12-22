interface HabitInfoSheetProps {
  habit: {
    habit: string;
    example: string;
  };
  isOpen: boolean;
  onClose: () => void;
}

export const HabitInfoSheet = ({ habit, isOpen, onClose }: HabitInfoSheetProps) => (
  <div
    className={`fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity ${
      isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
    }`}
    onClick={onClose}
  >
    <div 
      className={`fixed bottom-0 left-0 right-0 bg-gray-800 rounded-t-xl p-4 transition-transform transform ${
        isOpen ? 'translate-y-0' : 'translate-y-full'
      }`}
      onClick={e => e.stopPropagation()}
    >
      <div className="w-12 h-1 bg-gray-600 rounded-full mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-white mb-2">{habit.habit}</h3>
      <p className="text-sm text-gray-400 mb-4">{habit.example}</p>
      <div className="space-y-4">
        <div className="bg-gray-700 rounded-lg p-4">
          <h4 className="text-sm font-medium text-white mb-2">Tips</h4>
          <ul className="text-sm text-gray-400 space-y-2">
            <li>• Start small and build consistency</li>
            <li>• Track your progress daily</li>
            <li>• Celebrate small wins</li>
          </ul>
        </div>
        <button
          className="w-full bg-[#CCBA78] text-gray-900 rounded-lg py-3 font-medium"
          onClick={onClose}
        >
          Got it
        </button>
      </div>
    </div>
  </div>
);
