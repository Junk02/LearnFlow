import pdfplumber
from pathlib import Path

def extract_text(pdf_path: str) -> str:

    pdf_path = Path(pdf_path)
    if not pdf_path.exists():
        raise FileNotFoundError(f"PDF not found: {pdf_path}")

    print(f"[extract_text] Открываем PDF: {pdf_path}")

    full_text = []

    with pdfplumber.open(pdf_path) as pdf:
        num_pages = len(pdf.pages)
        print(f"[extract_text] Страниц: {num_pages}")

        for i, page in enumerate(pdf.pages):
            page_text = page.extract_text() or ""
            full_text.append(page_text)

    result = "\n".join(full_text)
    print(f"[extract_text] Всего извлечено символов: {len(result)}")

    return result
