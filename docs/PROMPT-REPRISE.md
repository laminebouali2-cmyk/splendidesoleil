# Prompt de reprise (à coller dans la nouvelle session)

> Colle tout le bloc ci-dessous. Démarre la session Claude Code dans le worktree
> `.claude/worktrees/iter` (ou laisse l'agent y aller), branche `iter`.

---

Tu reprends un projet : **clone fidèle (Phase 1) du site `https://aikawakenichi.com`** pour une
photographe (« Splendide Soleil »). Tout mon travail précédent est commité sur la branche **`iter`**
dans le worktree `.claude/worktrees/iter` — **travaille là** (l'autre version est sur `main`, ne pas
la toucher). **AVANT TOUT, lis** : `docs/HANDOFF.md`, `docs/reference/RECETTE-EXACTE.md`,
`docs/reference/FINDINGS.md` et `docs/reference/shaders/*.glsl` (vrais shaders extraits du site cible).

Setup : `npm install` déjà fait dans le worktree. Lancer `npm run dev -- -p 3001` (l'autre conv est sur 3000).
Playwright est installé → sers-t'en pour **capturer (vidéo + frames) le vrai site ET notre clone, et comparer**.
Le client n'a **que du local** → **commit régulièrement**. Le **build de prod doit passer** avant de dire « fini ».

## CE QUE J'AI OBSERVÉ SUR LE VRAI SITE (à reproduire)
- **Architecture** : vanilla JS + **Three.js + GSAP + Lenis**, **UN SEUL canvas WebGL plein écran** qui rend TOUT,
  en **SPA — jamais de changement de page visible**. Les photos = textures sur plans 3D, jamais des `<img>`.
- **Loader = le cylindre vu dans l'axe** (3 arcs colorés = 3 thèmes).
- **Home** = cylindre de 3 thèmes ; les **titres sont accrochés aux panneaux** (se courbent avec) ;
  des **éclats d'images flottent en 3D** autour.
- **Clic sur un thème** : l'image **se fissure en fragments** (grille ~20×40, `hash`+`rotate`, uniform `uProgress`,
  ease `power3.inOut`), **amène à la page suivante**, les **fragments RESTENT et flottent** autour de la page
  d'arrivée puis **disparaissent au scroll**. La **photo héro fait un flou→net** (focus pull). **TOUT bouge** —
  pas seulement l'image : le titre explose aussi, la page entière vit. **Aucune couture de page perçue** :
  « on dirait que la page était à l'intérieur du panneau ».
- **Easings réels** : `power3.inOut` (transition), `quint.inOut` (cylindre/anneau), `quint.out` (reflet),
  `power2.out` (preview). **Params réels** : segments **20×40**, velocity max **120**, aberration **.018**,
  reflect strength **.62**, mouse radius **256–280**. (tout est dans `docs/reference/RECETTE-EXACTE.md`)
- **About** : nom **centré** en serif géant + « (Photographer) », et en bas une **image full-bleed intégrée
  dans le background** (elle fait partie de la page, pas un rectangle posé).

## ÉTAT ACTUEL DU CLONE (worktree `iter`)
- Cylindre WebGL `src/components/hero/CarouselScene.ts` : plan plat courbé en vertex shader (`uCurveState`),
  navigation `uRotation`, **panneau focus recentré à plat** (fix du glissement), **gaps** entre panneaux, **relief 3D**.
- Transition clic (`playExit`) : dépliage **même taille** + autres panneaux `uAlpha`→0 + navigation. Titre `onReady`.
- Fissure **CSS** `src/components/gallery/ShatterIntro.tsx` sur la page galerie (grille 8×6, transforms 3D).
- About refait (centré + image intégrée par masque dégradé). Galerie = viewer scroll-snap. **Build prod vert**.

## PRIORITÉ 1 — l'animation au clic n'est PAS vivante (« vidéo mariage 2011 »)
**Cause racine** : on a un canvas WebGL (home) + une fissure **CSS sur une page galerie SÉPARÉE** →
couture inévitable, le titre de la galerie transparaît pendant l'anim, et **seule l'image bouge** (pas le titre,
pas le reste). Aucun réglage CSS ne corrigera ça.
**LA solution = UN canvas WebGL persistant dans le `app/layout.tsx`** (ne se démonte jamais entre routes),
qui gère cylindre + **fissure 3D (vrais shaders)** + éclats flottants **en continu**, la route changeant
**invisiblement derrière**. C'est la seule façon d'avoir : page qui explose + titre qui explose + fragments
qui flottent + flou→net, **sans couture**. Comportement clic voulu : tout petit zoom + dépliage + les autres
disparaissent + le titre explose, **tout dans la même page**.

## AUTRES POINTS À RÉGLER
- **Vraies polices** : l'actuelle (Editorial Old + Neue Montreal) est jugée « horrible » → **identifier les
  vraies fontes** chargées par aikawakenichi.com (3 fichiers de fontes vus au réseau) et les intégrer/matcher.
- **Titres accrochés aux panneaux** : « Mariages/Lumière… » doivent suivre/se courber avec le panneau
  (**texte rendu en WebGL**, pas un overlay DOM fixe `.hero__label`).
- **Éclats flottants ambiants** sur le home (autour du cylindre), comme la réf.
- **Galerie** : réduire l'espacement entre images, **faire remonter la première**, image un peu plus haute,
  fond **blanc pur** (#fff) partout.
- **Chargement entre pages lent** : surtout artefact du serveur **dev** (recompile à la volée) → vérifier/chiffrer
  en **build de prod** (`npm run build && npm start`), où les pages sont statiques.

## MÉTHODE
Plan d'abord. Une brique à la fois. Après chaque brique : `npm run build` + **capture Playwright comparée
au vrai site** + commit. Pas de placeholder. Prouver, pas affirmer.

---
