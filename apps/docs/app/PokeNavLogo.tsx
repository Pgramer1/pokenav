import type { SVGProps } from 'react';

type PokeNavLogoProps = SVGProps<SVGSVGElement> & {
  title?: string;
};

/**
 * Theme-aware PokeNav wordmark drawn entirely from vector shapes.
 *
 * The neutral letters inherit `color`; the ball and `nav` use fixed brand colors.
 * No font or raster asset is required, so the mark stays crisp at every size.
 */
export function PokeNavLogo({ className, title, ...props }: PokeNavLogoProps) {
  const labelled = Boolean(title);

  return (
    <svg
      viewBox="0 0 520 112"
      xmlns="http://www.w3.org/2000/svg"
      className={['pokeNavLogo', className].filter(Boolean).join(' ')}
      role={labelled ? 'img' : undefined}
      aria-hidden={labelled ? undefined : true}
      aria-label={labelled ? title : undefined}
      shapeRendering="crispEdges"
      {...props}
    >
      {title ? <title>{title}</title> : null}

      {/* p */}
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M4 16h36v8h12v40H40v8H16v36H4V16Zm12 12v32h24V28H16Z"
      />

      {/* Poké Ball */}
      <path
        className="pokeNavLogoBallOutline"
        d="M84 12h48v8h12v12h8v16h8v24h-8v12h-8v12h-12v8H84v-8H72V84h-8V72h-4V48h4V32h8V20h12v-8Z"
      />
      <path
        className="pokeNavLogoBallTop"
        d="M84 24h48v8h12v12h8v12h-36v-8h-16v8H68V44h8V32h8v-8Z"
      />
      <path
        className="pokeNavLogoBallBottom"
        d="M68 68h84v4h-8v12h-12v8H84v-8H76V72h-8v-4Z"
      />
      <path
        className="pokeNavLogoBallOutline"
        d="M100 48h16v4h8v8h4v12h-4v8h-8v4h-16v-4h-8v-8h-4V60h4v-8h8v-4Z"
      />
      <path
        className="pokeNavLogoBallButton"
        d="M100 60h16v12h-16V60Z"
      />
      <path className="pokeNavLogoBallHighlight" d="M84 28h12v8h-4v4h-8V28Zm-8 12h8v8h-8v-8Z" />

      {/* k */}
      <path
        fill="currentColor"
        d="M168 8h12v44h12V40h12V28h12V16h12v16h-12v12h-12v12h-12v8h12v12h12v12h12v16h-12V92h-12V80h-12V68h-12v36h-12V8Z"
      />

      {/* e */}
      <path
        fill="currentColor"
        d="M256 20h32v8h8v8h4v36h-48v20h48v12h-44v-4h-8v-8h-8V36h8v-8h8v-8Zm-4 16v20h36V36h-36Z"
        fillRule="evenodd"
      />

      {/* n */}
      <path
        className="pokeNavLogoAccent"
        d="M312 20h12v12h12V20h24v12h12v72h-12V40h-36v64h-12V20Z"
      />

      {/* a */}
      <path
        className="pokeNavLogoAccent"
        fillRule="evenodd"
        d="M396 20h36v12h12v72h-12V92h-36v12h-12V68h12V56h36V40h-36V20Zm0 48v12h36V68h-36Z"
      />

      {/* v */}
      <path
        className="pokeNavLogoAccent"
        d="M456 20h12v48h12v16h12V68h12V20h12v60h-12v12h-12v12h-12V92h-12V80h-12V20Z"
      />
    </svg>
  );
}
