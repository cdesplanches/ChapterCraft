"use client";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
  loading?: boolean;
}

const variants = {
  primary:
    "bg-accent text-white hover:bg-accent/90 disabled:opacity-50",
  secondary:
    "bg-surface border border-border text-foreground hover:bg-surface-hover disabled:opacity-50",
  ghost: "text-muted hover:text-foreground hover:bg-surface-hover disabled:opacity-50",
  danger:
    "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 disabled:opacity-50",
};

const sizes = {
  sm: "px-3 py-1.5 text-sm rounded-lg",
  md: "px-4 py-2 text-sm rounded-lg",
};

export function Button({
  variant = "primary",
  size = "md",
  loading,
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 font-medium transition-colors ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
}
