const loadingSection = document.getElementById('loadingSection');
const graphSection = document.getElementById('graphSection');
const networkContainer = document.getElementById('networkContainer');
const nodeCard = document.getElementById('nodeCard');
const cardTitle = document.getElementById('cardTitle');
const cardDesc = document.getElementById('cardDesc');
const editTitleBtn = document.getElementById('editTitleBtn');
const editDescBtn = document.getElementById('editDescBtn');

const siteHeader = document.getElementById('siteHeader');
const siteFooter = document.getElementById('siteFooter');

let NodesArray = [];
let data = null;
let currentOpenNodeId = null;
let network = null; 

const COLOR_DEFAULT = '#6366f1';
const COLOR_FROZEN = '#f59e0b';

<<<<<<< Updated upstream
let currentFlashcards = [];
let currentCardIndex = 0;
let correctAnswersCount = 0;
let isCardFlipped = false;
let isModalOpen = false;

let isDragging = false;
let hasMoved = false; 
let startX = 0;
let startY = 0;
let currentX = 0;
let currentY = 0;
const SWIPE_THRESHOLD = 120; 

function SkipLoading() {
    loadingSection.style.display = 'none';
    
    const mainContent = document.getElementById('mainContent');
    if (mainContent !== null) {
        mainContent.style.display = 'none';
    }
    
    if (siteHeader !== null) {
        siteHeader.style.display = 'none';
    }
    if (siteFooter !== null) {
        siteFooter.style.display = 'none';
    }

    graphSection.style.display = 'flex';
    graphSection.style.height = '100vh';
    graphSection.style.padding = '0';
    
    InitGraphFromBackend();
}

