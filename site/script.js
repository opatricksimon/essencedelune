(function () {
  'use strict';

  const LEADS_API_URL = '/api/leads';

  const GUIDES = {
    riqueza: {
      title: 'O Código da Riqueza',
      label: 'Código da Riqueza',
      pdf: 'assets/codigo-da-riqueza.pdf'
    },
    merecimento: {
      title: 'O Código do Merecimento',
      label: 'Código do Merecimento',
      pdf: 'assets/codigo-do-merecimento.pdf'
    }
  };

  let requestedGuide = null; // null = os 2 guias (hero / CTA)

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

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  function showState(name) {
    Object.entries(states).forEach(([key, element]) => {
      element.hidden = key !== name;
    });
  }

  function applyGuideContext() {
    const eyebrow = document.getElementById('formEyebrow');
    const title = document.getElementById('modalTitle');
    const sub = document.getElementById('formSub');
    const submit = document.getElementById('formSubmit');

    if (requestedGuide && GUIDES[requestedGuide]) {
      const g = GUIDES[requestedGuide];
      if (eyebrow) eyebrow.textContent = '1 guia gratuito · PDF';
      if (title) title.textContent = g.title;
      if (sub) sub.textContent = 'Preencha os campos abaixo para liberar o seu guia agora.';
      if (submit) submit.textContent = 'Liberar meu guia';
    } else {
      if (eyebrow) eyebrow.textContent = '2 guias gratuitos · PDF';
      if (title) title.textContent = 'Código da Riqueza & Merecimento';
      if (sub) sub.textContent = 'Preencha os campos abaixo para liberar os 2 PDFs agora.';
      if (submit) submit.textContent = 'Liberar meus guias';
    }
  }

  function openModal(guide) {
    requestedGuide = (guide && GUIDES[guide]) ? guide : null;
    applyGuideContext();

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
    button.addEventListener('click', () => openModal(button.dataset.guide));
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

  function downloadPdf(path) {
    const link = document.createElement('a');
    link.href = path;
    link.download = path.split('/').pop();
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  function triggerDownload() {
    const paths = (requestedGuide && GUIDES[requestedGuide])
      ? [GUIDES[requestedGuide].pdf]
      : [GUIDES.riqueza.pdf, GUIDES.merecimento.pdf];

    paths.forEach((path, index) => {
      setTimeout(() => downloadPdf(path), index * 800);
    });
  }

  function makeDownloadButton(guide, variant, prefix) {
    const a = document.createElement('a');
    a.className = 'btn ' + variant + ' btn--full';
    a.href = guide.pdf;
    a.setAttribute('download', '');
    a.textContent = prefix + guide.label;
    return a;
  }

  function buildSuccess() {
    const wrap = document.getElementById('modalDownloads');
    const title = document.getElementById('successTitle');
    const sub = document.getElementById('successSub');
    if (!wrap) return;
    wrap.innerHTML = '';

    if (requestedGuide && GUIDES[requestedGuide]) {
      const g = GUIDES[requestedGuide];
      const other = requestedGuide === 'riqueza' ? GUIDES.merecimento : GUIDES.riqueza;

      if (title) title.textContent = 'Seu guia foi liberado.';
      if (sub) sub.textContent = 'O download já começou. Se precisar, clique no botão abaixo.';

      wrap.appendChild(makeDownloadButton(g, 'btn--primary', 'Baixar o '));

      const also = document.createElement('a');
      also.className = 'modal__dl-also';
      also.href = other.pdf;
      also.setAttribute('download', '');
      also.textContent = 'Baixar também o ' + other.label;
      wrap.appendChild(also);
    } else {
      if (title) title.textContent = 'Seus guias foram liberados.';
      if (sub) sub.textContent = 'Clique para baixar cada PDF e comece os rituais com mais presença.';

      wrap.appendChild(makeDownloadButton(GUIDES.riqueza, 'btn--primary', 'Baixar o '));
      const second = makeDownloadButton(GUIDES.merecimento, 'btn--gold', 'Baixar o ');
      second.classList.add('modal__dl-second');
      wrap.appendChild(second);
    }
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const data = {
      nome: form.nome.value.trim(),
      email: form.email.value.trim(),
      telefone: form.telefone.value.trim(),
      origem: 'instagram',
      guia: requestedGuide || 'kit-2-guias',
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

      buildSuccess();
      setTimeout(triggerDownload, 500);
      form.reset();
      showState('success');

      if (window.dataLayer) window.dataLayer.push({ event: 'lead_capture', source: 'instagram', guia: data.guia });
      if (typeof window.fbq === 'function') window.fbq('track', 'Lead');
    } catch (error) {
      console.error('Erro ao enviar lead:', error);
      showState('error');
    }
  });

  /* ----- Efeito 3D: tilt do livro seguindo o cursor (só ponteiro fino) ----- */
  if (!reduceMotion && finePointer) {
    document.querySelectorAll('.guide-card__media').forEach((media) => {
      const tilt = media.querySelector('.guide-card__tilt');
      if (!tilt) return;
      const MAX = 9;

      media.addEventListener('mousemove', (event) => {
        const rect = media.getBoundingClientRect();
        const px = (event.clientX - rect.left) / rect.width;
        const py = (event.clientY - rect.top) / rect.height;
        const ry = (px - 0.5) * 2 * MAX;
        const rx = (0.5 - py) * 2 * MAX;
        tilt.style.setProperty('--ry', ry.toFixed(2) + 'deg');
        tilt.style.setProperty('--rx', rx.toFixed(2) + 'deg');
        tilt.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
        tilt.style.setProperty('--my', (py * 100).toFixed(1) + '%');
        tilt.style.setProperty('--glare', '1');
      });

      media.addEventListener('mouseleave', () => {
        tilt.style.setProperty('--rx', '0deg');
        tilt.style.setProperty('--ry', '0deg');
        tilt.style.setProperty('--glare', '0');
      });
    });
  }

  /* ----- Reveal no scroll ----- */
  const revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length) {
    if (reduceMotion || !('IntersectionObserver' in window)) {
      revealEls.forEach((el) => el.classList.add('is-visible'));
    } else {
      revealEls.forEach((el) => el.classList.add('reveal--armed'));
      const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            obs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15, rootMargin: '0px 0px -10% 0px' });
      revealEls.forEach((el) => observer.observe(el));
    }
  }
})();
