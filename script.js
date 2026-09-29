let selectedElements = []; 
let copiedData = null;
let isDragging = false;
let hasMoved = false;
let startX, startY, initialTransforms = new Map();

let isSelectingBox = false;
let boxStartX = 0, boxStartY = 0;

let isShelfPropsCollapsed = false;
let isShelfColorsCollapsed = false;
let activeOutflowContext = null;

let undoStack = [];
const maxHistory = 30;
const arreglo = [
  'canvas',
  'interactive-layer'
]

const svg = document.getElementById('canvas');
const interactiveLayer = document.getElementById('interactive-layer');
const selectionBoxLayer = document.getElementById('selection-box-layer');
const inspectorContent = document.getElementById('inspector-content');
const techSheetContainer = document.getElementById('tech-sheet-container');
const techSheetBody = document.getElementById('tech-sheet-body');
const btnCopy = document.getElementById('btn-copy');
const btnPaste = document.getElementById('btn-paste');
const btnUndo = document.getElementById('btn-undo');
const contextMenu = document.getElementById('context-menu');

const areaStyles = {
  'soldadura': { name: 'Soldadura (Rojo)', fill: '#dc2626', stroke: '#b91c1c', text: '#ffffff' },
  'electromecanica': { name: 'Electromecánica (Azul)', fill: '#2563eb', stroke: '#1d4ed8', text: '#ffffff' },
  'consumibles': { name: 'Consumibles (Amarillo)', fill: '#d97706', stroke: '#b45309', text: '#ffffff' },
  'electricidad': { name: 'Electricidad (Verde)', fill: '#16a34a', stroke: '#15803d', text: '#ffffff' },
  'plomeria': { name: 'Plomería (Naranja)', fill: '#ea580c', stroke: '#c2410c', text: '#ffffff' },
  'limpieza': { name: 'Limpieza (Celeste)', fill: '#0284c7', stroke: '#0369a1', text: '#ffffff' },
  'seguridad': { name: 'Seguridad (Vinotinto)', fill: '#4e0218', stroke: '#ffffff', text: '#ffffff' },
  'herramientas': { name: 'Herramientas (Morado)', fill: '#9333ea', stroke: '#7e22ce', text: '#ffffff' },
  'repuestos': { name: 'Repuestos Automotrices (Gris Oscuro)', fill: '#475569', stroke: '#334155', text: '#ffffff' },
  'guaya_fina': { name: 'Guaya Fina (Rosa)', fill: '#db2777', stroke: '#be185d', text: '#ffffff' },
  'ayt': { name: 'AYT (Índigo)', fill: '#4f46e5', stroke: '#4338ca', text: '#ffffff' },
  'llaves_hidraulicas': { name: 'Llaves Hidráulicas (Turquesa)', fill: '#0d9488', stroke: '#0f766e', text: '#ffffff' },
  'papeleria': { name: 'Papelería (Beige)', fill: '#f59e0b', stroke: '#d97706', text: '#ffffff' },
  'almacen': { name: 'Almacén (Lima)', fill: '#65a30d', stroke: '#4d7c0f', text: '#ffffff' },
  'repuestos_varios': { name: 'Repuestos Varios (Marrón)', fill: '#78350f', stroke: '#451a03', text: '#ffffff'},
  'comida': { name: 'Comida (Rosa Claro/Coral)', fill: '#f43f5e', stroke: '#e11d48', text: '#ffffff' },
  'archivo': { name: 'Archivo (Gris Pizarra)', fill: '#64748b', stroke: '#475569', text: '#ffffff' }
};

window.addEventListener('DOMContentLoaded', () => {
  let savedHTML = localStorage.getItem('warehouse_blueprint_html');
  if (savedHTML) interactiveLayer.innerHTML = savedHTML;
  renderAllShelvesCompartments();
  pushState();
});

function pushState() {
  undoStack.push(interactiveLayer.innerHTML);
  if (undoStack.length > maxHistory) {
    undoStack.shift();
  }
  btnUndo.removeAttribute('disabled');
}

function undoAction() {
  if (undoStack.length <= 1) return;
  undoStack.pop();
  let previousState = undoStack[undoStack.length - 1];
  interactiveLayer.innerHTML = previousState;
  clearSelection();
  renderAllShelvesCompartments();
  if (undoStack.length <= 1) {
    btnUndo.setAttribute('disabled', 'true');
  }
}

window.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
    e.preventDefault();
    undoAction();
  }
  if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElements.length > 0) {
    deleteSelected();
  }
});

window.addEventListener('click', () => {
  contextMenu.style.display = 'none';
});

function saveChanges() {
  clearSelection();
  localStorage.setItem('warehouse_blueprint_html', interactiveLayer.innerHTML);
  alert('¡Cambios guardados exitosamente!');
}

function resetCanvas() {
  if (confirm('¿Restablecer el plano a su estado original?')) {
    localStorage.removeItem('warehouse_blueprint_html');
    location.reload();
  }
}

function downloadFile() {
  clearSelection();
  let fullHtml = '<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="UTF-8">\n<title>Plano Almacén Wire Loggs Services</title>\n<style>\n' + 
    document.querySelector('style').innerHTML + 
    '\n</style>\n</head>\n<body>\n' + 
    document.querySelector('.app-container').outerHTML + 
    '\n<script>\n' + 
    document.querySelector('script').innerHTML + 
    '\n<\/script>\n</body>\n</html>';

  let blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
  let url = URL.createObjectURL(blob);
  let a = document.createElement('a');
  a.href = url;
  a.download = 'plano_almacen_wls.html';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function getTransformParams(el) {
  let transform = el.getAttribute('transform') || '';
  let tMatch = transform.match(/translate\(\s*([^\s,]+)[,\s]+([^\s,\)]+)\)/);
  let rMatch = transform.match(/rotate\(\s*([^\s,]+)(?:[,\s]+([^\s,]+)[,\s]+([^\s,\)]+))?\)/);
  return {
    tx: tMatch ? parseFloat(tMatch[1]) : 0,
    ty: tMatch ? parseFloat(tMatch[2]) : 0,
    ang: rMatch ? parseFloat(rMatch[1]) : 0
  };
}

function getSvgPoint(e) {
  let pt = svg.createSVGPoint();
  pt.x = e.clientX;
  pt.y = e.clientY;
  return pt.matrixTransform(svg.getScreenCTM().inverse());
}

svg.addEventListener('mousedown', (e) => {
  contextMenu.style.display = 'none';
  let target = e.target.closest('.draggable, .draggable-text');
  let pt = getSvgPoint(e);

  if (target) {
    if (e.shiftKey) {
      toggleSelectElement(target);
    } else {
      if (!selectedElements.includes(target)) {
        clearSelection();
        selectElement(target);
      }
    }
    isDragging = true;
    hasMoved = false;
    startX = e.clientX;
    startY = e.clientY;
    
    initialTransforms.clear();
    selectedElements.forEach(el => {
      initialTransforms.set(el, getTransformParams(el));
    });
    e.stopPropagation();
  } else if (e.target === svg || e.target.classList.contains('bg-element')) {
    if (!e.shiftKey) {
      clearSelection();
    }
    isSelectingBox = true;
    boxStartX = pt.x;
    boxStartY = pt.y;
    selectionBoxLayer.innerHTML = `<rect x="${boxStartX}" y="${boxStartY}" width="0" height="0"></rect>`;
  }
});

