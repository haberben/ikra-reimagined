import * as React from "react";

// Tooltip stubs - no external dependency needed
const TooltipProvider = ({ children }: { children: React.ReactNode; delayDuration?: number }) => <>{children}</>;
const Tooltip = ({ children }: { children: React.ReactNode }) => <>{children}</>;
const TooltipTrigger = React.forwardRef<HTMLButtonElement, React.ComponentPropsWithoutRef<"button"> & { asChild?: boolean }>(
  ({ children, ...props }, ref) => <button ref={ref} {...props}>{children}</button>
);
TooltipTrigger.displayName = "TooltipTrigger";
const TooltipContent = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<"div"> & { side?: string; align?: string; hidden?: boolean; sideOffset?: number }>(
  ({ children, hidden, ...props }, ref) => hidden ? null : <div ref={ref} {...props}>{children}</div>
);
TooltipContent.displayName = "TooltipContent";

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
