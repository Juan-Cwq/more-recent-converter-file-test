import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vibrant-teal focus-visible:ring-offset-2 focus-visible:ring-offset-deep-space disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-vibrant-teal text-deep-space hover:bg-vibrant-teal-dim hover:scale-[1.02] active:scale-[0.98]",
        secondary:
          "bg-royal-purple/50 text-off-white border border-royal-purple hover:bg-royal-purple/70 hover:scale-[1.02]",
        outline:
          "border border-medium-gray/30 text-off-white hover:bg-royal-purple/30 hover:border-vibrant-teal/50",
        ghost:
          "text-off-white hover:bg-royal-purple/30",
        link:
          "text-vibrant-teal underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 px-4 text-xs",
        lg: "h-13 px-8 text-base",
        xl: "h-14 px-10 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
