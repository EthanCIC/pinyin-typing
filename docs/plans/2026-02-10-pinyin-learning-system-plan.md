# Pinyin Learning System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a local web app that teaches a fluent Zhuyin typist to switch to Pinyin input method, using spaced repetition and progressive difficulty phases.

**Architecture:** Python FastAPI backend serving a vanilla HTML/CSS/JS SPA. SQLite for progress persistence. Core data is a comprehensive 注音↔拼音 mapping JSON. SRS engine manages review scheduling. Single-process: `python main.py` starts server and opens browser.

**Tech Stack:** Python 3.13, FastAPI, SQLite (via sqlite3 stdlib), pypinyin (already installed), uv (package manager), vanilla HTML/CSS/JS frontend.

---

### Task 1: Project Setup & Dependencies

**Files:**
- Create: `pyproject.toml`
- Create: `main.py` (stub)
- Create: `app/__init__.py`

**Step 1: Create pyproject.toml**

```toml
[project]
name = "pinyin-typing"
version = "0.1.0"
description = "Pinyin learning system for Zhuyin typists"
requires-python = ">=3.13"
dependencies = [
    "fastapi>=0.115.0",
    "uvicorn>=0.34.0",
    "pypinyin>=0.55.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0.0",
    "httpx>=0.28.0",
]
```

**Step 2: Install dependencies**

Run: `cd /Users/ethancic/typing && uv pip install -e ".[dev]"`
Expected: Successfully installed fastapi, uvicorn, pytest, httpx

**Step 3: Create stub main.py**

```python
import webbrowser
import uvicorn


def main():
    webbrowser.open("http://localhost:8000")
    uvicorn.run("app.api:app", host="127.0.0.1", port=8000, reload=True)


if __name__ == "__main__":
    main()
```

**Step 4: Create app/__init__.py**

Empty file.

**Step 5: Commit**

```bash
git add pyproject.toml main.py app/__init__.py .python-version .gitignore
git commit -m "feat: project setup with FastAPI + dependencies"
```

---

### Task 2: Core Data — 注音↔拼音 Mapping JSON

**Files:**
- Create: `app/data/mappings.json`
- Create: `tests/test_mappings.py`

**Step 1: Write the test**

```python
import json
from pathlib import Path


def load_mappings():
    path = Path(__file__).parent.parent / "app" / "data" / "mappings.json"
    with open(path) as f:
        return json.load(f)


def test_mappings_has_initials():
    data = load_mappings()
    initials = data["initials"]
    # 21 initials in standard Pinyin
    assert len(initials) == 21
    # Each must have zhuyin, pinyin, and group
    for item in initials:
        assert "zhuyin" in item
        assert "pinyin" in item
        assert "group" in item


def test_mappings_has_finals():
    data = load_mappings()
    finals = data["finals"]
    # At least 35 finals
    assert len(finals) >= 35
    for item in finals:
        assert "zhuyin" in item
        assert "pinyin" in item
        assert "group" in item


def test_mappings_has_special_syllables():
    data = load_mappings()
    specials = data["special_syllables"]
    # zhi/chi/shi/ri/zi/ci/si/yi/wu/yu etc
    assert len(specials) >= 16


def test_mappings_has_confusion_pairs():
    data = load_mappings()
    pairs = data["confusion_pairs"]
    assert len(pairs) >= 5
    for pair in pairs:
        assert "pair" in pair
        assert "hint" in pair


def test_all_zhuyin_initials_present():
    data = load_mappings()
    initials = {item["zhuyin"] for item in data["initials"]}
    expected = set("ㄅㄆㄇㄈㄉㄊㄋㄌㄍㄎㄏㄐㄑㄒㄓㄔㄕㄖㄗㄘㄙ")
    assert initials == expected
```

**Step 2: Run test to verify it fails**

Run: `cd /Users/ethancic/typing && python -m pytest tests/test_mappings.py -v`
Expected: FAIL — file not found

**Step 3: Create app/data/mappings.json**

