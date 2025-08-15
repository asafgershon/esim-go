import React, { ReactNode } from 'react';
import { cn } from '@workspace/ui/lib/utils';

// Container component
interface PageLayoutContainerProps {
  children: ReactNode;
  className?: string;
}

const Container: React.FC<PageLayoutContainerProps> = ({ children, className }) => {
  return (
    <div className={cn("h-full flex flex-col", className)}>
      {children}
    </div>
  );
};

// Header component
interface PageLayoutHeaderProps {
  title?: string;
  subtitle: string;
  description?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

const Header: React.FC<PageLayoutHeaderProps> = ({
  title,
  subtitle,
  description,
  icon,
  actions,
  className
}) => {
  return (
    <div className={cn("flex-shrink-0 space-y-4 pb-4", className)}>
      <div className="flex justify-between items-center">
        <div className="flex flex-col gap-1">
          {title && (
            <h1 className="text-sm font-normal text-gray-500 leading-none">{title}</h1>
          )}
          <div className="flex items-center gap-3">
            {icon}
            <h2 className="text-2xl font-bold text-gray-900">{subtitle}</h2>
          </div>
          {description && (
            <p className="text-gray-600">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-4">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

// Content component
interface PageLayoutContentProps {
  children: ReactNode;
  className?: string;
}

const Content: React.FC<PageLayoutContentProps> = ({ children, className }) => {
  return (
    <div className={cn("flex-1 min-h-0", className)}>
      {children}
    </div>
  );
};

// Export compound component
export const PageLayout = {
  Container,
  Header,
  Content
};