window.addEventListener('mousemove', (e) => {
  let pt = getSvgPoint(e);

  if (isSelectingBox) {
    let rx = Math.min(pt.x, boxStartX);
    let ry = Math.min(pt.y, boxStartY);
    let rw = Math.abs(pt.x - boxStartX);
    let rh = Math.abs(pt.y - boxStartY);
    selectionBoxLayer.innerHTML = `<rect x="${rx}" y="${ry}" width="${rw}" height="${rh}"></rect>`;
    return;
  }

  if (!isDragging || selectedElements.length === 0) return;
  let dx = e.clientX - startX;
  let dy = e.clientY - startY;

  if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
    hasMoved = true;
  }

  let ptBox = svg.getBoundingClientRect();
  let scaleX = 1400 / ptBox.width;
  let scaleY = 700 / ptBox.height;
  
  let moveX = dx * scaleX;
  let moveY = dy * scaleY;

  selectedElements.forEach(el => {
    let init = initialTransforms.get(el);
    if (!init) return;
    let newX = init.tx + moveX;
    let newY = init.ty + moveY;

    if (el.classList.contains('draggable')) {
      let w = parseFloat(el.dataset.w) || 50;
      let h = parseFloat(el.dataset.h) || 50;
      el.setAttribute('transform', `translate(${newX}, ${newY}) rotate(${init.ang}, ${w/2}, ${h/2})`);
    } else {
      el.setAttribute('transform', `translate(${newX}, ${newY})`);
    }
  });
});

window.addEventListener('mouseup', (e) => {
  if (isSelectingBox) {
    isSelectingBox = false;
    let rectEl = selectionBoxLayer.querySelector('rect');
    if (rectEl) {
      let rx = parseFloat(rectEl.getAttribute('x'));
      let ry = parseFloat(rectEl.getAttribute('y'));
      let rw = parseFloat(rectEl.getAttribute('width'));
      let rh = parseFloat(rectEl.getAttribute('height'));
      selectionBoxLayer.innerHTML = '';

      if (rw > 5 || rh > 5) {
        let allItems = interactiveLayer.querySelectorAll('.draggable, .draggable-text');
        if (!e.shiftKey) clearSelection();
        allItems.forEach(item => {
          let t = getTransformParams(item);
          let w = parseFloat(item.dataset.w) || 50;
          let h = parseFloat(item.dataset.h) || 50;
          if (item.classList.contains('draggable-text')) { w = 40; h = 20; }
          if (t.tx >= rx && t.tx <= rx + rw && t.ty >= ry && t.ty <= ry + rh) {
            addToSelection(item);
          }
        });
        updateUIAfterSelection();
      }
    }
  }

  if (isDragging) {
    isDragging = false;
    if (hasMoved) {
      pushState();
    }
  }
});

svg.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  let target = e.target.closest('.draggable, .draggable-text');
  if (target) {
    if (!selectedElements.includes(target)) {
      clearSelection();
      selectElement(target);
    }
  }
  if (selectedElements.length > 0) {
    contextMenu.style.display = 'block';
    contextMenu.style.left = `${e.clientX}px`;
    contextMenu.style.top = `${e.clientY}px`;
  } else {
    contextMenu.style.display = 'none';
  }
});

function selectElement(el) {
  clearSelection();
  addToSelection(el);
  updateUIAfterSelection();
}

function addToSelection(el) {
  if (!selectedElements.includes(el)) {
    selectedElements.push(el);
    if (el.classList.contains('draggable')) el.classList.add('selected');
    else el.classList.add('selected-text');
  }
}

function toggleSelectElement(el) {
  if (selectedElements.includes(el)) {
    selectedElements = selectedElements.filter(item => item !== el);
    el.classList.remove('selected', 'selected-text');
  } else {
    addToSelection(el);
  }
  updateUIAfterSelection();
}

function clearSelection() {
  selectedElements.forEach(el => {
    el.classList.remove('selected', 'selected-text');
  });
  selectedElements = [];
  btnCopy.setAttribute('disabled', 'true');
  inspectorContent.innerHTML = '<div class="no-selection">Selecciona cualquier objeto, pared o texto en el plano para editarlo.</div>';
  techSheetContainer.style.display = 'none';
}

function updateUIAfterSelection() {
  if (selectedElements.length > 0) {
    btnCopy.removeAttribute('disabled');
    if (selectedElements.length === 1) {
      renderInspectorForm();
      renderTechSheet();
    } else {
      techSheetContainer.style.display = 'none';
      inspectorContent.innerHTML = `
        <h4>Selección Múltiple (${selectedElements.length} elementos)</h4>
        <div style="font-size: 12px; color: #94a3b8; margin-bottom: 15px;">
          Puedes moverlos juntos arrastrándolos, copiarlos, o eliminarlos de manera simultánea.
        </div>
        <div class="btn-row">
          <button class="btn-delete" onclick="deleteSelected()">Eliminar Todos</button>
        </div>
      `;
    }
  } else {
    clearSelection();
  }
}

function toggleShelfProps() {
  isShelfPropsCollapsed = !isShelfPropsCollapsed;
  let body = document.getElementById('shelf-props-body');
  let btn = document.getElementById('btn-toggle-shelf-props');
  if (body) {
    body.style.display = isShelfPropsCollapsed ? 'none' : 'block';
  }
  if (btn) {
    btn.textContent = isShelfPropsCollapsed ? '▶️ Mostrar' : '🔽 Minimizar';
  }
}

function toggleShelfColors() {
  isShelfColorsCollapsed = !isShelfColorsCollapsed;
  let body = document.getElementById('shelf-colors-body');
  let btn = document.getElementById('btn-toggle-shelf-colors');
  if (body) {
    body.style.display = isShelfColorsCollapsed ? 'none' : 'block';
  }
  if (btn) {
    btn.textContent = isShelfColorsCollapsed ? '▶️ Mostrar' : '🔽 Minimizar';
  }
}