This is the most critical file. Must be 100% accurate. Contains:
- `initials`: 21 items — ㄅ→b, ㄆ→p, ㄇ→m, ㄈ→f, ㄉ→d, ㄊ→t, ㄋ→n, ㄌ→l, ㄍ→g, ㄎ→k, ㄏ→h, ㄐ→j, ㄑ→q, ㄒ→x, ㄓ→zh, ㄔ→ch, ㄕ→sh, ㄖ→r, ㄗ→z, ㄘ→c, ㄙ→s
- `finals`: 37+ items — all vowels/compound finals with their zhuyin equivalents
- `special_syllables`: whole-syllable items (zhi, chi, shi, ri, zi, ci, si, yi, wu, yu, ye, yue, yuan, yin, yun, ying)
- `confusion_pairs`: commonly mixed-up pairs with hints
- `tone_rules`: rules for tone mark placement

Full JSON structure:
```json
{
  "initials": [
    {"zhuyin": "ㄅ", "pinyin": "b", "group": "labial", "hint": "like English 'b'"},
    ...
  ],
  "finals": [
    {"zhuyin": "ㄚ", "pinyin": "a", "group": "simple", "hint": "like 'ah'"},
    ...
  ],
  "special_syllables": [
    {"zhuyin": "ㄓ", "pinyin": "zhi", "note": "standalone, no final needed"},
    ...
  ],
  "confusion_pairs": [
    {"pair": ["zh (ㄓ)", "z (ㄗ)"], "hint": "zh is retroflex (tongue curled), z is flat"},
    ...
  ],
  "tone_rules": {
    "marks": ["ā/á/ǎ/à", "ō/ó/ǒ/ò", ...],
    "placement": "Tone mark goes on the main vowel: a > e > o > i/u (last one wins if iu/ui)"
  }
}
```

**Implementation note:** Build the complete, accurate JSON with all 21 initials, all finals (ㄚㄛㄜㄝㄞㄟㄠㄡㄢㄣㄤㄥㄦ + compound finals ㄧㄨㄩ and their combinations), 16+ special syllables, 10+ confusion pairs, and tone rules.

**Step 4: Run test to verify it passes**

Run: `cd /Users/ethancic/typing && python -m pytest tests/test_mappings.py -v`
Expected: All 5 tests PASS

**Step 5: Commit**

```bash
git add app/data/mappings.json tests/test_mappings.py
git commit -m "feat: complete zhuyin-pinyin mapping data with tests"
```

---

### Task 3: SRS (Spaced Repetition) Engine

**Files:**
- Create: `app/srs.py`
- Create: `tests/test_srs.py`

**Step 1: Write the failing tests**

```python
from app.srs import SRSEngine, SRSItem
import time


def test_new_item_has_zero_interval():
    item = SRSItem(item_id="b", item_type="initial")
    assert item.interval == 0
    assert item.ease_factor == 2.5
    assert item.repetitions == 0


def test_correct_answer_increases_interval():
    engine = SRSEngine()
    item = SRSItem(item_id="b", item_type="initial")
    updated = engine.review(item, correct=True, quality=5)
    assert updated.interval > 0
    assert updated.repetitions == 1


def test_wrong_answer_resets():
    engine = SRSEngine()
    item = SRSItem(item_id="b", item_type="initial", interval=10, repetitions=3)
    updated = engine.review(item, correct=False, quality=1)
    assert updated.interval == 0
    assert updated.repetitions == 0


def test_due_items_sorted_by_next_review():
    engine = SRSEngine()
    items = [
        SRSItem(item_id="a", item_type="initial", next_review=time.time() - 100),
        SRSItem(item_id="b", item_type="initial", next_review=time.time() + 1000),
        SRSItem(item_id="c", item_type="initial", next_review=time.time() - 50),
    ]
    due = engine.get_due_items(items)
    assert len(due) == 2
    assert due[0].item_id == "a"
    assert due[1].item_id == "c"
```

**Step 2: Run test to verify it fails**

Run: `python -m pytest tests/test_srs.py -v`
Expected: FAIL — cannot import

**Step 3: Implement SRS engine**

