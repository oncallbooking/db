// FutriFix frontend minimal JS
document.addEventListener('DOMContentLoaded', () => {
  // API base: use same host as browser and port 5000 (works for localhost & Docker)
  const API_BASE = `http://${window.location.hostname}:5000`;

  function api(path, opts = {}) {
    const url = `${API_BASE}${path}`;
    opts.headers = opts.headers || { 'Content-Type': 'application/json' };
    if (opts.body && typeof opts.body === 'object') opts.body = JSON.stringify(opts.body);
    return fetch(url, opts).then(r => r.json().catch(()=>({})));
  }

  // expose some helper functions to window for simple pages
  window.futrifix = {
    async registerCustomer(formId) {
      try {
        const f = document.getElementById(formId);
        const name = f.querySelector('[name=name]').value;
        const email = f.querySelector('[name=email]').value;
        const password = f.querySelector('[name=password]').value;
        const resp = await api('/api/register', { method: 'POST', body: { name, email, password, role: "customer" }});
        if (resp.user) {
          localStorage.setItem('futrifix_user', JSON.stringify(resp.user));
          alert('Registered — you will be redirected to dashboard.');
          window.location.href = '/dashboard.html';
        } else alert(resp.message || 'Registration failed');
      } catch (err) { console.error(err); alert('Error'); }
    },

    async registerTech(formId) {
      try {
        const f = document.getElementById(formId);
        const name = f.querySelector('[name=name]').value;
        const email = f.querySelector('[name=email]').value;
        const password = f.querySelector('[name=password]').value;
        const skills = (f.querySelector('[name=skills]').value || '').split(',').map(s=>s.trim()).filter(Boolean);
        const resp = await api('/api/technicians/register', { method: 'POST', body: { name, email, password, skills }});
        if (resp.technician) {
          localStorage.setItem('futrifix_user', JSON.stringify(resp.technician));
          alert('Technician registered — redirecting to dashboard.');
          window.location.href = '/dashboard-tech.html';
        } else alert(resp.message || 'Registration failed');
      } catch (err) { console.error(err); alert('Error'); }
    },

    async login(formId) {
      try {
        const f = document.getElementById(formId);
        const email = f.querySelector('[name=email]').value;
        const password = f.querySelector('[name=password]').value;
        const resp = await api('/api/login', { method: 'POST', body: { email, password }});
        if (resp.user) {
          localStorage.setItem('futrifix_user', JSON.stringify(resp.user));
          alert('Login successful');
          // redirect based on role
          if (resp.user.role === 'technician') window.location.href = '/dashboard-tech.html';
          else window.location.href = '/dashboard.html';
        } else alert(resp.message || 'Login failed');
      } catch (err) { console.error(err); alert('Error'); }
    },

    async createJob(formId) {
      try {
        const f = document.getElementById(formId);
        const title = f.querySelector('[name=title]').value;
        const description = f.querySelector('[name=description]').value;
        const priceRange = f.querySelector('[name=priceRange]').value;
        const user = JSON.parse(localStorage.getItem('futrifix_user') || 'null');
        if (!user) { alert('Please login as customer'); return; }
        const resp = await api('/api/jobs', { method: 'POST', body: { title, description, priceRange, customerEmail: user.email }});
        if (resp.job) {
          alert('Job posted');
          window.location.href = '/dashboard.html';
        } else alert(resp.message || 'Failed');
      } catch (err) { console.error(err); alert('Error'); }
    },

    async listJobs(renderCallback) {
      const resp = await api('/api/jobs');
      if (resp.jobs) {
        renderCallback(resp.jobs);
      } else {
        renderCallback([]);
      }
    },

    async placeBid(jobId, price, message) {
      try {
        const user = JSON.parse(localStorage.getItem('futrifix_user') || 'null');
        if (!user) { alert('Please login as technician'); return; }
        const resp = await api(`/api/jobs/${jobId}/bid`, { method: 'POST', body: { techEmail: user.email, price, message }});
        if (resp.bid) {
          alert('Bid placed');
          location.reload();
        } else alert(resp.message || 'Failed');
      } catch (err) { console.error(err); alert('Error'); }
    },

    async subscribe(email, plan) {
      const resp = await api('/api/subscription', { method: 'POST', body: { email, plan }});
      if (resp.user) {
        alert('Subscription updated');
        localStorage.setItem('futrifix_user', JSON.stringify(resp.user));
      } else alert(resp.message || 'Failed');
    }
  };

  // Example: wire simple search button(s) if present
  const findBtn = document.getElementById('searchBtn') || document.getElementById('findBtn');
  if(findBtn){
    findBtn.addEventListener('click', ()=>{
      const loc = document.getElementById('searchInput') ? document.getElementById('searchInput').value : '';
      const svc = document.getElementById('serviceSelect') ? document.getElementById('serviceSelect').value : '';
      if(!loc && !svc){ alert('Please enter location or select a service.'); return; }
      alert('Searching (demo): ' + (svc || loc));
    });
  }
});
