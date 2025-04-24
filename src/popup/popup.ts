document.getElementById('read')!.addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      const id = tabs[0]?.id;
      if (id) chrome.tabs.sendMessage(id, { action: 'read' });
    });
  });
  