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
