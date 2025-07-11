// ✅ Handle Google Login
function handleCredentialResponse(response) {
  const user = parseJwt(response.credential);
  const name = user.name;
  
  // Optional: Display welcome message
  const welcomeMsg = document.createElement('div');
  welcomeMsg.textContent = `Welcome, ${name}!`;
  welcomeMsg.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: gold;
    color: black;
    padding: 12px 18px;
    border-radius: 12px;
    font-weight: bold;
    z-index: 10000;
  `;
  document.body.appendChild(welcomeMsg);

  // Now trigger the transition
  triggerCoverTransition();
}

// ✅ Helper: Decode Google token
function parseJwt(token) {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));
  return JSON.parse(jsonPayload);
}

// ✅ Cover transition effect
function triggerCoverTransition() {
  const cover = document.getElementById('cover');
  const coverImage = document.getElementById('coverImage');
  const home = document.getElementById('home');
  const glow = document.getElementById('glow');

  coverImage.classList.add('zoomed');

  setTimeout(() => glow.classList.add('active'), 1000);
  setTimeout(() => {
    cover.style.opacity = 0;
    home.style.display = 'flex';
    home.style.opacity = 1;
  }, 3000);
  setTimeout(() => cover.style.display = 'none', 4000);
}

// ✅ Menu button (optional but part of your UI)
document.addEventListener("DOMContentLoaded", () => {
  const menuBtn = document.getElementById('menuBtn');
  const menuOptions = document.getElementById('menuOptions');

  menuBtn?.addEventListener('click', () => {
    const isOpen = menuOptions.style.display === 'flex';
    menuOptions.style.display = isOpen ? 'none' : 'flex';
    menuBtn.textContent = isOpen ? '≡' : '✕';
  });
});
