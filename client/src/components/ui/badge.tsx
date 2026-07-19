import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium leading-none whitespace-nowrap",
        className
      )}
      {...props}
    />
  )
);
Badge.displayName = "Badge";

export { Badge };
