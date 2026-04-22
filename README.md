# Sorting Hat 🎩

A voice-first AI task manager for iOS and Android built with React Native + Expo.

## What it does

1. **Record** — tap the mic and speak your tasks naturally.
2. **Transcribe** — Whisper converts speech to text.
3. **Parse & Score** — GPT-4o extracts category/deadline and scores priority (0–100).
4. **Sort** — tasks surface in order of urgency so you always know what to tackle next.

## Project structure

```
├── App.tsx               # Root entry point
├── index.ts              # Expo entry registration
├── models/
│   └── Task.ts           # Task type, TaskCategory, createTask()
├── screens/
│   └── HomeScreen.tsx    # Main task list UI
├── components/
│   └── TaskCard.tsx      # Individual task card
├── services/
│   ├── taskService.ts    # CRUD + in-memory store
│   └── aiService.ts      # Whisper + GPT-4o stubs
└── assets/               # Icons and splash images
```

## Task model

| Field           | Type                                                        | Notes                         |
|-----------------|-------------------------------------------------------------|-------------------------------|
| `id`            | `string`                                                    | Auto-generated timestamp + random |
| `title`         | `string`                                                    | Raw or parsed task text       |
| `category`      | `work \| personal \| health \| social \| relationship \| legal \| routine` | AI-classified |
| `deadline`      | `Date \| null`                                              | Extracted from speech         |
| `priorityScore` | `number` (0–100)                                            | AI-computed urgency           |
| `isCompleted`   | `boolean`                                                   |                               |
| `createdAt`     | `Date`                                                      |                               |

## Getting started

```bash
npm install
npm start          # opens Expo Dev Tools
npm run android    # Android emulator / device
npm run ios        # iOS simulator (macOS only)
```
