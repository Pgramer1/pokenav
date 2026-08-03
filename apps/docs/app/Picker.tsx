'use client';

import { useMemo, useState } from 'react';
import { Pallet, catalogue, type NavConfig } from '@devanshsoni/pallet';
import { SpriteThumb } from './SpriteThumb';

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
  const [copied, setCopied] = useState(false);

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

  const copy = async () => {
    await navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <section className="picker">
      <div className="pickerMain">
        <div className="pickerLeft">
          <h2 className="pickerHeading">1 — Pick a slot</h2>
          <ol className="slots">
            {items.map((item, index) => {
              const entry = catalogue.entries.find((e) => e.id === item.pokemonId);
              return (
                <li key={index}>
                  <button
                    type="button"
                    className="slot"
                    data-selected={index === selected ? '' : undefined}
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
                      <span className="slotMeta">{entry ? entry.name : 'no sprite'}</span>
                    </span>
                  </button>
                  <span className="slotEdit">
                    <input
                      value={item.label}
                      onChange={(e) => updateItem(index, { label: e.target.value })}
                      aria-label={`Label for item ${index + 1}`}
                      className="slotInput"
                    />
                    <input
                      value={item.href}
                      onChange={(e) => updateItem(index, { href: e.target.value })}
                      aria-label={`Href for item ${index + 1}`}
                      className="slotInput"
                    />
                    <button
                      type="button"
                      className="slotRemove"
                      onClick={() => removeItem(index)}
                      disabled={items.length <= 2}
                      aria-label={`Remove ${item.label}`}
                    >
                      ×
                    </button>
                  </span>
                </li>
              );
            })}
          </ol>
          <button type="button" className="addItem" onClick={addItem}>
            + Add item
          </button>

          <h2 className="pickerHeading">Style</h2>
          <div className="styleControls">
            <div className="controlRow">
              <span className="controlsLabel">accent</span>
              {ACCENTS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className="swatch"
                  data-selected={color === accentColor ? '' : undefined}
                  style={{ background: color }}
                  onClick={() => setAccentColor(color)}
                  aria-label={`Accent ${color}`}
                />
              ))}
            </div>
            <div className="controlRow">
              <span className="controlsLabel">ring</span>
              <Toggle value={ringStyle} onChange={setRingStyle} options={['solid', 'pokeball']} />
            </div>
            <div className="controlRow">
              <span className="controlsLabel">trail</span>
              <Toggle value={trailPath} onChange={setTrailPath} options={['straight', 'wavy']} />
            </div>
            <div className="controlRow">
              <span className="controlsLabel">axis</span>
              <Toggle
                value={orientation}
                onChange={setOrientation}
                options={['vertical', 'horizontal']}
              />
            </div>
            <div className="controlRow">
              <span className="controlsLabel">position</span>
              <Toggle
                value={position}
                onChange={setPosition}
                options={['left', 'center', 'right']}
              />
            </div>
          </div>
        </div>

        <div className="pickerPreview">
          <h2 className="pickerHeading">Live preview</h2>
          <div className="previewStage" data-orientation={orientation}>
            <Pallet {...config} activeHref={items[selected]?.href} ariaLabel="Preview navigation" />
          </div>
        </div>
      </div>

      <h2 className="pickerHeading">
        2 — Choose a sprite for <em>{items[selected]?.label ?? '—'}</em>
      </h2>

      <div className="gridControls">
        <input
          type="search"
          className="search"
          placeholder="Search 898 Pokémon by name or Dex number…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search Pokémon"
        />
        <div className="genTabs" role="group" aria-label="Filter by generation">
          <button
            type="button"
            className="genTab"
            data-selected={generation === 'all' ? '' : undefined}
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
              onClick={() => setGeneration(gen)}
            >
              Gen {gen}
            </button>
          ))}
        </div>
      </div>

      <p className="resultCount">
        {results.length} of {catalogue.entries.length} sprites
      </p>

      <div className="grid">
        {results.map((entry) => (
          <button
            key={entry.id}
            type="button"
            className="gridItem"
            data-chosen={items[selected]?.pokemonId === entry.id ? '' : undefined}
            onClick={() => assign(entry.id)}
            title={`#${entry.id} ${entry.name} — ${entry.types.join('/')}`}
          >
            <SpriteThumb pokemonId={entry.id} name={entry.name} />
          </button>
        ))}
        {results.length === 0 ? <p className="empty">No Pokémon match that search.</p> : null}
      </div>

      <h2 className="pickerHeading">3 — Copy your config</h2>
      <div className="output">
        <button type="button" className="copy" onClick={copy}>
          {copied ? 'Copied' : 'Copy'}
        </button>
        <pre className="json">{json}</pre>
      </div>
    </section>
  );
}

function Toggle<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (next: T) => void;
  options: readonly T[];
}) {
  return (
    <span className="toggle">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          className="toggleOption"
          data-selected={option === value ? '' : undefined}
          onClick={() => onChange(option)}
        >
          {option}
        </button>
      ))}
    </span>
  );
}
