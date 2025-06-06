import * as React from 'react';
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';

type ScrollBehavior = 'auto' | 'smooth';

import { cn } from '../../utils';

export interface ScrollAreaHandle {
  scrollToBottom: () => void;
  scrollToPosition: (options: { top: number; behavior?: ScrollBehavior }) => void;
}

interface ScrollAreaProps extends React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root> {
  autoScroll?: boolean;
}

const ScrollArea = React.forwardRef<ScrollAreaHandle, ScrollAreaProps>(
  ({ className, children, autoScroll = false, ...props }, ref) => {
    const rootRef = React.useRef<React.ElementRef<typeof ScrollAreaPrimitive.Root>>(null);
    const viewportRef = React.useRef<HTMLDivElement>(null);
    const viewportEndRef = React.useRef<HTMLDivElement>(null);
    const [isFollowing, setIsFollowing] = React.useState(true);
    const [isScrolled, setIsScrolled] = React.useState(false);

    const scrollToBottom = React.useCallback(() => {
      if (viewportEndRef.current) {
        viewportEndRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'end',
          inline: 'nearest',
        });
        setIsFollowing(true);
      }
    }, []);

    const scrollToPosition = React.useCallback(
      ({ top, behavior = 'smooth' }: { top: number; behavior?: ScrollBehavior }) => {
        if (viewportRef.current) {
          viewportRef.current.scrollTo({
            top,
            behavior,
          });
        }
      },
      []
    );

    // Expose the scroll methods to parent components
    React.useImperativeHandle(
      ref,
      () => ({
        scrollToBottom,
        scrollToPosition,
      }),
      [scrollToBottom, scrollToPosition]
    );

    // Handle scroll events to update isFollowing state
    const handleScroll = React.useCallback(() => {
      if (!viewportRef.current) return;

      const viewport = viewportRef.current;
      const { scrollHeight, scrollTop, clientHeight } = viewport;

      const scrollBottom = scrollTop + clientHeight;
      const newIsFollowing = scrollHeight === scrollBottom;

      // Check if scrolled from top
      setIsScrolled(scrollTop > 0);

      // react will internally optimize this to not re-store the same values
      setIsFollowing(newIsFollowing);
    }, []);

    React.useEffect(() => {
      if (!autoScroll || !isFollowing) return;

      scrollToBottom();
    }, [children, autoScroll, isFollowing, scrollToBottom]);

    // Add scroll event listener
    React.useEffect(() => {
      const viewport = viewportRef.current;
      if (!viewport) return;

      viewport.addEventListener('scroll', handleScroll);
      return () => viewport.removeEventListener('scroll', handleScroll);
    }, [handleScroll]);

    return (
      <ScrollAreaPrimitive.Root
        ref={rootRef}
        className={cn('relative overflow-hidden', className)}
        data-scrolled={isScrolled}
        {...props}
      >
        <div
          className={cn(
            'absolute top-0 left-0 right-0 z-10 transition-all duration-200',
            isScrolled ? 'border-t border-borderSubtle' : 'border-t border-transparent'
          )}
        />
        <ScrollAreaPrimitive.Viewport
          ref={viewportRef}
          className="h-full w-full rounded-[inherit] [&>div]:!block"
        >
          {children}
          {autoScroll && <div ref={viewportEndRef} style={{ height: '1px' }} />}
        </ScrollAreaPrimitive.Viewport>
        <ScrollBar />
        <ScrollAreaPrimitive.Corner />
      </ScrollAreaPrimitive.Root>
    );
  }
);
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName;

const ScrollBar = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>
>(({ className, orientation = 'vertical', ...props }, ref) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    ref={ref}
    orientation={orientation}
    className={cn(
      'flex touch-none select-none transition-colors',
      orientation === 'vertical' && 'h-full w-2.5 border-l border-l-transparent p-[1px]',
      orientation === 'horizontal' && 'h-2.5 flex-col border-t border-t-transparent p-[1px]',
      className
    )}
    {...props}
  >
    <ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-border dark:bg-border-dark" />
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
));
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName;

export { ScrollArea, ScrollBar };
