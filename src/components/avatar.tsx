"use client";

interface AvatarProps {
  url: string | null;
  username: string;
  size?: number;
  className?: string;
}

export function Avatar({ url, username, size = 40, className = "" }: AvatarProps) {
  const initials = username.slice(0, 2).toUpperCase();

  if (url) {
    return (
      <img
        src={url}
        alt={username}
        width={size}
        height={size}
        className={`rounded-full object-cover ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  // Deterministic color from username
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;

  return (
    <div
      className={`rounded-full flex items-center justify-center font-bold text-white ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.35,
        backgroundColor: `hsl(${hue}, 50%, 35%)`,
      }}
    >
      {initials}
    </div>
  );
}
