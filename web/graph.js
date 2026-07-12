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

// Переменная для отслеживания перетаскиваемой вершины
let draggingNodeId = null;

const COLOR_DEFAULT = '#6366f1';
const COLOR_FROZEN = '#f59e0b';

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
    
    InitRandomGraph();
}

function InitRandomGraph() {
    NodesArray = [];
    const edgesArray = [];
    const nodeCount = 30;

    for (let i = 1; i <= nodeCount; i++) {
        NodesArray.push({
            id: i,
            label: "Concept #" + i,
            title: "Concept #" + i,
            description: "This is a randomly generated description for Concept #" + i + ". When connected to the backend, this will show real definitions from the textbook."
        });
    }

    for (let i = 1; i <= nodeCount; i++) {
        const target1 = Math.floor(Math.random() * nodeCount) + 1;
        const target2 = Math.floor(Math.random() * nodeCount) + 1;

        if (i !== target1) {
            edgesArray.push({ from: i, to: target1 });
        }
        if (i !== target2) {
            if (target1 !== target2) {
                edgesArray.push({ from: i, to: target2 });
            }
        }
    }

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
                centralGravity: 0.01,          
                springLength: 180,             
                springConstant: 0.005,          
                damping: 0.09 
            },
            maxVelocity: 50,
            minVelocity: 0.05,
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

    // Отслеживаем начало и конец перетаскивания
    network.on('dragStart', function(params) {
        if (params.nodes && params.nodes.length > 0) {
            draggingNodeId = params.nodes[0];
        }
    });

    network.on('dragEnd', function(params) {
        // dragEnd может приходить с пустым params.nodes, поэтому сбрасываем всегда
        draggingNodeId = null;
    });

    network.on("click", function (params) {
        if (params.nodes && params.nodes.length > 0) {
            const clickedNodeId = params.nodes[0];
            ShowNodeDetails(clickedNodeId);
        } else {
            CloseNodeCard();
        }
    });

    // Обработчик клавиши F: поддерживает фриз как для выбранной, так и для перетаскиваемой вершины
    window.addEventListener("keydown", function(event) {
        if (event.key.toLowerCase() === 'f') {
            // Выбираем сначала выделенную вершину, иначе — ту, что перетаскивается
            let selectedNodes = [];
            try {
                selectedNodes = network.getSelectedNodes() || [];
            } catch (e) {
                selectedNodes = [];
            }

            let nodeId = null;
            if (selectedNodes.length > 0) {
                nodeId = selectedNodes[0];
            } else if (draggingNodeId !== null) {
                nodeId = draggingNodeId;
            }

            if (nodeId === null) return;

            const nodeData = data.nodes.get(nodeId) || {};
            const isFrozen = nodeData.fixed && nodeData.fixed.x === true;

            // Если вершина перетаскивалась — корректно завершаем drag
            try {
                if (typeof network.releaseNode === 'function') {
                    network.releaseNode();
                } else if (typeof network.unselectAll === 'function') {
                    // fallback: снимаем выделение, чтобы прервать возможные состояния
                    network.unselectAll();
                }
            } catch (e) {
                // игнорируем ошибки API
            }

            // Получаем текущие координаты вершины
            let pos = null;
            try {
                const positions = network.getPositions([nodeId]);
                pos = positions ? positions[nodeId] : null;
            } catch (e) {
                pos = null;
            }

            // Формируем обновление узла
            const update = {
                id: nodeId,
                fixed: { x: !isFrozen, y: !isFrozen },
                color: {
                    background: isFrozen ? COLOR_DEFAULT : COLOR_FROZEN,
                    border: isFrozen ? COLOR_DEFAULT : COLOR_FROZEN
                }
            };

            // Если мы фризим (переключаем в true) — явно задаём координаты, чтобы зафиксировать в текущем месте
            if (!isFrozen && pos) {
                update.x = pos.x;
                update.y = pos.y;
            }

            // Если мы размораживаем — не трогаем x/y (физика сможет двигать узел дальше)
            data.nodes.update(update);

            // Обнуляем скорость и силы в теле сети, чтобы узел не "рывком" уехал
            try {
                const bodyNode = network.body && network.body.nodes ? network.body.nodes[nodeId] : null;
                if (bodyNode) {
                    bodyNode.vx = 0;
                    bodyNode.vy = 0;
                    bodyNode.fx = 0;
                    bodyNode.fy = 0;
                }
            } catch (e) {
                // игнорируем
            }

            // Сбрасываем переменную перетаскивания
            draggingNodeId = null;
        }
    });
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
    const updates = allIds.map(nodeId => {
        return {
            id: nodeId,
            fixed: { x: false, y: false },
            color: {
                background: COLOR_DEFAULT,
                border: COLOR_DEFAULT
            }
        };
    });

    data.nodes.update(updates);
    // Сброс переменной перетаскивания на всякий случай
    draggingNodeId = null;
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
    }
}

function CloseNodeCard() {
    cardTitle.removeAttribute('contenteditable');
    cardDesc.removeAttribute('contenteditable');
    editTitleBtn.innerText = '✏️';
    editDescBtn.innerText = '✏️';
    
    nodeCard.style.display = 'none';
    currentOpenNodeId = null;
}
