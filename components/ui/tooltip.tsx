// components/ui/tooltip.tsx
import React, { ReactNode } from 'react';

// Basic tooltip provider - just a context wrapper
export const TooltipProvider = ({ children }: { children: ReactNode }) => {
  return <>{children}</>;
};

// The trigger element that activates the tooltip
export const TooltipTrigger = ({ children, ...props }: { children: ReactNode } & React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span className="inline-block cursor-pointer" {...props}>
      {children}
    </span>
  );
};

// The actual tooltip content that appears on hover
export const TooltipContent = ({ children, side = 'top' }: { children: ReactNode, side?: 'top' | 'right' | 'bottom' | 'left' }) => {
  return (
    <div className={`absolute z-50 px-2 py-1 text-xs bg-gray-800 text-white rounded shadow-lg whitespace-nowrap ${getPositionClasses(side)}`}>
      {children}
      <div className={`absolute w-2 h-2 rotate-45 bg-gray-800 ${getArrowClasses(side)}`}></div>
    </div>
  );
};

// Wrapper component that handles show/hide logic
export const Tooltip = ({ children, content, side = 'top' }: { children: ReactNode, content: ReactNode, side?: 'top' | 'right' | 'bottom' | 'left' }) => {
  return (
    <TooltipProvider>
      <div className="relative inline-flex group">
        <TooltipTrigger>{children}</TooltipTrigger>
        <div className="absolute pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <TooltipContent side={side}>{content}</TooltipContent>
        </div>
      </div>
    </TooltipProvider>
  );
};

// Helper function to get positioning classes based on side
function getPositionClasses(side: 'top' | 'right' | 'bottom' | 'left') {
  switch (side) {
    case 'top':
      return 'bottom-full left-1/2 -translate-x-1/2 mb-2';
    case 'right':
      return 'left-full top-1/2 -translate-y-1/2 ml-2';
    case 'bottom':
      return 'top-full left-1/2 -translate-x-1/2 mt-2';
    case 'left':
      return 'right-full top-1/2 -translate-y-1/2 mr-2';
    default:
      return 'bottom-full left-1/2 -translate-x-1/2 mb-2';
  }
}

// Helper function to get arrow positioning classes
function getArrowClasses(side: 'top' | 'right' | 'bottom' | 'left') {
  switch (side) {
    case 'top':
      return 'bottom-[-4px] left-1/2 -translate-x-1/2';
    case 'right':
      return 'left-[-4px] top-1/2 -translate-y-1/2';
    case 'bottom':
      return 'top-[-4px] left-1/2 -translate-x-1/2';
    case 'left':
      return 'right-[-4px] top-1/2 -translate-y-1/2';
    default:
      return 'bottom-[-4px] left-1/2 -translate-x-1/2';
  }
}

export default Tooltip;
