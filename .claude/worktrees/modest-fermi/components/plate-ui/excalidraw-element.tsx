import React from 'react';
import { withRef } from '@udecode/cn';
// @ts-expect-error -- plate package API mismatch
import { PlateElement } from '@udecode/plate-common';
// @ts-expect-error -- plate package API mismatch
import { useExcalidrawElement } from '@udecode/plate-excalidraw';

export const ExcalidrawElement = withRef<typeof PlateElement>(
  ({ nodeProps, ...props }, ref) => {
    const { children, element } = props;

    const { Excalidraw, excalidrawProps } = useExcalidrawElement({
      element,
    });

    return (
      <PlateElement ref={ref} {...props}>
        <div contentEditable={false}>
          <div className="h-[600px]">
            {Excalidraw ? (
              <Excalidraw {...nodeProps} {...(excalidrawProps as any)} />
            ) : null}
          </div>
        </div>
        {children}
      </PlateElement>
    );
  }
);
