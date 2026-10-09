import React from 'react';

export const PuLogoSvg: React.FC<{ className?: string }> = ({ className = "w-full h-full" }) => {
  return (
    <svg 
      viewBox="0 0 100 100" 
      className={className} 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Dark Blue Background with Outer Border */}
      <rect x="0.5" y="0.5" width="99" height="99" fill="#002299" stroke="#111111" strokeWidth="1" />
      
      {/* Top-Left Yellow 'P' Loop */}
      <path 
        d="M 0,0 L 15,0 C 33,0 47,14 47,32.5 C 47,51 33,65 15,65 L 0,65 Z" 
        fill="#FFC700" 
      />
      
      {/* Bottom-Left Yellow Dome */}
      <path 
        d="M 9.5,100 A 22.5,22.5 0 0,1 54.5,100 Z" 
        fill="#FFC700" 
      />
      
      {/* Right Yellow 'U' Shape */}
      <path 
        d="M 54.5,0 L 54.5,63.5 A 20.25,20.25 0 0,0 95,63.5 L 95,0 Z" 
        fill="#FFC700" 
      />
    </svg>
  );
};
