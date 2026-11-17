import React from 'react';

interface UserAvatarProps {
  name: string;
  avatarUrl?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const SIZE_CLASSES: Record<NonNullable<UserAvatarProps['size']>, string> = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
  xl: 'w-20 h-20 text-2xl',
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  name,
  avatarUrl,
  size = 'md',
}) => {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'LM';

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        referrerPolicy="no-referrer"
        className={`${SIZE_CLASSES[size]} rounded-full object-cover border-2 border-[#F5B82E] bg-[#FFF9ED] shrink-0`}
      />
    );
  }

  return (
    <div
      className={`${SIZE_CLASSES[size]} rounded-full bg-[#593B2A] text-[#F5B82E] font-display font-extrabold flex items-center justify-center border-2 border-[#F5B82E]/60 shrink-0 select-none`}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
};
