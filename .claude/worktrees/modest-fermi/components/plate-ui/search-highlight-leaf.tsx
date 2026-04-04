import { withCn } from '@udecode/cn';
// @ts-expect-error -- plate package API mismatch
import { PlateLeaf } from '@udecode/plate-common';

export const SearchHighlightLeaf = withCn(PlateLeaf, 'bg-warning/10');
