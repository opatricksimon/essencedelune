(function () {
  'use strict';

  const GAS_URL = 'https://script.google.com/macros/s/AKfycbwyCx0bl6r2wZprDmaCRFOQr32D-Q-DTTMiqF5XI-jp_ulVJqk0lJ94yhk4a4QXwak_Aw/exec';
  const PDF_PATH = 'assets/codigo-do-merecimento.pdf';

  const modal = document.getElementById('formModal');
  const form = document.getElementById('leadForm');
  const states = {
    form: modal.querySelector('.modal__state--form'),
    loading: modal.querySelector('.modal__state--loading'),
    success: modal.querySelector('.modal__state--success'),
    error: modal.querySelector('.modal__state--error')
  };

  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  let lastFocus = null;

  function showState(name) {
    Object.entries(states).forEach(([k, el]) => { el.hidden = k !== name; });
  }

  function openModal() {
    lastFocus = document.activeElement;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    showState('form');
    setTimeout(() => {
      const first = form.querySelector('input[name="nome"]');
      if (first) first.focus();
    }, 120);
  }

  function closeModal() {
    modal.hidden = true;
    document.body.style.overflow = '';
    if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
  }

  document.querySelectorAll('[data-open-form]').forEach(btn => {
    btn.addEventListener('click', openModal);
  });
  document.querySelectorAll('[data-close-form]').forEach(btn => {
    btn.addEventListener('click', closeModal);
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !modal.hidden) closeModal();
  });
  document.querySelectorAll('[data-retry]').forEach(btn => {
    btn.addEventListener('click', () => showState('form'));
  });

  const telInput = form.querySelector('input[name="telefone"]');
  telInput.addEventListener('input', (e) => {
    let v = e.target.value.replace(/\D/g, '').slice(0, 11);
    if (v.length > 10) v = `(${v.slice(0,2)}) ${v.slice(2,7)}-${v.slice(7)}`;
    else if (v.length > 6) v = `(${v.slice(0,2)}) ${v.slice(2,6)}-${v.slice(6)}`;
    else if (v.length > 2) v = `(${v.slice(0,2)}) ${v.slice(2)}`;
    else if (v.length > 0) v = `(${v}`;
    e.target.value = v;
  });

  function triggerDownload() {
    const a = document.createElement('a');
    a.href = PDF_PATH;
    a.download = 'codigo-do-merecimento.pdf';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
      nome: form.nome.value.trim(),
      email: form.email.value.trim(),
      telefone: form.telefone.value.trim(),
      origem: 'instagram',
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    };

    if (!data.nome || !data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      return;
    }

    showState('loading');

    try {
      if (GAS_URL) {
        await fetch(GAS_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(data)
        });
      } else {
        console.warn('[Essence de Lune] GAS_URL não configurada — lead não foi salvo em Sheets.');
      }

      setTimeout(triggerDownload, 500);

      showState('success');

      if (window.dataLayer) window.dataLayer.push({ event: 'lead_capture', source: 'instagram' });
      if (typeof window.fbq === 'function') window.fbq('track', 'Lead');

    } catch (err) {
      console.error('Erro ao enviar lead:', err);
      showState('error');
    }
  });
})();
