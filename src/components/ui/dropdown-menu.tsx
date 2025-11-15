'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

const DropdownMenu = React.forwardRef<
  React.ElementRef<'div'>,
  React.ComponentPropsWithoutRef<'div'> & {
    children: React.ReactNode;
  }
>(({ className, children, ...props }, ref) => {
  const [open, setOpen] = React.useState(false);

  return (
    <div
      ref={ref}
      className={cn('relative inline-block text-left', className)}
      {...props}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          if (child.type === DropdownMenuTrigger) {
            return React.cloneElement(child as React.ReactElement, { onClick: () => setOpen(!open) } as any);
          }
          if (child.type === DropdownMenuContent) {
            return open ? React.cloneElement(child as React.ReactElement, { onClose: () => setOpen(false) } as any) : null;
          }
        }
        return child;
      })}
    </div>
  );
});
DropdownMenu.displayName = 'DropdownMenu';

const DropdownMenuTrigger = React.forwardRef<
  React.ElementRef<'div'>,
  React.ComponentPropsWithoutRef<'div'>
>(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn('cursor-pointer', className)} {...props}>
    {children}
  </div>
));
DropdownMenuTrigger.displayName = 'DropdownMenuTrigger';

const DropdownMenuContent = React.forwardRef<
  React.ElementRef<'div'>,
  React.ComponentPropsWithoutRef<'div'> & {
    align?: 'start' | 'center' | 'end';
    onClose?: () => void;
  }
>(({ className, align = 'center', onClose, children, ...props }, ref) => {
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref && 'current' in ref && ref.current && !ref.current.contains(event.target as Node)) {
        onClose?.();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose, ref]);

  return (
    <div
      ref={ref}
      className={cn(
        'absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md',
        {
          'right-0': align === 'end',
          'left-1/2 -translate-x-1/2': align === 'center',
          'left-0': align === 'start',
        },
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});
DropdownMenuContent.displayName = 'DropdownMenuContent';

const DropdownMenuItem = React.forwardRef<
  React.ElementRef<'div'>,
  React.ComponentPropsWithoutRef<'div'>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
      className
    )}
    {...props}
  >
    {children}
  </div>
));
DropdownMenuItem.displayName = 'DropdownMenuItem';

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
};
