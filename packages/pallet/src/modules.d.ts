/** Ambient declarations for the non-TS assets tsup bundles into the package. */

declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

/** PNGs are inlined as `data:` URIs by tsup's `dataurl` loader — see tsup.config.ts. */
declare module '*.png' {
  const src: string;
  export default src;
}
