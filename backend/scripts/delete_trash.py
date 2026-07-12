import json
from pathlib import Path

INPUT_FILE = Path("chunk_cleared.json")        # исходный файл
CLEANED_FILE = Path("topics_cleaned.json")     # файл с очищенными темами
REMOVED_FILE = Path("topics_removed.json")     # файл с удалёнными темами

BLACKLIST = [
    "translation",
    "feedback"
]

def load_topics(path: Path):
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)

def save_json(path: Path, data):
    with path.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def normalize(s: str) -> str:
    return " ".join(s.split()).strip().lower()

def is_blacklisted(topic):
    text = (topic.get("name", "") + " " + topic.get("description", "")).lower()
    return any(word in text for word in BLACKLIST)

def filter_topics(topics):
    cleaned = []
    removed = []

    for topic in topics:
        if is_blacklisted(topic):
            removed.append(topic)
        else:
            cleaned.append(topic)

    return cleaned, removed

def main():
    topics = load_topics(INPUT_FILE)

    cleaned, removed = filter_topics(topics)

    print(f"Всего тем: {len(topics)}")
    print(f"Осталось после фильтрации: {len(cleaned)}")
    print(f"Удалено лишних тем: {len(removed)}")

    save_json(CLEANED_FILE, cleaned)
    save_json(REMOVED_FILE, removed)

if __name__ == "__main__":
    main()
