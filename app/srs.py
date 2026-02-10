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
