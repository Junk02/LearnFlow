import re

def is_real_content(chunk: str) -> bool:
    text = chunk.lower()

    review_keywords = ["excellent", "helpful", "beginner-friendly", "feedback", "recommend"]
    if any(k in text for k in review_keywords):
        return False

    translation_keywords = ["translation", "chinese", "french", "german", "greek", "indonesian"]
    if any(k in text for k in translation_keywords):
        return False

    license_keywords = ["license", "copyright", "permission", "redistribute"]
    if any(k in text for k in license_keywords):
        return False

    numbered_lines = sum(1 for l in chunk.splitlines() if re.match(r"^\d+(\.\d+)*", l.strip()))
    sentences = re.findall(r"[A-Za-z][^.?!]{20,}[.?!]", chunk)

    if numbered_lines > 5 and len(sentences) < 3:
        return False

    return True
