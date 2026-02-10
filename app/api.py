"""FastAPI application with all API routes."""
import json
from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from pypinyin import pinyin, Style

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


@app.get("/api/character/{char}")
def get_character_pinyin(char: str):
    result = pinyin(char, style=Style.NORMAL)
    if result:
        return {"character": char, "pinyin": result[0][0]}
    return {"character": char, "pinyin": ""}


@app.post("/api/session")
def save_session(req: SessionRequest):
    db.save_session(req.phase, req.mode, req.duration, req.total, req.correct)
    return {"status": "ok"}


# Mount static files last (catch-all)
STATIC_PATH = Path(__file__).parent.parent / "static"
if STATIC_PATH.exists():
    app.mount("/", StaticFiles(directory=str(STATIC_PATH), html=True), name="static")
