# dungeon-sweeper-editor

Éditeur web des données d'équilibrage de DungeonSweeper, basé sur
[Sveltia CMS](https://github.com/sveltia/sveltia-cms) (licence MIT,
`admin/sveltia-cms.LICENSE.txt`). Ce dépôt public ne contient que l'interface
et sa configuration : **aucune donnée de jeu, aucun secret**. Les données sont
les fichiers JSON du dépôt privé `Haibo14/DungeonSweeper` (format :
`docs/data.md` de ce dépôt).

Pour l'instant : armes (`data/equipment/weapons/*.json`), armures
(`data/equipment/armors/*.json`), monstres (`data/monsters/*.json`), pièges
(`data/traps/*.json`), artéfacts (`data/artifacts/*.json`) et étages
(`data/levels/*.json`, sans création ni suppression : leur ordre est
dans `level_refs` de `data/dungeon_data.tres`).

## Contenu

- `admin/index.html` : charge Sveltia et lui indique sa config (chemins
  relatifs : sur GitHub Pages, le site vit sous `/dungeon-sweeper-editor/`).
- `admin/config.yml` : collections des armes, armures, monstres, étages, pièges et artéfacts ; `backend: github`,
  `repo: Haibo14/DungeonSweeper`, `branch: balance`.
- `admin/sveltia-cms.js` et `admin/chunks/` : Sveltia CMS **0.252.0**, copié
  dans le dépôt plutôt que chargé depuis un CDN (un script externe modifié
  pourrait voler le token GitHub).
- `.nojekyll` : GitHub Pages sert les fichiers tels quels.

## Ce qui vient encore de l'extérieur

Le script principal et ses morceaux de code (`chunks/`) sont servis par ce
dépôt. Sveltia télécharge encore, depuis des CDN :

- la traduction de son interface (`unpkg.com/@sveltia/cms@0.252.0/locales/…`,
  fichier JSON) et une vérification de nouvelle version (`package.json`) ;
- ses polices (`cdn.jsdelivr.net/fontsource/…`) ;
- des bibliothèques propres à certains widgets (carte, code, PDF…), que la
  config actuelle n'utilise pas.

Pour bloquer tout script externe, il faudrait une Content Security Policy
(`<meta http-equiv="Content-Security-Policy">`), à mettre au point et tester
avec une vraie connexion GitHub.

## Mettre à jour Sveltia

Sans Node.js, à la main (ce que fait `npm i @sveltia/cms`) :

1. Lire la version et l'empreinte publiées :
   `https://registry.npmjs.org/@sveltia/cms/<version>` (champs `dist.tarball`
   et `dist.integrity`).
2. Télécharger l'archive `.tgz` et vérifier son empreinte SHA-512 :
   `openssl dgst -sha512 -binary cms-<version>.tgz | openssl base64 -A` doit
   donner la valeur de `dist.integrity` (sans le préfixe `sha512-`).
3. Copier depuis l'archive : `package/dist/sveltia-cms.js` → `admin/`,
   `package/dist/chunks/*.js` → `admin/chunks/`,
   `package/dist/chunks/assets/*.js` → `admin/chunks/assets/` (supprimer les
   anciens), `package/LICENSE.txt` → `admin/sveltia-cms.LICENSE.txt`.
4. Mettre à jour le numéro de version dans ce README et dans `index.html`.

## Publier sur GitHub Pages

Une fois ce dépôt poussé : Settings → Pages → « Deploy from a branch », branche
`main`, dossier `/ (root)`. L'éditeur est alors à
`https://haibo14.github.io/dungeon-sweeper-editor/admin/`.

Connexion : « Sign In with GitHub » demande un serveur d'authentification
OAuth (`backend.base_url`, non configuré). Sans lui, utiliser « Sign In Using
Access Token » avec un jeton GitHub à accès limité au dépôt `DungeonSweeper`
(contenu en lecture et écriture). Le jeton reste dans le navigateur ; ne
jamais l'écrire dans ce dépôt.

## Tester en local

1. Servir ce dépôt avec n'importe quel serveur statique sur `localhost`,
   depuis sa racine, par exemple `python -m http.server 8080` ou l'extension
   « Live Server » de VS Code.
2. Ouvrir `http://localhost:8080/admin/` dans **Chrome, Edge ou Brave**. Le
   mode local utilise l'API File System Access, absente de Firefox et Safari.
   Le navigateur intégré de l'application Claude ne convient pas : il annule
   la fenêtre de choix de dossier.
3. Cliquer sur **« Work with Local Repository »** et choisir la **racine du
   dépôt du jeu** (le dossier qui contient `project.godot`). Sveltia travaille
   sur la branche sortie dans ce dossier.
4. Les modifications sont écrites directement dans les fichiers, sans commit.
   Les relire avec `git diff` dans le dépôt du jeu, puis les commiter
   soi-même sur une branche.

## À observer pendant le test

- Formatage écrit par le CMS : indentation de 2 espaces, fins de ligne LF,
  saut de ligne final, clés dans l'ordre des champs de la config.
- Champs laissés vides : absents du fichier
  (`output.omit_empty_optional_fields`), le jeu prend la valeur par défaut.
- Nom du fichier d'une nouvelle arme : tiré du nom (« Hache de guerre » →
  `hache_de_guerre.json`).
- Effets de l'attaque : ajout, suppression, changement de type.
- Liste des armes : tri, filtres et groupes par type et rareté ; liste des
  armures : par emplacement et rareté.
- Icône : vignette et choix dans la grille des PNG de `assets/icons/weapons/`
  (armes) ou `assets/icons/equipment/` (armures).
