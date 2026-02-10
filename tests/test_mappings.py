import json
from pathlib import Path


def load_mappings():
    path = Path(__file__).parent.parent / "app" / "data" / "mappings.json"
    with open(path) as f:
        return json.load(f)


def test_mappings_has_initials():
    data = load_mappings()
    initials = data["initials"]
    assert len(initials) == 21
    for item in initials:
        assert "zhuyin" in item
        assert "pinyin" in item
        assert "group" in item


def test_mappings_has_finals():
    data = load_mappings()
    finals = data["finals"]
    assert len(finals) >= 35
    for item in finals:
        assert "zhuyin" in item
        assert "pinyin" in item
        assert "group" in item


def test_mappings_has_special_syllables():
    data = load_mappings()
    specials = data["special_syllables"]
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