function renderInspectorForm() {
  if (selectedElements.length !== 1) return;
  let inspector = document.getElementById('inspector');
  let scrollPos = inspector ? inspector.scrollTop : 0;
  let selectedElement = selectedElements[0];
  let isTextOnly = selectedElement.classList.contains('drawing-text');
  let isWall = selectedElement.classList.contains('wall-item');
  let isDoor = selectedElement.classList.contains('door-item');
  let isWindow = selectedElement.classList.contains('window-item');
  let isShelf = selectedElement.classList.contains('shelf-item');
  let text = selectedElement.dataset.text || '';
  let fontSize = selectedElement.dataset.fontsize || '12';
  let w = selectedElement.dataset.w || 50;
  let h = selectedElement.dataset.h || 50;

  if (isShelf) {
    let comps = [];
    try {
      comps = JSON.parse(selectedElement.dataset.comp || '["","","","",""]');
    } catch(e) { comps = ["","","","",""]; }

    let totalComps = comps.length || 5;

    let subDivs = [];
    try {
      subDivs = JSON.parse(selectedElement.dataset.subdiv || '[]');
    } catch(e) { subDivs = []; }

    let compsHtml = '';
    for (let i = 0; i < totalComps; i++) {
      let currentVal = comps[i];
      let divs = subDivs[i] || 1;

      let subdivSelect = `
        <select onchange="updateCompartmentDivisions(${i}, parseInt(this.value))" style="width: 70px; margin-bottom: 4px;">
          <option value="1" ${divs === 1 ? 'selected' : ''}>1 Parte</option>
          <option value="2" ${divs === 2 ? 'selected' : ''}>2 Partes</option>
          <option value="3" ${divs === 3 ? 'selected' : ''}>3 Partes</option>
        </select>
      `;

      if (divs > 1) {
        let subAreas = Array.isArray(currentVal) ? currentVal : [currentVal, ...Array(divs - 1).fill('')];
        compsHtml += `<div class="compartment-row" style="flex-direction: column; align-items: flex-start; background: rgba(255,255,255,0.03); padding: 6px; border-radius: 4px; margin-bottom: 6px;">`;
        compsHtml += `<div style="display: flex; justify-content: space-between; width: 100%; align-items: center;"><span style="font-size: 11px; font-weight: bold;">Comp. ${i + 1}:</span> ${subdivSelect}</div>`;

        for (let subIdx = 0; subIdx < divs; subIdx++) {
          let subCurrVal = subAreas[subIdx] || '';
          let generatedOpts = `<option value="">-- Sin Área --</option>`;
          for (let key in areaStyles) {
            generatedOpts += `<option value="${key}" ${subCurrVal === key ? 'selected' : ''}>${areaStyles[key].name}</option>`;
          }
          compsHtml += `<div style="margin-left: 10px; margin-top: 3px; width: calc(100% - 10px);"><span style="font-size: 10px; color: #94a3b8;">Parte ${subIdx + 1}:</span> <select onchange="updateSubCompartmentArea(${i}, ${subIdx}, this.value)">${generatedOpts}</select></div>`;
        }
        compsHtml += `</div>`;
      } else {
        let singleVal = Array.isArray(currentVal) ? currentVal[0] : currentVal;
        let generatedOpts = `<option value="">-- Sin Área Específica --</option>`;
        for (let key in areaStyles) {
          generatedOpts += `<option value="${key}" ${singleVal === key ? 'selected' : ''}>${areaStyles[key].name}</option>`;
        }
        compsHtml += `
          <div class="compartment-row" style="margin-bottom: 6px;">
            <div style="display: flex; justify-content: space-between; width: 100%; align-items: center;">
              <label style="font-size: 11px;">Comp. ${i + 1}:</label>
              ${subdivSelect}
            </div>
            <select onchange="updateCompartment(${i}, this.value)">${generatedOpts}</select>
          </div>
        `;
      }
    }
    
    let displayStyle = isShelfPropsCollapsed ? 'none' : 'block';
    let btnText = isShelfPropsCollapsed ? '▶️ Mostrar' : '🔽 Minimizar';

    let displayColorsStyle = isShelfColorsCollapsed ? 'none' : 'block';
    let btnColorsText = isShelfColorsCollapsed ? '▶️ Mostrar' : '🔽 Minimizar';

    inspectorContent.innerHTML = `
      <div style="max-height: 500px; overflow-y: auto; padding-right: 4px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; border-bottom: 2px solid #334155; padding-bottom: 6px;">
          <h4 style="margin: 0; padding: 0; border: none; font-size: 14px;">Propiedades de Estante</h4>
          <button id="btn-toggle-shelf-props" onclick="toggleShelfProps()" style="background: #334155; color: #f8fafc; border: 1px solid #475569; padding: 2px 8px; border-radius: 4px; font-size: 11px; cursor: pointer; flex: none;">${btnText}</button>
        </div>
        
        <div id="shelf-props-body" style="display: ${displayStyle}; margin-bottom: 8px;">
          <label style="margin-bottom: 4px;">Nombre / ID: <input type="text" id="inp-text" value="${text}" oninput="updateProp('text', this.value)" style="margin-top: 2px; padding: 3px 6px;"></label>
          <label style="margin-bottom: 4px;">Tamaño Fuente: <input type="number" id="inp-fontsize" value="${fontSize}" oninput="updateProp('fontsize', this.value)" style="margin-top: 2px; padding: 3px 6px;"></label>
          <label style="margin-bottom: 4px;">Compartimentos:</label>
          <select id="inp-total-comps" onchange="changeTotalCompartments(parseInt(this.value))" style="margin-top: 2px; margin-bottom: 4px; padding: 3px 6px;">
            <option value="1" ${totalComps === 1 ? 'selected' : ''}>1 Compartimento</option>
            <option value="2" ${totalComps === 2 ? 'selected' : ''}>2 Compartimentos</option>
            <option value="3" ${totalComps === 3 ? 'selected' : ''}>3 Compartimentos</option>
            <option value="4" ${totalComps === 4 ? 'selected' : ''}>4 Compartimentos</option>
            <option value="5" ${totalComps === 5 ? 'selected' : ''}>5 Compartimentos</option>
            <option value="6" ${totalComps === 6 ? 'selected' : ''}>6 Compartimentos</option>
          </select>
          <label style="margin-bottom: 4px;">Ancho (px): <input type="number" id="inp-w" value="${w}" oninput="updateProp('width', this.value)" style="margin-top: 2px; padding: 3px 6px;"></label>
          <label style="margin-bottom: 4px;">Alto (px): <input type="number" id="inp-h" value="${h}" oninput="updateProp('height', this.value)" style="margin-top: 2px; padding: 3px 6px;"></label>
          <hr style="border-color: #334155; margin: 8px 0;">
        </div>
        
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; border-bottom: 1px solid #334155; padding-bottom: 4px;">
          <label style="color: #60a5fa; margin: 0; display: block;">Colores por compartimento:</label>
          <button id="btn-toggle-shelf-colors" onclick="toggleShelfColors()" style="background: #334155; color: #f8fafc; border: 1px solid #475569; padding: 2px 8px; border-radius: 4px; font-size: 11px; cursor: pointer; flex: none;">${btnColorsText}</button>
        </div>

        <div id="shelf-colors-body" style="display: ${displayColorsStyle};">
          ${compsHtml}
        </div>

        <div class="btn-row" style="margin-top: 10px;">
          <button onclick="rotateSelected(90)">Rotar +90°</button>
          <button class="btn-delete" onclick="deleteSelected()">Eliminar</button>
        </div>
      </div>
    `;

  } else {
    let currentArea = selectedElement.dataset.area || '';
    let areaOptions = `<option value="">-- Sin Área --</option>`;
    for (let key in areaStyles) {
      areaOptions += `<option value="${key}" ${currentArea === key ? 'selected' : ''}>${areaStyles[key].name}</option>`;
    }
    inspectorContent.innerHTML = `
      <h4>Propiedades de Objeto</h4>
      <label>Área / Uso:</label>
      <select id="inp-area" onchange="updateArea(this.value)">${areaOptions}</select>
      <label>Ancho (px): <input type="number" id="inp-w" value="${w}" oninput="updateProp('width', this.value)"></label>
      <label>Alto (px): <input type="number" id="inp-h" value="${h}" oninput="updateProp('height', this.value)"></label>
      <label>Nombre / ID: <input type="text" id="inp-text" value="${text}" oninput="updateProp('text', this.value)"></label>
      <div class="btn-row">
        <button onclick="rotateSelected(90)">Rotar +90°</button>
        <button class="btn-delete" onclick="deleteSelected()">Eliminar</button>
      </div>
    `;
  }

  if (inspector) {
    inspector.scrollTop = scrollPos;
  }
}

function updateTechTitle(val) {
  if (selectedElements.length !== 1 || !selectedElements[0].classList.contains('shelf-item')) return;
  let selectedElement = selectedElements[0];
  selectedElement.dataset.techtitle = val;
  pushState();
}

