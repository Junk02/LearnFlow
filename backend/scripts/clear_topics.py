import json
import re
from pathlib import Path


def extract_json(raw: str):
    raw = raw.strip()

    raw = re.sub(r"^```json", "", raw)
    raw = re.sub(r"```$", "", raw)
    raw = raw.strip()

    try:
        return json.loads(raw)
    except:
        pass

    try:
        cleaned = raw.strip('"')
        return json.loads(cleaned)
    except:
        pass

    match = re.search(r"\{[\s\S]*\}", raw)
    if match:
        try:
            return json.loads(match.group(0))
        except:
            pass

    return None


def flatten_topics(raw_list):
    all_topics = []

    for raw in raw_list:
        obj = extract_json(raw)
        if not obj:
            continue

        topics = obj.get("topics", [])
        if not isinstance(topics, list):
            continue

        for t in topics:
            all_topics.append(t)

    return all_topics


BLACKLIST = ["translation", "feedback"]

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


def clear_topics(raw_results, temp_dir: Path):
    topics_flat = flatten_topics(raw_results)
    (temp_dir / "topics_flat.json").write_text(
        json.dumps(topics_flat, ensure_ascii=False, indent=2),
        encoding="utf-8"
    )

    cleaned, removed = filter_topics(topics_flat)

    (temp_dir / "topics_cleaned.json").write_text(
        json.dumps(cleaned, ensure_ascii=False, indent=2),
        encoding="utf-8"
    )

    (temp_dir / "topics_removed.json").write_text(
        json.dumps(removed, ensure_ascii=False, indent=2),
        encoding="utf-8"
    )

    return cleaned
