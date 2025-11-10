import type React from 'react';
import '@reown/appkit/react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'appkit-button': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        balance?: 'show' | 'hide';
      };
    }
  }
}

export {};
