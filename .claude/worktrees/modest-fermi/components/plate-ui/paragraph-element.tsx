import { withCn } from '@udecode/cn';
// @ts-expect-error -- plate package API mismatch
import { PlateElement } from '@udecode/plate-common';

export const ParagraphElement = withCn(PlateElement, 'm-0 px-0 py-1');
