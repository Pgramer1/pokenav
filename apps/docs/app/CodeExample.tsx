'use client';

import { Pokenav, type NavConfig } from 'pokenav/pokemon';
import { CopyButton } from './CopyButton';

/**
 * A code block and a live rendering of the *same* config object.
 *
 * The code is generated from `config` rather than written out by hand alongside it, so the
 * snippet on the page and the component beside it cannot drift apart. What you read is
 * literally what is being rendered — change the object and both move together.
 */
export function CodeExample({
  config,
  showImports = false,
  caption,
}: {
  config: NavConfig;
  showImports?: boolean;
  caption?: string;
}) {
  const code = formatExample(config, showImports);

  return (
    <div className="example">
      <div className="exampleCode">
        <div className="codeHead">
          <span className="codeLang">tsx</span>
          <CopyButton value={code} className="copy copyInline" />
        </div>
        <pre className="code">
          <code>{code}</code>
        </pre>
      </div>
      <div className="examplePreview">
        <div className="codeHead">
          <span className="exampleTag">Live — rendered from this config</span>
        </div>
        <div className="exampleStage" data-orientation={config.orientation}>
          <Pokenav
            {...config}
            activeHref={config.items[0]?.href}
            ariaLabel={caption ?? 'Example navigation'}
          />
        </div>
      </div>
    </div>
  );
}

/** Serializes a NavConfig back into the JSX that would produce it. */
function formatExample(config: NavConfig, showImports: boolean): string {
  const lines: string[] = [];

  if (showImports) {
    // Which entry point a config needs is a property of the config, so derive it rather
    // than hardcoding one: an example that names a pokemonId cannot use the core entry.
    lines.push(`import { Pokenav } from '${entryPointFor(config)}';`);
    lines.push(`import 'pokenav/styles.css';`);
    lines.push('');
  }

  lines.push('<Pokenav');
  lines.push(`  position="${config.position}"`);
  lines.push(`  orientation="${config.orientation}"`);
  lines.push('  items={[');

  for (const item of config.items) {
    const fields = [`label: '${item.label}'`, `href: '${item.href}'`];
    if (item.pokemonId !== undefined) fields.push(`pokemonId: ${item.pokemonId}`);
    if (item.spriteUrl !== undefined) fields.push(`spriteUrl: '${spriteUrlOf(item.spriteUrl)}'`);
    if (item.alt !== undefined) fields.push(`alt: '${item.alt}'`);
    lines.push(`    { ${fields.join(', ')} },`);
  }

  lines.push('  ]}');

  if (config.theme) {
    const entries = Object.entries(config.theme).filter(([, value]) => value !== undefined);
    if (entries.length > 0) {
      lines.push(`  theme={{ ${entries.map(([k, v]) => `${k}: '${v}'`).join(', ')} }}`);
    }
  }

  if (typeof config.matchActive === 'string') {
    lines.push(`  matchActive="${config.matchActive}"`);
  }

  lines.push('  activeHref={pathname}');
  lines.push('/>');

  return lines.join('\n');
}

function entryPointFor(config: NavConfig): string {
  return config.items.some((item) => item.pokemonId !== undefined)
    ? 'pokenav/pokemon'
    : 'pokenav';
}

/** `spriteUrl` accepts a bundler's static-import object as well as a plain string. */
function spriteUrlOf(spriteUrl: NonNullable<NavConfig['items'][number]['spriteUrl']>): string {
  return typeof spriteUrl === 'string' ? spriteUrl : spriteUrl.src;
}