function renderTechSheet() {
  if (selectedElements.length !== 1 || !selectedElements[0].classList.contains('shelf-item')) {
    techSheetContainer.style.display = 'none';
    return;
  }

  let compartmentBoxes = techSheetBody.querySelectorAll('.tech-compartment-box');
  let scrollPositions = {};
  compartmentBoxes.forEach((box, idx) => {
    scrollPositions[idx] = box.scrollTop;
  });

  let selectedElement = selectedElements[0];
  let photoPreview = document.getElementById('shelf-photo-preview');
  let photoData = selectedElement.dataset.photo || '';
  if (photoData) {
    photoPreview.innerHTML = `<img src="${photoData}" onclick="openPhotoModal('${photoData}')" style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px; cursor: pointer;" title="Haz clic para ampliar la imagen">`;
  } else {
    photoPreview.innerHTML = `<span style="font-size: 10px; color: #94a3b8; text-align: center;">Sin foto</span>`;
  }

  let comps = [];
  try {
    comps = JSON.parse(selectedElement.dataset.comp || '[]');
  } catch(e) { comps = []; }

  let hasAssignedArea = comps.some(c => c !== "");
  if (!hasAssignedArea) {
    techSheetContainer.style.display = 'none';
    return;
  }

  techSheetContainer.style.display = 'block';

  let titleInput = document.getElementById('tech-shelf-title-input');
  let currentTechTitle = (selectedElement.dataset.techtitle !== undefined && selectedElement.dataset.techtitle !== '') 
    ? selectedElement.dataset.techtitle 
    : (selectedElement.dataset.text || 'Estante');

  if (titleInput && document.activeElement !== titleInput) {
    titleInput.value = currentTechTitle;
  }

  let techData = [];
  try {
    techData = JSON.parse(selectedElement.dataset.tech || '[]');
  } catch(e) { techData = []; }

  let searchInput = document.getElementById('shelf-search-input');
  let searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';

  let html = '';
  let matchesCount = 0;

  for (let i = 0; i < comps.length; i++) {
    let areaKey = comps[i];
    if (!areaKey) continue; 

    let areaLabel = areaStyles[areaKey] ? areaStyles[areaKey].name : 'Área';
    let articles = techData[i] || [];

    let matchesCompartment = false;

    if (!searchTerm) {
      matchesCompartment = true;
    } else {
      let compTitle = `compartimento ${i + 1}`;
      if (areaLabel.toLowerCase().includes(searchTerm) || compTitle.includes(searchTerm)) {
        matchesCompartment = true;
      }

      if (!matchesCompartment) {
        let matchesArticles = articles.some(art => 
          (art.name && art.name.toLowerCase().includes(searchTerm)) ||
          (art.code && String(art.code).toLowerCase().includes(searchTerm)) ||
          (art.qty && String(art.qty).toLowerCase().includes(searchTerm)) ||
          (art.eq && art.eq.toLowerCase().includes(searchTerm))
        );
        if (matchesArticles) {
          matchesCompartment = true;
        }
      }
    }

    if (!matchesCompartment) continue;

    matchesCount++;

    let articlesHtml = '';
    if (articles.length === 0) {
      articlesHtml = `<div style="font-size: 11px; color: #94a3b8; font-style: italic; margin-bottom: 8px;">No hay artículos registrados.</div>`;
    } else {
      articles.forEach((art, artIdx) => {
        let isMatch = false;

        if (searchTerm !== '') {
          let nameMatch = art.name && art.name.toLowerCase().includes(searchTerm);
          let codeMatch = art.code && String(art.code).trim().toLowerCase() === searchTerm;
          let eqMatch = art.eq && art.eq.toLowerCase().includes(searchTerm);
          let qtyMatch = art.qty && String(art.qty).trim().toLowerCase() === searchTerm;

          if (nameMatch || codeMatch || eqMatch || qtyMatch) {
            isMatch = true;
          }
        }

        let highlightClass = isMatch ? ' highlight-exact' : '';

        let equivalenciaHtml = '';
        if (areaKey === 'consumibles') {
          equivalenciaHtml = `
            <label class="field-eq">Equivalencia:
              <input type="text" value="${art.eq || ''}" placeholder="Ej. Lts / Pza" 
                     oninput="updateArticleData(${i}, ${artIdx}, 'eq', this.value)">
            </label>
          `;
        }

        articlesHtml += `
          <div class="article-row${highlightClass}">
            <div class="article-row-top">
              <label class="field-name">Nombre del Artículo:
                <input type="text" value="${art.name || ''}" placeholder="Ej. Artículo o herramienta" 
                       oninput="updateArticleData(${i}, ${artIdx}, 'name', this.value)"
                       onblur="sortAndRefreshTechSheet(${i})">
              </label>
            </div>
            <div class="article-row-bottom">
              <label class="field-code">Código:
                <input type="text" value="${art.code || ''}" placeholder="Ej. 293" 
                       oninput="updateArticleData(${i}, ${artIdx}, 'code', this.value)">
              </label>
              <label class="field-qty">Cantidad:
                <input type="number" min="0" value="${art.qty !== undefined ? art.qty : ''}" placeholder="Ej. 1" 
                       oninput="updateArticleData(${i}, ${artIdx}, 'qty', this.value)">
              </label>
              ${equivalenciaHtml}
              <button class="btn-outflow-article" onclick="openOutflowModal(${i}, ${artIdx})" title="Registrar Salida de Inventario">📦</button>
              <button class="btn-remove-article" onclick="removeArticle(${i}, ${artIdx})" title="Eliminar artículo">🗑️</button>
            </div>
          </div>
        `;
      });
    }

    html += `
      <div class="tech-compartment-box">
        <h4>Compartimento ${i + 1} (${areaLabel})</h4>
        ${articlesHtml}
        <button class="btn-add-article" onclick="addArticle(${i})">+ Agregar Artículo</button>
      </div>
    `;
  }

  if (matchesCount === 0 && searchTerm) {
    html = `<div style="grid-column: 1 / -1; font-size: 12px; color: #94a3b8; text-align: center; padding: 15px;">
              No se encontraron compartimentos que coincidan con "${searchTerm}".
            </div>`;
  }

  techSheetBody.innerHTML = html;

  let newCompartmentBoxes = techSheetBody.querySelectorAll('.tech-compartment-box');
  newCompartmentBoxes.forEach((box, idx) => {
    if (scrollPositions[idx] !== undefined) {
      box.scrollTop = scrollPositions[idx];
    }
  });
}

function addArticle(compIndex) {
  if (selectedElements.length !== 1 || !selectedElements[0].classList.contains('shelf-item')) return;
  let selectedElement = selectedElements[0];
  let tech = [];
  try {
    tech = JSON.parse(selectedElement.dataset.tech || '[]');
  } catch(e) { tech = []; }

  let comps = [];
  try {
    comps = JSON.parse(selectedElement.dataset.comp || '[]');
  } catch(e) { comps = []; }

  while(tech.length < comps.length) {
    tech.push([]);
  }

  if (!Array.isArray(tech[compIndex])) {
    tech[compIndex] = [];
  }

  tech[compIndex].push({ name: '', code: '', qty: '', eq: '' });
  selectedElement.dataset.tech = JSON.stringify(tech);
  renderTechSheet();
  setTimeout(() => {
    let compartmentBoxes = techSheetBody.querySelectorAll('.tech-compartment-box');
    if (compartmentBoxes[compIndex]) {
      compartmentBoxes[compIndex].scrollTop = compartmentBoxes[compIndex].scrollHeight;
    }
  }, 0);

  pushState();
}

function removeArticle(compIndex, artIndex) {
  if (selectedElements.length !== 1 || !selectedElements[0].classList.contains('shelf-item')) return;
  let selectedElement = selectedElements[0];
  let tech = [];
  try {
    tech = JSON.parse(selectedElement.dataset.tech || '[]');
  } catch(e) { tech = []; }

  if (tech[compIndex] && Array.isArray(tech[compIndex])) {
    tech[compIndex].splice(artIndex, 1);
    selectedElement.dataset.tech = JSON.stringify(tech);
    renderTechSheet();
    pushState();
  }
}

function updateArticleData(compIndex, artIndex, field, val) {
  if (selectedElements.length !== 1 || !selectedElements[0].classList.contains('shelf-item')) return;
  let selectedElement = selectedElements[0];
  let tech = [];
  try {
    tech = JSON.parse(selectedElement.dataset.tech || '[]');
  } catch(e) { tech = []; }

  if (tech[compIndex] && tech[compIndex][artIndex]) {
    tech[compIndex][artIndex][field] = val;
    selectedElement.dataset.tech = JSON.stringify(tech);
    pushState();
  }
}

function changeTotalCompartments(newTotal) {
  if (selectedElements.length !== 1 || !selectedElements[0].classList.contains('shelf-item')) return;
  let selectedElement = selectedElements[0];
  let comps = [];
  try {
    comps = JSON.parse(selectedElement.dataset.comp || '["","","","",""]');
  } catch(e) { comps = ["","","","",""]; }

  let tech = [];
  try {
    tech = JSON.parse(selectedElement.dataset.tech || '[]');
  } catch(e) { tech = []; }

  let newComps = [];
  let newTech = [];
  for (let i = 0; i < newTotal; i++) {
    newComps.push(comps[i] !== undefined ? comps[i] : "");
    newTech.push(tech[i] !== undefined ? tech[i] : []);
  }
  selectedElement.dataset.comp = JSON.stringify(newComps);
  selectedElement.dataset.tech = JSON.stringify(newTech);
  redrawShelfCompartments(selectedElement);
  renderInspectorForm();
  renderTechSheet();
  pushState();
}

function updateCompartment(index, areaKey) {
  if (selectedElements.length !== 1 || !selectedElements[0].classList.contains('shelf-item')) return;
  let selectedElement = selectedElements[0];
  let comps = [];
  try {
    comps = JSON.parse(selectedElement.dataset.comp || '["","","","",""]');
  } catch(e) { comps = ["","","","",""]; }
  comps[index] = areaKey;
  selectedElement.dataset.comp = JSON.stringify(comps);
  redrawShelfCompartments(selectedElement);
  renderInspectorForm();
  renderTechSheet();
  pushState();
}

