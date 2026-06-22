let recording = false;
let actions = [];
let recordingBar = null;
let inputIndex = 0;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "startRecording") {
    recording = true;
    actions = [];
    inputIndex = 0;
    createRecordingBar();
    return true;
  }

  if (message.action === "stopRecording") {
    recording = false;
    recordingBar?.remove();
  }

  if (message.action === "getActions") {
    sendResponse({ actions });
    return true;
  }

  if (message.action === "runAutomation") {
    runAutomation(message.automation, message.excelData).then((ok) => {
      sendResponse({ ok });
    });
    return true;
  }
});

function createRecordingBar() {
  if (document.getElementById("automacao-bar")) return;

  recordingBar = document.createElement("div");
  recordingBar.id = "automacao-bar";

  recordingBar.style.cssText = `
    position: fixed;
    top: 40%;
    left: 20px;
    z-index: 2147483647;
    width: 160px;
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    border-radius: 16px;
    box-shadow: 0 15px 35px rgba(0,0,0,0.4);
    padding: 15px;
    text-align: center;
    color: white;
    font-family: system-ui;
    cursor: move;
  `;

  recordingBar.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <strong>REC</strong>
      <button id="close-bar" style="
        background:none;
        border:none;
        color:white;
        font-weight:bold;
        cursor:pointer;
        font-size:16px;
      ">X</button>
    </div>
    <div style="font-size:11px;margin-top:10px;">
      SHIFT = preencher<br>
      CTRL = clicar
    </div>
  `;

  document.body.appendChild(recordingBar);

  document.getElementById("close-bar").onclick = () => {
    recording = false;
    recordingBar.remove();
  };

  makeDraggable(recordingBar);
}

document.addEventListener("click", (e) => {
  if (!recording) return;
  if (e.target.closest("#automacao-bar")) return;

  const clickTarget = e.target instanceof Element ? e.target : null;
  const inputTarget = getInputElement(e.target) || getInputElement(document.activeElement);

  if (e.shiftKey && inputTarget) {
    recordInputAction(inputTarget);
  }

  if (e.ctrlKey && clickTarget) {
    recordClickAction(clickTarget);
  }
}, true);

let shiftLatch = false;
document.addEventListener("keydown", (e) => {
  if (!recording) return;
  if (e.key !== "Shift" || e.repeat || shiftLatch) return;
  const inputTarget = getInputElement(document.activeElement);
  if (!inputTarget) return;
  shiftLatch = true;
  recordInputAction(inputTarget);
}, true);

document.addEventListener("keyup", (e) => {
  if (e.key === "Shift") shiftLatch = false;
}, true);

function recordInputAction(target) {
  const selectorInfo = getBestSelector(target);
  const value = getElementValue(target);
  actions.push({
    selector: selectorInfo.selector,
    selectorType: selectorInfo.selectorType,
    xpath: selectorInfo.xpath,
    delay: 500,
    type: "input",
    value,
    inputIndex: inputIndex++
  });
  showFeedback(target, "Preencher OK", "#10b981");
}

function recordClickAction(target) {
  const selectorInfo = getBestSelector(target);
  actions.push({
    selector: selectorInfo.selector,
    selectorType: selectorInfo.selectorType,
    xpath: selectorInfo.xpath,
    delay: 800,
    type: "click"
  });
  showFeedback(target, "Clicar OK", "#3b82f6");
}

function getInputElement(el) {
  if (!el || !(el instanceof Element)) return null;
  const candidate = el.closest("input,select,textarea,[contenteditable='true'],[role='textbox']");
  return candidate || null;
}

function getElementValue(el) {
  if (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT") {
    return el.value ?? "";
  }
  if (el.isContentEditable) {
    return el.textContent ?? "";
  }
  return "";
}

function getBestSelector(el) {
  const css = getUniqueCssSelector(el);
  if (css) {
    return { selector: css, selectorType: "css", xpath: getXPath(el) };
  }
  const xpath = getXPath(el);
  return { selector: xpath, selectorType: "xpath", xpath };
}

function getUniqueCssSelector(el) {
  if (!(el instanceof Element)) return null;

  const id = el.getAttribute("id");
  if (id && isUniqueSelector(`#${CSS.escape(id)}`)) {
    return `#${CSS.escape(id)}`;
  }

  const name = el.getAttribute("name");
  if (name && isUniqueSelector(`${el.tagName.toLowerCase()}[name="${CSS.escape(name)}"]`)) {
    return `${el.tagName.toLowerCase()}[name="${CSS.escape(name)}"]`;
  }

  const testId = el.getAttribute("data-testid") || el.getAttribute("data-test") || el.getAttribute("data-qa");
  if (testId && isUniqueSelector(`[data-testid="${CSS.escape(testId)}"]`)) {
    return `[data-testid="${CSS.escape(testId)}"]`;
  }

  const aria = el.getAttribute("aria-label");
  if (aria && isUniqueSelector(`${el.tagName.toLowerCase()}[aria-label="${CSS.escape(aria)}"]`)) {
    return `${el.tagName.toLowerCase()}[aria-label="${CSS.escape(aria)}"]`;
  }

  let path = el.tagName.toLowerCase();
  if (el.classList.length) {
    const stableClass = Array.from(el.classList).find((c) => c.length < 30);
    if (stableClass) path += `.${CSS.escape(stableClass)}`;
  }

  if (isUniqueSelector(path)) return path;

  const segments = [];
  let current = el;
  while (current && current.nodeType === 1 && current.tagName.toLowerCase() !== "html") {
    let segment = current.tagName.toLowerCase();
    const sibs = Array.from(current.parentNode?.children || []).filter((n) => n.tagName === current.tagName);
    if (sibs.length > 1) {
      const index = sibs.indexOf(current) + 1;
      segment += `:nth-of-type(${index})`;
    }
    segments.unshift(segment);
    const candidate = segments.join(" > ");
    if (isUniqueSelector(candidate)) return candidate;
    current = current.parentElement;
  }

  return null;
}