```python
"""Simplified SM-2 spaced repetition algorithm."""
import time
from dataclasses import dataclass, field


@dataclass
class SRSItem:
    item_id: str
    item_type: str  # "initial", "final", "special", "character"
    interval: float = 0  # days
    ease_factor: float = 2.5
    repetitions: int = 0
    next_review: float = field(default_factory=time.time)
    correct_count: int = 0
    wrong_count: int = 0


class SRSEngine:
    def review(self, item: SRSItem, correct: bool, quality: int) -> SRSItem:
        """
        Update item after review.
        quality: 0-5 (0=complete fail, 5=perfect recall)
        """
        if correct and quality >= 3:
            if item.repetitions == 0:
                item.interval = 1
            elif item.repetitions == 1:
                item.interval = 6
            else:
                item.interval = item.interval * item.ease_factor

            item.repetitions += 1
            item.correct_count += 1
            item.ease_factor = max(1.3, item.ease_factor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
        else:
            item.interval = 0
            item.repetitions = 0
            item.wrong_count += 1

        item.next_review = time.time() + item.interval * 86400
        return item

    def get_due_items(self, items: list[SRSItem]) -> list[SRSItem]:
        """Return items due for review, sorted by most overdue first."""
        now = time.time()
        due = [item for item in items if item.next_review <= now]
        due.sort(key=lambda x: x.next_review)
        return due
```

**Step 4: Run test to verify it passes**

Run: `python -m pytest tests/test_srs.py -v`
Expected: All 4 tests PASS

**Step 5: Commit**

```bash
git add app/srs.py tests/test_srs.py
git commit -m "feat: SRS spaced repetition engine with SM-2 algorithm"
```

---

### Task 4: Database Models & Persistence

**Files:**
- Create: `app/db.py`
- Create: `tests/test_db.py`

**Step 1: Write the failing tests**

```python
import os
import tempfile
from app.db import Database


def make_temp_db():
    fd, path = tempfile.mkstemp(suffix=".db")
    os.close(fd)
    return path


def test_create_tables():
    path = make_temp_db()
    try:
        db = Database(path)
        db.init()
        # Should not raise
        db.close()
    finally:
        os.unlink(path)


def test_save_and_load_progress():
    path = make_temp_db()
    try:
        db = Database(path)
        db.init()
        db.save_progress("b", "initial", interval=1.0, ease_factor=2.5,
                         repetitions=1, next_review=1000.0,
                         correct_count=1, wrong_count=0)
        item = db.load_progress("b", "initial")
        assert item is not None
        assert item["interval"] == 1.0
        assert item["repetitions"] == 1
        db.close()
    finally:
        os.unlink(path)


def test_load_all_progress():
    path = make_temp_db()
    try:
        db = Database(path)
        db.init()
        db.save_progress("b", "initial", 1.0, 2.5, 1, 1000.0, 1, 0)
        db.save_progress("p", "initial", 0.0, 2.5, 0, 500.0, 0, 1)
        items = db.load_all_progress()
        assert len(items) == 2
        db.close()
    finally:
        os.unlink(path)


def test_save_session_record():
    path = make_temp_db()
    try:
        db = Database(path)
        db.init()
        db.save_session(phase=1, mode="typing", duration=120,
                        total=20, correct=15)
        sessions = db.get_sessions()
        assert len(sessions) == 1
        assert sessions[0]["correct"] == 15
        db.close()
    finally:
        os.unlink(path)
```

**Step 2: Run test to verify it fails**

Run: `python -m pytest tests/test_db.py -v`
Expected: FAIL — cannot import

**Step 3: Implement database layer**

Use Python's built-in `sqlite3` module (no ORM needed for this simple schema).

