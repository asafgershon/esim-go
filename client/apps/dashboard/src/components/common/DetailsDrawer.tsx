import { ReactNode } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet";

interface DetailsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  width?: string;
}

export function DetailsDrawer({
  open,
  onOpenChange,
  title,
  description,
  children,
  className = "",
  width = "w-[400px] sm:w-[540px]",
}: DetailsDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className={`${width} overflow-y-auto ${className}`}>
        <SheetHeader className="pb-6 px-6">
          <SheetTitle>{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
        <div className="px-6 pb-6">
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
}

interface DetailsSectionProps {
  children: ReactNode;
  className?: string;
}

export function DetailsSection({ children, className = "" }: DetailsSectionProps) {
  return <section className={`space-y-4 ${className}`}>{children}</section>;
}

interface DetailsSectionHeaderProps {
  icon?: ReactNode;
  title: string;
}

export function DetailsSectionHeader({ icon, title }: DetailsSectionHeaderProps) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <h3 className="text-lg font-semibold">{title}</h3>
    </div>
  );
}

interface DetailsFieldProps {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
}

export function DetailsField({ label, value, icon, action }: DetailsFieldProps) {
  return (
    <div className="flex items-start gap-3">
      {icon && <div className="mt-0.5">{icon}</div>}
      <div className="flex-1">
        <div className="text-sm font-medium text-foreground">{label}</div>
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          {value}
          {action}
        </div>
      </div>
    </div>
  );
}

interface DetailsContainerProps {
  children: ReactNode;
  className?: string;
}

export function DetailsContainer({ children, className = "" }: DetailsContainerProps) {
  return (
    <div className={`bg-muted/30 rounded-lg p-4 space-y-4 ${className}`}>
      {children}
    </div>
  );
}

interface DetailsHeaderWithAvatarProps {
  initials: string;
  title: string;
  subtitle?: string;
  badge?: ReactNode;
}

export function DetailsHeaderWithAvatar({ initials, title, subtitle, badge }: DetailsHeaderWithAvatarProps) {
  return (
    <div className="flex items-center gap-4 -mt-6 mb-6">
      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
        <span className="text-xl font-semibold">{initials}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xl font-semibold truncate">{title}</div>
        {subtitle && <div className="text-sm text-muted-foreground truncate">{subtitle}</div>}
        {badge}
      </div>
    </div>
  );
}