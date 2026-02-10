# Pinyin Learning System

## Project
FastAPI backend + vanilla HTML/CSS/JS frontend for learning Pinyin.
Deployed to Zeabur, auto-deploys on merge to main.

## Tech Stack
- Python 3.13, FastAPI, SQLite (stdlib sqlite3), pypinyin
- Frontend: vanilla HTML/CSS/JS (no framework)
- Package manager: uv

## Commands
- Run tests: `.venv/bin/python -m pytest tests/ -v`
- Run server: `.venv/bin/python main.py`
- Install deps: `uv pip install -e ".[dev]"`

## Code Conventions
- All user-facing text in Traditional Chinese (繁體中文)
- Dark theme UI
- Keep frontend vanilla (no npm/webpack)
