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
