const DISK_SIZE = 100;
const BLOCK_CAPACITY = 50;

const state = {
  files: new Map(),
  blocks: Array.from({ length: DISK_SIZE }, () => ({ owner: null, index: false, data: "", next: -1 })),
  selectedBlock: null
};

const els = {
  fileName: document.getElementById("fileName"),
  fileSize: document.getElementById("fileSize"),
  method: document.getElementById("method"),
  fileData: document.getElementById("fileData"),
  message: document.getElementById("message"),
  directoryBody: document.getElementById("directoryBody"),
  directoryCount: document.getElementById("directoryCount"),
  diskGrid: document.getElementById("diskGrid"),
  diskHint: document.getElementById("diskHint"),
  diskUsage: document.getElementById("diskUsage"),
  fileCount: document.getElementById("fileCount"),
  usedBlocks: document.getElementById("usedBlocks"),
  freeBlocks: document.getElementById("freeBlocks"),
  currentMethod: document.getElementById("currentMethod"),
  methodTitle: document.getElementById("methodTitle"),
  methodText: document.getElementById("methodText"),
  methodVisual: document.getElementById("methodVisual")
};

const methodInfo = {
  Contiguous: {
    title: "Contiguous Allocation",
    text: "The file occupies consecutive blocks. It is simple and fast, but external fragmentation can make large files harder to place.",
    visual: ["B10", "B11", "B12", "B13"]
  },
  Linked: {
    title: "Linked Allocation",
    text: "Blocks may be scattered across the disk and are connected using next-block pointers. File growth is flexible, but random access is slower.",
    visual: ["B5 →", "B22 →", "B8 →", "NULL"]
  },
  Indexed: {
    title: "Indexed Allocation",
    text: "A separate index block stores references to the file's data blocks. This supports direct access while adding index-block overhead.",
    visual: ["INDEX", "B7", "B19", "B31"]
  }
};

function showMessage(text, type = "info") {
  els.message.textContent = text;
  els.message.className = `message ${type}`;
}

function normalizeName(name) {
  return name.trim();
}

function availableBlocks(count, exclude = new Set()) {
  const list = [];
  for (let i = 0; i < DISK_SIZE && list.length < count; i++) {
    if (!state.blocks[i].owner && !exclude.has(i)) list.push(i);
  }
  return list;
}

function contiguousBlocks(count) {
  for (let start = 0; start <= DISK_SIZE - count; start++) {
    let good = true;
    for (let i = start; i < start + count; i++) {
      if (state.blocks[i].owner) { good = false; break; }
    }
    if (good) return Array.from({ length: count }, (_, j) => start + j);
  }
  return null;
}

function allocateFile(name, size, method) {
  if (method === "Contiguous") {
    const blocks = contiguousBlocks(size);
    if (!blocks) return null;
    return { blocks, indexBlock: null };
  }

  if (method === "Linked") {
    const blocks = availableBlocks(size);
    if (blocks.length < size) return null;
    return { blocks, indexBlock: null };
  }

  if (method === "Indexed") {
    const idx = availableBlocks(1)[0];
    if (idx === undefined) return null;
    const blocks = availableBlocks(size, new Set([idx]));
    if (blocks.length < size) return null;
    return { blocks, indexBlock: idx };
  }

  return null;
}

function createFile() {
  const name = normalizeName(els.fileName.value);
  const size = Number(els.fileSize.value);
  const method = els.method.value;

  if (!name || !Number.isInteger(size) || size < 1 || size > DISK_SIZE) {
    showMessage("Enter a valid file name and a size from 1 to 100 blocks.", "error");
    return;
  }
  if (state.files.has(name)) {
    showMessage("A file with that name already exists.", "error");
    return;
  }

  const allocation = allocateFile(name, size, method);
  if (!allocation) {
    showMessage("Allocation failed. The selected method could not find enough suitable free space.", "error");
    return;
  }

  const file = {
    name,
    size,
    method,
    blocks: allocation.blocks,
    indexBlock: allocation.indexBlock,
    data: ""
  };

  state.files.set(name, file);
  file.blocks.forEach((blockId, pos) => {
    state.blocks[blockId].owner = name;
    state.blocks[blockId].next = file.blocks[pos + 1] ?? -1;
    state.blocks[blockId].index = false;
  });

  if (file.indexBlock !== null) {
    state.blocks[file.indexBlock].owner = name;
    state.blocks[file.indexBlock].index = true;
  }

  updateUI();
  highlightFile(name);
  showMessage(`Created ${name} using ${method} allocation.`, "success");
}

function writeFile() {
  const name = normalizeName(els.fileName.value);
  const file = state.files.get(name);
  if (!file) {
    showMessage("File not found. Create the file first.", "error");
    return;
  }

  const data = els.fileData.value;
  const required = Math.max(1, Math.ceil(data.length / BLOCK_CAPACITY));
  if (required > file.size) {
    showMessage(`Write failed. ${name} has ${file.size} block(s), so it can store about ${file.size * BLOCK_CAPACITY} characters in this demo.`, "error");
    return;
  }

  file.data = data;
  file.blocks.forEach((blockId, i) => {
    const start = i * BLOCK_CAPACITY;
    state.blocks[blockId].data = data.slice(start, start + BLOCK_CAPACITY);
  });
  updateUI();
  highlightFile(name);
  showMessage(`Wrote data to ${name}.`, "success");
}

