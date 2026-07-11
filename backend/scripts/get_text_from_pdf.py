import pdfplumber

def extract_text(pdf_path):
    full_text = ""
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if text:
                full_text += text + "\n"
    return full_text

if __name__ == "__main__":
    path = "../byte_of_python.pdf"
    text = extract_text(path)
    print(text)
