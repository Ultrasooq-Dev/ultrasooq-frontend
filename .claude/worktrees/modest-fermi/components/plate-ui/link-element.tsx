import React from 'react';
import { cn, withRef } from '@udecode/cn';
// @ts-expect-error -- plate package API mismatch
import { PlateElement, useElement } from '@udecode/plate-common';
// @ts-expect-error -- plate package API mismatch
import { TLinkElement, useLink } from '@udecode/plate-link';

export const LinkElement = withRef<typeof PlateElement>(
  ({ className, children, ...props }, ref) => {
    const element = useElement<TLinkElement>();
    const { props: linkProps } = useLink({ element });

    return (
      <PlateElement
        ref={ref}
        asChild
        className={cn(
          'font-medium text-primary underline decoration-primary underline-offset-4',
          className
        )}
        {...(linkProps as any)}
        {...props}
      >
        <a>{children}</a>
      </PlateElement>
    );
  }
);
