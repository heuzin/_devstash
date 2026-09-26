import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserAvatarProps {
  name?: string | null;
  image?: string | null;
  size?: "default" | "sm" | "lg";
  className?: string;
}

function getInitials(name?: string | null) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  const initials =
    parts.length === 1 ? parts[0].slice(0, 2) : parts[0][0] + parts[parts.length - 1][0];
  return initials.toUpperCase();
}

export function UserAvatar({ name, image, size = "default", className }: UserAvatarProps) {
  return (
    <Avatar size={size} className={className}>
      {image && <AvatarImage src={image} alt={name ?? "User avatar"} />}
      <AvatarFallback>{getInitials(name)}</AvatarFallback>
    </Avatar>
  );
}
