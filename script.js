/* script.js - demo interactions (static site) */
document.addEventListener('DOMContentLoaded', function(){

  // FIND button on home page
  var findBtn = document.getElementById('findBtn');
  if(findBtn){
    findBtn.addEventListener('click', function(){
      var loc = document.getElementById('location').value.trim();
      var svc = document.getElementById('service').value;
      if(!loc || !svc){ alert('Please enter location and select a service.'); return; }
      // In a real site you would call the backend here — demo shows a simulated result.
      alert('Searching technicians for ' + svc + ' near ' + loc + '\\n(This is a static demo — implement backend to connect to real data.)');
    });
  }

  // generic subscribe button logic (non-auth)
  document.querySelectorAll('.subscribe').forEach(function(btn){
    btn.addEventListener('click', function(){
      var plan = btn.getAttribute('data-plan');
      if(confirm('Subscribe to ' + plan.toUpperCase() + ' — demo?')){
        btn.textContent = 'Subscribed';
        btn.disabled = true;
        btn.classList.add('disabled');
        // persist plan locally
        localStorage.setItem('futrifix_plan', plan);
        var resEl = document.getElementById('subResult');
        if(resEl) resEl.textContent = 'Subscribed to ' + plan.toUpperCase() + ' — Thank you (demo).';
      }
    });
  });

  // show user status in console (for development)
  var role = localStorage.getItem('futrifix_role');
  var user = localStorage.getItem('futrifix_user');
  if(role && user){
    console.info('Demo session:', role, user);
  }

  // Add a small convenience: if Post Job clicked and not logged in, prompt
  document.querySelectorAll('.btn-post').forEach(function(b){
    b.addEventListener('click', function(){
      var role = localStorage.getItem('futrifix_role');
      if(!role){
        if(confirm('You must be logged in to post a job. Go to Customer Login?')){
          window.location = 'login-customer.html';
        }
        return;
      }
      if(role !== 'customer'){
        alert('Only customers can post jobs. Please login as a customer.');
        window.location = 'login-customer.html';
        return;
      }
      alert('Open "Post job" flow (demo). In a real app you would implement a job posting form and send data to the server.');
    });
  });

});
