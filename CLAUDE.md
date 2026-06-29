@AGENTS.md

# CLAUDE.md — Portfolio « Splendide Soleil »

> Ce fichier est lu automatiquement au début de chaque session Claude Code.
> Il est la source de vérité du projet. Tu (l'agent) ne dévies jamais de ce qui est écrit ici.

---

## 1. Contexte du projet

Site portfolio pour **Splendide Soleil**, photographe de mariage.
Univers : **golden hour, lumière chaude maghrébine/algérienne, intimité, mariages pudiques, mood poétique et solaire.**
Objectif du site : montrer son travail au plus haut niveau et générer des demandes de contact. Public : futurs mariés, sensibilité esthétique élevée.

**Stack :** Next.js (App Router) + Tailwind CSS + TypeScript. Déploiement Vercel.
**Langue du site :** français.

---

## 2. Règles non négociables (la discipline avant le style)

1. **Vrai contenu only.** Jamais de placeholder (pas de picsum, pas de lorem, pas de dicebear). On construit autour des vraies photos, rangées dans `/public/images/{mariages,couples,portraits}/`. Si une image manque, tu t'arrêtes et tu le signales — tu n'inventes pas un substitut.
2. **Vérification obligatoire.** Tu ne déclares JAMAIS une section « finie » sans avoir : (a) lancé `npm run build` et confirmé qu'il passe sans erreur, ET (b) lancé `npm run dev`, ouvert la page en **1440px** et en **375px**, pris un screenshot de chaque, et comparé à la direction artistique ci-dessous. Tu me montres les screenshots. « Ça a l'air bon » ne vaut rien sans la preuve.
3. **Minimalisme strict.** Aucune librairie, dépendance ou fonctionnalité ajoutée sans qu'elle résolve un besoin réel et présent. Avant tout `npm install`, tu justifies pourquoi le besoin existe maintenant. Pas d'accumulation.
4. **Plan avant code.** Tu démarres chaque chantier en plan mode : tu proposes un plan, j'approuve, ensuite tu exécutes. Une section à la fois. Un commit par section terminée et vérifiée.
5. **Pas de slop.** Voir §3. La chaleur vient des PHOTOS, pas d'une UI crème générique. On ne reproduit pas la grille carrée d'Instagram : ce site est éditorial, pas un feed.

---

## 3. Direction artistique

### Concept signature
**« La lumière d'un jour. »** Le site se traverse comme un golden hour. L'élément signature unique est le **traitement de la lumière chaude** (glow / halo solaire doux, dégradés qui évoquent la lumière rasante du soir) posé à UN endroit mémorable — le hero — et tenu en retenue partout ailleurs. Les photos chaudes et solaires de la photographe sont la véritable source de couleur de la page ; l'interface reste sobre pour les laisser rayonner.

> Garde-fou anti-slop : ne pas tomber dans le fond crème plat + serif générique + accent terracotta posé partout. La hardiesse se dépense uniquement sur la lumière signature. Le reste est discipliné et silencieux.

### Palette (4–6 valeurs nommées)
- `--ivoire` **#F8F0E3** — canvas, chaud, légèrement ensoleillé (volontairement plus chaud que le crème cliché)
- `--espresso` **#2A1B12** — texte, fonds sombres dramatiques
- `--nuit-chaude` **#1A120C** — sections plein cadre sombres (silhouettes au coucher de soleil)
- `--or` **#E0A951** — lumière / accent signature (le glow, les détails dorés). Usage rare.
- `--terre` **#C0532B** — terracotta, accent secondaire. Usage TRÈS parcimonieux (un lien, un état actif). Jamais en aplat large.
- `--sauge` **#8A8B6E** — contrepoint froid discret (tiré des verts du feuillage de son feed) pour casser le tout-chaud. Usage rare, en respiration.

Règle d'usage : fond ivoire, texte espresso, lumière dorée pour la signature, terracotta en touche, sauge en respiration rare. Les moments sombres (nuit-chaude) servent à faire ressortir une image plein cadre.

### Typographie
- **Display :** `Fraunces` (Google Fonts, variable) — serif chaud, à fort contraste mais avec un axe optique « soft » qui lui donne du caractère sans tomber dans la Didone froide. Utilisée avec retenue, en grand, sur les titres.
  - *Alternative plus romantique si tu préfères :* `Cormorant Garamond`. Choisis-en UNE et tiens-t'y. Pas les deux.
- **Corps :** un sans humaniste discret et chaud (`Figtree` ou `Mulish`). Lisible, jamais « tech ».
- **Légendes :** le sans du corps en petites capitales, interlettrage léger, pour les noms de séries / catégories.

Échelle typo (rem) : 4.5 / 3 / 2 / 1.5 / 1.125 / 1 / 0.875. Titres en Fraunces, tout le reste en sans. Beaucoup d'air autour des titres : le type EST le design.

### Mise en page
Grille **éditoriale asymétrique**, marges généreuses, énormément de blanc. Alternance de moments plein cadre (une image qui respire) et de moments calmes (texte sobre, beaucoup de vide). Surtout PAS une grille de tuiles uniforme. Le rythme se construit image par image, selon l'orientation (portrait/paysage) des vraies photos.

### Mouvement
Lent, doux, golden hour. Reveals au scroll (fade + légère montée). Glow / parallaxe douce sur le hero (la signature). Hover sur une image : léger scale + voile chaud. **Jamais** de bounce, de rebond, d'easing « tech ». `prefers-reduced-motion` respecté. Si une animation fait « généré », on la coupe : less is more.

### Copy
Français, poétique, sobre, intime, chaleureux. Phrases courtes. Sentence case. Les mots aident à naviguer, ils ne décorent pas.

---

## 4. Structure du site (MVP — on ne fait QUE ça d'abord)

1. **Hero** — une image signature plein cadre, « Splendide Soleil », une ligne poétique courte, le glow doré signature.
2. **Galeries** — par catégorie (Mariages / Couples / Portraits), layout éditorial asymétrique, images pleine résolution.
3. **À propos** — la photographe, sa philosophie, un portrait chaud.
4. **Un moment de respiration** — une seule phrase sur la lumière / l'amour, sur une image sombre plein cadre.
5. **Contact / Réserver** — simple, chaleureux, un seul appel à l'action clair.

On ne construit pas au-delà tant que ces 5 blocs ne sont pas finis ET vérifiés.

---

## 5. Workflow

- Plan mode → j'approuve → exécution, section par section, dans l'ordre du §4.
- `npm run build` + screenshots 1440/375 + comparaison à la direction — AVANT de dire « fini ».
- Commit par section vérifiée. Push. Vercel déploie tout seul = check visuel final.
- Worktree « labo » (`../splendide-soleil-lab`) uniquement pour tester une approche d'animation risquée sans polluer le repo principal. Sinon, on reste sur la session principale.

---

## 6. Phase actuelle (note de chantier — 2026-06-29)

> Cette section décrit OÙ on en est. La direction artistique ci-dessus (§3) est la cible **finale** du site, pas l'instruction de la phase en cours.

**Phase 1 — Clone exact de référence.** On reproduit à l'identique le site `aikawakenichi.com` (layout, mouvements, animations) comme maquette de démonstration à montrer à la cliente. Pendant cette phase, c'est le skill `/clone-website` qui fait foi (« match 1:1 d'abord, on personnalise après ») : on utilise les assets extraits du site cible, pas encore les photos de la cliente. Les §1–§5 ci-dessus ne s'appliquent PAS encore.

**Phase 2 — Personnalisation.** Une fois le clone validé, on bascule vers la direction artistique des §1–§5 : nom, univers, vraies photos de la cliente, palette golden hour, etc.
