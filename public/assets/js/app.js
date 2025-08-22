(() => {
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

  const toast = (msg, type='success') => {
    let t = $('.toast');
    if (!t) {
      t = document.createElement('div');
      t.className = 'toast alert ' + (type==='error'?'error':'success');
      document.body.appendChild(t);
    } else {
      t.className = 'toast alert ' + (type==='error'?'error':'success');
    }
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2500);
  };

  setTimeout(() => $$('.alert').forEach(a => a.classList.add('hidden')), 4500);

  $$('.container form[data-debounce="search"]').forEach(form => {
    const input = form.querySelector('input[name="q"]');
    if (!input) return;
    let t;
    input.addEventListener('input', () => {
      clearTimeout(t);
      t = setTimeout(() => form.requestSubmit(), 350);
    });
  });

  (function enhanceCompleteModule(){
    const form = $('#complete-module-form');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      if (!btn) return;
      const id = form.dataset.moduleId;
      btn.disabled = true; btn.textContent = 'Completing...';
      try {
        const resp = await fetch(`/api/modules/${id}/complete`, {
          method: 'PATCH',
          credentials: 'same-origin', // send cookies
        });
        const json = await resp.json();
        if (json.status === 'success') {
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
            if (cert) { cert.href = certUrl; cert.classList.remove('hidden'); }
          }
        } else {
          throw new Error(json?.message || 'Failed');
        }
      } catch (err) {
        console.error(err);
        toast('Failed to complete module', 'error');
        btn.disabled = false; btn.textContent = 'Mark as completed';
      }
    });
  })();

  (async function liveCourses(){
    if (!document.body.dataset.poll) return; // only on courses page
    const grid = $('#courses-grid');
    const pagination = $('#courses-pagination');
    if (!grid) return;

    const searchForm = document.querySelector('form[action="/courses"]') || document.querySelector('form[data-debounce="search"]');

    const getParams = () => {
      const url = new URL(location.href);
      const q = searchForm?.querySelector('input[name="q"]')?.value ?? url.searchParams.get('q') ?? '';
      const limit = searchForm?.querySelector('select[name="limit"]')?.value ?? url.searchParams.get('limit') ?? '15';
      const page = url.searchParams.get('page') ?? '1';
      return { q, limit, page };
    };

    const card = (c) => `
      <a class="card" href="/courses/${c.id}">
        ${c.thumbnail_image ? `<img class="thumb" src="${c.thumbnail_image}" alt="">` : ''}
        <h3>${c.title}</h3>
        <p class="muted">By ${c.instructor}</p>
        <div style="margin:.5rem 0">
          ${(c.topics||[]).map(t => `<span class="badge topic">${t}</span>`).join('')}
        </div>
        <div class="space-between">
          <span class="badge price">Modules: ${c.total_modules}</span>
          ${c.is_purchased ? `<span class="badge owned">Owned</span>` : `<span class="badge">Price: $${c.price}</span>`}
        </div>
      </a>`.trim();

    const render = (items) => { grid.innerHTML = items.map(card).join(''); };

    const renderPagination = (p, params) => {
      if (!pagination) return;
      const prev = (p.current_page > 1) ? `<a href="?q=${encodeURIComponent(params.q)}&limit=${params.limit}&page=${p.current_page-1}">Prev</a>` : '';
      const next = (p.current_page < p.total_pages) ? `<a href="?q=${encodeURIComponent(params.q)}&limit=${params.limit}&page=${p.current_page+1}">Next</a>` : '';
      pagination.innerHTML = `${prev}<span>Page ${p.current_page} / ${p.total_pages}</span>${next}`;
    };

    async function syncNow(){
      const { q, limit, page } = getParams();
      const res = await fetch(`/api/courses?q=${encodeURIComponent(q)}&limit=${limit}&page=${page}`, {
        credentials: 'same-origin',
      });
      const json = await res.json();
      if (json?.status === 'success') {
        render(json.data || []);
        renderPagination(json.pagination || { current_page:1, total_pages:1 }, { q, limit });
      }
    }

    // grab current version
    let v = 0;
    try {
      const vres = await fetch('/api/poll/version/courses', { credentials: 'same-origin' });
      const vjson = await vres.json();
      v = vjson?.data?.version || 0;
    } catch {}

    await syncNow();

    // long-poll loop
    while (true) {
      try {
        const res = await fetch(`/api/poll/courses?since=${v}`, { credentials: 'same-origin' });
        const json = await res.json();
        const newest = json?.data?.version ?? v;
        if (newest > v) await syncNow();
        v = newest;
      } catch {
        // fallback: short wait then retry
        await new Promise(r => setTimeout(r, 1000));
      }
    }
  })();

  (async function liveModules(){
    if (!document.body.dataset.pollModules) return;
    const courseId = document.body.dataset.courseId;
    if (!courseId) return;
    const list = $('#modules-list');
    if (!list) return;

    const selectedId = () => document.body.dataset.selectedId || '';

    const item = (m) => `
      <a class="module-item ${m.is_completed ? 'done' : ''} ${String(m.id)===String(selectedId()) ? 'active' : ''}"
         href="/courses/${courseId}/modules?m=${m.id}">
        <span class="dot"></span>
        <div>
          <strong>#${m.order} — ${m.title}</strong>
          <small>${m.description || ''}</small>
        </div>
      </a>`.trim();

    async function syncModules(){
      const res = await fetch(`/api/courses/${courseId}/modules?limit=50&page=1`, {
        credentials: 'same-origin',
      });
      const json = await res.json();
      if (json?.status === 'success') {
        const items = json.data || [];
        list.innerHTML = items.map(item).join('');
      }
    }

    // current version
    let v = 0;
    try {
      const vres = await fetch(`/api/poll/version/course/${courseId}/modules`, { credentials: 'same-origin' });
      const vjson = await vres.json();
      v = vjson?.data?.version || 0;
    } catch {}

    await syncModules();

    // long-poll loop
    while (true) {
      try {
        const res = await fetch(`/api/poll/course/${courseId}/modules?since=${v}`, { credentials: 'same-origin' });
        const json = await res.json();
        const newest = json?.data?.version ?? v;
        if (newest > v) await syncModules();
        v = newest;
      } catch {
        await new Promise(r => setTimeout(r, 1000));
      }
    }
  })();

})();