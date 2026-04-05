// @ts-expect-error -- plate package API mismatch
import { createPlugins } from "@udecode/plate-common";

// Minimal plugins configuration to avoid version conflicts
export const plugins = createPlugins(
  [
    // Basic plugins only
  ],
  {
    components: {},
  },
);
