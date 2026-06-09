# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # start dev server with HMR
npm run build     # type-check then build for production (tsc -b && vite build)
npm run lint      # run ESLint
npm run preview   # preview the production build locally
```

## Stack

- React 19 + TypeScript, bundled with Vite 8
- Tailwind CSS v4 (PostCSS-based, no `tailwind.config.js` — config lives in CSS via `@import "tailwindcss"`)
- Entry: `src/main.tsx` → `src/App.tsx`

## Project purpose

Kid incentive app — currently at the default Vite scaffold stage, ready to be built out.
