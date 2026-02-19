console.log("🚀 PreencheJá - FIX");

function setStatus(text, color = '#22c55e') {
  document.getElementById('status-text').textContent = `Status: ${text}`;
  document.querySelector('.status-dot').style.backgroundColor = color;
}

// Salve o tabId global para usar no stop
let recordingTabId = null;

document.getElementById('start-btn').onclick = () => {
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    const tabId = tabs[0].id;
    recordingTabId = tabId; // salvar aba atual

    chrome.tabs.sendMessage(tabId, {action: 'startRecording'}, () => {
      setStatus('🔴 Gravando... SHIFT=preencher | CTRL=click', '#ef4444');
      document.querySelector('.progress-fill').style.width = '100%';
    });
  });
};

document.getElementById('stop-btn').onclick = () => {
  if (!recordingTabId) {
    setStatus('⚠️ Nenhuma gravação ativa', '#f59e0b');
    return;
  }

  chrome.tabs.sendMessage(recordingTabId, {action: 'stopRecording'});

  chrome.tabs.sendMessage(recordingTabId, {action: 'getActions'}, (response) => {
    if (!response?.actions?.length) {
      setStatus('⚠️ Nenhuma ação gravada', '#f59e0b');
      return;
    }

    chrome.tabs.get(recordingTabId, (tab) => {
      const url = tab?.url || 'desconhecida';
      const name = prompt('Nome da automação:') || `Automação ${Date.now()}`;

      const automation = {
        name,
        url,
        actions: response.actions
      };

      chrome.storage.local.get(['automations'], (result) => {
        const automations = result.automations || [];
        automations.push(automation);

        chrome.storage.local.set({automations}, () => {
          setStatus('✅ Automação salva!', '#10b981');
          document.querySelector('.progress-fill').style.width = '0%';

          // NÃO FECHAR NENHUMA ABA!
          // O popup não deve fechar a aba ativa ou a aba do usuário
          // Apenas resetar o estado
          recordingTabId = null;
        });
      });
    });
  });
};
