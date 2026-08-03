# Sprite Assets Notice

**Short version:** the code in this repository is MIT licensed and original. The Pokémon
sprite assets bundled with the `pokenav` package are **not** original work, are **not**
covered by that MIT license, and are **not** ours to license to you.

> **Status:** 898 sprite assets are bundled — National Dex ids 1–898, generations 1–8.
> Generation 9 has no icon-style sprite in the upstream source, so those ids are absent
> rather than filled in from a different sprite style.

## What is bundled

The `pokenav` component renders small pixel-art sprites as navigation nodes. Those sprite
files are fan-derived artwork based on Pokémon characters. Pokémon and all associated
names, characters, and artwork are trademarks and copyrights of **Nintendo, Creatures Inc.,
GAME FREAK inc., and The Pokémon Company**. This project is not affiliated with,
endorsed by, sponsored by, or approved by any of them.

No claim of ownership is made over the sprite assets. They are included for identification
and illustrative purposes in a non-commercial fan tool.

## The precedent this relies on

This project distributes sprite assets on the same basis as long-running community
projects such as [PokéAPI](https://pokeapi.co/) and
[PokeAPI/sprites](https://github.com/PokeAPI/sprites) — that the rights holders have, over
many years, tolerated non-commercial fan tools that redistribute this artwork for
community and educational use.

**This is a precedent, not a legal guarantee.** Tolerance is not a license. It can be
withdrawn at any time, and it has been withdrawn from other fan projects before. If you
build something commercial on top of `pokenav`, that tolerance may not extend to you, and
evaluating that risk is your responsibility, not this project's.

## Your escape hatch

`pokenav` is designed so you never have to ship a single Pokémon sprite. Every nav item
accepts a `spriteUrl`, which takes any image you supply:

```ts
items: [
  { label: 'Work', href: '/work', spriteUrl: '/icons/my-own-art.png' },
]
```

An item with `spriteUrl` set never touches the bundled catalogue. If you want the route-map
navigation without the IP question, use `spriteUrl` on every item and none of this notice
applies to your build.

## Audio is deliberately excluded

Pokémon cries and other game audio are **not** bundled, and are out of scope for v1 and
v1.x. Copyrighted audio is a materially different risk from sprite artwork and requires its
own decision before anything ships.

## Takedown

If you represent a rights holder and want these assets removed, open an issue on this
repository or contact the maintainer directly. Assets will be removed promptly and without
argument.
