# dungeon-sweeper-editor

Éditeur web des données d'équilibrage de DungeonSweeper, basé sur
[Sveltia CMS](https://github.com/sveltia/sveltia-cms). Ce dépôt ne contient que
l'interface (`admin/index.html`) et sa configuration (`admin/config.yml`) :
aucune donnée de jeu, aucun secret. Les données sont les fichiers JSON du dépôt
du jeu (format : `docs/data.md` de ce dépôt).

Pour l'instant : armes seulement (`data/equipment/weapons/*.json`), test en local.

## Tester en local

1. Servir ce dépôt avec n'importe quel serveur statique sur `localhost`,
   depuis sa racine, par exemple `python -m http.server 8080` ou l'extension
   « Live Server » de VS Code.
2. Ouvrir `http://localhost:8080/admin/` dans **Chrome, Edge ou Brave**. Le
   mode local utilise l'API File System Access, absente de Firefox et Safari.
   Le navigateur intégré de l'application Claude ne convient pas : il annule
   la fenêtre de choix de dossier.
3. Cliquer sur **« Work with Local Repository »** et choisir la **racine du
   dépôt du jeu** (le dossier qui contient `project.godot`).
4. Les modifications sont écrites directement dans les fichiers, sans commit.
   Les relire avec `git diff` dans le dépôt du jeu, puis les commiter
   soi-même sur une branche.

## À observer pendant le test

- Formatage écrit par le CMS, comparé à celui des fichiers actuels :
  indentation de 2 espaces, pas de tabulation, fins de ligne LF, `}` suivi
  d'un saut de ligne final, clés dans l'ordre des champs de la config.
- Champs laissés vides : ils doivent rester absents du fichier
  (`output.omit_empty_optional_fields`), le jeu prenant alors la valeur par
  défaut.
  À vérifier surtout pour les booléens (un `false` écrit est sans effet, mais
  ajoute du bruit au diff).
- Nom du fichier d'une nouvelle arme : tiré du nom (« Hache de guerre » doit
  donner `hache_de_guerre.json`, en minuscules avec des `_`).
- La liste d'effets de l'attaque : ajout, suppression et changement de type.
- Liste des armes : tri par nom, type ou rareté, filtres « Type : … » et
  « Rareté : … », groupes par type ou par rareté. Le tri par rareté suit
  l'ordre de rareté grâce aux valeurs R0_COMMON … R4_LEGENDARY.

## Avant toute publication

- Épingler la version de Sveltia CMS dans `admin/index.html` (TODO).
- Remplacer `<COMPTE>/dungeon-sweeper` dans `admin/config.yml` (backend
  `github`, branche `balance`) par le vrai dépôt.