```python
"""SQLite database for progress persistence."""
import sqlite3
import time


class Database:
    def __init__(self, path: str = "db/progress.db"):
        self.path = path
        self.conn = sqlite3.connect(path)
        self.conn.row_factory = sqlite3.Row

    def init(self):
        self.conn.executescript("""
            CREATE TABLE IF NOT EXISTS progress (
                item_id TEXT NOT NULL,
                item_type TEXT NOT NULL,
                interval REAL DEFAULT 0,
                ease_factor REAL DEFAULT 2.5,
                repetitions INTEGER DEFAULT 0,
                next_review REAL DEFAULT 0,
                correct_count INTEGER DEFAULT 0,
                wrong_count INTEGER DEFAULT 0,
                updated_at REAL DEFAULT 0,
                PRIMARY KEY (item_id, item_type)
            );
            CREATE TABLE IF NOT EXISTS sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                phase INTEGER NOT NULL,
                mode TEXT NOT NULL,
                duration INTEGER NOT NULL,
                total INTEGER NOT NULL,
                correct INTEGER NOT NULL,
                created_at REAL DEFAULT 0
            );
        """)
        self.conn.commit()

    def save_progress(self, item_id, item_type, interval, ease_factor,
                      repetitions, next_review, correct_count, wrong_count):
        self.conn.execute("""
            INSERT INTO progress (item_id, item_type, interval, ease_factor,
                                  repetitions, next_review, correct_count,
                                  wrong_count, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(item_id, item_type) DO UPDATE SET
                interval=?, ease_factor=?, repetitions=?, next_review=?,
                correct_count=?, wrong_count=?, updated_at=?
        """, (item_id, item_type, interval, ease_factor, repetitions,
              next_review, correct_count, wrong_count, time.time(),
              interval, ease_factor, repetitions, next_review,
              correct_count, wrong_count, time.time()))
        self.conn.commit()

    def load_progress(self, item_id, item_type):
        row = self.conn.execute(
            "SELECT * FROM progress WHERE item_id=? AND item_type=?",
            (item_id, item_type)).fetchone()
        return dict(row) if row else None

    def load_all_progress(self):
        rows = self.conn.execute("SELECT * FROM progress").fetchall()
        return [dict(r) for r in rows]

    def save_session(self, phase, mode, duration, total, correct):
        self.conn.execute("""
            INSERT INTO sessions (phase, mode, duration, total, correct, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (phase, mode, duration, total, correct, time.time()))
        self.conn.commit()

    def get_sessions(self, limit=50):
        rows = self.conn.execute(
            "SELECT * FROM sessions ORDER BY created_at DESC LIMIT ?",
            (limit,)).fetchall()
        return [dict(r) for r in rows]

    def close(self):
        self.conn.close()
```

**Step 4: Run test to verify it passes**

Run: `python -m pytest tests/test_db.py -v`
Expected: All 4 tests PASS

**Step 5: Commit**

```bash
git add app/db.py tests/test_db.py
git commit -m "feat: SQLite database layer for progress persistence"
```

---

### Task 5: FastAPI Routes

**Files:**
- Create: `app/api.py`
- Create: `tests/test_api.py`
- Create: `tests/__init__.py`

**Step 1: Write the failing tests**

```python
import pytest
from httpx import AsyncClient, ASGITransport
from app.api import app


@pytest.fixture
def client():
    transport = ASGITransport(app=app)
    return AsyncClient(transport=transport, base_url="http://test")


@pytest.mark.asyncio
async def test_get_mappings(client):
    resp = await client.get("/api/mappings")
    assert resp.status_code == 200
    data = resp.json()
    assert "initials" in data
    assert "finals" in data


@pytest.mark.asyncio
async def test_get_phase_items(client):
    resp = await client.get("/api/phase/1/items")
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert len(data["items"]) > 0


@pytest.mark.asyncio
async def test_submit_review(client):
    resp = await client.post("/api/review", json={
        "item_id": "b",
        "item_type": "initial",
        "correct": True,
        "quality": 5
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "interval" in data


@pytest.mark.asyncio
async def test_get_progress(client):
    resp = await client.get("/api/progress")
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert "sessions" in data


@pytest.mark.asyncio
async def test_save_session(client):
    resp = await client.post("/api/session", json={
        "phase": 1,
        "mode": "typing",
        "duration": 120,
        "total": 20,
        "correct": 15
    })
    assert resp.status_code == 200
```

**Step 2: Run test to verify it fails**

Run: `python -m pytest tests/test_api.py -v`
Expected: FAIL — cannot import

**Step 3: Install pytest-asyncio**

Run: `uv pip install pytest-asyncio`

**Step 4: Implement FastAPI routes**