async function InitGraphFromBackend() {
    const response = await fetch("http://localhost:8000/graph");
=======
async function InitGraphFromBackend() {
    loadingSection.style.display = 'flex';
    graphSection.style.display = 'none';

    const params = new URLSearchParams(window.location.search);
    const docName = params.get("doc");

    if (!docName) {
        alert("Error: doc parameter missing");
        return;
    }

    const response = await fetch(`http://localhost:8000/graph/${docName}`);
>>>>>>> Stashed changes
    const graphData = await response.json();

    NodesArray = graphData.topics.map(n => ({
        id: n.id,
        label: n.name,
        title: n.name,
        description: n.displayed_info,
        flashcards: n.flashcards || []
    }));

    const edgesArray = graphData.edges.map(edge => ({
        from: edge[0],
        to: edge[1]
    }));

    data = {
        nodes: new vis.DataSet(NodesArray),
        edges: new vis.DataSet(edgesArray)
    };

    const options = {
        nodes: {
            shape: 'dot',
            size: 8,
            borderWidth: 0,
            borderWidthSelected: 2,
            font: {
                color: '#94a3b8',
                size: 11,
                face: 'inherit',
                vadjust: 14
            },
            color: {
                background: COLOR_DEFAULT,
                border: COLOR_DEFAULT,
                highlight: {
                    background: '#a855f7',
                    border: '#ffffff'
                },
                hover: {
                    background: '#a855f7',
                    border: '#a855f7'
                }
            },
            shadow: false
        },
        edges: {
            width: 1,
            color: {
                color: 'rgba(148, 163, 184, 0.15)',
                highlight: 'rgba(168, 85, 247, 0.6)',
                hover: 'rgba(168, 85, 247, 0.4)'
            },
            smooth: false
        },
        physics: {
            solver: 'barnesHut',
            barnesHut: {
                gravitationalConstant: -8000,
                centralGravity: 0.3,
                springLength: 180,
                springConstant: 0.005,
                damping: 0.09
            },
            maxVelocity: 10,
            minVelocity: 0.1,
            timestep: 0.35,
            stabilization: {
                enabled: true,
                iterations: 150,
                updateInterval: 25,
                onlyDynamicEdges: false,
                fit: true
            }
        },
        interaction: {
            hover: true,
            dragNodes: true,
            zoomView: true,
            dragView: true
        }
    };

    network = new vis.Network(networkContainer, data, options);

    loadingSection.style.display = 'none';
    graphSection.style.display = 'flex';
    graphSection.style.height = '100vh';
    graphSection.style.padding = '0';

    network.on("click", function (params) {
        if (params.nodes.length > 0) {
            ShowNodeDetails(params.nodes[0]);
        } else {
            CloseNodeCard();
        }
    });

    network.on("dragStart", function (params) {
        if (params.nodes.length > 0) {
            network.draggedNodeId = params.nodes[0];
        }
    });

    network.on("dragEnd", function (params) {
        if (network.pendingFreezeNodeId) {
            const nodeId = network.pendingFreezeNodeId;
            data.nodes.update({ 
                id: nodeId, 
                fixed: { x: true, y: true },
                color: { background: COLOR_FROZEN, border: COLOR_FROZEN }
            });
            network.pendingFreezeNodeId = null;
        }
        network.draggedNodeId = null;
    });

    window.addEventListener("keydown", function(event) {
        if (document.activeElement.getAttribute('contenteditable') === 'true') return;

        if (isModalOpen && currentFlashcards.length > 0) {
            if (event.code === "Space") {
                event.preventDefault(); 
                flipFlashcard();
                return;
            } else if (event.key === "ArrowLeft") {
                handleCardAnswer(false);
                return;
            } else if (event.key === "ArrowRight") {
                handleCardAnswer(true);
                return;
            } else if (event.key === "Escape") {
                CloseFlashcardsModal();
                return;
            }
        }
        if (event.key.toLowerCase() === 'f') {
            const selectedNodes = network.getSelectedNodes();
            if (selectedNodes.length > 0) {
                const nodeId = selectedNodes[0];
                const nodeData = data.nodes.get(nodeId);
                const isFrozen = nodeData.fixed && nodeData.fixed.x === true;
                if (network.draggedNodeId === nodeId) {
                    network.pendingFreezeNodeId = nodeId;
                } else {
                    data.nodes.update({ 
                        id: nodeId, 
                        fixed: { x: !isFrozen, y: !isFrozen },
                        color: {
                            background: isFrozen ? COLOR_DEFAULT : COLOR_FROZEN,
                            border: isFrozen ? COLOR_DEFAULT : COLOR_FROZEN
                        }
                    });
                    if (!isFrozen) {
                        network.body.nodes[nodeId].vx = 0;
                        network.body.nodes[nodeId].vy = 0;
                        network.body.nodes[nodeId].fx = 0;
                        network.body.nodes[nodeId].fy = 0;
                    }
                }
            }
        }
    });
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
}

function toggleEdit(elementId, buttonId) {
    if (currentOpenNodeId === null) return;

    const element = document.getElementById(elementId);
    const button = document.getElementById(buttonId);
    const isEditing = element.getAttribute('contenteditable') === 'true';

    if (!isEditing) {
        element.setAttribute('contenteditable', 'true');
        element.focus();
        button.innerText = '✅';
    } else {
        element.removeAttribute('contenteditable');
        button.innerText = '✏️';
        saveNodeChanges();
    }
}

function saveNodeChanges() {
    if (currentOpenNodeId === null) return;

    const updatedTitle = cardTitle.innerText;
    const updatedDesc = cardDesc.innerText;

    for (let i = 0; i < NodesArray.length; i++) {
        if (NodesArray[i].id === currentOpenNodeId) {
            NodesArray[i].title = updatedTitle;
            NodesArray[i].label = updatedTitle; 
            NodesArray[i].description = updatedDesc;
            break;
        }
    }

    data.nodes.update({
        id: currentOpenNodeId,
        label: updatedTitle,
        title: updatedTitle
    });
}

function UnfreezeAllNodes() {
    if (data === null) return;
    const allIds = data.nodes.getIds();
    const updates = allIds.map(nodeId => ({
        id: nodeId,
        fixed: { x: false, y: false },
        color: { background: COLOR_DEFAULT, border: COLOR_DEFAULT }
    }));
    data.nodes.update(updates);
}

function OpenFlashcardsModal() {
    if (currentOpenNodeId === null) return;
    isModalOpen = true;
    document.getElementById('fcModalOverlay').style.display = 'flex';
    renderFlashcard();
}

function CloseFlashcardsModal() {
    isModalOpen = false;
    document.getElementById('fcModalOverlay').style.display = 'none';
}

function renderFlashcard() {
    const container = document.getElementById('flashcardContainer');
    const progressText = document.getElementById('fcProgress');

    isCardFlipped = false;

    if (!currentFlashcards || currentFlashcards.length === 0) {
        container.innerHTML = `<div class="fc-result-screen"><p style="margin:0;color:#94a3b8;font-size:1.1rem;">No flashcards available for this concept.</p></div>`;
        progressText.innerText = '';
        return;
    }

    if (currentCardIndex >= currentFlashcards.length) {
        container.innerHTML = `
            <div class="fc-result-screen">
                <span style="font-size: 1.1rem; color: #94a3b8;">Learning Session Complete!</span>
                <span style="font-size: 2.2rem; font-weight: bold; color: #a855f7;">${correctAnswersCount} / ${currentFlashcards.length}</span>
                <button onclick="restartFlashcards()" style="background: rgba(168, 85, 247, 0.2); color: #ffffff; border: 1px solid #a855f7; padding: 8px 20px; border-radius: 8px; cursor: pointer; font-size: 0.95rem; font-weight: 600; margin-top: 5px; transition: 0.2s;" onmouseover="this.style.background='rgba(168, 85, 247, 0.4)'" onmouseout="this.style.background='rgba(168, 85, 247, 0.2)'">Try Again</button>
            </div>
        `;
        progressText.innerText = 'Finished';
        return;
    }

    const cardData = currentFlashcards[currentCardIndex];
    progressText.innerText = `${currentCardIndex + 1} of ${currentFlashcards.length}`;

    container.innerHTML = `
        <div id="activeFlashcard" class="flashcard">
            <div class="flashcard-front">${cardData.q}</div>
            <div class="flashcard-back">${cardData.a}</div>
        </div>
    `;

    const cardEl = document.getElementById('activeFlashcard');
    cardEl.addEventListener('mousedown', handleMouseDown);
}

function flipFlashcard() {
    const card = document.getElementById('activeFlashcard');
    if (card && !card.classList.contains('swipe-left-animation') && !card.classList.contains('swipe-right-animation')) {
        card.classList.toggle('flipped');
        isCardFlipped = card.classList.contains('flipped');
    }
}

function handleMouseDown(e) {
    const card = document.getElementById('activeFlashcard');
    if (!card || card.classList.contains('swipe-left-animation') || card.classList.contains('swipe-right-animation')) return;

    e.preventDefault();
    isDragging = true;
    hasMoved = false;
    startX = e.clientX;
    startY = e.clientY;
    currentX = 0;
    currentY = 0;
    
    card.classList.remove('reset-animation');
    card.style.transition = 'none';
}

function handleMouseMove(e) {
    if (!isDragging) return;
    const card = document.getElementById('activeFlashcard');
    if (!card) return;

    currentX = e.clientX - startX;
    currentY = e.clientY - startY;

    if (Math.abs(currentX) > 5 || Math.abs(currentY) > 5) {
        hasMoved = true;
    }

    if (!isCardFlipped) return;

    let rotation = currentX * 0.08; 
    let yOffset = currentY + Math.abs(currentX) * 0.15;

    card.style.transform = `translate(${currentX}px, ${yOffset}px) rotate(${rotation}deg) rotateY(180deg)`;

    const side = card.querySelector('.flashcard-back');
    if (side) {
        let opacity = Math.min(Math.abs(currentX) / SWIPE_THRESHOLD, 1) * 0.85;
        if (currentX > 0) {
            side.style.backgroundColor = `rgba(34, 197, 94, ${opacity})`;
            side.style.borderColor = `rgba(34, 197, 94, ${opacity + 0.15})`;
        } else {
            side.style.backgroundColor = `rgba(239, 68, 68, ${opacity})`;
            side.style.borderColor = `rgba(239, 68, 68, ${opacity + 0.15})`;
        }
    }
}

function handleMouseUp(e) {
    if (!isDragging) return;
    isDragging = false;

    const card = document.getElementById('activeFlashcard');
    if (!card) return;

    card.style.transition = '';

    if (!hasMoved) {
        flipFlashcard();
        return;
    }

    if (!isCardFlipped) {
        resetCardPosition(card);
        return;
    }

    // Проверка порога свайпа
    if (currentX > SWIPE_THRESHOLD) {
        forceSwipeTrigger(true);
    } else if (currentX < -SWIPE_THRESHOLD) {
        forceSwipeTrigger(false);
    } else {
        resetCardPosition(card);
    }
}

function resetCardPosition(card) {
    card.classList.add('reset-animation');
    if (isCardFlipped) {
        card.style.transform = `translate(0px, 0px) rotate(0deg) rotateY(180deg)`;
        const side = card.querySelector('.flashcard-back');
        if (side) {
            side.style.backgroundColor = 'rgba(30, 41, 59, 0.9)';
            side.style.borderColor = 'rgba(168, 85, 247, 0.6)';
        }
    } else {
        card.style.transform = '';
    }
}

function handleCardAnswer(isCorrect) {
    if (currentCardIndex >= currentFlashcards.length || !isCardFlipped) return;
    forceSwipeTrigger(isCorrect);
}

function forceSwipeTrigger(isCorrect) {
    const card = document.getElementById('activeFlashcard');
    const side = card ? card.querySelector('.flashcard-back') : null;
    if (!card || !side) return;

    side.style.backgroundColor = isCorrect ? 'rgba(34, 197, 94, 0.85)' : 'rgba(239, 68, 68, 0.85)';
    side.style.borderColor = isCorrect ? '#22c55e' : '#ef4444';

    if (isCorrect) {
        correctAnswersCount++;
        card.classList.add('swipe-right-animation'); 
    } else {
        card.classList.add('swipe-left-animation'); 
    }

    setTimeout(() => {
        currentCardIndex++;
        renderFlashcard();
    }, 450);
}

function restartFlashcards() {
    currentCardIndex = 0;
    correctAnswersCount = 0;
    renderFlashcard();
}

function ShowNodeDetails(nodeId) {
    let selectedNode = null;

    for (let i = 0; i < NodesArray.length; i++) {
        if (NodesArray[i].id === nodeId) {
            selectedNode = NodesArray[i];
            break;
        }
    }

    if (selectedNode !== null) {
        CloseNodeCard();
        currentOpenNodeId = nodeId; 
        cardTitle.innerText = selectedNode.label;
        cardDesc.innerText = selectedNode.description;
        nodeCard.style.display = 'block';

        currentFlashcards = selectedNode.flashcards || [];
        currentCardIndex = 0;
        correctAnswersCount = 0;
    }
}

function CloseNodeCard() {
    cardTitle.removeAttribute('contenteditable');
    cardDesc.removeAttribute('contenteditable');
    editTitleBtn.innerText = '✏️';
    editDescBtn.innerText = '✏️';
    
    nodeCard.style.display = 'none';
    currentOpenNodeId = null;
<<<<<<< Updated upstream

    CloseFlashcardsModal();
    currentFlashcards = [];
    document.getElementById('flashcardContainer').innerHTML = '';
    document.getElementById('fcProgress').innerText = '';
}
=======
}

window.onload = () => {
    InitGraphFromBackend();
};
>>>>>>> Stashed changes
