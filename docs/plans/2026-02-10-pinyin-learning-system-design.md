# Pinyin Learning System Design

## Goal
Build a local web app that helps a fluent Zhuyin (注音) typist learn Pinyin input method from scratch, ultimately replacing Zhuyin as their primary input method.

## User Profile
- Zhuyin blind-typing at >60 chars/min
- Knows basic Pinyin concepts but not full mappings
- Target: switch to Pinyin input method for daily typing

## Learning Path (5 Phases)

### Phase 1: Mapping Memorization (聲母 + 韻母)
- Flashcard-style: see 注音 → type Pinyin
- Grouped: initials first (b/p/m/f...), then finals (a/o/e/ai/ei...)
- Pass threshold: >90% accuracy per group before advancing

### Phase 2: Special Rules
- ü handling (lü/nü vs lu/nu)
- Whole-syllable recognition (zhi/chi/shi/ri/zi/ci/si/yi/wu/yu...)
- Tone mark placement rules
- Interactive quizzes targeting confusing pairs

### Phase 3: Single Character Practice
- See Chinese character → type its Pinyin (with tone number)
- Wrong answers enter "weakness list" for spaced repetition
- Cover 2500+ common characters

### Phase 4: Word & Sentence Practice
- Common words and short sentences
- Simulate real Pinyin IME experience

### Phase 5: Speed Training
- Timed typing exercises
- WPM tracking with progress over time
- Goal: approach original Zhuyin speed

## Core Mechanisms

### Spaced Repetition (SRS)
- Simplified SM-2 algorithm
- Per-item mastery score
- Correct → longer interval, wrong → immediate re-queue
- Persistent in SQLite

### Weakness Tracking
- Auto-detect commonly confused pairs (e.g., zh/z, ch/c, sh/s, ü/u)
- Priority review at session start
- Statistics dashboard

### Progress Dashboard
- Phase completion percentage
- Daily practice time, accuracy curves
- Per-initial/final mastery heatmap

### Practice Modes
- **Recognition**: see 注音 → pick Pinyin (multiple choice)
- **Typing**: see 注音/character → type Pinyin
- **Reverse**: see Pinyin → identify the sound/character
- **Speed**: timed typing, track WPM

## Technical Architecture

### Stack
- Backend: Python 3.13 + FastAPI
- Frontend: vanilla HTML/CSS/JS (no framework)
- Database: SQLite (zero-config, local persistence)
- Launch: `python main.py` → auto-open browser

### Project Structure
```
typing/
├── main.py              # Entry point, launch server + open browser
├── app/
│   ├── api.py           # FastAPI routes
│   ├── models.py        # SQLAlchemy models (SQLite)
│   ├── srs.py           # Spaced repetition algorithm
│   └── data/
│       └── mappings.json # Complete 注音↔拼音 mapping data
├── static/
│   ├── index.html       # Main SPA page
│   ├── style.css        # Styles
│   └── app.js           # Frontend logic
└── db/
    └── progress.db      # SQLite DB (auto-created)
```

### Key Data: 注音↔拼音 Mappings
- 21 initials + 37 finals + special combinations
- Each mapping includes: 注音 symbol, Pinyin spelling, pronunciation note, common confusion pairs
- This is the core dataset — must be accurate and complete

## Implementation Order
1. Core data: mappings.json with complete 注音↔拼音 data
2. Backend: FastAPI server + SQLite models + SRS engine
3. Frontend: Phase 1 flashcards + recognition mode
4. Frontend: Phase 2 special rules quizzes
5. Frontend: Phase 3 single character typing practice
6. Backend: progress tracking + dashboard API
7. Frontend: dashboard + stats visualization
8. Frontend: Phase 4 word/sentence practice
9. Frontend: Phase 5 speed training mode
