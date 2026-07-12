const uploadZone = document.getElementById('uploadZone');
const fileInput = document.getElementById('fileInput');
const mainText = document.getElementById('mainText');
const subText = document.getElementById('subText');
const uploadIconWrapper = document.getElementById('uploadIconWrapper');
const uploadContainer = document.getElementById('uploadContainer');

let SelectedFile = null;


uploadZone.addEventListener("click", (event) => {
    if (event.target.tagName === "BUTTON") return;
    fileInput.click();
});

fileInput.addEventListener("change", () => {
    if (!fileInput.files || !fileInput.files[0]) return;

    const file = fileInput.files[0];

    if (!file.name.toLowerCase().endsWith(".pdf")) {
        fileInput.value = "";
        uploadZone.classList.add("error-state");
        mainText.textContent = "Invalid format!";
        subText.textContent = "Please select a valid PDF file.";
        return;
    }

    SelectedFile = file;

    uploadZone.classList.remove("error-state");
    uploadIconWrapper.style.display = "none";

    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
    mainText.textContent = file.name;
    subText.textContent = "PDF • " + fileSizeMB + " MB";

    const oldActions = document.getElementById("uploadActions");
    if (oldActions) oldActions.remove();

    const actionsDiv = document.createElement("div");
    actionsDiv.id = "uploadActions";
    actionsDiv.className = "upload-actions";

    const previewBtn = document.createElement("button");
    previewBtn.className = "btn-preview";
    previewBtn.textContent = "Preview";
    previewBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        PreviewFile();
    });

    const uploadBtn = document.createElement("button");
    uploadBtn.className = "btn-submit-file";
    uploadBtn.textContent = "Upload to Server";
    uploadBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        UploadFile();
    });

    actionsDiv.appendChild(previewBtn);
    actionsDiv.appendChild(uploadBtn);
    uploadContainer.appendChild(actionsDiv);
});

function PreviewFile() {
    if (SelectedFile) {
        const fileURL = URL.createObjectURL(SelectedFile);
        window.open(fileURL, "_blank");
    }
}

async function UploadFile() {
    if (!SelectedFile) return;

    const formData = new FormData();
    formData.append("file", SelectedFile);

    mainText.textContent = "Processing...";
    subText.textContent = "Please wait while the PDF is analyzed.";

    let response;
    try {
        response = await fetch("http://localhost:8000/upload", {
            method: "POST",
            body: formData
        });
    } catch (e) {
        console.error("Fetch failed:", e);
        mainText.textContent = "Connection error";
        subText.textContent = "Server unreachable.";
        return;
    }

    if (!response.ok) {
        console.error("Server error", response.status);
        mainText.textContent = "Server error";
        subText.textContent = "Try again later.";
        return;
    }

    let result;
    try {
        result = await response.json();
    } catch (e) {
        console.error("JSON parse failed:", e);
        mainText.textContent = "Invalid server response";
        subText.textContent = "Try again.";
        return;
    }

    if (result.status === "ok") {
        const docName = result.doc_name;
        window.location.href = `graph.html?doc=${docName}`;
    } else {
        mainText.textContent = "Error!";
        subText.textContent = "Something went wrong.";
    }
}
