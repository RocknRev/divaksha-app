import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '../../utils/cn';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  variant?:
    | 'primary'
    | 'secondary'
    | 'ghost'
    | 'outline'
    | 'danger'
    | 'success'
    | 'default'
    | 'link';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

const variantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:
    'bg-primary text-white hover:bg-primary-hover shadow-md hover:shadow-lg focus-visible:ring-2 focus-visible:ring-primary/60',
  secondary:
    'bg-surface text-text-primary border border-card-border hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-primary/40',
  outline:
    'border border-card-border text-text-primary hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-primary/40 hover:border-primary hover:text-primary-hover shadow-sm hover:shadow-md',
  ghost:
    'text-text-primary hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-primary/30',
  danger:
    'bg-danger text-white hover:bg-red-600 focus-visible:ring-2 focus-visible:ring-danger/60',
  success:
    'bg-success text-white hover:bg-emerald-600 focus-visible:ring-2 focus-visible:ring-success/60',
  default:
    'bg-surface text-text-primary border border-card-border hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-primary/40',
  link: 'text-primary hover:text-primary-hover underline-offset-4 hover:underline',
};

const sizeClasses: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-5 text-base',
  icon: 'h-10 w-10',
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', asChild, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(
          'inline-flex items-center justify-center rounded-xl font-semibold transition-transform duration-150 active:scale-[0.98] focus-visible:outline-none disabled:opacity-60 disabled:cursor-not-allowed',
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button };