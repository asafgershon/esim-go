import React, { ReactNode, createContext, useContext, forwardRef } from 'react';
import { ScrollArea } from './scroll-area';
import { Skeleton } from './skeleton';
import { InputWithAdornment } from './input-with-adornment';
import { Search } from 'lucide-react';
import { cn } from '../lib/utils';
import { Slot } from '@radix-ui/react-slot';

// Context for sharing list state
interface ListContextValue {
  itemCount?: number;
}

const ListContext = createContext<ListContextValue>({});

// Container component
interface ListContainerProps {
  children: ReactNode;
  className?: string;
  itemCount?: number;
}

const Container = forwardRef<HTMLDivElement, ListContainerProps>((
  { children, className, itemCount },
  ref
) => {
  return (
    <ListContext.Provider value={{ itemCount }}>
      <div ref={ref} className={cn("h-full flex flex-col", className)}>
        {children}
      </div>
    </ListContext.Provider>
  );
});
Container.displayName = 'List.Container';

// Header component
interface ListHeaderProps {
  children?: ReactNode;
  title?: string;
  description?: string;
  showCount?: boolean;
  className?: string;
}

const Header = forwardRef<HTMLDivElement, ListHeaderProps>((
  { children, title, description, showCount = true, className },
  ref
) => {
  const { itemCount } = useContext(ListContext);
  
  if (children) {
    return (
      <div
        ref={ref}
        className={cn(
          "sticky top-0 z-10 bg-white border-b border-gray-200 px-3 py-3 flex-shrink-0",
          className
        )}
      >
        {children}
      </div>
    );
  }
  
  return (
    <div
      ref={ref}
      className={cn(
        "sticky top-0 z-10 bg-white border-b border-gray-200 px-3 py-3 flex-shrink-0",
        className
      )}
    >
      {title && (
        <h3 className="text-sm font-medium text-gray-700">
          {title}
          {showCount && itemCount !== undefined && ` (${itemCount})`}
        </h3>
      )}
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );
});
Header.displayName = 'List.Header';

// Search component
interface ListSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const SearchInput = forwardRef<HTMLInputElement, ListSearchProps>((
  { value, onChange, placeholder = 'Search...', className },
  ref
) => {
  return (
    <div className={cn("p-2 border-b bg-gray-50", className)}>
      <InputWithAdornment
        ref={ref}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        leftAdornment={<Search className="h-4 w-4 text-gray-400" />}
        className="w-full"
      />
    </div>
  );
});
SearchInput.displayName = 'List.Search';

// Content component
interface ListContentProps {
  children: ReactNode;
  className?: string;
  spacing?: 'tight' | 'normal' | 'loose';
  padding?: boolean;
}

const spacingClasses = {
  tight: 'space-y-1',
  normal: 'space-y-3',
  loose: 'space-y-4'
};

const Content = forwardRef<HTMLDivElement, ListContentProps>((
  { children, className, spacing = 'normal', padding = true },
  ref
) => {
  return (
    <ScrollArea ref={ref} className="flex-1" showOnHover={true}>
      <div className={cn(
        spacingClasses[spacing],
        padding && "p-3",
        className
      )}>
        {children}
      </div>
    </ScrollArea>
  );
});
Content.displayName = 'List.Content';

// Item component with asChild support
interface ListItemProps {
  children: ReactNode;
  asChild?: boolean;
  className?: string;
}

const Item = forwardRef<HTMLDivElement, ListItemProps>((
  { children, asChild = false, className, ...props },
  ref
) => {
  const Comp = asChild ? Slot : 'div';
  return (
    <Comp ref={ref} className={className} {...props}>
      {children}
    </Comp>
  );
});
Item.displayName = 'List.Item';

// Empty state component
interface ListEmptyProps {
  children?: ReactNode;
  icon?: ReactNode;
  title?: string;
  message?: string | ReactNode;
  className?: string;
}

const Empty = forwardRef<HTMLDivElement, ListEmptyProps>((
  { children, icon, title, message, className },
  ref
) => {
  if (children) {
    return (
      <div ref={ref} className={cn("text-center py-8", className)}>
        {children}
      </div>
    );
  }
  
  return (
    <div ref={ref} className={cn("text-center py-8", className)}>
      {icon && (
        <div className="mb-4">{icon}</div>
      )}
      {title && (
        <p className="text-lg text-gray-500 mb-2">{title}</p>
      )}
      {message && (
        <div className="text-sm text-muted-foreground">{message}</div>
      )}
    </div>
  );
});
Empty.displayName = 'List.Empty';

// Loading state component
interface ListLoadingProps {
  children?: ReactNode;
  count?: number;
  height?: string;
  className?: string;
}

const Loading = forwardRef<HTMLDivElement, ListLoadingProps>((
  { children, count = 5, height = 'h-20', className },
  ref
) => {
  if (children) {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    );
  }
  
  return (
    <div ref={ref} className={cn("space-y-3 p-3", className)}>
      {[...Array(count)].map((_, i) => (
        <Skeleton key={i} className={cn(height, "w-full")} />
      ))}
    </div>
  );
});
Loading.displayName = 'List.Loading';

// Export compound component
export const List = {
  Container,
  Header,
  Search: SearchInput,
  Content,
  Item,
  Empty,
  Loading
};