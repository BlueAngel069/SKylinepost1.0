document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form[action^="/chat/"]');
    if (!form) return;
  
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
  
      const textarea = form.querySelector('textarea[name="message"]');
      const message = textarea.value.trim();
      if (!message) return;
  
      const url = form.action;
  
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ message })
        });
  
        if (!res.ok) throw new Error('Message failed');
  
        const now = new Date().toLocaleString();
        const container = document.querySelector('.chat-window');
        const msgBlock = document.createElement('div');
        msgBlock.innerHTML = `<strong>You:</strong> ${message}<br><small style="color:#777">${now}</small>`;
        msgBlock.style.marginBottom = '1em';
        container.appendChild(msgBlock);
  
        textarea.value = '';
        container.scrollTop = container.scrollHeight;
      } catch (err) {
        alert('Could not send message.');
      }
    });
  });
  