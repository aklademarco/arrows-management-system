import { FiUser } from "react-icons/fi";

type ProfileAvatarProps = {
  name?: string;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "member" | "admin";
};

const sizes = {
  sm: "size-9 text-xs",
  md: "size-11 text-sm",
  lg: "size-16 text-lg",
  xl: "size-24 text-2xl",
};

export function ProfileAvatar({
  name,
  size = "md",
  variant = "member",
}: ProfileAvatarProps) {
  const initials = name
    ?.split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  const palette =
    variant === "admin"
      ? "bg-slate-950 text-white ring-slate-200"
      : "bg-[#6b21a8] text-white ring-purple-100";

  return (
    <span
      aria-label={name ? `${name} profile picture` : "Profile picture"}
      className={`relative grid shrink-0 place-items-center rounded-full font-extrabold ring-4 ${sizes[size]} ${palette}`}
      role="img"
    >
      {initials || <FiUser aria-hidden="true" />}
      <span className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-white bg-emerald-500" />
    </span>
  );
}
