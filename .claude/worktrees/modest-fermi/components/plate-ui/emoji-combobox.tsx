import React from 'react';
// @ts-expect-error - type mismatch
import { ComboboxItemProps } from '@udecode/plate-combobox';
// @ts-expect-error - plate-emoji API changed in newer versions
import { EmojiItemData, KEY_EMOJI, TEmojiCombobox, useEmojiComboboxState } from '@udecode/plate-emoji';

import { Combobox } from './combobox';

export function EmojiComboboxItem({ item }: ComboboxItemProps<EmojiItemData>) {
  const {
    data: { id, emoji },
  } = item;

  return (
    <div>
      {emoji} :{id}:
    </div>
  );
}

export function EmojiCombobox({
  pluginKey = KEY_EMOJI,
  id = pluginKey,
  ...props
}: TEmojiCombobox) {
  const { trigger, onSelectItem } = useEmojiComboboxState({ pluginKey });

  return (
    <Combobox
      id={id}
      trigger={trigger}
      controlled
      onSelectItem={onSelectItem as any}
      onRenderItem={EmojiComboboxItem}
      {...props}
    />
  );
}
