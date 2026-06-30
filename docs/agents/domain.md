# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

This repo uses the single-context layout:

- `CONTEXT.md` at the repo root is the project glossary and domain-language source.
- `docs/adr/` at the repo root holds architectural decision records when they exist.
- `CONTEXT-MAP.md` is not used unless this repo moves to a multi-context layout later.

## Before exploring, read these

- **`CONTEXT.md`** at the repo root.
- **`docs/adr/`** — read ADRs that touch the area you're about to work in.

If any ADR files don't exist, **proceed silently**. Don't flag their absence; don't suggest creating them upfront. The producer skill (`/grill-with-docs`) creates them lazily when terms or decisions actually get resolved.

## File structure

```txt
/
├── CONTEXT.md
├── docs/adr/
└── apps/
```

## Use the glossary's vocabulary

When your output names a domain concept, use the term as defined in `CONTEXT.md`. Don't drift to synonyms the glossary explicitly avoids.

If the concept you need isn't in the glossary yet, that's a signal — either you're inventing language the project doesn't use, or there's a real gap to note for `/grill-with-docs`.

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it explicitly rather than silently overriding:

> _Contradicts ADR-0007 (event-sourced orders) — but worth reopening because…_