function redrawShelfCompartments(shelfEl) {
  let w = parseFloat(shelfEl.dataset.w) || 90;
  let h = parseFloat(shelfEl.dataset.h) || 54;
  let compsGroup = shelfEl.querySelector('.shelf-compartments');
  if (!compsGroup) return;

  let comps = [];
  try {
    comps = JSON.parse(shelfEl.dataset.comp || '["","","","",""]');
  } catch(e) { comps = ["","","","",""]; }

  let subDivs = [];
  try {
    subDivs = JSON.parse(shelfEl.dataset.subdiv || '[]');
  } catch(e) { subDivs = []; }

  let total = comps.length || 5;
  let compWidth = w / total;
  let html = '';

  for (let i = 0; i < total; i++) {
    let xPos = i * compWidth;
    let areaKey = comps[i];
    let divisions = subDivs[i] || 1;

    if (divisions > 1) {
      let subWidth = compWidth / divisions;
      let subAreas = Array.isArray(areaKey) ? areaKey : [areaKey, ...Array(divisions - 1).fill('')];

      for (let j = 0; j < divisions; j++) {
        let subX = xPos + (j * subWidth);
        let subAreaKey = subAreas[j] || '';
        let fillCol = '#e2e8f0';
        let strokeCol = '#2563eb';

        if (subAreaKey && areaStyles[subAreaKey]) {
          fillCol = areaStyles[subAreaKey].fill;
          strokeCol = areaStyles[subAreaKey].stroke;
        }
        html += `<rect x="${subX}" y="0" width="${subWidth}" height="${h}" fill="${fillCol}" stroke="${strokeCol}" stroke-width="1" />`;
      }
      for (let j = 1; j < divisions; j++) {
        let lineX = xPos + (j * subWidth);
        html += `<line x1="${lineX}" y1="0" x2="${lineX}" y2="${h}" stroke="#1e293b" stroke-width="1" stroke-dasharray="2" />`;
      }
    } else {
      let fillCol = '#e2e8f0';
      let strokeCol = '#2563eb';
      let singleArea = Array.isArray(areaKey) ? areaKey[0] : areaKey;

      if (singleArea && areaStyles[singleArea]) {
        fillCol = areaStyles[singleArea].fill;
        strokeCol = areaStyles[singleArea].stroke;
      }
      html += `<rect x="${xPos}" y="0" width="${compWidth}" height="${h}" fill="${fillCol}" stroke="${strokeCol}" stroke-width="1.5" />`;
    }
  }
  compsGroup.innerHTML = html;
}

function renderAllShelvesCompartments() {
  let shelves = interactiveLayer.querySelectorAll('.shelf-item');
  shelves.forEach(shelf => {
    if (!shelf.dataset.photo) {
      shelf.dataset.photo = "";
    }
    if (!shelf.dataset.comp) {
      shelf.dataset.comp = '["","","","",""]';
    }
    if (!shelf.dataset.tech) {
      let defaultTech = [];
      for(let i=0; i<5; i++) defaultTech.push([]);
      shelf.dataset.tech = JSON.stringify(defaultTech);
    }
    if (!shelf.dataset.fontsize) {
      shelf.dataset.fontsize = "12";
    }
    let labelEl = shelf.querySelector('.shelf-label');
    if (labelEl) {
      labelEl.setAttribute('font-size', shelf.dataset.fontsize);
    }
    redrawShelfCompartments(shelf);
  });
}

function updateProp(prop, val) {
  if (selectedElements.length !== 1) return;
  let selectedElement = selectedElements[0];
  let isTextOnly = selectedElement.classList.contains('draggable-text');

  if (prop === 'text') {
    selectedElement.dataset.text = val;
    if (isTextOnly) {
      let txt = selectedElement.querySelector('text');
      if (txt) txt.textContent = val;
    } else if (selectedElement.classList.contains('shelf-item')) {
      let labelEl = selectedElement.querySelector('.shelf-label');
      if (labelEl) labelEl.textContent = val;
      renderTechSheet();
    }
  } else if (prop === 'fontsize') {
    selectedElement.dataset.fontsize = val;
    let txt = selectedElement.querySelector('.shelf-label') || selectedElement.querySelector('text');
    if (txt) txt.setAttribute('font-size', val);
  } else if (!isTextOnly) {
    let w = parseFloat(selectedElement.dataset.w);
    let h = parseFloat(selectedElement.dataset.h);
    
    if (prop === 'width') {
      selectedElement.dataset.w = val;
      w = parseFloat(val) || 10;
      let rect = selectedElement.querySelector('rect');
      if (rect) rect.setAttribute('width', w);
      let labelEl = selectedElement.querySelector('.shelf-label');
      if (labelEl) labelEl.setAttribute('x', w / 2);
    } else if (prop === 'height') {
      selectedElement.dataset.height = val;
      h = parseFloat(val) || 10;
      let rect = selectedElement.querySelector('rect');
      if (rect) rect.setAttribute('height', h);
    }

    if (selectedElement.classList.contains('shelf-item')) {
      redrawShelfCompartments(selectedElement);
    }
    
    let current = getTransformParams(selectedElement);
    selectedElement.setAttribute('transform', `translate(${current.tx}, ${current.ty}) rotate(${current.ang}, ${w/2}, ${h/2})`);
  }
  pushState();
}

function updateArea(areaKey) {
  if (selectedElements.length !== 1) return;
  let selectedElement = selectedElements[0];
  selectedElement.dataset.area = areaKey;
  let rect = selectedElement.querySelector('rect');
  let txt = selectedElement.querySelector('text');
  if (areaKey && areaStyles[areaKey]) {
    let style = areaStyles[areaKey];
    if (rect) rect.setAttribute('fill', style.fill);
    if (rect) rect.setAttribute('stroke', style.stroke);
    if (txt && !selectedElement.classList.contains('shelf-item')) txt.setAttribute('fill', style.text);
  } else {
    if (rect) rect.setAttribute('fill', '#e2e8f0');
    if (rect) rect.setAttribute('stroke', '#2563eb');
    if (txt && !selectedElement.classList.contains('shelf-item')) txt.setAttribute('fill', '#1e293b');
  }
  pushState();
}

function rotateSelected(angleStep) {
  if (selectedElements.length !== 1 || selectedElements[0].classList.contains('draggable-text')) return;
  let selectedElement = selectedElements[0];
  let current = getTransformParams(selectedElement);
  let newAng = (current.ang + angleStep) % 360;
  let w = parseFloat(selectedElement.dataset.w) || 50;
  let h = parseFloat(selectedElement.dataset.h) || 50;
  selectedElement.setAttribute('transform', `translate(${current.tx}, ${current.ty}) rotate(${newAng}, ${w/2}, ${h/2})`);
  pushState();
}

function deleteSelected() {
  if (selectedElements.length > 0 && confirm(`¿Eliminar los ${selectedElements.length} elementos seleccionados?`)) {
    selectedElements.forEach(el => el.remove());
    clearSelection();
    pushState();
  }
}

function menuDelete() {
  contextMenu.style.display = 'none';
  deleteSelected();
}

function addWall() {
  let g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.setAttribute('class', 'draggable wall-item');
  g.setAttribute('transform', 'translate(200, 200) rotate(0, 100, 6)');
  g.dataset.w = "200";
  g.dataset.h = "12";
  g.dataset.text = "Nueva Pared";
  g.innerHTML = `<rect x="0" y="0" width="200" height="12" fill="#1e293b" stroke="#1e293b" stroke-width="1" />`;
  interactiveLayer.appendChild(g);
  selectElement(g);
  pushState();
}

function addDoor() {
  let g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.setAttribute('class', 'draggable door-item');
  g.setAttribute('transform', 'translate(220, 220) rotate(0, 50, 6)');
  g.dataset.w = "100";
  g.dataset.h = "12";
  g.dataset.text = "Nueva Puerta";
  g.innerHTML = `<rect x="0" y="0" width="100" height="12" fill="#94a3b8" stroke="#475569" stroke-width="2" rx="2" />`;
  interactiveLayer.appendChild(g);
  selectElement(g);
  pushState();
}

