import json
from pathlib import Path

def add_fields(topics, temp_dir: Path):

    for t in topics:
        t["displayed_info"] = ""
        t["flashcards"] = []

    output_file = temp_dir / "topics_ready_for_details.json"
    output_file.write_text(
        json.dumps(topics, ensure_ascii=False, indent=2),
        encoding="utf-8"
    )

    print(f"[add_fields] Added fields to {len(topics)} topics.")
    print(f"[add_fields] Saved to {output_file}")

    return topics