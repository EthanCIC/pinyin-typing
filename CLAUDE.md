# Pinyin Learning System

## Project
FastAPI backend + vanilla HTML/CSS/JS frontend for learning Pinyin.
Deployed to Zeabur with staging/production workflow.

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

## Communication
- Always respond in Traditional Chinese (繁體中文)
- Commit messages in English

## Deployment Workflow

### Branch Strategy
- `main` → 正式環境 (Production) - 自動部署到 Zeabur
- `staging` → 測試環境 (Beta) - 自動部署到 Zeabur staging 環境

### 工作流程
1. 功能開發在 feature branch
2. 合併到 `staging` 進行測試
3. 在 staging 環境驗證功能
4. 確認無誤後合併到 `main` 部署到正式環境

### CI/CD
- 所有 PR 都會執行自動化測試 (pytest)
- 測試必須通過才能合併
- staging 和 main 分支受保護
