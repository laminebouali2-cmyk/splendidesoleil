# aikawakenichi.com — anatomie des animations (référence Phase 1)

## L'outil
Inspecteur Playwright (dans `../`) — réutilisable sur n'importe quelle URL :
- `recon.cjs <url> <label>`   → détecte libs/canvas, logge tous les assets (JS/shaders/images), DOM-map, screenshot, vidéo.
- `observe.cjs <url> <label>` → attend la fin du loader + intro, screenshots timés, DOM-map de l'état chargé.
- `capture.cjs <url> <label> <cx> <cy>` → headed, attend l'intro, clique en (cx,cy), enregistre la transition en vidéo.
- Extraction frames : `ffmpeg -ss <t> -i page.webm -t <dur> -r 8 -start_number 0 frames/e_%03d.png`
  (ffmpeg Playwright = build mini : encodeurs vp8/png OK, **pas** mjpeg, **pas** les filtres scale/fps/tile).
Lancer avec `NODE_PATH=<projet>/node_modules` car les scripts vivent hors du projet.

## La stack réelle du site cible
- **Vanilla JS** (PAS React) + **Three.js** (bundlé, sans global `THREE`) + **GSAP** + **Lenis** (smooth scroll).
- SPA : la navigation ne recharge pas la page (l'URL/`body` restent identiques), tout est piloté côté WebGL.
- **Un seul `<canvas>` WebGL2 plein écran rend TOUT.** Les photos ne sont pas des `<img>` : ce sont des **textures** sur des plans 3D. Workers (`blob-loader`, `quick`) pour charger les images en blob progressivement → le loader animé.

## Les easings & uniforms signature
- GSAP : `power2.out` (×50), `power3.inOut` (×36), `quint.out` (×31). La transition = `power3.inOut`.
- CSS DOM (header/nav) : `cubic-bezier(.104,.204,.492,1)`.
- Uniforms shader : `uVelocity` (×45 — les images se **déforment selon la vitesse de scroll**), `uProgress`/`uTransition` (progression 0→1 de la transition), `uScroll`, `uAlpha` (fondus).

## CORRECTION intro : le loader EST le cylindre
L'anneau du loader = le **cylindre 3D vu dans l'axe** (de face → un cercle). Les 3 arcs colorés = les 3
photos de thème enroulées (doré=Fashion, bleu=Journey, rose=Work). Séquence de reveal vérifiée :
1. Anneau (cylindre axis-on) + « Kenichi Aikawa » + compteur %.
2. L'anneau bascule → le **cylindre se présente de face** (bande photo courbée + reflet sol), titre « Portfolio ».
3. Le cylindre **se déplie en couverture plate** plein cadre ; titre → nom du thème ; nav « X ←→ » → pilule « Category X ».
4. Des dizaines d'**éclats de photos (fragments anguleux) volent en orbite 3D** autour de la couverture (couleur = thème).
Preuves : ref-home/home-0 (cylindre +6s) → home-2 (couverture plate, sans éclats, +8s) → home-5 (couverture + éclats +11s).

## Layout galerie : 2 modes
L'icône à droite de la pilule bascule entre couverture (`details-vertical`) et **bande horizontale**
(`details-horizontal__slider`, ~2835px de large) = toutes les photos en fines colonnes verticales. Preuve : ref-work2/01-switch-2.

## Le home : 3 thèmes
- Composant `g-canvas-slider` avec 3 slides : **Work / Fashion / Journey** (= préfixes images `w_` / `f_` / `j_`).
- 1 seul centré (`--is-focus`), titre serif géant, couverture-photo, **éclats d'images flottants en 3D** sur les bords.
- Float-nav bas : flèche ←, pilule « Category / <THÈME> » (cliquable), flèche →, bouton retour.
- On cycle les thèmes avec ← → ; on **entre** dans un thème en cliquant la couverture centrale (box ≈ centre 712,728).

## LA transition au clic sur un thème (le cœur)
1. Clic sur la couverture plate du thème focus.
2. La photo plate **se plie en une bande cylindrique 3D** (carrousel courbé de photos) **avec reflet au sol**.
3. Le titre swap vers **« Portfolio »** ; la float-nav passe en mode catégorie (vignette + ← → + retour).
4. Piloté GSAP `power3.inOut`, ~0,8–1,2 s. Durant tout le site, `uVelocity` déforme les plans selon le scroll.
Voir `03-REF-after-click-3Dcylinder.jpg` et `04-REF-full-video.webm`.

## Parcours détaillé « cliquer sur Work » (capture-work.cjs)
Le focus de départ varie à chaque chargement (souvent Journey). On cycle avec les flèches
`.g-float-nav__hit.--left/--right` (≈734/775, 835). Entrer dans un thème **change de route** :
`body` passe à `details --work`, URL `/work` (ce n'est donc pas qu'un overlay).
Séquence observée (voir `07`, `08`, vidéos `09`) :
1. **Home** : un thème focus, titre serif (« Work »), couverture, éclats 3D flottants.
2. **Switch** via ← → : titre morph (Journey→Fashion→Work), shards se réorganisent, couverture swap.
3. **Clic couverture** → la photo plate **se courbe en cylindre 3D** (titre « Portfolio », reflet sol).
4. **Entrée `/work`** : le cylindre se déplie, la **photo héro entre en flou puis se nettoie (focus pull blur→net)**,
   grand titre serif « Work », pilule catégorie terracotta active, **éclats 3D de la série qui flottent** (≈20+ plans).
   Eases : ouverture en `power3.inOut`/`quint.out`, ~1 s.
Note technique de capture : le sélecteur `.--is-focus` (DOM) ne reflète pas toujours le focus WebGL réel
→ se fier à l'état final (`body`/`url`) plus qu'au readback intermédiaire.

## L'écart avec le clone local (localhost:3000)
Le clone a DÉJÀ la bonne architecture (canvas WebGL2 `hero__canvas--clickable`, slider 3 thèmes « MARIAGES… », float-nav, transition cylindre, loader en arcs). Mais l'EXÉCUTION est brute :
- cylindre sur-dimensionné / mal proportionné (centre vide géant),
- couleurs criardes (orange/bleu saturés) au lieu des tons photographiques doux et chauds,
- polices différentes (clone : Editorial Old + Neue Montreal).
→ Même squelette, rendu non fini. Le travail n'est pas « tout refaire » mais **régler géométrie + matériaux + courbes** du WebGL existant.
Voir `06-CLONE-current-state.jpg`.