function addWindow() {
  let g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.setAttribute('class', 'draggable window-item');
  g.setAttribute('transform', 'translate(240, 240) rotate(0, 60, 6)');
  g.dataset.w = "120";
  g.dataset.h = "12";
  g.dataset.text = "Nueva Ventana";
  g.innerHTML = `<rect x="0" y="0" width="120" height="12" fill="#bae6fd" stroke="#0284c7" stroke-width="2" rx="2" />`;
  interactiveLayer.appendChild(g);
  selectElement(g);
  pushState();
}

function addShelf() {
  let g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.setAttribute('class', 'draggable shelf-item');
  g.dataset.photo = "";
  g.setAttribute('transform', 'translate(300, 300) rotate(0, 45, 27)');
  g.dataset.w = "90";
  g.dataset.h = "54";
  g.dataset.text = "Nuevo Estante";
  g.dataset.fontsize = "12";
  g.dataset.comp = '["","","","",""]';
  g.dataset.tech = JSON.stringify([[],[],[],[],[]]);
  g.innerHTML = `
    <text class="shelf-label" x="45" y="-5" font-size="12" fill="#000000" font-weight="bold" text-anchor="middle">Nuevo Estante</text>
    <rect x="0" y="0" width="90" height="54" fill="#e2e8f0" stroke="#2563eb" stroke-width="2" />
    <g class="shelf-compartments" transform="translate(0, 0)"></g>
  `;
  interactiveLayer.appendChild(g);
  redrawShelfCompartments(g);
  selectElement(g);
  pushState();
}

function addPallet() {
  let g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.setAttribute('class', 'draggable anim-estiba');
  g.setAttribute('transform', 'translate(350, 300) rotate(0, 40, 40)');
  g.dataset.w = "80";
  g.dataset.h = "80";
  g.dataset.text = "Estiba";
  g.innerHTML = `
    <rect x="0" y="0" width="80" height="80" fill="#fef3c7" stroke="#d97706" stroke-width="2.5" rx="4" />
    <line x1="0" y1="26" x2="80" y2="26" stroke="#d97706" stroke-width="1.5" stroke-dasharray="4" />
    <line x1="0" y1="53" x2="80" y2="53" stroke="#d97706" stroke-width="1.5" stroke-dasharray="4" />
    <text x="50%" y="50%" font-size="11" fill="#92400e" font-weight="bold" text-anchor="middle" dominant-baseline="central">Estiba</text>
  `;
  interactiveLayer.appendChild(g);
  selectElement(g);
  pushState();
}

function addPC() {
  let g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.setAttribute('class', 'draggable pc-station');
  g.setAttribute('transform', 'translate(300, 300) rotate(0, 50, 40)');
  g.dataset.w = "100";
  g.dataset.h = "80";
  g.dataset.text = "PC Estación";
  g.innerHTML = `
    <rect class="pc-desk" x="0" y="0" width="100" height="70" fill="#e2e8f0" stroke="#2563eb" stroke-width="2" rx="4" />
    <rect class="pc-monitor" x="25" y="8" width="50" height="28" fill="#0f172a" rx="2" stroke="#64748b" stroke-width="1.5" />
    <rect class="pc-stand" x="42" y="36" width="16" height="4" fill="#64748b" />
    <circle class="pc-led" cx="50" cy="22" r="1" fill="#2563eb" />
    <rect class="pc-keyboard" x="35" y="46" width="30" height="10" fill="#cbd5e1" rx="1" />
    <ellipse class="pc-mouse" cx="72" cy="51" rx="4" ry="5" fill="#cbd5e1" />
    <path class="pc-chair" d="M 35 70 C 35 62, 65 62, 65 70 L 68 85 C 68 88, 32 88, 32 85 Z" fill="#cbd5e1" stroke="#1e293b" stroke-width="1.5" opacity="0.9" />
    <text class="pc-label" x="50" y="35" font-size="9" fill="#1e293b" font-weight="bold" text-anchor="middle" dominant-baseline="central">PC Estación</text>
  `;
  interactiveLayer.appendChild(g);
  selectElement(g);
  pushState();
}

function addGenericBox() {
  let g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.setAttribute('class', 'draggable');
  g.setAttribute('transform', 'translate(300, 300) rotate(0, 40, 40)');
  g.dataset.w = "80";
  g.dataset.h = "80";
  g.dataset.text = "Objeto";
  g.innerHTML = `<rect x="0" y="0" width="80" height="80" fill="#e2e8f0" stroke="#2563eb" stroke-width="2" rx="4" /><text x="50%" y="50%" font-size="11" fill="#1e293b" text-anchor="middle" dominant-baseline="central">Objeto</text>`;
  interactiveLayer.appendChild(g);
  selectElement(g);
  pushState();
}

function addCustomText() {
  let g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.setAttribute('class', 'draggable-text');
  g.setAttribute('transform', 'translate(300, 300)');
  g.dataset.text = "Nuevo Texto";
  g.dataset.fontsize = "12";
  g.innerHTML = `<text x="0" y="0" font-size="12" fill="#1e293b" text-anchor="middle">Nuevo Texto</text>`;
  interactiveLayer.appendChild(g);
  selectElement(g);
  pushState();
}

function copySelected() {
  if (selectedElements.length === 0) return;
  copiedData = selectedElements.map(el => {
    let current = getTransformParams(el);
    let isTextOnly = el.classList.contains('draggable-text');
    return {
      type: isTextOnly ? 'text' : 'object',
      w: el.dataset.w,
      h: el.dataset.h,
      text: el.dataset.text,
      techtitle: el.dataset.techtitle || '',
      fontsize: el.dataset.fontsize || '12',
      area: el.dataset.area || '',
      comp: el.dataset.comp || null,
      tech: el.dataset.tech || null,
      htmlContent: el.innerHTML,
      className: el.getAttribute('class'),
      tx: current.tx,
      ty: current.ty,
      ang: current.ang,
      photo: el.dataset.photo || '',
    };
  });
  btnPaste.removeAttribute('disabled');
  contextMenu.style.display = 'none';
}

function menuCopy() {
  contextMenu.style.display = 'none';
  copySelected();
}

function pasteElement() {
  if (!copiedData || copiedData.length === 0) return;
  clearSelection();

  let newElements = [];
  copiedData.forEach(item => {
    let g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', item.className);
    let pasteX = item.tx + 30;
    let pasteY = item.ty + 30;

    if (item.type === 'text') {
      g.setAttribute('transform', `translate(${pasteX}, ${pasteY})`);
      g.dataset.text = item.text;
      g.dataset.photo = item.photo || "";
      g.dataset.fontsize = item.fontsize;
      g.innerHTML = item.htmlContent;
    } else {
      let w = parseFloat(item.w);
      let h = parseFloat(item.h);
      g.setAttribute('transform', `translate(${pasteX}, ${pasteY}) rotate(${item.ang}, ${w/2}, ${h/2})`);
      g.dataset.w = item.w;
      g.dataset.h = item.h;
      g.dataset.text = item.text;
      if (item.techtitle) g.dataset.techtitle = item.techtitle;
      g.dataset.fontsize = item.fontsize || "12";
      if (item.area) g.dataset.area = item.area;
      if (item.comp) g.dataset.comp = item.comp;
      if (item.tech) g.dataset.tech = item.tech;
      g.innerHTML = item.htmlContent;
      let labelEl = g.querySelector('.shelf-label');
      if (labelEl) labelEl.setAttribute('font-size', g.dataset.fontsize);
    }
    interactiveLayer.appendChild(g);
    if (g.classList.contains('shelf-item')) {
      redrawShelfCompartments(g);
    }
    addToSelection(g);
    newElements.push(g);
  });

  updateUIAfterSelection();
  pushState();
  contextMenu.style.display = 'none';
}

function menuPaste() {
  contextMenu.style.display = 'none';
  pasteElement();
}