function readFile() {
  const name = normalizeName(els.fileName.value);
  const file = state.files.get(name);
  if (!file) {
    showMessage("File not found.", "error");
    return;
  }
  els.fileData.value = file.data;
  highlightFile(name);
  showMessage(`Read operation successful for ${name}.`, "success");
}

function deleteFile() {
  const name = normalizeName(els.fileName.value);
  const file = state.files.get(name);
  if (!file) {
    showMessage("File not found.", "error");
    return;
  }

  file.blocks.forEach(blockId => {
    state.blocks[blockId] = { owner: null, index: false, data: "", next: -1 };
  });
  if (file.indexBlock !== null) {
    state.blocks[file.indexBlock] = { owner: null, index: false, data: "", next: -1 };
  }
  state.files.delete(name);
  els.fileData.value = "";
  updateUI();
  showMessage(`Deleted ${name} and released its blocks.`, "success");
}

function resetSystem() {
  if (!state.files.size) {
    showMessage("The disk is already empty.", "info");
    return;
  }
  state.files.clear();
  state.blocks = Array.from({ length: DISK_SIZE }, () => ({ owner: null, index: false, data: "", next: -1 }));
  state.selectedBlock = null;
  els.fileData.value = "";
  updateUI();
  showMessage("Disk reset. All files and allocations were cleared.", "success");
}

function blockLabel(blockId) {
  const block = state.blocks[blockId];
  if (!block.owner) return "FREE";
  if (block.index) return "INDEX";
  return block.owner.length > 8 ? block.owner.slice(0, 8) : block.owner;
}

function renderDisk() {
  els.diskGrid.innerHTML = "";
  state.blocks.forEach((block, i) => {
    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = "block";
    if (block.owner) cell.classList.add("used");
    if (block.index) cell.classList.add("index");
    if (state.selectedBlock === i) cell.classList.add("selected");
    cell.title = block.owner ? `${i}: ${block.index ? "Index block" : block.owner}` : `${i}: Free`;
    cell.innerHTML = `<span>${i}</span>${block.owner ? `<small>${blockLabel(i)}</small>` : ""}`;
    cell.addEventListener("click", () => inspectBlock(i));
    els.diskGrid.appendChild(cell);
  });
}

function inspectBlock(i) {
  state.selectedBlock = i;
  const block = state.blocks[i];
  if (!block.owner) {
    els.diskHint.textContent = `Block ${i} is free.`;
  } else if (block.index) {
    const file = state.files.get(block.owner);
    els.diskHint.textContent = `Block ${i} is the index block for ${block.owner}. Data blocks: ${file.blocks.join(", ")}`;
  } else {
    const next = block.next === -1 ? "NULL" : `Block ${block.next}`;
    els.diskHint.textContent = `Block ${i} belongs to ${block.owner}. Next block: ${next}.`;
  }
  renderDisk();
}

function renderDirectory() {
  els.directoryBody.innerHTML = "";
  if (!state.files.size) {
    els.directoryBody.innerHTML = `<tr><td colspan="4" class="empty-state">No files yet.</td></tr>`;
  } else {
    state.files.forEach(file => {
      const row = document.createElement("tr");
      row.innerHTML = `<td><strong>${escapeHtml(file.name)}</strong></td><td>${file.size}</td><td>${file.method}</td><td>${file.indexBlock !== null ? `I:${file.indexBlock} → ` : ""}${file.blocks.join(", ")}</td>`;
      row.addEventListener("dblclick", () => {
        els.fileName.value = file.name;
        els.fileSize.value = file.size;
        els.method.value = file.method;
        els.fileData.value = file.data;
        highlightFile(file.name);
      });
      els.directoryBody.appendChild(row);
    });
  }
  const count = state.files.size;
  els.directoryCount.textContent = `${count} ${count === 1 ? "entry" : "entries"}`;
}

function highlightFile(name) {
  const file = state.files.get(name);
  if (!file) return;
  state.selectedBlock = file.blocks[0] ?? file.indexBlock;
  renderDisk();
  els.diskHint.textContent = `${name}: ${file.method} allocation • ${file.blocks.length} data block(s)${file.indexBlock !== null ? ` • index block ${file.indexBlock}` : ""}`;
}

function renderMethodInfo() {
  const method = els.method.value;
  const info = methodInfo[method];
  els.currentMethod.textContent = method;
  els.methodTitle.textContent = info.title;
  els.methodText.textContent = info.text;
  els.methodVisual.innerHTML = info.visual.map(item => `<span>${item}</span>`).join("");
}

function updateUI() {
  const used = state.blocks.filter(b => b.owner).length;
  els.fileCount.textContent = state.files.size;
  els.usedBlocks.textContent = used;
  els.freeBlocks.textContent = DISK_SIZE - used;
  els.diskUsage.textContent = `${used} / ${DISK_SIZE} blocks`;
  renderDirectory();
  renderDisk();
  renderMethodInfo();
}

function escapeHtml(value) {
  return value.replace(/[&<>\"]/g, ch => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '\"': "&quot;"}[ch]));
}

document.getElementById("createBtn").addEventListener("click", createFile);
document.getElementById("writeBtn").addEventListener("click", writeFile);
document.getElementById("readBtn").addEventListener("click", readFile);
document.getElementById("deleteBtn").addEventListener("click", deleteFile);
document.getElementById("resetBtn").addEventListener("click", resetSystem);
els.method.addEventListener("change", renderMethodInfo);

updateUI();
