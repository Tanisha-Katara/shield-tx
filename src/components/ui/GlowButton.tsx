"use client";

interface GlowButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: "primary" | "secondary";
  size?: "md" | "lg";
  disabled?: boolean;
  className?: string;
}

export function GlowButton({
  children,
  onClick,
  type = "button",
  variant = "primary",
  size = "md",
  disabled = false,
  className = "",
}: GlowButtonProps) {
  const base =
    "relative font-mono font-medium tracking-wide uppercase transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed";

  const sizes = {
    md: "px-6 py-3 text-sm",
    lg: "px-8 py-4 text-base",
  };

  const variants = {
    primary:
      "bg-shieldtx-green/10 text-shieldtx-green border border-shieldtx-green/40 hover:bg-shieldtx-green/20 hover:border-shieldtx-green/60 hover:shadow-[0_0_20px_rgba(0,255,136,0.15)]",
    secondary:
      "bg-transparent text-shieldtx-muted border border-shieldtx-border hover:text-shieldtx-text hover:border-shieldtx-muted",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
