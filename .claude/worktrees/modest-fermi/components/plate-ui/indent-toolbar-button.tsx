import React from 'react';
import { withRef } from '@udecode/cn';
// @ts-expect-error -- plate package API mismatch
import { useIndentButton } from '@udecode/plate-indent';

import { Icons } from '@/components/icons';

import { ToolbarButton } from './toolbar';

export const IndentToolbarButton = withRef<typeof ToolbarButton>(
  (rest, ref) => {
    const { props } = useIndentButton();

    return (
      <ToolbarButton ref={ref} tooltip="Indent" {...props} {...rest}>
        <Icons.indent />
      </ToolbarButton>
    );
  }
);
