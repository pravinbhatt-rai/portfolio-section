import type { DetailedHTMLProps, HTMLAttributes } from "react";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "theme-selector": DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          "data-key"?: string;
          "data-transition-duration"?: string;
        },
        HTMLElement
      >;
    }
  }
}
