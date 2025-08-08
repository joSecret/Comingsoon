function openChatWithInput() {
  var input = document.getElementById('userInput');
  var text = input.value.trim();

  // Deschide chatbot-ul
  window.dispatchEvent(new Event('openChatWidgetNB'));

  if (text) {
    // Salvează textul pentru trimitere
    window.pendingMessage = text;

    // Încearcă să trimită textul după ce chatbot-ul se deschide
    setTimeout(function() {
      sendMessageToChat(text);
    }, 100);

    input.value = '';
  }
}

function sendMessageToChat(message) {
  // Metodă 1: Prin iframe
  var iframe = document.querySelector('iframe[src*="nextbot"]');
  if (iframe && iframe.contentWindow) {
    try {
      iframe.contentWindow.postMessage({
        type: 'SEND_MESSAGE',
        message: message,
        text: message,
        action: 'send_message'
      }, '*');
    } catch(e) {
      console.log('Eroare la trimiterea prin iframe:', e);
    }
  }

  // Metodă 2: Prin evenimente globale
  var events = [
    'sendMessageToChatWidgetNB',
    'nextbot-send-message',
    'chat-send-message'
  ];

  events.forEach(function(eventName) {
    window.dispatchEvent(new CustomEvent(eventName, {
      detail: { message: message, text: message }
    }));
  });

  // Metodă 3: Caută input-ul din chatbot și completează-l
  setTimeout(function() {
    var chatInputs = document.querySelectorAll('input[type="text"]:not(#userInput), textarea, [contenteditable="true"]');
    chatInputs.forEach(function(chatInput) {
      if (chatInput.offsetParent !== null && chatInput.id !== 'userInput') {
        chatInput.value = message;
        chatInput.focus();

        // Simulează eventi de input
        var inputEvent = new Event('input', { bubbles: true });
        chatInput.dispatchEvent(inputEvent);

        // Încearcă Enter
        var enterEvent = new KeyboardEvent('keydown', {
          key: 'Enter',
          code: 'Enter',
          bubbles: true
        });
        chatInput.dispatchEvent(enterEvent);
      }
    });
  }, 110);
}

// Butonul "Ask AI"
document.getElementById('askAiBtn').addEventListener('click', function(e) {
  e.preventDefault();
  openChatWithInput();
});

// Enter în input
document.getElementById('userInput').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') {
	e.preventDefault();
	openChatWithInput();
  }
});

// Listener pentru mesaje pendente
window.addEventListener('message', function(event) {
  // Detectează când chat-ul Nextbot este gata
  if (event.data && (
    event.data.type === 'WIDGET_READY' ||
    event.data.type === 'CHAT_OPENED' ||
    event.data.type === 'iframe-ready' ||
    event.data.action === 'widget-ready'
  )) {
    if (window.pendingMessage) {
      setTimeout(function() {
        sendMessageToChat(window.pendingMessage);
        window.pendingMessage = null;
      }, 800);
    }
  }
});

// Încearcă să detecteze când widget-ul Nextbot este încărcat
document.addEventListener('DOMContentLoaded', function() {
  var checkInterval = setInterval(function() {
    var iframe = document.querySelector('iframe[src*="nextbot"]');
    if (iframe && window.pendingMessage) {
      sendMessageToChat(window.pendingMessage);
      window.pendingMessage = null;
      clearInterval(checkInterval);
    }
  }, 90);

  // Oprește verificarea după 30 de secunde
  setTimeout(function() {
    clearInterval(checkInterval);
  }, 3000);
});
