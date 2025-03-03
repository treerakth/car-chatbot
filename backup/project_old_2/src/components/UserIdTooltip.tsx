import React from 'react';
import {
  useFloating,
  useHover,
  useInteractions,
  offset,
  flip,
  shift,
  FloatingPortal
} from '@floating-ui/react';

interface UserIdTooltipProps {
  userId: string;
  children: React.ReactNode;
}

export function UserIdTooltip({ userId, children }: UserIdTooltipProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    middleware: [
      offset(8),
      flip(),
      shift()
    ],
  });

  const hover = useHover(context);
  const { getReferenceProps, getFloatingProps } = useInteractions([hover]);

  return (
    <>
      <span
        ref={refs.setReference}
        {...getReferenceProps()}
        className="cursor-help"
      >
        {children}
      </span>
      {isOpen && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            {...getFloatingProps()}
            className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm shadow-lg z-50 max-w-md break-all"
          >
            {userId}
          </div>
        </FloatingPortal>
      )}
    </>
  );
}