```python
"""FastAPI application with all API routes."""
import json
from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from app.db import Database
from app.srs import SRSEngine, SRSItem

app = FastAPI()

# Load mapping data
DATA_PATH = Path(__file__).parent / "data" / "mappings.json"
with open(DATA_PATH) as f:
    MAPPINGS = json.load(f)

# Database & SRS
DB_PATH = Path(__file__).parent.parent / "db" / "progress.db"
DB_PATH.parent.mkdir(exist_ok=True)
db = Database(str(DB_PATH))
db.init()
srs = SRSEngine()


class ReviewRequest(BaseModel):
    item_id: str
    item_type: str
    correct: bool
    quality: int


class SessionRequest(BaseModel):
    phase: int
    mode: str
    duration: int
    total: int
    correct: int


@app.get("/api/mappings")
def get_mappings():
    return MAPPINGS


@app.get("/api/phase/{phase}/items")
def get_phase_items(phase: int):
    if phase == 1:
        items = MAPPINGS["initials"] + MAPPINGS["finals"]
    elif phase == 2:
        items = MAPPINGS["special_syllables"] + MAPPINGS.get("confusion_pairs", [])
    else:
        items = MAPPINGS["initials"] + MAPPINGS["finals"]
    return {"items": items, "phase": phase}


@app.post("/api/review")
def submit_review(req: ReviewRequest):
    # Load existing progress or create new
    existing = db.load_progress(req.item_id, req.item_type)
    if existing:
        item = SRSItem(
            item_id=req.item_id, item_type=req.item_type,
            interval=existing["interval"],
            ease_factor=existing["ease_factor"],
            repetitions=existing["repetitions"],
            next_review=existing["next_review"],
            correct_count=existing["correct_count"],
            wrong_count=existing["wrong_count"],
        )
    else:
        item = SRSItem(item_id=req.item_id, item_type=req.item_type)

    updated = srs.review(item, correct=req.correct, quality=req.quality)
    db.save_progress(
        updated.item_id, updated.item_type, updated.interval,
        updated.ease_factor, updated.repetitions, updated.next_review,
        updated.correct_count, updated.wrong_count
    )
    return {
        "item_id": updated.item_id,
        "interval": updated.interval,
        "repetitions": updated.repetitions,
        "correct_count": updated.correct_count,
        "wrong_count": updated.wrong_count,
    }


@app.get("/api/progress")
def get_progress():
    items = db.load_all_progress()
    sessions = db.get_sessions()
    return {"items": items, "sessions": sessions}


@app.post("/api/session")
def save_session(req: SessionRequest):
    db.save_session(req.phase, req.mode, req.duration, req.total, req.correct)
    return {"status": "ok"}


# Mount static files last (catch-all)
STATIC_PATH = Path(__file__).parent.parent / "static"
if STATIC_PATH.exists():
    app.mount("/", StaticFiles(directory=str(STATIC_PATH), html=True), name="static")
```

**Step 5: Run test to verify it passes**

Run: `python -m pytest tests/test_api.py -v`
Expected: All 5 tests PASS

**Step 6: Commit**

```bash
git add app/api.py tests/test_api.py tests/__init__.py
git commit -m "feat: FastAPI routes for mappings, review, progress"
```

---

### Task 6: Frontend — Main HTML + CSS Framework

**Files:**
- Create: `static/index.html`
- Create: `static/style.css`
- Create: `static/app.js` (stub)

**Step 1: Create index.html**

Single-page app structure with:
- Navigation bar showing 5 phases
- Main content area that swaps between views
- Phase 1: flashcard view (注音 displayed large, input field for pinyin)
- Phase 1: recognition mode (multiple choice)
- Progress stats sidebar
- Clean, focused design — no distractions

Key UI elements:
- Large 注音 character display (center)
- Text input field for typing pinyin
- Correct/incorrect feedback (green/red flash)
- Progress bar for current session
- Phase navigation tabs

**Step 2: Create style.css**

Modern, clean design:
- Dark theme (easier on eyes for extended practice)
- Large fonts for 注音/拼音 display
- Smooth transitions for card flipping
- Color-coded feedback (green=correct, red=wrong)
- Responsive layout

**Step 3: Create app.js stub**

```javascript
// App state and initialization
const App = {
    currentPhase: 1,
    currentMode: 'typing',
    init() {
        console.log('Pinyin Learning System initialized');
    }
};
document.addEventListener('DOMContentLoaded', () => App.init());
```

