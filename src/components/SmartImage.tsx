import React, { useState } from 'react';
import { ImageOff } from 'lucide-react';

interface SmartImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackLabel?: string;
  icon?: React.ReactNode;
}

export const SmartImage: React.FC<SmartImageProps> = ({
  src,
  alt,
  className = 'w-full h-full object-cover',
  fallbackLabel,
  icon,
}) => {
  const [hasError, setHasError] = useState(false);

  if (hasError || !src) {
    return (
      <div
        className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#FFF6E3] via-[#F9E8C6] to-[#F3D89E] text-[#5C3A1F] p-3 text-center"
        role="img"
        aria-label={alt}
      >
        <div className="mb-1.5 opacity-80">{icon ?? <ImageOff className="w-6 h-6" />}</div>
        <span className="text-xs font-medium leading-tight line-clamp-2">
          {fallbackLabel || alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
    />
  );
};
