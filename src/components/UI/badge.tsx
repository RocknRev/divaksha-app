import * as React from 'react';
import { cn } from '../../utils/cn';

type Variant = 'default' | 'success' | 'danger' | 'warning' | 'outline';

const variants: Record<Variant, string> = {
  default: 'bg-primary/10 text-primary border border-primary/20',
  success: 'bg-success/10 text-success border border-success/20',
  danger: 'bg-danger/10 text-danger border border-danger/20',
  warning: 'bg-warning/10 text-amber-800 border border-warning/30',
  outline: 'border border-card-border text-text-primary',
};

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: Variant;
}

export const Badge = ({ className, variant = 'default', ...props }: BadgeProps) => (
  <div
    className={cn(
      'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold',
      variants[variant],
      className
    )}
    {...props}
  />
);

