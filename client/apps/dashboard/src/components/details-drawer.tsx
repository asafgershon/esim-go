import { ReactNode } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet";
import { Skeleton } from "@workspace/ui/components/skeleton";

interface DetailsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description: string;
  loading?: boolean;
  error?: boolean;
  errorMessage?: string;
  children: ReactNode;
}

export function DetailsDrawer({
  open,
  onOpenChange,
  title,
  description,
  loading = false,
  error = false,
  errorMessage = "An error occurred",
  children,
}: DetailsDrawerProps) {
  if (loading) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
          <SheetHeader className="pb-6 px-6">
            <SheetTitle>
              <Skeleton className="h-6 w-32" />
            </SheetTitle>
            <SheetDescription>
              <Skeleton className="h-4 w-48" />
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-6 px-6 pb-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  if (error) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
          <SheetHeader className="pb-6 px-6">
            <SheetTitle>{title}</SheetTitle>
            <SheetDescription>{description}</SheetDescription>
          </SheetHeader>
          <div className="px-6 pb-6">
            <div className="text-center text-muted-foreground">
              {errorMessage}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader className="pb-6 px-6">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
        <div className="space-y-6 px-6 pb-6">{children}</div>
      </SheetContent>
    </Sheet>
  );
}

interface DetailsSectionProps {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}

export function DetailsSection({ icon, title, children }: DetailsSectionProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      <div className="bg-muted/30 rounded-lg p-4 space-y-4">{children}</div>
    </section>
  );
}

interface DetailsRowProps {
  icon: ReactNode;
  label: string;
  value: ReactNode;
}

export function DetailsRow({ icon, label, value }: DetailsRowProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="h-4 w-4 text-muted-foreground mt-0.5">{icon}</div>
      <div className="flex-1">
        <div className="text-sm font-medium text-foreground">{label}</div>
        <div className="text-sm text-muted-foreground">{value}</div>
      </div>
    </div>
  );
}