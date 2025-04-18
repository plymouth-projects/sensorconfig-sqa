import React from 'react'

export function Logo() {
  return (
    <div> 
        <svg 
        viewBox="0 0 24 24" 
        className="h-8 w-8" 
        fill="none" 
        stroke="currentColor"
        strokeWidth="1.5"
        xmlns="http://www.w3.org/2000/svg"
    >
        {/* Outer radar circle with pulse animation */}
        <circle 
            cx="12" 
            cy="12" 
            r="9" 
            strokeDasharray="3,1.5" 
            className="animate-[spin_8s_linear_infinite]"
        />
        
        {/* Inner circle with opposite rotation */}
        <circle 
            cx="12" 
            cy="12" 
            r="5" 
            strokeDasharray="2,1" 
            className="animate-[spin_6s_linear_infinite_reverse]"
        />
        
        {/* Central sensor dot */}
        <circle cx="12" cy="12" r="2" fill="currentColor" />
        
        {/* Signal points at cardinal directions */}
        <circle cx="12" cy="3" r="1" fill="currentColor" />
        <circle cx="21" cy="12" r="1" fill="currentColor" />
        <circle cx="12" cy="21" r="1" fill="currentColor" />
        <circle cx="3" cy="12" r="1" fill="currentColor" />
        
        {/* Signal beam lines */}
        <line x1="12" y1="5" x2="12" y2="9" className="animate-pulse" />
        <line x1="19" y1="12" x2="15" y2="12" className="animate-pulse" />
        <line x1="12" y1="19" x2="12" y2="15" className="animate-pulse" />
        <line x1="5" y1="12" x2="9" y2="12" className="animate-pulse" />
        
        {/* Abstract data flow elements */}
        <path 
            d="M16 7L14 9M8 17L10 15M8 7L10 9M16 17L14 15" 
            strokeLinecap="round" 
        />
        </svg>
    </div>
  )
}
