import React, { useState, useEffect } from 'react';

interface LightRaysProps {
  className?: string;
  colorScheme?: 'cool' | 'warm' | 'rainbow' | 'monochrome';
  intensity?: 'low' | 'medium' | 'high';
  interactive?: boolean;
}

export function LightRays({ 
  className = '', 
  colorScheme = 'cool', 
  intensity = 'medium',
  interactive = false
}: LightRaysProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  
  // Color maps for different schemes
  const colorMaps = {
    cool: ['blue', 'cyan', 'purple', 'indigo', 'sky'],
    warm: ['red', 'orange', 'amber', 'yellow', 'rose'],
    rainbow: ['red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet'],
    monochrome: ['slate', 'zinc', 'stone', 'gray', 'neutral']
  };
  
  const colors = colorMaps[colorScheme];
  const rayCount = intensity === 'low' ? 6 : intensity === 'medium' ? 12 : 20;
  const particleCount = intensity === 'low' ? 15 : intensity === 'medium' ? 30 : 50;
  
  useEffect(() => {
    if (interactive) {
      const handleMouseMove = (e: MouseEvent) => {
        setMousePosition({
          x: (e.clientX / window.innerWidth) * 100,
          y: (e.clientY / window.innerHeight) * 100
        });
      };
      
      const handleMouseEnter = () => setIsHovering(true);
      const handleMouseLeave = () => setIsHovering(false);
      
      window.addEventListener('mousemove', handleMouseMove);
      document.documentElement.addEventListener('mouseenter', handleMouseEnter);
      document.documentElement.addEventListener('mouseleave', handleMouseLeave);
      
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        document.documentElement.removeEventListener('mouseenter', handleMouseEnter);
        document.documentElement.removeEventListener('mouseleave', handleMouseLeave);
      };
    }
  }, [interactive]);

  return (
    <div 
      className={`lightrays-container ${className} ${colorScheme}-theme`}
      style={interactive ? { 
        '--mouse-x': `${mousePosition.x}%`, 
        '--mouse-y': `${mousePosition.y}%`,
        '--hover-intensity': isHovering ? '1.2' : '1'
      } as React.CSSProperties : {}}
    >
      {/* Ambient glow effect */}
      <div className="ambient-glow"></div>
      
      {/* Background gradient overlay */}
      <div className={`lightrays-gradient ${colorScheme}-gradient`}></div>
      
      {/* Main light rays */}
      <div className="rays-layer">
        {Array.from({ length: rayCount }).map((_, index) => {
          const colorIndex = index % colors.length;
          return (
            <div 
              key={`ray-${index}`} 
              className={`lightray lightray-${index + 1} bg-${colors[colorIndex]}/20`}
              style={{
                animationDelay: `${(index * 0.5) % 4}s`,
                transform: `rotate(${(index * 360) / rayCount}deg)`,
                width: `${3 + (index % 3) * 2}px`
              }}
            />
          );
        })}
      </div>
      
      {/* Floating particles */}
      <div className="particles-layer">
        {Array.from({ length: particleCount }).map((_, index) => {
          const colorIndex = index % colors.length;
          const size = 2 + Math.floor(Math.random() * 6);
          const duration = 15 + Math.floor(Math.random() * 25);
          const delay = Math.random() * 10;
          
          return (
            <div 
              key={`particle-${index}`}
              className={`floating-particle bg-${colors[colorIndex]}/40`}
              style={{
                width: `${size}px`,
                height: `${size}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDuration: `${duration}s`,
                animationDelay: `${delay}s`
              }}
            />
          );
        })}
      </div>
      
      {/* Light burst effect */}
      <div className="light-burst"></div>
      
      {/* Pulsating rings */}
      <div className="rings-layer">
        {Array.from({ length: 3 }).map((_, index) => (
          <div 
            key={`ring-${index}`}
            className={`pulsating-ring ring-${index + 1}`}
            style={{ animationDelay: `${index * 1.5}s` }}
          ></div>
        ))}
      </div>
    </div>
  );
}
