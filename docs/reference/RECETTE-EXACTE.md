# RECETTE EXACTE — aikawakenichi.com (vérité-terrain extraite du vrai code)

Source : bundle `entry.S2oj3BdN.js` (leur code source, minifié) + Spector-able runtime + vidéos/frames.
But : reproduire **à l'identique l'âme et le détail d'animation**, puis réimplémenter en code propre (Next.js + Three.js).

## Architecture
- Vanilla JS + **Three.js** (bundlé) + **GSAP** + **Lenis**. UN seul `<canvas>` WebGL2 plein écran rend tout.
- Lenis → `uVelocity.value = this.scroll.velocity` et `uScroll` injectés dans les matériaux chaque frame.
- Les photos = **textures sur plans 3D**. Loader = cylindre vu dans l'axe.

## Les shaders RÉELS (fichiers dans ./shaders/)
### Brique « cylindre pliable » — `shaders/shader_01.glsl` (vertex)
```glsl
uniform float uCurveRadius;  // rayon du cylindre
uniform float uCurveState;   // 0 = cylindre courbé, 1 = plat
uniform float uBendDir;      // sens du pli
vec3 bendCylinder(vec3 p, float radius){
  if (radius <= 0.0) return p;
  float theta = p.x / radius;
  float radial = radius + uBendDir * p.z;
  return vec3(sin(theta)*radial, p.y, uBendDir*cos(theta)*radial);
}
void main(){
  vec3 curvedPosition = mix(bendCylinder(position, uCurveRadius), position, uCurveState);
  ... gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(curvedPosition,1.0);
}
```
→ Le **toggle bouton central** = animer `uCurveState` 0↔1 (ease `quint.inOut`, ~1.2 s). Cylindre ⟷ déplié.

### Brique « fissure / éclats » — `shaders/shader_02.glsl`
- L'image est une **grille de segments** (`effects:segments:x` × `effects:segments:y`).
- Attribut `color` par pièce → `vPieceCoord = color.yz`, `vFaceTag = color.w`.
- `hash11(seed)` + `rotateX/rotateY(angle)` → chaque éclat a une rotation/translation pseudo-aléatoire propre.
- Pilotée par un `uProgress` (GSAP, `power3.inOut`) : 0 = image entière → 1 = éclats explosés. Puis `uAlpha`→0 (disparition).
- C'est la **transition de page** : on clique un thème → l'image se fissure → les fragments emmènent à la page → ils restent → disparaissent au scroll.

### Brique « page détail / focus » — `shaders/shader_03.glsl` + `shader_04.glsl` (fragment)
```glsl
uniform float uAlpha, uEffectsAberration, uEffectsBlurFade, uEffectsBlurHorizontal;
```
→ Le **focus pull (flou→net)** = `uEffectsBlurFade`/`uEffectsBlurHorizontal` animés vers 0 à l'arrivée.
→ Aberration chromatique sur les bords (`uEffectsAberration`).

### Brique « warp vélocité » (dans les shaders ci-dessus)
```glsl
// uVelocity = vitesse de scroll (Lenis), clampé
... clamp(uVelocity, 0.0, 160.0) ...
offset += uVelocity * uEffectsStrength * 12.0 * (1.0 - horizontalProgress);
```

## VALEURS EXACTES (params réels)
| Param | Valeur |
|---|---|
| effects:segments:x / :y | **20 × 40** (tiers qualité : 14/20/24 × 28/40/48) |
| effects:velocity:max | **120** (clamp shader 160) · velocity:depth 256 · velocity:blur .75 / max .0135 |
| effects:aberration | **0.018** |
| effects:blur:fade / :horizontal | **0.03 / 0.001** |
| effects:reflect | 0.12–0.16 |
| card:reflect:strength / thickness / scale / saturation | **0.62 / 1.8 / 1.15 / 0.74** · chroma 8.6 |
| effects/details:mouse:radius | **256–280 px** (rayon d'influence hover) |
| fracture:details:radius / camera:blur | 0.52 / 0.1 |
| layout:curve / layout:radius | 0 (état de départ) |

## EASINGS / DURÉES EXACTS (GSAP)
| Effet | Ease | Durée |
|---|---|---|
| Cylindre / anneau (`ringEase`) | **quint.inOut** | ~1.2 s |
| Reflet sol (`reflectEase`) | **quint.out** | — |
| Fissure / transition page | **power3.inOut** | ~1 s |
| Preview détail show/hide | **power2.out** | .45–.75 s |
| Micro (hover header, CSS) | cubic-bezier(.104,.204,.492,1) ; hover cubic-bezier(.306,.968,.632,1) | .35 s |

## ORDRE DE CONSTRUCTION (notre code, fidèle)
1. Socle : 1 canvas Three.js persistant entre routes (Next.js App Router) + Lenis → uVelocity/uScroll.
2. Plan pliable (`bendCylinder` + `uCurveState`) → cylindre + toggle déplié. ✅ vérifier vs réf.
3. Carrousel 3 thèmes sur le cylindre + reflet sol.
4. Système de fissure (grille 20×40 + hash + rotate + uProgress) = transition de page.
5. Warp vélocité (uVelocity) + aberration + focus pull (uEffectsBlur*).
6. Orchestration GSAP (eases/durées ci-dessus) + routeur.
Chaque brique : build + capture inspecteur Playwright + comparaison frame-à-frame avec la réf.
