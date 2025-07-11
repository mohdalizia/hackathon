const cover = document.getElementById('cover');
const coverImage = document.getElementById('coverImage');
const home = document.getElementById('home');
const glow = document.getElementById('glow');
const menuBtn = document.getElementById('menuBtn');
const menuOptions = document.getElementById('menuOptions');

function handleCredentialResponse(response) {
  const user = parseJwt(response.credential);
  const name = user.name;
  document.body.innerHTML += `<div style="position:fixed;top:20px;right:20px;padding:10px 16px;background:gold;color:black;border-radius:10px;font-weight:bold;z-index:10000">Welcome, ${name}!</div>`;
  triggerCoverTransition();
}

function parseJwt(token) {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));
  return JSON.parse(jsonPayload);
}

function triggerCoverTransition() {
  if (cover.classList.contains("done")) return;
  cover.classList.add("done");

  createSparkles(window.innerWidth / 2, window.innerHeight / 2);
  coverImage.classList.add('zoomed');
  setTimeout(() => glow.classList.add('active'), 1000);
  setTimeout(() => {
    cover.style.opacity = 0;
    home.style.display = 'flex';
    home.style.opacity = 1;
  }, 3000);
  setTimeout(() => cover.style.display = 'none', 4000);
}

function createSparkles(x, y) {
  for (let i = 0; i < 20; i++) {
    const sparkle = document.createElement('div');
    sparkle.className = 'sparkle';
    const angle = Math.random() * 2 * Math.PI;
    const distance = Math.random() * 60 + 20;
    const dx = Math.cos(angle) * distance;
    const dy = Math.sin(angle) * distance;
    sparkle.style.left = `${x}px`;
    sparkle.style.top = `${y}px`;
    sparkle.style.setProperty('--scatter-transform', `translate(${dx}px, ${dy}px)`);
    document.body.appendChild(sparkle);
    setTimeout(() => sparkle.remove(), 800);
  }
}

menuBtn.addEventListener('click', () => {
  const isOpen = menuOptions.style.display === 'flex';
  menuOptions.style.display = isOpen ? 'none' : 'flex';
  menuBtn.textContent = isOpen ? '≡' : '✕';
});
