# HANDOFF — clone aikawakenichi.com (branche `iter`)

> Tout le travail est commité (rien n'est perdu, même en local). Ce doc = état + ce qui reste + le plan.
> Réf extraite du VRAI site dans `docs/reference/` : `RECETTE-EXACTE.md`, `FINDINGS.md`, `shaders/*.glsl` (vrais shaders).

## Lancer le worktree
```
cd .claude/worktrees/iter
npm install            # node_modules pas partagé (Turbopack refuse les junctions)
npm run dev -- -p 3001 # port dédié pour ne pas gêner main (autre conversation)
```

## Fait
- Cylindre WebGL `CarouselScene.ts` : un plan plat courbé en vertex shader (`uCurveState`), navigation `uRotation`, reflet, **gaps entre panneaux** (`gap=0.95`).
- Toggle « déplier » = bande horizontale (`uFlatScale`). Icône dock : anneau 3-parties ↔ 3 barres.
- Transition clic (`playExit`) : panneau se déplie **même taille** + autres `uAlpha`→0, puis navigation. Titre `onReady` (caché pendant l'intro).
- Galerie : fissure CSS `ShatterIntro.tsx` (grille 8×6, transforms 3D, flash). Flèches dock visibles.
- Image Lumière = `/opt/IMG_3386.webp`. Build prod **vert**.

## CE QUI RESTE (demandes client, par impact)

### 1. 🔑 L'animation au clic est « nulle / vidéo mariage 2011 » → la rendre VIVANTE
Le client : « il faut que la page explose, le titre aussi », « pas que l'image qui se fissure, tout le reste doit bouger », « la page semble être DANS le panneau », « on voit déjà le titre 'Mariages' de l'autre page pendant l'anim ».
**Cause racine** : on a un canvas WebGL (accueil) + une fissure CSS sur une PAGE galerie séparée → couture inévitable + le titre galerie transparaît.
**Le vrai moyen (comme la réf)** = **UN canvas WebGL persistant dans le layout racine** (ne se démonte jamais entre routes). Il gère cylindre + fissure 3D (grille 20×40 + `uProgress`, vrais shaders dans `docs/reference/shaders/`) + éclats flottants, **en continu**, la route changeant *invisiblement derrière*. C'est LA condition d'une transition sans couture.
- Sur `/work` la réf : les **fragments RESTENT et flottent** doucement autour de la page (déco ambiante vivante), et la **photo héro fait flou→net**. Reproduire ça.
- Pendant l'explosion : cacher le titre de la page galerie tant que la fissure n'est pas finie.

### 2. Police « toujours horrible » → vraies polices de la réf
Actuel : `EditorialOld` + `NeueMontreal` (woff2 locaux, `app/fonts.ts`). À FAIRE : extraire les **vrais noms/fichiers de fontes** chargés par aikawakenichi.com (3 fichiers de fontes vus au recon) et les intégrer / matcher exactement.

### 3. Relief 3D du cylindre ressenti au scroll (étape C partie 2)
Les gaps y sont, manque la **profondeur** : ombrage selon l'angle au caméra (panneaux de côté plus sombres), légère épaisseur, parallaxe douce à la navigation.

### 4. Titres accrochés aux panneaux (pas un texte fixe DOM)
Les titres « Mariages/Lumière… » doivent **suivre/se courber avec le panneau** (texte rendu en WebGL / texture), pas un overlay `.hero__label` fixe.

### 5. Page About — `https://aikawakenichi.com/about`
« en bas l'image est complètement DANS le background, pas posée, elle fait partie de la page » → image **full-bleed intégrée** (pas une vignette). `app/about/` est commencé.

### 6. Détails rapides
- Fond **blanc pur** (#fff) partout comme la réf (vérifier qu'il ne reste pas d'ivoire `#f8f0e3`).
- Image de la page galerie **un peu plus haute**.

## Reco
La session précédente était très longue → repartir **net dans ce worktree** pour le gros morceau (canvas persistant + vraies polices + about). Tout le savoir est ici (`docs/reference/`).
