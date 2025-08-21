(function(){
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

  const toast = (msg, type='success') => {
    let t = $('.toast');
    if(!t){
      t = document.createElement('div');
      t.className = 'toast alert ' + (type==='error'?'error':'success');
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(()=> t.classList.remove('show'), 2500);
  };

  setTimeout(() => $$('.alert').forEach(a => a.classList.add('hidden')), 4500);

  const searchForms = $$('form[data-debounce="search"]');
  searchForms.forEach(form => {
    const input = form.querySelector('input[name="q"]');
    if(!input) return;
    let t; 
    input.addEventListener('input', () => {
      clearTimeout(t);
      t = setTimeout(() => form.requestSubmit(), 350);
    });
  });

  const completeForm = $('#complete-module-form');
  if (completeForm) {
    completeForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = completeForm.querySelector('button[type="submit"]');
      const id = completeForm.dataset.moduleId;
      btn.disabled = true; btn.textContent = 'Completing...';
      try {
        const resp = await fetch(`/api/modules/${id}/complete`, { method: 'PATCH', headers: { 'Authorization': `Bearer ${getToken()}` } });
        const json = await resp.json();
        if (json.status === 'success') {
          toast('Module marked as completed!');
          const badge = $('#module-done-badge');
          if (badge) { badge.classList.remove('hidden'); }
          btn.remove();
          const pr = $('#course-progress');
          if (pr && json.data?.course_progress?.percentage != null) {
            pr.style.width = json.data.course_progress.percentage + '%';
          }
          if (json.data?.certificate_url) {
            const cert = $('#certificate-link');
            if (cert) { cert.classList.remove('hidden'); cert.href = json.data.certificate_url; }
          }
        } else {
          throw new Error(json.message || 'Failed');
        }
      } catch (err) {
        console.error(err);
        toast('Failed to complete module', 'error');
        btn.disabled = false; btn.textContent = 'Mark as completed';
      }
    });
  }

  function getToken(){
    try { return localStorage.getItem('token') || ''; } catch { return ''; }
  }
})();