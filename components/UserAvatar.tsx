"use client"

interface UserAvatarProps {
  name?: string | null
  avatarUrl?: string | null
  size?: "sm" | "md" | "lg"
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
}

export function UserAvatar({ name, avatarUrl, size = "sm" }: UserAvatarProps) {
  const initial = name?.[0]?.toUpperCase() ?? "?"
  const cls = sizeClasses[size]

  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={name ?? "Avatar"}
        className={`${cls} rounded-full object-cover shrink-0 ring-2 ring-border`}
      />
    )
  }

  return (
    <div className={`${cls} rounded-full bg-primary/15 flex items-center justify-center font-semibold text-primary shrink-0 ring-2 ring-border`}>
      {initial}
    </div>
  )
}
