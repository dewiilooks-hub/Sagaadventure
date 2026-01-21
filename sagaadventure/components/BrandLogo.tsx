
import React from 'react';

interface BrandLogoProps {
  className?: string;
  color?: string;
  size?: number;
}

const BrandLogo: React.FC<BrandLogoProps> = ({ className = "", color = "currentColor", size = 11 }) => {
  return (
    <div className={`flex items-center select-none ${className}`} style={{ color }}>
      <span className="font-normal tracking-[0.2em] uppercase whitespace-nowrap leading-none" style={{ fontSize: size }}>
        SAGA ADVENTURE
      </span>
    </div>
  );
};

export default BrandLogo;
