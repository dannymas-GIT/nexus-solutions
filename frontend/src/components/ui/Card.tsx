import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

const cardVariants = cva(
  "rounded-xl transition-all duration-200",
  {
    variants: {
      variant: {
        default: "bg-white border border-gray-200 shadow-sm hover:shadow-md",
        blue: "bg-white border border-brand-primary/20 shadow-sm hover:shadow-brand-primary/10",
        filled: "bg-brand-neutral text-brand-neutral-dark border border-gray-200 shadow-sm",
        callout: "bg-gradient-to-r from-brand-primary to-brand-secondary text-white shadow-md",
        outline: "bg-white border-2 border-brand-primary/20 hover:border-brand-primary/50",
      },
      size: {
        default: "p-6",
        sm: "p-4",
        lg: "p-8",
      },
      animation: {
        none: "",
        hover: "hover:scale-[1.02]",
        active: "active:scale-[0.98]",
      },
      rounded: {
        default: "rounded-xl",
        full: "rounded-full",
        sm: "rounded-lg",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      animation: "none",
      rounded: "default",
    },
  }
);

export interface CardProps 
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  footer?: React.ReactNode;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, size, animation, rounded, title, subtitle, icon, footer, children, ...props }, ref) => {
    return (
      <div
        className={cardVariants({ variant, size, animation, rounded, className })}
        ref={ref}
        {...props}
      >
        {(title || icon) && (
          <div className="flex items-start justify-between mb-4">
            <div>
              {title && <h3 className="text-lg font-semibold">{title}</h3>}
              {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
            </div>
            {icon && <div className="flex-shrink-0">{icon}</div>}
          </div>
        )}
        
        <div>{children}</div>
        
        {footer && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            {footer}
          </div>
        )}
      </div>
    );
  }
);

Card.displayName = "Card";

export { Card, cardVariants }; 