**Step 4: Test manually**

Run: `cd /Users/ethancic/typing && python main.py`
Expected: Browser opens, shows the basic page layout

**Step 5: Commit**

```bash
git add static/index.html static/style.css static/app.js main.py
git commit -m "feat: frontend HTML/CSS scaffold with dark theme"
```

---

### Task 7: Frontend — Phase 1 Flashcard & Typing Mode

**Files:**
- Modify: `static/app.js`
- Modify: `static/index.html` (if needed)
- Modify: `static/style.css` (if needed)

**Step 1: Implement flashcard engine in app.js**

Core frontend logic:
1. Fetch `/api/phase/1/items` on load
2. Show items grouped: initials first, then finals
3. **Typing mode**: display 注音 → user types pinyin → Enter to submit
4. Instant feedback: green flash + chime for correct, red flash + shake for wrong
5. Track session stats (total, correct, time)
6. Submit review to `/api/review` after each answer
7. When all items reviewed, show session summary
8. Submit session to `/api/session`

Key interactions:
- Auto-focus input field after each answer
- Show correct answer if wrong (for 2 seconds before next card)
- Progress bar shows items completed / total
- Keyboard-driven (no mouse needed for practice flow)

**Step 2: Implement recognition (multiple choice) mode**

1. Show 注音 + 4 pinyin options (1 correct, 3 random)
2. User presses 1/2/3/4 to select
3. Same feedback and tracking as typing mode

**Step 3: Add group navigation**

Allow user to select which group to practice:
- "All Initials"
- "All Finals"
- "Labial" (ㄅㄆㄇㄈ)
- "Alveolar" (ㄉㄊㄋㄌ)
- "Velar" (ㄍㄎㄏ)
- "Palatal" (ㄐㄑㄒ)
- "Retroflex" (ㄓㄔㄕㄖ)
- "Sibilant" (ㄗㄘㄙ)
- etc.

**Step 4: Test manually**

Run: `python main.py`
Test: Complete a full round of initials in typing mode. Verify:
- Feedback appears correctly
- Progress bar updates
- Session summary shows at end

**Step 5: Commit**

```bash
git add static/app.js static/index.html static/style.css
git commit -m "feat: Phase 1 flashcard + typing + recognition modes"
```

---

### Task 8: Frontend — Phase 2 Special Rules

**Files:**
- Modify: `static/app.js`
- Possibly modify: `static/index.html`, `static/style.css`

**Step 1: Add special rules lesson content**

Interactive lessons covering:
1. **ü rule**: after j/q/x/y, ü is written as u (e.g., ㄐㄩ = ju, not jü)
2. **Whole syllables**: zhi/chi/shi/ri/zi/ci/si + yi/wu/yu/ye/yue/yuan/yin/yun/ying
3. **Tone placement**: a > e > o; for iu/ui the second vowel gets the mark
4. **Common confusions**: zh vs z, ch vs c, sh vs s, n vs l, an vs ang, en vs eng, in vs ing

**Step 2: Implement quiz mode for special rules**

- Present a scenario/question
- User answers (type or select)
- Explain the rule after each answer
- Track mastery per rule

**Step 3: Test manually**

Verify all special rules are covered and quizzes work.

**Step 4: Commit**

```bash
git add static/app.js static/index.html static/style.css
git commit -m "feat: Phase 2 special rules lessons and quizzes"
```

---

### Task 9: Frontend — Phase 3 Character Practice

**Files:**
- Modify: `static/app.js`
- Create: `app/data/characters.json` (or use pypinyin dynamically)
- Modify: `app/api.py` (add character endpoint)

**Step 1: Add character pinyin endpoint**

Use the `pypinyin` library to generate pinyin for characters on-the-fly:

```python
from pypinyin import pinyin, Style

@app.get("/api/characters")
def get_characters(level: str = "common"):
    # Return a batch of common characters with their pinyin
    # Use HSK level 1-3 characters for "common"
    ...
```

**Step 2: Implement character practice UI**

- Show a Chinese character (large, center)
- User types its pinyin (with tone number, e.g., "zhong1")
- Instant feedback
- SRS tracking per character

