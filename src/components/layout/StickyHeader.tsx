import { cn } from "@/lib/utils";

interface StickyHeaderProps {
  title?: string;
  subtitle?: string;
  leftIcon?: string;
  rightIcon?: string;
  onLeftClick?: () => void;
  onRightClick?: () => void;
  dark?: boolean;
  showPattern?: boolean;
  className?: string;
  children?: React.ReactNode;
  showNotificationDot?: boolean;
}

export default function StickyHeader({
  title = "İKRA",
  subtitle,
  leftIcon = "menu",
  rightIcon = "notifications",
  onLeftClick,
  onRightClick,
  dark = false,
  showPattern = false,
  className,
  children,
  showNotificationDot = true,
}: StickyHeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b border-primary/10 backdrop-blur-md",
        dark
          ? "bg-primary text-primary-foreground"
          : "bg-card/80 text-foreground",
        showPattern && "islamic-pattern",
        className
      )}
    >
      <div className="flex items-center justify-between px-4 py-3">
        <button onClick={onLeftClick} className="p-1">
          <span className="material-symbols-outlined text-[24px]">{leftIcon}</span>
        </button>
        <div className="text-center">
          <h1 className="text-lg font-bold tracking-widest">{title}</h1>
          {subtitle && (
            <p className="text-xs opacity-70">{subtitle}</p>
          )}
        </div>
        <button onClick={onRightClick} className="relative p-1">
          <span className="material-symbols-outlined text-[24px]">{rightIcon}</span>
          {showNotificationDot && (
            <span className="absolute right-0.5 top-0.5 h-2 w-2 rounded-full bg-destructive" />
          )}
        </button>
      </div>
      {children}
    </header>
  );
}
