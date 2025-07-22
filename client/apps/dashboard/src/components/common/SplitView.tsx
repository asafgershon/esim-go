import React, { ReactNode } from 'react';
import { Panel, PanelGroup } from 'react-resizable-panels';
import { ResizeHandle } from '../resize-handle';
import { cn } from '@workspace/ui/lib/utils';

export interface SplitViewPanelConfig {
  id: string;
  defaultSize?: number;
  minSize?: number;
  maxSize?: number;
  order?: number;
  content: ReactNode;
  header?: ReactNode;
  className?: string;
}

interface SplitViewProps {
  panels: SplitViewPanelConfig[];
  direction?: 'horizontal' | 'vertical';
  className?: string;
  autoSaveId?: string;
}

export const SplitView: React.FC<SplitViewProps> = ({
  panels,
  direction = 'horizontal',
  className,
  autoSaveId,
}) => {
  return (
    <PanelGroup
      direction={direction}
      className={cn('flex h-full', className)}
      autoSaveId={autoSaveId}
    >
      {panels.map((panel, index) => (
        <React.Fragment key={panel.id}>
          <Panel
            id={panel.id}
            defaultSize={panel.defaultSize}
            minSize={panel.minSize}
            maxSize={panel.maxSize}
            order={panel.order}
          >
            <div className={cn('h-full flex flex-col', panel.className)}>
              {panel.header && (
                <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-3 py-3 flex-shrink-0">
                  {panel.header}
                </div>
              )}
              <div className="flex-1 min-h-0">
                {panel.content}
              </div>
            </div>
          </Panel>
          {index < panels.length - 1 && (
            <ResizeHandle orientation={direction} />
          )}
        </React.Fragment>
      ))}
    </PanelGroup>
  );
};