function searchShelf(query) {
  let searchTerm = query.trim().toLowerCase();
  clearSelection();

  if (!searchTerm) return;

  let allElements = interactiveLayer.querySelectorAll('.draggable');
  let exactCodeMatches = [];
  let otherMatches = [];

  allElements.forEach(el => {
    let isExactCodeMatch = false;
    let isOtherMatch = false;

    if (el.classList.contains('shelf-item')) {
      try {
        let techData = JSON.parse(el.dataset.tech || '[]');
        techData.forEach(compartment => {
          if (Array.isArray(compartment)) {
            compartment.forEach(art => {
              let code = art.code !== undefined && art.code !== null ? String(art.code).trim().toLowerCase() : '';
              let name = art.name ? String(art.name).trim().toLowerCase() : '';
              let eq = art.eq ? String(art.eq).trim().toLowerCase() : '';

              if (code !== '' && code === searchTerm) {
                isExactCodeMatch = true;
              }
              else if (name.includes(searchTerm) || eq.includes(searchTerm)) {
                isOtherMatch = true;
              }
            });
          }
        });
      } catch(e) {}

      if (!isExactCodeMatch && !isOtherMatch) {
        try {
          let compData = JSON.parse(el.dataset.comp || '[]');
          let flatComps = compData.flat();
          flatComps.forEach(areaKey => {
            if (areaKey && areaStyles[areaKey]) {
              let areaName = areaStyles[areaKey].name.toLowerCase();
              if (areaName.includes(searchTerm)) {
                isOtherMatch = true;
              }
            }
          });
        } catch(e) {}
      }
    }

    let elName = (el.dataset.text || '').trim().toLowerCase();
    if (elName === searchTerm) {
      isExactCodeMatch = true;
    } else if (elName.includes(searchTerm) && !isExactCodeMatch) {
      isOtherMatch = true;
    }

    if (isExactCodeMatch) {
      exactCodeMatches.push(el);
    } else if (isOtherMatch) {
      otherMatches.push(el);
    }
  });

  let finalResults = exactCodeMatches.length > 0 ? exactCodeMatches : otherMatches;

  if (finalResults.length > 0) {
    finalResults.forEach(el => addToSelection(el));
    updateUIAfterSelection();
    finalResults[0].scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
  }
}

function clearSearch() {
  let input = document.getElementById('shelf-search-input');
  if (input) input.value = '';
  clearSelection();
}

function openOutflowModal(compIndex, artIndex) {
  if (selectedElements.length !== 1 || !selectedElements[0].classList.contains('shelf-item')) return;
  let selectedElement = selectedElements[0];
  let tech = [];
  try { tech = JSON.parse(selectedElement.dataset.tech || '[]'); } catch(e) { tech = []; }

  let article = tech[compIndex] ? tech[compIndex][artIndex] : null;
  if (!article) return;

  activeOutflowContext = { compIndex, artIndex, article };

  document.getElementById('outflow-art-name').textContent = article.name || 'Artículo sin nombre';
  document.getElementById('outflow-art-stock').textContent = `Disponible actual: ${article.qty !== undefined && article.qty !== '' ? article.qty : 0}`;
  document.getElementById('outflow-qty-input').value = '';
  document.getElementById('outflow-note-input').value = '';

  let modal = document.getElementById('modal-outflow');
  if (modal) modal.style.display = 'flex';
}

function closeOutflowModal() {
  activeOutflowContext = null;
  let modal = document.getElementById('modal-outflow');
  if (modal) modal.style.display = 'none';
}

function confirmOutflow() {
  if (!activeOutflowContext || selectedElements.length !== 1) return;
  
  let { compIndex, artIndex, article } = activeOutflowContext;
  let currentQty = parseInt(article.qty) || 0;
  let withdrawQty = parseInt(document.getElementById('outflow-qty-input').value) || 0;
  let note = document.getElementById('outflow-note-input').value.trim();

  if (withdrawQty <= 0) {
    alert('Ingresa una cantidad válida a retirar.');
    return;
  }

  if (withdrawQty > currentQty) {
    alert(`La cantidad a retirar (${withdrawQty}) supera el stock actual disponible (${currentQty}).`);
    return;
  }

  let newQty = currentQty - withdrawQty;
  let selectedElement = selectedElements[0];
  let tech = JSON.parse(selectedElement.dataset.tech || '[]');
  
  tech[compIndex][artIndex].qty = newQty;
  selectedElement.dataset.tech = JSON.stringify(tech);

  let now = new Date();
  let timestamp = now.toLocaleDateString('es-ES') + ' ' + now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  let outflowRecord = {
    date: timestamp,
    shelf: selectedElement.dataset.text || 'Estante',
    comp: compIndex + 1,
    artName: article.name || 'Sin Nombre',
    artCode: article.code || 'S/C',
    withdrawQty: withdrawQty,
    remainingQty: newQty,
    note: note || 'Sin observaciones'
  };

  let history = JSON.parse(localStorage.getItem('warehouse_outflow_history') || '[]');
  history.unshift(outflowRecord);
  localStorage.setItem('warehouse_outflow_history', JSON.stringify(history));

  closeOutflowModal();
  renderTechSheet();
  pushState();

  alert(`✅ Salida registrada exitosamente:\n- ${withdrawQty} unidad(es) de "${article.name}"\n- Quedan disponibles: ${newQty}`);
}

function addSignNoSmoking() {
  let g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.setAttribute('class', 'draggable');
  g.setAttribute('transform', 'translate(300, 300) rotate(0, 25, 25)');
  g.dataset.w = "50";
  g.dataset.h = "50";
  g.dataset.text = "No Fumar";
  g.innerHTML = `
    <circle cx="25" cy="25" r="23" fill="#ffffff" stroke="#dc2626" stroke-width="4" />
    <circle cx="25" cy="25" r="16" fill="none" stroke="#dc2626" stroke-width="3" />
    <line x1="14" y1="36" x2="36" y2="14" stroke="#dc2626" stroke-width="3" />
    <path d="M 18 27 Q 21 25 24 27 T 30 27" fill="none" stroke="#000" stroke-width="1.5" />
  `;
  interactiveLayer.appendChild(g);
  selectElement(g);
  pushState();
}

function addSignDanger() {
  let g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.setAttribute('class', 'draggable');
  g.setAttribute('transform', 'translate(300, 300) rotate(0, 25, 25)');
  g.dataset.w = "50";
  g.dataset.h = "50";
  g.dataset.text = "Peligro";
  g.innerHTML = `
    <polygon points="25,3 48,45 2,45" fill="#facc15" stroke="#ca8a04" stroke-width="3" />
    <text x="25" y="36" font-size="22" font-weight="bold" fill="#000000" text-anchor="middle">!</text>
  `;
  interactiveLayer.appendChild(g);
  selectElement(g);
  pushState();
}

function addSignFireExtinguisher() {
  let g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.setAttribute('class', 'draggable');
  g.setAttribute('transform', 'translate(300, 300) rotate(0, 25, 25)');
  g.dataset.w = "50";
  g.dataset.h = "50";
  g.dataset.text = "Extintor";
  g.innerHTML = `
    <rect x="3" y="3" width="44" height="44" rx="6" fill="#dc2626" stroke="#991b1b" stroke-width="2" />
    <rect x="20" y="14" width="10" height="20" rx="2" fill="#ffffff" />
    <rect x="22" y="10" width="6" height="4" fill="#ffffff" />
    <path d="M 23 10 Q 15 8 15 14" fill="none" stroke="#ffffff" stroke-width="2" />
    <text x="25" y="41" font-size="8" font-weight="bold" fill="#ffffff" text-anchor="middle">EXTINTOR</text>
  `;
  interactiveLayer.appendChild(g);
  selectElement(g);
  pushState();
}

function addSignElectrical() {
  let g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.setAttribute('class', 'draggable');
  g.setAttribute('transform', 'translate(300, 300) rotate(0, 25, 25)');
  g.dataset.w = "50";
  g.dataset.h = "50";
  g.dataset.text = "Riesgo Eléctrico";
  g.innerHTML = `
    <polygon points="25,3 48,45 2,45" fill="#facc15" stroke="#ca8a04" stroke-width="3" />
    <polygon points="26,12 17,28 24,28 22,38 34,22 26,22" fill="#000000" />
  `;
  interactiveLayer.appendChild(g);
  selectElement(g);
  pushState();
}

