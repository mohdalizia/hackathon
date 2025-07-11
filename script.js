const cover = document.getElementById('cover');
const coverImage = document.getElementById('coverImage');
const home = document.getElementById('home');
const glow = document.getElementById('glow');
const welcomeMsg = document.getElementById('welcomeMsg');
let started = false;

function handleCredentialResponse(response) {
  const jwt = parseJwt(response.credential);
  const name = jwt.name;
  welcomeMsg.innerText = `Welcome to the Map, ${name}!`;
  triggerCoverTransition();
}

function parseJwt(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return {};
  }
}

function triggerCoverTransition() {
  if (started) return;
  started = true;

  coverImage.classList.add('zoomed');
  setTimeout(() => glow.classList.add('active'), 1000);
  setTimeout(() => {
    cover.style.opacity = 0;
    home.style.display = 'flex';
    home.style.opacity = 1;
  }, 3000);
  setTimeout(() => cover.style.display = 'none', 4000);
}

const menuBtn = document.getElementById('menuBtn');
const menuOptions = document.getElementById('menuOptions');

menuBtn.addEventListener('click', () => {
  const isOpen = menuOptions.style.display === 'flex';
  menuOptions.style.display = isOpen ? 'none' : 'flex';
  menuBtn.textContent = isOpen ? '≡' : '✕';
});