**Step 3: Add character data**

Create a curated list of ~500 most common characters for initial practice, sourced from common frequency lists.

**Step 4: Test manually and commit**

```bash
git add app/api.py app/data/characters.json static/app.js
git commit -m "feat: Phase 3 character pinyin typing practice"
```

---

### Task 10: Frontend — Progress Dashboard

**Files:**
- Modify: `static/app.js`
- Modify: `static/index.html`
- Modify: `static/style.css`

**Step 1: Implement dashboard view**

Fetch `/api/progress` and display:
- Overall mastery percentage per phase
- Initials mastery heatmap (color-coded grid)
- Finals mastery heatmap
- Session history (recent 10 sessions with date, duration, accuracy)
- Accuracy trend line chart (simple SVG or canvas)
- Weakness list (top 10 most-failed items)

**Step 2: Add daily streak tracker**

- Count consecutive days with at least 1 session
- Display streak prominently

**Step 3: Test manually and commit**

```bash
git add static/app.js static/index.html static/style.css
git commit -m "feat: progress dashboard with mastery heatmap and stats"
```

---

### Task 11: Frontend — Phase 4 Word & Sentence Practice

**Files:**
- Modify: `static/app.js`
- Create: `app/data/words.json`
- Modify: `app/api.py`

**Step 1: Create word data**

Common 2-4 character words with pinyin:
```json
[
  {"word": "你好", "pinyin": "ni3 hao3"},
  {"word": "謝謝", "pinyin": "xie4 xie4"},
  ...
]
```

Include ~200 common words initially.

**Step 2: Add word practice API endpoint**

**Step 3: Implement word/sentence typing UI**

- Show word → type full pinyin (space-separated syllables with tone numbers)
- Show sentence → type full pinyin
- Track accuracy per word

**Step 4: Test and commit**

```bash
git add app/data/words.json app/api.py static/app.js
git commit -m "feat: Phase 4 word and sentence pinyin practice"
```

---

### Task 12: Frontend — Phase 5 Speed Training

**Files:**
- Modify: `static/app.js`
- Modify: `static/style.css`

**Step 1: Implement speed test mode**

- Countdown timer (30s / 60s / 120s options)
- Stream of characters/words to type pinyin for
- Real-time WPM counter
- Accuracy percentage
- Results screen with WPM, accuracy, and comparison to previous best

**Step 2: Add personal best tracking**

Save best WPM per time duration to database.

**Step 3: Test and commit**

```bash
git add static/app.js static/style.css app/api.py app/db.py
git commit -m "feat: Phase 5 speed training with WPM tracking"
```

---

### Task 13: Polish & Integration Testing

**Files:**
- Modify: various files
- Create: `tests/test_integration.py`

**Step 1: Write integration test**

Test the full flow: load mappings → practice → submit review → check progress.

**Step 2: UX polish**

- Keyboard shortcut hints on screen
- Smooth transitions between phases
- Error handling for network issues
- Loading states

**Step 3: Update main.py**

Ensure `db/` directory auto-creates, browser opens after server starts (with small delay).

**Step 4: Final test**

Run full test suite: `python -m pytest -v`
Manual test: complete a full Phase 1 session from start to finish.

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: polish, integration tests, UX improvements"
```

---

## Summary

| Task | Description | Key Deliverable |
|------|-------------|-----------------|
| 1 | Project setup | pyproject.toml, deps installed |
| 2 | Core mapping data | mappings.json (注音↔拼音) |
| 3 | SRS engine | Spaced repetition algorithm |
| 4 | Database layer | SQLite persistence |
| 5 | API routes | FastAPI endpoints |
| 6 | Frontend scaffold | HTML/CSS/JS structure |
| 7 | Phase 1: Flashcards | Typing + recognition modes |
| 8 | Phase 2: Special rules | Lessons + quizzes |
| 9 | Phase 3: Characters | Character → pinyin practice |
| 10 | Dashboard | Progress visualization |
| 11 | Phase 4: Words | Word/sentence practice |
| 12 | Phase 5: Speed | WPM speed training |
| 13 | Polish | Integration tests, UX |
