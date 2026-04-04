declare module 'react-slider' {
  import { Component } from 'react';

  interface ReactSliderProps {
    className?: string;
    thumbClassName?: string;
    trackClassName?: string;
    defaultValue?: number | number[];
    value?: number | number[];
    min?: number;
    max?: number;
    step?: number;
    pearling?: boolean;
    minDistance?: number;
    disabled?: boolean;
    invert?: boolean;
    orientation?: 'horizontal' | 'vertical';
    ariaLabel?: string | string[];
    ariaValuetext?: (state: { valueNow: number; index: number }) => string;
    renderThumb?: (
      props: Record<string, unknown> & { key: string },
      state: { index: number; valueNow: number; value: number | number[] }
    ) => React.ReactNode;
    renderTrack?: (
      props: Record<string, unknown> & { key: string },
      state: { index: number; value: number | number[] }
    ) => React.ReactNode;
    renderMark?: (props: Record<string, unknown>) => React.ReactNode;
    onChange?: (value: number | number[], index: number) => void;
    onBeforeChange?: (value: number | number[], index: number) => void;
    onAfterChange?: (value: number | number[], index: number) => void;
    onSliderClick?: (value: number) => void;
    marks?: boolean | number | number[];
    [key: string]: unknown;
  }

  export default class ReactSlider extends Component<ReactSliderProps> {}
}
