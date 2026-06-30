# Outils d'inspection Playwright (capturer le vrai site & notre clone, comparer)

Playwright est installé. Lancer avec le node_modules du projet :
```
NODE_PATH="<repo>/node_modules" node scripts/inspect/<fichier>.cjs
```
Notre clone tourne sur **localhost:3001** (worktree). Le vrai site = `https://aikawakenichi.com`.
ffmpeg de Playwright (extraire des frames d'une vidéo .webm) :
`<LOCALAPPDATA>/ms-playwright/ffmpeg-1011/ffmpeg-win64.exe` — encodeurs **vp8/png** OK, **PAS** mjpeg,
et **PAS** les filtres scale/fps/tile (extraire des frames : `-r 8` SANS `-vf`, sortie `e_%03d.png`).

- **recon.cjs `<url> <label>`** — détecte libs (gsap/three/lenis), logge tous les assets (JS/shaders/fontes/images), DOM-map, screenshot, vidéo.
- **observe.cjs `<url> <label>`** — attend la fin du loader+intro, screenshots timés, DOM-map de l'état chargé.
- **capture.cjs / capture-work.cjs** — film l'intro / le parcours d'un thème (vidéo).
- **clone-check.cjs** — home + clique le bouton toggle (déplier), screenshots A/B/C + erreurs console.
- **capture-theme.cjs `<n>`** — navigue le cylindre de n crans puis screenshot (voir un thème précis).
- **capture-transition.cjs / video-transition.cjs** — film le clic→galerie (la transition).
- **clone-about.cjs / ref-about.cjs** — capture la page About (clone / vrai site).

Astuce : les screenshots Playwright sont lents sur du WebGL lourd → préférer **recordVideo** (25fps) puis
extraire les frames avec ffmpeg. Headless rame sur WebGL2 ; **headed** (vrai GPU) est plus fiable pour filmer.
