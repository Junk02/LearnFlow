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

    network.on("click", function (params) {
        if (params.nodes.length > 0) {
            const clickedNodeId = params.nodes[0];
            ShowNodeDetails(clickedNodeId);
        } else {
            CloseNodeCard();
        }
    });

    window.addEventListener("keydown", function(event) {
        if (event.key.toLowerCase() === 'f') {
            const selectedNodes = network.getSelectedNodes();
            if (selectedNodes.length > 0) {
                const nodeId = selectedNodes[0];
                const nodeData = data.nodes.get(nodeId);
                const isFrozen = nodeData.fixed && nodeData.fixed.x === true;
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