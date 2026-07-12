const uploadZone = document.getElementById('uploadZone');
const fileInput = document.getElementById('fileInput');
const mainText = document.getElementById('mainText');
const subText = document.getElementById('subText');
const uploadIconWrapper = document.getElementById('uploadIconWrapper');
const uploadContainer = document.getElementById('uploadContainer');

let SelectedFile = null;

function TriggerFileInput(event) {
    if (event.target.tagName === 'BUTTON') {
        return;
    }
    fileInput.click();
}

function HandleFileSelect(input) {
    if (input.files === null) {
        return;
    }
    if (input.files[0] === undefined) {
        return;
    }
    
    const file = input.files[0];
    
    if (file.name.toLowerCase().endsWith('.pdf') === false) {
        input.value = '';
        uploadZone.classList.add('error-state');
        mainText.textContent = "Invalid format!";
        subText.textContent = "Please select a valid PDF file.";
        return;
    }

    SelectedFile = file;

    uploadZone.classList.remove('error-state');
    uploadIconWrapper.style.display = 'none';

    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
    mainText.textContent = file.name;
    subText.textContent = "PDF • " + fileSizeMB + " MB";

    const oldActions = document.getElementById('uploadActions');
    if (oldActions !== null) {
        oldActions.remove();
    }

    const actionsDiv = document.createElement('div');
    actionsDiv.id = 'uploadActions';
    actionsDiv.className = 'upload-actions';
    
    actionsDiv.innerHTML = `
        <button class="btn-preview" onclick="PreviewFile()">Preview</button>
        <button class="btn-submit-file" onclick="UploadFile()">Upload to Server</button>
    `;
    
    uploadContainer.appendChild(actionsDiv);
}

function PreviewFile() {
    if (SelectedFile !== null) {
        const fileURL = URL.createObjectURL(SelectedFile);
        window.open(fileURL, '_blank');
    }
}

function UploadFile() {
    if (SelectedFile !== null) {
        window.open('graph.html', '_blank');
    }
}