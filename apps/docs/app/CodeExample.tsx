'use client';

import { Pallet, type NavConfig } from 'pokenav';
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
          <Pallet
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
    lines.push(`import { Pallet } from 'pokenav';`);
    lines.push(`import 'pokenav/styles.css';`);
    lines.push('');
  }

  lines.push('<Pallet');
  lines.push(`  position="${config.position}"`);
  lines.push(`  orientation="${config.orientation}"`);
  lines.push('  items={[');

  for (const item of config.items) {
    const fields = [`label: '${item.label}'`, `href: '${item.href}'`];
    if (item.pokemonId !== undefined) fields.push(`pokemonId: ${item.pokemonId}`);
    if (item.spriteUrl !== undefined) fields.push(`spriteUrl: '${item.spriteUrl}'`);
    lines.push(`    { ${fields.join(', ')} },`);
  }

  lines.push('  ]}');

  if (config.theme) {
    const entries = Object.entries(config.theme).filter(([, value]) => value !== undefined);
    if (entries.length > 0) {
      lines.push(`  theme={{ ${entries.map(([k, v]) => `${k}: '${v}'`).join(', ')} }}`);
    }
  }

  lines.push('  activeHref={pathname}');
  lines.push('/>');

  return lines.join('\n');
}
