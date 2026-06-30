# Prompt de reprise — clone aikawakenichi.com (branche `iter`)

> Colle TOUT le bloc « PROMPT À COLLER » ci-dessous dans une nouvelle conversation Claude Code.
> (Le reste de ce fichier = détails que l'agent lira de toute façon en ouvrant les docs.)

---
## PROMPT À COLLER
---

Tu reprends un projet : **clone fidèle (Phase 1) du site `https://aikawakenichi.com`** pour une photographe
de mariage (« Splendide Soleil », univers golden-hour, lumière chaude maghrébine). Mon travail est commité
sur la branche **`iter`** dans le worktree `.claude/worktrees/iter` — **c'est déjà ton dossier de travail**.
L'autre version (sur `main`) ne doit PAS être touchée. Le client n'a **que du local** → **commit souvent**.

**ÉTAPE 0 — lis ces fichiers AVANT de coder :**
1. `docs/HANDOFF.md` — état + ce qui reste + plan.
2. `docs/reference/RECETTE-EXACTE.md` — la recette exacte extraite du VRAI site (stack, easings, params, ordre).
3. `docs/reference/FINDINGS.md` — analyse détaillée de la référence.
4. `docs/reference/shaders/*.glsl` — les **vrais shaders** du site cible (10 fichiers).
5. `scripts/inspect/README.md` — mes outils Playwright pour **capturer le vrai site ET notre clone et comparer**.
6. Regarde l'historique : `git log --oneline` (commits `a973df5`→ détaillés).

**Setup :** `npm install` déjà fait. `npm run dev -- -p 3001` (l'autre conv est sur 3000). Build prod doit passer.

### CE QUE J'AI OBSERVÉ SUR LE VRAI SITE (vérité-terrain à reproduire)
- **Stack** : vanilla JS + **Three.js + GSAP + Lenis**, **UN SEUL canvas WebGL plein écran** qui rend TOUT,
  en **SPA — jamais de changement de page visible**. Photos = textures sur plans 3D, jamais des `<img>`.
- **Loader = le cylindre vu dans l'axe** (3 arcs colorés = 3 thèmes : Work/Fashion/Journey ; chez nous Mariages/Nature/Lumière).
- **Home** = cylindre de 3 thèmes ; **titres accrochés aux panneaux** (se courbent avec) ; **éclats d'images flottent en 3D** autour.
- **Clic sur un thème** : l'image **se fissure** (grille ~20×40, `hash`+`rotate`, uniform `uProgress`, `power3.inOut`)
  → amène à la page suivante → les **fragments RESTENT et flottent** autour de la page d'arrivée → **disparaissent au scroll**.
  La photo héro fait un **flou→net** (focus pull). **TOUT bouge** (le titre explose aussi). **Aucune couture de page perçue**
  (« on dirait que la page était à l'intérieur du panneau »).
- **Bouton central** = déplie le cylindre en **bande horizontale** (mêmes images à plat). Icône : anneau 3-parties ↔ 3 barres.
- **About** = nom **centré** en serif géant + « (Photographer) », et en bas une **image full-bleed intégrée au background**.
- **Easings réels** : `power3.inOut` (transition), `quint.inOut` (cylindre/anneau), `quint.out` (reflet), `power2.out` (preview).
  **Params réels** : segments **20×40**, velocity max **120** (clamp shader 160), aberration **.018**, reflect strength **.62**,
  thickness 1.8, mouse radius **256–280**. (tout dans `docs/reference/RECETTE-EXACTE.md`)

### PRIORITÉ 1 — l'animation au clic n'est PAS vivante (« vidéo mariage 2011 »)
**Cause racine** : on a un canvas WebGL (home) + une fissure **CSS sur une page galerie SÉPARÉE** → couture
inévitable, le titre de la galerie transparaît pendant l'anim, et **seule l'image bouge**. Aucun réglage CSS ne corrige.
**LA solution = UN canvas WebGL persistant dans `app/layout.tsx`** (jamais démonté entre routes), qui gère
cylindre + **fissure 3D (vrais shaders)** + éclats flottants **en continu**, la route changeant **invisiblement
derrière**. Seule façon d'avoir : page qui explose + titre qui explose + fragments qui flottent + flou→net, sans
couture. Clic voulu : tout petit zoom + dépliage + les autres disparaissent + le titre explose, **tout dans la même page**.

### AUTRES POINTS À RÉGLER
- **Titres accrochés aux panneaux** : « Mariages/Lumière… » doivent suivre/se courber avec le panneau (**texte WebGL**, pas overlay DOM `.hero__label`).
- **Éclats flottants ambiants** sur le home (autour du cylindre), comme la réf.
- **Galerie** : réduire l'espacement entre images, **faire remonter la première**, image un peu plus haute, fond **blanc pur** (#fff).
- **Lenteur entre pages** : surtout artefact **dev** (recompile à la volée) → vérifier/chiffrer en **build prod** (`npm run build && npm start`).
- **Police** : NE PAS y toucher comme à un fichier — ce sont DÉJÀ les vraies PP (voir « État » plus bas). Si « horrible », c'est l'USAGE d'un élément précis → demander lequel.

### MÉTHODE
Plan d'abord (plan mode). Une brique à la fois. Après CHAQUE brique : `npm run build` + **capture Playwright
comparée au vrai site** (`scripts/inspect/`) + **commit**. Pas de placeholder. Prouver, pas affirmer.

---
## FIN DU PROMPT À COLLER
---

## Détail du travail déjà fait cette session (par fichier)

**`src/components/hero/CarouselScene.ts`** (le moteur du cylindre, Three.js pur) :
- Réécrit : un **plan plat courbé dans le vertex shader** via `uCurveState` (0=cylindre, 1=plat), au lieu d'une géométrie pré-courbée.
- Navigation par uniform `uRotation` (pas la rotation du groupe) ; **repli d'angle** `a -= 2π·floor(a/2π+0.5)` → le panneau focus
  reste **centré** à plat (fix du « glissement vers la droite » qui était illogique).
- **Gaps** entre panneaux (`gap = 0.95`, largeur < secteur). **Relief 3D** : `vFacing = cos(theta)` → bords du tambour assombris (coupé à plat).
- Dépliage en bande horizontale via `uFlatScale` (toggle 0.55). Reflet sol. Aberration chromatique douce.
- `playExit(onComplete)` : déplie le panneau focus **même taille** (`uFlatScale`→0.62), `uAlpha`→0 sur les autres, puis navigue.
- `onReady` (intro finie) ; `toggleFlat` (bande), `next/prev`, `onWheel`, `onPointerMove`.

**`src/components/hero/HeroCarousel.tsx`** — câble le clic : `openGallery` → `scene.playExit(()=>router.push(...))`. Titre `.hero__label` visible seulement `ready`.
**`src/components/hero/Dock.tsx`** — bouton dont l'icône SVG bascule anneau-3-parties ↔ 3 barres.
**`src/components/Experience.tsx`** — loader 0→100% (1ʳᵉ visite) + monte le HeroCarousel + titre « Portfolio ».
**`src/components/gallery/ShatterIntro.tsx`** — fissure **CSS** (grille jitter 8×6, transforms 3D translate3d+rotateX/Y, flash). ⚠️ c'est CE composant qu'il faut remplacer par la fissure WebGL (Priorité 1).
**`src/components/gallery/GalleryViewer.tsx`** + `.gv` (globals.css) — viewer **scroll-snap**, 1 image/écran, lightbox. (espacement/1ʳᵉ image à régler ici)
**`app/about/page.tsx`** + `.ab` (globals.css) — REFAIT : nom centré + image full-bleed **intégrée par masque dégradé** (émerge du blanc). À valider.
**`src/data/categories.ts`** — 3 thèmes ; image Lumière = `/opt/IMG_3386.webp`. Photos dans `/public/opt/*.webp`.
**`app/globals.css`** — tout le style. `--bg:#fff`. `.hero__*`, `.dock*`, `.shatter*`, `.gv*`, `.ab*`.
**`app/fonts.ts` + `app/layout.tsx`** — **vraies PP** (Editorial Old + Neue Montreal), fichiers `app/fonts/*.woff2` **identiques octet-pour-octet** au site cible, câblées. NE PAS rechasser.

## Où sont les choses
- **Réf extraite** : `docs/reference/` (recette, findings, 10 shaders réels).
- **Outils capture** : `scripts/inspect/` (+ son README). Playwright installé.
- **Vraies photos client** : `public/opt/*.webp` (+ `public/images/` les JPG d'origine).
- **Historique** : `git log` — commits du clone + de la doc.
