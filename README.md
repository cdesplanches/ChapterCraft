# ChapterCraft

Outil d'aide à la rédaction de livres. Définissez votre pitch, travaillez chapitre par chapitre, et laissez l'IA vérifier la cohérence narrative de l'ensemble.

## Fonctionnalités

- **Gestion de projets** — pitch, synopsis, genre, public cible
- **Édition par chapitre** — plan, contenu, notes, statut (plan → brouillon → révision → terminé)
- **Assistance IA par chapitre** — génération de plan, rédaction, révision, suggestions
- **Analyse de cohérence** — vérifie l'alignement avec le pitch et la continuité entre chapitres
- **Providers IA pluggables** :
  - **Ollama** (modèles locaux, ex. llama3.2, mistral…)
  - **OpenAI** (GPT-4o, etc.)
  - **Anthropic** (Claude)

## Démarrage rapide

```bash
# Installer les dépendances
npm install

# Lancer en développement
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

## Configuration IA

### Ollama (recommandé en local)

1. Installer [Ollama](https://ollama.com)
2. Télécharger un modèle : `ollama pull llama3.2`
3. Dans ChapterCraft → onglet **IA** → sélectionner Ollama → tester la connexion

### OpenAI

Dans l'onglet **IA**, choisir OpenAI et renseigner votre clé API (`sk-...`).

### Anthropic (Claude)

Dans l'onglet **IA**, choisir Anthropic et renseigner votre clé API (`sk-ant-...`).

> Les clés API sont stockées localement dans le fichier du projet (`data/projects/`). Elles ne quittent jamais votre machine sauf pour les appels API directs au fournisseur choisi.

## Stockage des données

Les projets sont sauvegardés en JSON dans `data/projects/`. Ce dossier est ignoré par git — vos manuscrits restent locaux.

## Stack technique

- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS 4**
- Stockage fichier JSON (pas de base de données requise)

## Scripts

| Commande        | Description              |
|-----------------|--------------------------|
| `npm run dev`   | Serveur de développement |
| `npm run build` | Build de production      |
| `npm run start` | Serveur de production    |
| `npm run lint`  | Vérification ESLint      |

## Licence

MIT
