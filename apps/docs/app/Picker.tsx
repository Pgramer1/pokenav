'use client';

import { useMemo, useState } from 'react';
import { Pallet, catalogue, type NavConfig } from 'pokenav';
import { SpriteThumb } from './SpriteThumb';
import { CopyButton } from './CopyButton';

const ACCENTS = ['#f97316', '#2563eb', '#16a34a', '#db2777', '#7c3aed'];

const GENERATIONS = [...new Set(catalogue.entries.map((entry) => entry.generation))].sort(
  (a, b) => a - b,
);

const INITIAL_ITEMS: NavConfig['items'] = [
  { label: 'Home', href: '/', pokemonId: 133 },
  { label: 'Work', href: '/work', pokemonId: 81 },
  { label: 'Writing', href: '/writing', pokemonId: 137 },
  { label: 'Contact', href: '/contact', pokemonId: 185 },
];

export function Picker() {
  const [items, setItems] = useState(INITIAL_ITEMS);
  const [selected, setSelected] = useState(0);
  const [search, setSearch] = useState('');
  const [generation, setGeneration] = useState<number | 'all'>('all');
  const [accentColor, setAccentColor] = useState(ACCENTS[0]);
  const [ringStyle, setRingStyle] = useState<'solid' | 'pokeball'>('solid');
  const [trailPath, setTrailPath] = useState<'straight' | 'wavy'>('wavy');
  const [orientation, setOrientation] = useState<'vertical' | 'horizontal'>('vertical');
  const [position, setPosition] = useState<'left' | 'center' | 'right'>('left');

  const results = useMemo(() => {
    const query = search.trim().toLowerCase();
    return catalogue.entries.filter(
      (entry) =>
        (generation === 'all' || entry.generation === generation) &&
        (query === '' || entry.name.includes(query) || String(entry.id) === query),
    );
  }, [search, generation]);

  const config: NavConfig = {
    position,
    orientation,
    items,
    theme: { accentColor, ringStyle, trailPath, dotStyle: 'dotted' },
  };

  const json = JSON.stringify(config, null, 2);

  const assign = (pokemonId: number) => {
    setItems((prev) => prev.map((item, i) => (i === selected ? { ...item, pokemonId } : item)));
    // Advance to the next slot so picking four in a row needs no extra clicks.
    setSelected((prev) => (prev + 1) % items.length);
  };

  const updateItem = (index: number, patch: Partial<NavConfig['items'][number]>) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { label: `Section ${prev.length + 1}`, href: `/section-${prev.length + 1}`, pokemonId: 25 },
    ]);
    setSelected(items.length);
  };

  const removeItem = (index: number) => {
    if (items.length <= 2) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
    setSelected((prev) => Math.max(0, Math.min(prev, items.length - 2)));
  };

  const activeLabel = items[selected]?.label ?? '—';

  return (
    <section className="picker" aria-label="Navigation builder">
      <div className="pickerHead">
        <span className="eyebrow">Playground</span>
        <h2>Build your nav</h2>
        <p className="hint">
          Pick sprites, rename the items, tune the theme, copy the config. The preview beside
          the steps is the real component, re-rendering as you go.
        </p>
      </div>

      {/* A horizontal nav is far wider than a vertical one, so the aside column widens to
          match rather than leaving the preview permanently mid-scroll. */}
      <div className="pickerBody" data-orientation={orientation}>
        <div className="pickerFlow">
          <Step number={1} title="Nav items">
            <ol className="slots">
              {items.map((item, index) => {
                const entry = catalogue.entries.find((e) => e.id === item.pokemonId);
                return (
                  <li
                    className="slotRow"
                    key={index}
                    data-selected={index === selected ? '' : undefined}
                  >
                    <button
                      type="button"
                      className="slot"
                      onClick={() => setSelected(index)}
                      aria-pressed={index === selected}
                    >
                      <span className="slotSprite">
                        {item.pokemonId !== undefined && entry ? (
                          <SpriteThumb pokemonId={item.pokemonId} name="" />
                        ) : null}
                      </span>
                      <span className="slotText">
                        <span className="slotLabel">{item.label}</span>
                        <span className="slotMeta">
                          {entry ? `#${entry.id} ${entry.name}` : 'no sprite yet'}
                        </span>
                      </span>
                      <span className="slotState" aria-hidden="true">
                        {index === selected ? 'editing' : 'select'}
                      </span>
                    </button>

                    <div className="slotFields">
                      <label className="field">
                        <span className="fieldTag">Label</span>
                        <input
                          value={item.label}
                          onChange={(e) => updateItem(index, { label: e.target.value })}
                          className="slotInput"
                        />
                      </label>
                      <label className="field">
                        <span className="fieldTag">Href</span>
                        <input
                          value={item.href}
                          onChange={(e) => updateItem(index, { href: e.target.value })}
                          className="slotInput"
                        />
                      </label>
                      <button
                        type="button"
                        className="slotRemove"
                        onClick={() => removeItem(index)}
                        disabled={items.length <= 2}
                        aria-label={`Remove ${item.label}`}
                        title={items.length <= 2 ? 'A nav needs at least two items' : 'Remove item'}
                      >
                        <svg
                          viewBox="0 0 16 16"
                          width="14"
                          height="14"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          aria-hidden="true"
                        >
                          <path d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 8.2h5.8l.6-8.2" />
                        </svg>
                      </button>
                    </div>
                  </li>
                );
              })}
            </ol>
            <button type="button" className="addItem" onClick={addItem}>
              + Add item
            </button>
          </Step>

          <Step number={2} title={<>Choose a sprite for <em>{activeLabel}</em></>}>
            <div className="gridControls">
              <div className="searchWrap">
                <svg
                  className="searchIcon"
                  viewBox="0 0 16 16"
                  width="15"
                  height="15"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  aria-hidden="true"
                >
                  <circle cx="7" cy="7" r="4.5" />
                  <path d="m10.5 10.5 3 3" />
                </svg>
                <input
                  type="search"
                  className="search"
                  placeholder="Search by name or Dex number…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  aria-label="Search Pokémon"
                />
              </div>
              <p className="resultCount" role="status">
                <strong>{results.length}</strong> of {catalogue.entries.length}
              </p>
            </div>

            <div className="genTabs" role="group" aria-label="Filter by generation">
              <button
                type="button"
                className="genTab"
                data-selected={generation === 'all' ? '' : undefined}
                aria-pressed={generation === 'all'}
                onClick={() => setGeneration('all')}
              >
                All
              </button>
              {GENERATIONS.map((gen) => (
                <button
                  key={gen}
                  type="button"
                  className="genTab"
                  data-selected={generation === gen ? '' : undefined}
                  aria-pressed={generation === gen}
                  onClick={() => setGeneration(gen)}
                >
                  Gen {gen}
                </button>
              ))}
            </div>

            <div className="grid">
              {results.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  className="gridItem"
                  data-chosen={items[selected]?.pokemonId === entry.id ? '' : undefined}
                  onClick={() => assign(entry.id)}
                  title={`#${entry.id} ${entry.name} — ${entry.types.join('/')}`}
                  aria-label={`Use ${entry.name} for ${activeLabel}`}
                >
                  <SpriteThumb pokemonId={entry.id} name={entry.name} />
                </button>
              ))}
              {results.length === 0 ? (
                <p className="empty">
                  No Pokémon match “{search}”
                  {generation === 'all' ? '' : ` in generation ${generation}`}.
                </p>
              ) : null}
            </div>
          </Step>

          <Step number={3} title="Copy your config">
            <div className="output">
              <CopyButton value={json} />
              <pre className="json">{json}</pre>
            </div>
          </Step>
        </div>

        <aside className="pickerAside" aria-label="Preview and theme controls">
          <div className="asideSticky">
            <div className="asideBlock">
              <span className="asideTitle">Live preview</span>
              <div className="previewStage" data-orientation={orientation}>
                <Pallet
                  {...config}
                  activeHref={items[selected]?.href}
                  ariaLabel="Preview navigation"
                />
              </div>
            </div>

            <div className="asideBlock">
              <span className="asideTitle">Theme</span>
              <div className="styleControls">
                <div className="controlRow">
                  <span className="controlsLabel" id="ctl-accent">
                    accent
                  </span>
                  <span className="swatches" role="group" aria-labelledby="ctl-accent">
                    {ACCENTS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className="swatch"
                        data-selected={color === accentColor ? '' : undefined}
                        aria-pressed={color === accentColor}
                        style={{ background: color }}
                        onClick={() => setAccentColor(color)}
                        aria-label={`Accent ${color}`}
                      />
                    ))}
                  </span>
                </div>
                <Control label="ring">
                  <Toggle
                    value={ringStyle}
                    onChange={setRingStyle}
                    options={['solid', 'pokeball']}
                    name="ring style"
                  />
                </Control>
                <Control label="trail">
                  <Toggle
                    value={trailPath}
                    onChange={setTrailPath}
                    options={['straight', 'wavy']}
                    name="trail path"
                  />
                </Control>
                <Control label="axis">
                  <Toggle
                    value={orientation}
                    onChange={setOrientation}
                    options={['vertical', 'horizontal']}
                    name="orientation"
                  />
                </Control>
                <Control label="position">
                  <Toggle
                    value={position}
                    onChange={setPosition}
                    options={['left', 'center', 'right']}
                    name="position"
                  />
                </Control>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

function Step({
  number,
  title,
  children,
}: {
  number: number;
  title: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="step">
      <h3 className="stepHead">
        <span className="stepNumber" aria-hidden="true">
          {number}
        </span>
        <span className="stepTitle">{title}</span>
      </h3>
      <div className="stepBody">{children}</div>
    </section>
  );
}

function Control({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="controlRow">
      <span className="controlsLabel">{label}</span>
      {children}
    </div>
  );
}

function Toggle<T extends string>({
  value,
  onChange,
  options,
  name,
}: {
  value: T;
  onChange: (next: T) => void;
  options: readonly T[];
  name: string;
}) {
  return (
    <span className="toggle" role="group" aria-label={name}>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          className="toggleOption"
          data-selected={option === value ? '' : undefined}
          aria-pressed={option === value}
          onClick={() => onChange(option)}
        >
          {option}
        </button>
      ))}
    </span>
  );
}
