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
