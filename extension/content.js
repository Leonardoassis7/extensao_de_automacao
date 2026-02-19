let recording = false;
let actions = [];
let recordingBar = null;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'startRecording') {
    recording = true;
    actions = [];
    createRecordingBar();
    return true;
  }
  
  if (message.action === 'stopRecording') {
    recording = false;
    recordingBar?.remove();
  }
  
  if (message.action === 'getActions') {
    sendResponse({ actions });
    return true;
  }
});

function createRecordingBar() {
  if (document.getElementById('automacao-bar')) return;

  recordingBar = document.createElement('div');
  recordingBar.id = 'automacao-bar';

  recordingBar.style.cssText = `
    position: fixed;
    top: 40%;
    left: 20px;
    z-index: 2147483647;
    width: 140px;
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
      <strong>🔴 Gravando</strong>
      <button id="close-bar" style="
        background:none;
        border:none;
        color:white;
        font-weight:bold;
        cursor:pointer;
        font-size:16px;
      ">✕</button>
    </div>
    <div style="font-size:11px;margin-top:10px;">
      SHIFT = preencher<br>
      CTRL = clicar
    </div>
  `;

  document.body.appendChild(recordingBar);

  document.getElementById('close-bar').onclick = () => {
    recording = false;
    recordingBar.remove();
  };

  makeDraggable(recordingBar);
}

// ✅ CAPTURA CORRETA DE CLIQUES (APENAS UM LISTENER)
document.addEventListener('click', (e) => {
  if (!recording) return;
  if (e.target.closest('#automacao-bar')) return;

  const target = e.target.closest('input,select,textarea,button,a');
  if (!target) return;

  const selector = target.id
    ? `#${target.id}`
    : target.name
    ? `[name="${target.name}"]`
    : target.classList.length
    ? `.${target.classList[0]}`
    : target.tagName.toLowerCase();

  if (e.shiftKey) {
    actions.push({ type: 'input', selector, delay: 500 });
    showFeedback(target, 'Preencher ✓', '#10b981');
  }

  if (e.ctrlKey) {
    actions.push({ type: 'click', selector, delay: 800 });
    showFeedback(target, 'Clicar ✓', '#3b82f6');
  }

}, true);

function showFeedback(el, text, color) {
  const feedback = document.createElement('div');
  feedback.textContent = text;

  feedback.style.cssText = `
    position: absolute;
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

  el.style.position = 'relative';
  el.appendChild(feedback);

  setTimeout(() => {
    feedback.style.transition = 'all 0.3s';
    feedback.style.opacity = '0';
    feedback.style.transform = 'translate(-50%, -120%)';
  }, 100);

  setTimeout(() => feedback.remove(), 800);
}

function makeDraggable(element) {
  let isDragging = false;
  let offsetX, offsetY;

  element.addEventListener('mousedown', (e) => {
    isDragging = true;
    offsetX = e.clientX - element.getBoundingClientRect().left;
    offsetY = e.clientY - element.getBoundingClientRect().top;
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;

    element.style.left = (e.clientX - offsetX) + 'px';
    element.style.top = (e.clientY - offsetY) + 'px';
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
  });
}
