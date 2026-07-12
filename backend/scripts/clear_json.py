import json
import re

def extract_json(raw):
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


with open("chunk_results.json", "r", encoding="utf-8") as f:
    raw_list = json.load(f)

topics = flatten_topics(raw_list)

with open("chunk_cleared.json", "w", encoding="utf-8") as f:
    json.dump(topics, f, indent=2, ensure_ascii=False)
