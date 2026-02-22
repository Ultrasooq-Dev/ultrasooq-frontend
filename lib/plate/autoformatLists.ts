import { AutoformatRule } from '@udecode/plate-autoformat';
// @ts-expect-error -- plate package API mismatch
import { isBlock, setNodes } from '@udecode/plate-common';
// @ts-expect-error -- plate package API mismatch
import { ELEMENT_LI, ELEMENT_OL, ELEMENT_TODO_LI, ELEMENT_UL, TTodoListItemElement } from '@udecode/plate-list';

import { formatList, preFormat } from '@/lib/plate/autoformatUtils';

export const autoformatLists: AutoformatRule[] = [
  {
    mode: 'block',
    type: ELEMENT_LI,
    match: ['* ', '- '],
    preFormat,
    format: (editor: any) => formatList(editor, ELEMENT_UL),
  },
  {
    mode: 'block',
    type: ELEMENT_LI,
    match: ['1. ', '1) '],
    preFormat,
    format: (editor: any) => formatList(editor, ELEMENT_OL),
  },
  {
    mode: 'block',
    type: ELEMENT_TODO_LI,
    match: '[] ',
  },
  {
    mode: 'block',
    type: ELEMENT_TODO_LI,
    match: '[x] ',
    format: (editor: any) =>
      setNodes<TTodoListItemElement>(
        editor,
        { type: ELEMENT_TODO_LI, checked: true },
        {
          match: (n: any) => isBlock(editor, n),
        }
      ),
  },
];