function addSignExit() {
  let g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.setAttribute('class', 'draggable');
  g.setAttribute('transform', 'translate(300, 300) rotate(0, 30, 20)');
  g.dataset.w = "60";
  g.dataset.h = "40";
  g.dataset.text = "Salida de Emergencia";
  g.innerHTML = `
    <rect x="2" y="2" width="56" height="36" rx="4" fill="#16a34a" stroke="#14532d" stroke-width="2" />
    <text x="30" y="24" font-size="11" font-weight="bold" fill="#ffffff" text-anchor="middle">SALIDA</text>
  `;
  interactiveLayer.appendChild(g);
  selectElement(g);
  pushState();
}

function addSignPPE() {
  let g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.setAttribute('class', 'draggable');
  g.setAttribute('transform', 'translate(300, 300) rotate(0, 25, 25)');
  g.dataset.w = "50";
  g.dataset.h = "50";
  g.dataset.text = "Uso Obligatorio de EPP";
  g.innerHTML = `
    <circle cx="25" cy="25" r="23" fill="#2563eb" stroke="#1d4ed8" stroke-width="3" />
    <circle cx="25" cy="24" r="10" fill="none" stroke="#ffffff" stroke-width="3" />
    <path d="M 12 36 Q 25 31 38 36" fill="none" stroke="#ffffff" stroke-width="3" />
  `;
  interactiveLayer.appendChild(g);
  selectElement(g);
  pushState();
}

function sortAndRefreshTechSheet(compIndex) {
  if (selectedElements.length !== 1 || !selectedElements[0].classList.contains('shelf-item')) return;
  let selectedElement = selectedElements[0];
  let tech = [];
  try {
    tech = JSON.parse(selectedElement.dataset.tech || '[]');
  } catch(e) { tech = []; }

  if (tech[compIndex] && Array.isArray(tech[compIndex])) {
    tech[compIndex].sort((a, b) => {
      let nameA = (a.name || '').toLowerCase();
      let nameB = (b.name || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });
    selectedElement.dataset.tech = JSON.stringify(tech);
    pushState();
    renderTechSheet();
  }
}

function updateCompartmentDivisions(index, numDivs) {
  if (selectedElements.length !== 1 || !selectedElements[0].classList.contains('shelf-item')) return;
  let selectedElement = selectedElements[0];
  
  let subDivs = [];
  try { subDivs = JSON.parse(selectedElement.dataset.subdiv || '[]'); } catch(e) { subDivs = []; }
  subDivs[index] = numDivs;
  selectedElement.dataset.subdiv = JSON.stringify(subDivs);

  let comps = [];
  try { comps = JSON.parse(selectedElement.dataset.comp || '[]'); } catch(e) { comps = []; }
  
  if (numDivs > 1) {
    if (!Array.isArray(comps[index])) {
      comps[index] = [comps[index] || '', ...Array(numDivs - 1).fill('')];
    } else {
      while(comps[index].length < numDivs) comps[index].push('');
    }
  } else {
    if (Array.isArray(comps[index])) {
      comps[index] = comps[index][0] || '';
    }
  }
  selectedElement.dataset.comp = JSON.stringify(comps);

  redrawShelfCompartments(selectedElement);
  renderInspectorForm();
  pushState();
}

function updateSubCompartmentArea(compIndex, subIndex, areaKey) {
  if (selectedElements.length !== 1 || !selectedElements[0].classList.contains('shelf-item')) return;
  let selectedElement = selectedElements[0];
  
  let comps = [];
  try { comps = JSON.parse(selectedElement.dataset.comp || '[]'); } catch(e) { comps = []; }

  if (!Array.isArray(comps[compIndex])) {
    comps[compIndex] = [comps[compIndex] || ''];
  }
  comps[compIndex][subIndex] = areaKey;
  selectedElement.dataset.comp = JSON.stringify(comps);

  redrawShelfCompartments(selectedElement);
  pushState();
}

function handleShelfPhotoUpload(input) {
  if (selectedElements.length !== 1 || !selectedElements[0].classList.contains('shelf-item')) return;
  let selectedElement = selectedElements[0];
  
  if (input.files && input.files[0]) {
    let reader = new FileReader();
    reader.onload = function(e) {
      selectedElement.dataset.photo = e.target.result;
      renderTechSheet();
      pushState();
    };
    reader.readAsDataURL(input.files[0]);
  }
}

function removeShelfPhoto() {
  if (selectedElements.length !== 1 || !selectedElements[0].classList.contains('shelf-item')) return;
  let selectedElement = selectedElements[0];
  selectedElement.dataset.photo = "";
  let fileInput = document.getElementById('shelf-photo-input');
  if (fileInput) fileInput.value = "";
  renderTechSheet();
  pushState();
}

function openPhotoModal(imgSrc) {
  let modal = document.getElementById('photo-modal');
  let modalImg = document.getElementById('modal-img');
  if (modal && modalImg) {
    modalImg.src = imgSrc;
    modal.style.display = 'flex';
  }
}

function closePhotoModal() {
  let modal = document.getElementById('photo-modal');
  if (modal) {
    modal.style.display = 'none';
  }
}

function openHistoryModal() {
  renderHistoryTable();
  let modal = document.getElementById('modal-history');
  if (modal) modal.style.display = 'flex';
}

function closeHistoryModal() {
  let modal = document.getElementById('modal-history');
  if (modal) modal.style.display = 'none';
}

function renderHistoryTable() {
  let tbody = document.getElementById('history-table-body');
  let filter = (document.getElementById('history-filter-input')?.value || '').trim().toLowerCase();
  let history = JSON.parse(localStorage.getItem('warehouse_outflow_history') || '[]');

  if (!tbody) return;

  let filtered = history.filter(item => {
    if (!filter) return true;
    return (item.artCode && String(item.artCode).toLowerCase().includes(filter)) ||
           (item.artName && String(item.artName).toLowerCase().includes(filter)) ||
           (item.shelf && String(item.shelf).toLowerCase().includes(filter)) ||
           (item.note && String(item.note).toLowerCase().includes(filter));
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 15px; color: #94a3b8;">No hay registros de salidas que coincidan.</td></tr>`;
    return;
  }

  let html = '';
  filtered.forEach(item => {
    html += `
      <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
        <td style="padding: 8px; white-space: nowrap; color: #cbd5e1;">${item.date}</td>
        <td style="padding: 8px;">${item.shelf} (C${item.comp})</td>
        <td style="padding: 8px; font-weight: bold; color: #f59e0b;">${item.artCode}</td>
        <td style="padding: 8px; font-weight: bold;">${item.artName}</td>
        <td style="padding: 8px; text-anchor: middle; text-align: center; color: #ef4444; font-weight: bold;">-${item.withdrawQty}</td>
        <td style="padding: 8px; text-anchor: middle; text-align: center; color: #22c55e;">${item.remainingQty}</td>
        <td style="padding: 8px; color: #94a3b8; font-style: italic;">${item.note}</td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}

function clearHistory() {
  if (confirm('¿Estás seguro de que deseas borrar todo el historial de salidas registrado?')) {
    localStorage.removeItem('warehouse_outflow_history');
    renderHistoryTable();
  }
}

function exportHistoryCSV() {
  let history = JSON.parse(localStorage.getItem('warehouse_outflow_history') || '[]');
  if (history.length === 0) {
    alert('No hay datos en el historial para exportar.');
    return;
  }

  let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
  csvContent += "Fecha y Hora;Estante;Compartimento;Codigo;Nombre / Articulo;Cantidad Retirada;Stock Restante;Nota / OT\n";

  history.forEach(row => {
    csvContent += `"${row.date}";"${row.shelf}";"${row.comp}";"${row.artCode}";"${row.artName}";"${row.withdrawQty}";"${row.remainingQty}";"${row.note}"\n`;
  });

  let encodedUri = encodeURI(csvContent);
  let link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `historial_salidas_almacen_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}