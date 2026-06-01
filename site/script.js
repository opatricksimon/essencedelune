(function () {
  'use strict';

  const LEADS_API_URL = '/api/leads';
  const PDF_PATHS = ['assets/codigo-da-riqueza.pdf', 'assets/codigo-do-merecimento.pdf'];

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
    Object.entries(states).forEach(([key, element]) => {
      element.hidden = key !== name;
    });
  }

  function openModal() {
    lastFocus = document.activeElement;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    showState('form');

    setTimeout(() => {
      const firstInput = form.querySelector('input[name="nome"]');
      if (firstInput) firstInput.focus();
    }, 120);
  }

  function closeModal() {
    modal.hidden = true;
    document.body.style.overflow = '';

    if (lastFocus && typeof lastFocus.focus === 'function') {
      lastFocus.focus();
    }
  }

  document.querySelectorAll('[data-open-form]').forEach((button) => {
    button.addEventListener('click', openModal);
  });

  document.querySelectorAll('[data-close-form]').forEach((button) => {
    button.addEventListener('click', closeModal);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !modal.hidden) closeModal();
  });

  document.querySelectorAll('[data-retry]').forEach((button) => {
    button.addEventListener('click', () => showState('form'));
  });

  const telInput = form.querySelector('input[name="telefone"]');
  telInput.addEventListener('input', (event) => {
    let value = event.target.value.replace(/\D/g, '').slice(0, 11);

    if (value.length > 10) value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
    else if (value.length > 6) value = `(${value.slice(0, 2)}) ${value.slice(2, 6)}-${value.slice(6)}`;
    else if (value.length > 2) value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
    else if (value.length > 0) value = `(${value}`;

    event.target.value = value;
  });

  function triggerDownload() {
    PDF_PATHS.forEach((path, index) => {
      setTimeout(() => {
        const link = document.createElement('a');
        link.href = path;
        link.download = path.split('/').pop();
        document.body.appendChild(link);
        link.click();
        link.remove();
      }, index * 800);
    });
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const data = {
      nome: form.nome.value.trim(),
      email: form.email.value.trim(),
      telefone: form.telefone.value.trim(),
      origem: 'instagram',
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    };

    if (!data.nome || !data.email || !data.telefone || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      form.reportValidity();
      return;
    }

    showState('loading');

    try {
      const response = await fetch(LEADS_API_URL, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const result = await response.json().catch(() => null);

      if (!response.ok || !result || result.ok !== true) {
        const message = result && result.error ? result.error : `Erro HTTP ${response.status}`;
        throw new Error(message);
      }

      setTimeout(triggerDownload, 500);
      form.reset();
      showState('success');

      if (window.dataLayer) window.dataLayer.push({ event: 'lead_capture', source: 'instagram' });
      if (typeof window.fbq === 'function') window.fbq('track', 'Lead');
    } catch (error) {
      console.error('Erro ao enviar lead:', error);
      showState('error');
    }
  });
})();