function isUniqueSelector(selector) {
  try {
    return document.querySelectorAll(selector).length === 1;
  } catch {
    return false;
  }
}

function getXPath(el) {
  if (!(el instanceof Element)) return "";
  const segments = [];
  let current = el;
  while (current && current.nodeType === 1) {
    let index = 1;
    let sibling = current.previousSibling;
    while (sibling) {
      if (sibling.nodeType === 1 && sibling.tagName === current.tagName) {
        index++;
      }
      sibling = sibling.previousSibling;
    }
    const tag = current.tagName.toLowerCase();
    segments.unshift(`${tag}[${index}]`);
    current = current.parentElement;
  }
  return "/" + segments.join("/");
}

function findElement(action) {
  if (action.selectorType === "css") {
    const el = document.querySelector(action.selector);
    if (el) return el;
    if (action.xpath) return findByXPath(action.xpath);
  } else {
    const el = findByXPath(action.selector);
    if (el) return el;
    return document.querySelector(action.selector);
  }
  return null;
}

function findByXPath(xpath) {
  try {
    return document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
  } catch {
    return null;
  }
}

async function runAutomation(automation, excelData) {
  if (!automation?.actions?.length) return false;

  const rows = excelData?.rows?.length ? excelData.rows : [null];
  for (const row of rows) {
    for (const action of automation.actions) {
      const el = findElement(action);
      if (!el) continue;

      if (action.type === "click") {
        el.click();
      }

      if (action.type === "input") {
        const value = row ? (row[action.inputIndex] ?? action.value ?? "") : (action.value ?? "");
        if (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT") {
          el.value = value;
          el.dispatchEvent(new Event("input", { bubbles: true }));
          el.dispatchEvent(new Event("change", { bubbles: true }));
        } else if (el.isContentEditable) {
          el.textContent = value;
          el.dispatchEvent(new Event("input", { bubbles: true }));
        }
      }

      await sleep(action.delay || 500);
    }
    await sleep(1000);
  }
  return true;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function showFeedback(el, text, color) {
  const rect = el.getBoundingClientRect();
  const feedback = document.createElement("div");
  feedback.textContent = text;

  // Use position:fixed anchored to the element's bounding box so the tooltip
  // works on void elements (input, select, textarea) that cannot have children.
  feedback.style.cssText = `
    position: fixed;
    left: ${rect.left + rect.width / 2}px;
    top: ${rect.top}px;
    background: ${color};
    color: white;
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
    z-index: 9999999;
    pointer-events: none;
    transform: translate(-50%, -100%);
    white-space: nowrap;
  `;

  document.body.appendChild(feedback);

  setTimeout(() => {
    feedback.style.transition = "all 0.3s";
    feedback.style.opacity = "0";
    feedback.style.transform = "translate(-50%, -120%)";
  }, 100);

  setTimeout(() => feedback.remove(), 800);
}

function makeDraggable(element) {
  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

  element.addEventListener("mousedown", (e) => {
    isDragging = true;
    offsetX = e.clientX - element.getBoundingClientRect().left;
    offsetY = e.clientY - element.getBoundingClientRect().top;
  });

  document.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    element.style.left = `${e.clientX - offsetX}px`;
    element.style.top = `${e.clientY - offsetY}px`;
  });

  document.addEventListener("mouseup", () => {
    isDragging = false;
  });
}
