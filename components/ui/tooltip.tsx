"use client"

import React, { useState, useRef, useEffect } from "react";

// Basic tooltip provider - just a context wrapper
export const TooltipProvider = ({ children }) => {
  return <>{children}</>;
};

// Simple tooltip component with hover functionality
export const Tooltip = ({ children }) => {
  return <>{children}</>;
};

// Trigger component for the tooltip
export const TooltipTrigger = ({ children, asChild, ...props }) => {
  return <>{children}</>;
};

// The actual tooltip content
export const TooltipContent = ({ children, className = "", ...props }) => {
  const [isVisible, setIsVisible] = useState(false);
  const tooltipRef = useRef(null);
  
  // Add event listeners to parent TooltipTrigger
  useEffect(() => {
    const parent = tooltipRef.current?.parentElement;
    if (!parent) return;
    
    const showTooltip = () => setIsVisible(true);
    const hideTooltip = () => setIsVisible(false);
    
    parent.addEventListener("mouseenter", showTooltip);
    parent.addEventListener("mouseleave", hideTooltip);
    parent.addEventListener("focus", showTooltip);
    parent.addEventListener("blur", hideTooltip);
    
    return () => {
      parent.removeEventListener("mouseenter", showTooltip);
      parent.removeEventListener("mouseleave", hideTooltip);
      parent.removeEventListener("focus", showTooltip);
      parent.removeEventListener("blur", hideTooltip);
    };
  }, []);
  
  if (!isVisible) return null;
  
  return (
    <div
      ref={tooltipRef}
      className={`absolute z-50 top-full mt-2 left-1/2 transform -translate-x-1/2 rounded-md border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-white shadow-md ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
