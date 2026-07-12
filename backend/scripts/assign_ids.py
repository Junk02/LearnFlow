import json
from pathlib import Path

def assign_ids(topics, temp_dir: Path):

    for i, t in enumerate(topics):
        t["id"] = i

    output_file = temp_dir / "topics_with_ids.json"
    output_file.write_text(
        json.dumps(topics, ensure_ascii=False, indent=2),
        encoding="utf-8"
    )

    print(f"[assign_ids] Assigned IDs to {len(topics)} topics.")
    print(f"[assign_ids] Saved to {output_file}")

    return topics
