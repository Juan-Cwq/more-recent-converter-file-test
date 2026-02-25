import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-11 w-full rounded-lg border border-medium-gray/30 bg-deep-space/50 px-4 py-2 text-sm text-off-white placeholder:text-medium-gray focus:border-vibrant-teal focus:outline-none focus:ring-1 focus:ring-vibrant-teal transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };
