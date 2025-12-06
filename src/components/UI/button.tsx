import React from "react";
import clsx from "clsx";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "ghost" | "danger" | "success";
  size?: "sm" | "md" | "lg";
};

const variantClasses: Record<string, string> = {
  default: "!bg-slate-900 !text-white hover:!bg-slate-800",
  ghost: "!bg-transparent hover:!bg-slate-100 !text-slate-900",
  danger: "!bg-rose-600 !text-white hover:!bg-rose-700",
  success: "!bg-emerald-600 !text-white hover:!bg-emerald-700",
};

const sizeClasses: Record<string, string> = {
  sm: "px-2 py-1 text-sm",
  md: "px-3 py-2 text-sm",
  lg: "px-4 py-2 text-base",
};

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = "default",
  size = "md",
  ...rest
}) => {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1",
      `!${variantClasses[variant]}`,   // <-- FORCE OVERRIDE        
      sizeClasses[size],
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
};

export default Button;
