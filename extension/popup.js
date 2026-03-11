console.log("PreencheJa - popup ready");

const statusText = document.getElementById("status-text");
const statusDot = document.querySelector(".status-dot");
const progressFill = document.querySelector(".progress-fill");
const automationSelect = document.getElementById("automation-select");
const automationList = document.querySelector(".automation-list");
const excelInput = document.getElementById("excel-file");
const dropZone = document.querySelector(".drop-zone");
const excelStatus = document.getElementById("excel-status");

let recordingTabId = null;

function setStatus(text, color = "#22c55e") {
  statusText.textContent = `Status: ${text}`;
  statusDot.style.backgroundColor = color;
}

function setProgress(value) {
  progressFill.style.width = `${value}%`;
}

function safeSendMessage(tabId, payload, cb) {
  chrome.tabs.sendMessage(tabId, payload, (response) => {
    if (chrome.runtime.lastError) {
      setStatus("Erro: aba sem script ativo", "#ef4444");
      if (cb) cb(null);
      return;
    }
    if (cb) cb(response);
  });
}

function loadAutomations() {
  chrome.storage.local.get(["automations"], (result) => {
    const automations = result.automations || [];
    renderAutomations(automations);
  });
}

function renderAutomations(automations) {
  automationSelect.innerHTML = "<option>Selecionar automacao...</option>";
  automationList.innerHTML = "";

  automations.forEach((automation, index) => {
    const opt = document.createElement("option");
    opt.value = index;
    opt.textContent = automation.name || `Automacao ${index + 1}`;
    automationSelect.appendChild(opt);

    const item = document.createElement("div");
    item.className = "item";
    item.innerHTML = `
      <span>${opt.textContent}</span>
      <button class="delete-small" data-index="${index}" title="Deletar">✖</button>
    `;
    automationList.appendChild(item);
  });
}

function deleteAutomationByIndex(index) {
  chrome.storage.local.get(["automations"], (result) => {
    const automations = result.automations || [];
    if (index < 0 || index >= automations.length) return;
    automations.splice(index, 1);
    chrome.storage.local.set({ automations }, () => {
      setStatus("Automacao deletada", "#ef4444");
      loadAutomations();
    });
  });
}

document.getElementById("start-btn").onclick = () => {
  chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
    const tabId = tabs[0]?.id;
    if (!tabId) return;
    recordingTabId = tabId;

    safeSendMessage(tabId, { action: "startRecording" }, () => {
      setStatus("Gravando... SHIFT=preencher | CTRL=click", "#ef4444");
      setProgress(100);
    });
  });
};

document.getElementById("stop-btn").onclick = () => {
  if (!recordingTabId) {
    setStatus("Nenhuma gravacao ativa", "#f59e0b");
    return;
  }

  safeSendMessage(recordingTabId, { action: "stopRecording" }, () => {
    safeSendMessage(recordingTabId, { action: "getActions" }, (response) => {
      if (!response?.actions?.length) {
        setStatus("Nenhuma acao gravada", "#f59e0b");
        return;
      }

      chrome.tabs.get(recordingTabId, (tab) => {
        if (chrome.runtime.lastError) {
          setStatus("Erro ao ler aba", "#ef4444");
          return;
        }

        const url = tab?.url || "desconhecida";
        const name = prompt("Nome da automacao:") || `Automacao ${Date.now()}`;

        const automation = {
          name,
          url,
          actions: response.actions
        };

        chrome.storage.local.get(["automations"], (result) => {
          const automations = result.automations || [];
          automations.push(automation);

          chrome.storage.local.set({ automations }, () => {
            setStatus("Automacao salva!", "#10b981");
            setProgress(0);
            recordingTabId = null;
            loadAutomations();
          });
        });
      });
    });
  });
};

document.getElementById("run-btn").onclick = () => {
  const selectedIndex = parseInt(automationSelect.value, 10);
  if (Number.isNaN(selectedIndex)) {
    setStatus("Selecione uma automacao", "#f59e0b");
    return;
  }

  chrome.storage.local.get(["automations", "excelData"], (result) => {
    const automations = result.automations || [];
    const automation = automations[selectedIndex];
    if (!automation) {
      setStatus("Automacao nao encontrada", "#f59e0b");
      return;
    }

    chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
      const tabId = tabs[0]?.id;
      if (!tabId) return;

      setStatus("Executando automacao...", "#3b82f6");
      safeSendMessage(tabId, {
        action: "runAutomation",
        automation,
        excelData: result.excelData || null
      }, (response) => {
        if (response?.ok) {
          setStatus("Automacao concluida", "#10b981");
        } else {
          setStatus("Falha na execucao", "#ef4444");
        }
      });
    });
  });
};

document.getElementById("delete-main-btn").onclick = () => {
  const selectedIndex = parseInt(automationSelect.value, 10);
  if (Number.isNaN(selectedIndex)) {
    setStatus("Selecione uma automacao", "#f59e0b");
    return;
  }
  deleteAutomationByIndex(selectedIndex);
};

automationList.addEventListener("click", (e) => {
  const btn = e.target.closest(".delete-small");
  if (!btn) return;
  const index = parseInt(btn.dataset.index, 10);
  if (Number.isNaN(index)) return;
  deleteAutomationByIndex(index);
});

dropZone.addEventListener("click", () => excelInput.click());
dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropZone.classList.add("dragover");
});
dropZone.addEventListener("dragleave", () => dropZone.classList.remove("dragover"));
dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropZone.classList.remove("dragover");
  if (e.dataTransfer?.files?.length) {
    handleExcelFile(e.dataTransfer.files[0]);
  }
});
excelInput.addEventListener("change", (e) => {
  if (e.target.files?.length) handleExcelFile(e.target.files[0]);
});

function handleExcelFile(file) {
  if (typeof XLSX === "undefined") {
    setStatus("Erro: biblioteca XLSX nao carregada", "#ef4444");
    excelStatus.textContent = "Erro: coloque xlsx.full.min.js em extension/vendor/";
    return;
  }
  const reader = new FileReader();
  reader.onload = (evt) => {
    const data = new Uint8Array(evt.target.result);
    const workbook = XLSX.read(data, { type: "array" });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: "" });
    const headers = rows[0] || [];
    const dataRows = rows.slice(1).filter((r) => r.length > 0);

    const excelData = { headers, rows: dataRows };
    chrome.storage.local.set({ excelData }, () => {
      excelStatus.textContent = `Arquivo carregado: ${dataRows.length} linhas`;
      setStatus("Excel carregado", "#10b981");
    });
  };
  reader.readAsArrayBuffer(file);
}

loadAutomations();
