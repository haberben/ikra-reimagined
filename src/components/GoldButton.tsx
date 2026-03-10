import { cn } from "@/lib/utils";

interface GoldButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: string;
  fullWidth?: boolean;
}

export default function GoldButton({ children, icon, fullWidth, className, ...props }: GoldButtonProps) {
  return (
    <button
      className={cn(
        "gold-gradient inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-bold uppercase tracking-wide text-foreground shadow-md transition-transform active:scale-95",
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {icon && <span className="material-symbols-outlined text-[20px]">{icon}</span>}
      {children}
    </button>
  );
}
