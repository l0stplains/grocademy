(() => {
  'use strict';

  console.log(
    '%cHalo bang! 👋%c\nWelcome to Grocademy 🍌',
    'color: white; background: #2c3e50; padding: 8px; font-size: 16px; font-weight: bold;',
    'color: #27ae60; font-size: 14px; font-style: italic;',
  );

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  function toast(message, type = 'success') {
    let t = $('.toast');
    if (!t) {
      t = document.createElement('div');
      t.className = 'toast alert';
      document.body.appendChild(t);
    }
    t.className = `toast alert ${type === 'error' ? 'error' : 'success'}`;
    t.textContent = message;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2500);
  }

  setTimeout(
    () => $$('.alert').forEach((a) => a.classList.add('hidden')),
    4500,
  );

  window.addEventListener('DOMContentLoaded', () => {
    const err = document.querySelector('.alert.error');
    if (err && err.textContent.trim()) toast(err.textContent.trim(), 'error');
  });

  (function navBurger() {
    const btn = $('#nav-toggle');
    const menu = $('#nav-menu');
    if (!btn || !menu) return;
    btn.addEventListener('click', () => {
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!expanded));
      menu.classList.toggle('open', !expanded);
    });
    $$('#nav-menu a').forEach((a) =>
      a.addEventListener('click', () => {
        btn.setAttribute('aria-expanded', 'false');
        menu.classList.remove('open');
      }),
    );
  })();

  (function enhanceCompleteModule() {
    const form = $('#complete-module-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      const id = form.getAttribute('data-module-id');
      if (!btn || !id) return;

      btn.disabled = true;
      btn.textContent = 'Completing...';

      try {
        const resp = await fetch(`/api/modules/${id}/complete`, {
          method: 'PATCH',
          credentials: 'same-origin',
        });
        if (!resp.ok) throw new Error('Request failed');

        const json = await resp.json();
        if (json.status !== 'success')
          throw new Error(json?.message || 'Failed');

        toast('Module marked as completed!');

        const badge = $('#module-done-badge');
        if (badge) badge.classList.remove('hidden');

        btn.remove();

        const pr = $('#course-progress');
        const pct = json?.data?.course_progress?.percentage;
        if (pr && typeof pct === 'number') pr.style.width = pct + '%';

        const certUrl = json?.data?.certificate_url;
        if (certUrl) {
          const cert = $('#certificate-link');
          if (cert) {
            cert.href = certUrl;
            cert.classList.remove('hidden');
          }
        }
      } catch (err) {
        console.error(err);
        toast('Failed to complete module', 'error');
        btn.disabled = false;
        btn.textContent = 'Mark as completed';
      }
    });
  })();

  (async function liveCourses() {
    // start if either: explicit flag OR we detect the browse grid
    const grid = document.getElementById('courses-grid');
    const isBrowse = document.body.dataset.poll === 'courses' || !!grid;
    if (!isBrowse || !grid) return;

    const pagination = document.getElementById('courses-pagination');

    const getParams = () => {
      const url = new URL(location.href);
      const q = url.searchParams.get('q') || '';
      const page = url.searchParams.get('page') || '1';
      return { q, page };
    };

    const card = (c) =>
      `
    <a class="card" href="/courses/${c.id}">
      <div class="thumb-frame">
        <div class="thumb-placeholder" aria-hidden="true"></div>
        ${c.thumbnail_image ? `<img class="thumb-img" src="${c.thumbnail_image}" alt="">` : ''}
      </div>
      <h3>${c.title}</h3>
      <p class="muted">By ${c.instructor}</p>
      <div style="margin:.5rem 0">
        ${(c.topics || []).map((t) => `<span class="badge topic">${t}</span>`).join('')}
      </div>
      <div class="space-between">
        <span class="badge price">Modules: ${c.total_modules}</span>
        ${c.is_purchased ? `<span class="badge owned">Owned</span>` : `<span class="badge">Price: $${c.price}</span>`}
      </div>
    </a>`.trim();

    function render(items) {
      grid.innerHTML = items.map(card).join('');
    }

    function renderPagination(p, params) {
      if (!pagination) return;
      const prev =
        p.current_page > 1
          ? `<a href="?q=${encodeURIComponent(params.q)}&page=${p.current_page - 1}">Prev</a>`
          : '';
      const next =
        p.current_page < p.total_pages
          ? `<a href="?q=${encodeURIComponent(params.q)}&page=${p.current_page + 1}">Next</a>`
          : '';
      pagination.innerHTML = `${prev}<span>Page ${p.current_page} / ${p.total_pages}</span>${next}`;
    }

    async function syncNow() {
      const { q, page } = getParams();
      const res = await fetch(
        `/api/courses?q=${encodeURIComponent(q)}&page=${page}`,
        { credentials: 'same-origin' },
      );
      if (!res.ok) return;
      const json = await res.json();
      if (json?.status === 'success') {
        render(json.data || []);
        renderPagination(
          json.pagination || { current_page: 1, total_pages: 1 },
          { q },
        );
      }
    }

    let v = 0;
    try {
      const vres = await fetch('/api/poll/version/courses', {
        credentials: 'same-origin',
      });
      const vjson = await vres.json();
      v = vjson?.data?.version || 0;
    } catch {}

    await syncNow();

    // long-poll loop
    while (true) {
      try {
        const res = await fetch(`/api/poll/courses?since=${v}`, {
          credentials: 'same-origin',
        });
        if (!res.ok) throw new Error('poll failed');
        const json = await res.json();
        const newest = json?.data?.version ?? v;
        if (newest > v) await syncNow();
        v = newest;
      } catch {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
  })();

  (async function liveModules() {
    const list = document.getElementById('modules-list');
    const courseId =
      document.body.dataset.courseId ||
      (list ? list.getAttribute('data-course-id') : '');
    const isModules = document.body.dataset.pollModules || (list && courseId);
    if (!isModules || !list || !courseId) return;

    const currentSelected = () => document.body.dataset.selectedId || '';

    const item = (m) =>
      `
    <a class="module-item ${m.is_completed ? 'done' : ''} ${String(m.id) === String(currentSelected()) ? 'active' : ''}"
       href="/courses/${courseId}/modules?m=${m.id}">
      <span class="dot"></span>
      <div>
        <strong>#${m.order} — ${m.title}</strong>
        <small>${m.description || ''}</small>
      </div>
    </a>`.trim();

    async function syncModules() {
      const res = await fetch(`/api/courses/${courseId}/modules?page=1`, {
        credentials: 'same-origin',
      });
      if (!res.ok) return;
      const json = await res.json();
      if (json?.status === 'success')
        list.innerHTML = (json.data || []).map(item).join('');
    }

    let v = 0;
    try {
      const vres = await fetch(`/api/poll/version/course/${courseId}/modules`, {
        credentials: 'same-origin',
      });
      const vjson = await vres.json();
      v = vjson?.data?.version || 0;
    } catch {}

    await syncModules();

    while (true) {
      try {
        const res = await fetch(
          `/api/poll/course/${courseId}/modules?since=${v}`,
          { credentials: 'same-origin' },
        );
        if (!res.ok) throw new Error('poll failed');
        const json = await res.json();
        const newest = json?.data?.version ?? v;
        if (newest > v) await syncModules();
        v = newest;
      } catch {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
  })();

  (function enhanceRegister() {
    const form = document.getElementById('register-form');
    if (!form) return;

    const pwd = form.querySelector('input[name="password"]');
    const cpw = form.querySelector('input[name="confirm_password"]');
    const re = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

    function checkPasswordPattern() {
      if (!pwd.value) {
        pwd.setCustomValidity('');
        return;
      }
      if (!re.test(pwd.value)) {
        pwd.setCustomValidity(
          'Password must be at least 8 characters and include letters and numbers',
        );
      } else {
        pwd.setCustomValidity('');
      }
    }
    function checkMatch() {
      if (!cpw.value) {
        cpw.setCustomValidity('');
        return;
      }
      if (pwd.value !== cpw.value) {
        cpw.setCustomValidity('Passwords do not match');
      } else {
        cpw.setCustomValidity('');
      }
    }

    pwd.addEventListener('input', () => {
      checkPasswordPattern();
      checkMatch();
    });
    cpw.addEventListener('input', checkMatch);

    form.addEventListener('submit', (e) => {
      checkPasswordPattern();
      checkMatch();
      if (!form.checkValidity()) {
        e.preventDefault();
        if (!re.test(pwd.value)) {
          if (typeof toast === 'function')
            toast('Password must include letters and numbers', 'error');
        } else if (pwd.value !== cpw.value) {
          if (typeof toast === 'function')
            toast('Passwords do not match', 'error');
        }
      }
    });
  })();
})();
