import { AutoformatPlugin } from '@udecode/plate-autoformat';
// @ts-expect-error -- plate package API mismatch
import { PlatePlugin } from '@udecode/plate-common';

import { autoformatRules } from '@/lib/plate/autoformatRules';

export const autoformatPlugin: Partial<PlatePlugin<any>> = {
  options: {
    rules: autoformatRules as any,
    enableUndoOnDelete: true,
  },
};
