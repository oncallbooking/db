document.addEventListener('DOMContentLoaded', () => {
  // show logged in user in console
  const u = JSON.parse(localStorage.getItem('futrifix_user') || 'null');
  if(u) console.info('Logged in user:', u);

  // Basic find button if present
  const findBtn = document.getElementById('searchBtn') || document.getElementById('findBtn');
  if(findBtn){
    findBtn.addEventListener('click', ()=>{
      const loc = document.getElementById('searchInput') ? document.getElementById('searchInput').value : (document.getElementById('location') ? document.getElementById('location').value : '');
      const svc = document.getElementById('serviceSelect') ? document.getElementById('serviceSelect').value : (document.getElementById('service') ? document.getElementById('service').value : '');
      if(!loc && !svc){ alert('Please enter location or select a service.'); return; }
      alert('Searching (demo): ' + (svc || loc));
    });
  }
});
