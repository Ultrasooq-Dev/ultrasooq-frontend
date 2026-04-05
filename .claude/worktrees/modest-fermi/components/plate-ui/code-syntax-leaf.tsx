'use client';

import React from 'react';
import { withRef } from '@udecode/cn';
// @ts-expect-error -- plate package API mismatch
import { useCodeSyntaxLeaf } from '@udecode/plate-code-block';
// @ts-expect-error -- plate package API mismatch
import { PlateLeaf } from '@udecode/plate-common';

export const CodeSyntaxLeaf = withRef<typeof PlateLeaf>(
  ({ children, ...props }, ref) => {
    const { leaf } = props;

    const { tokenProps } = useCodeSyntaxLeaf({ leaf });

    return (
      <PlateLeaf ref={ref} {...props}>
        <span {...tokenProps}>{children}</span>
      </PlateLeaf>
    );
  }
);
