function handleCredentialResponse(response) {
  const user = parseJwt(response.credential);
  if (user) {
    document.getElementById("signinPage").style.display = "none";
    document.getElementById("cover").style.display = "flex";
  }
}
function parseJwt(token) {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(
    atob(base64).split('').map(c =>
      '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    ).join('')
  );
  return JSON.parse(jsonPayload);
}

// Cover page click to trigger animation
const cover = document.getElementById('cover');
const coverImage = document.getElementById('coverImage');
const home = document.getElementById('home');
const glow = document.getElementById('glow');
let started = false;

cover?.addEventListener('click', (e) => {
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
});

// Menu Button
document.addEventListener("DOMContentLoaded", () => {
  const menuBtn = document.getElementById('menuBtn');
  const menuOptions = document.getElementById('menuOptions');
  menuBtn?.addEventListener('click', () => {
    const isOpen = menuOptions.style.display === 'flex';
    menuOptions.style.display = isOpen ? 'none' : 'flex';
    menuBtn.textContent = isOpen ? '≡' : '✕';
  });
});
