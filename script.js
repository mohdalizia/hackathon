document.addEventListener("DOMContentLoaded", () => {
  const menuBtn = document.getElementById('menuBtn');
  const menuOptions = document.getElementById('menuOptions');

  // Toggle Menu
  menuBtn?.addEventListener('click', () => {
    const isOpen = menuOptions.style.display === 'flex';
    menuOptions.style.display = isOpen ? 'none' : 'flex';
    menuBtn.textContent = isOpen ? '≡' : '✕';
  });

  // Google Login Click Event
  const googleBtn = document.getElementById('googleLoginBtn');
  googleBtn?.addEventListener('click', () => {
    const client = google.accounts.oauth2.initTokenClient({
      client_id: '678440281179-jqiml6orsrn6beunlgbe0sgav3970v2r.apps.googleusercontent.com',
      scope: 'profile email',
      callback: (tokenResponse) => {
        google.accounts.oauth2.userinfo.get({
          access_token: tokenResponse.access_token,
          callback: (userInfo) => {
            showWelcome(userInfo.name);
            triggerCoverTransition();
          }
        });
      }
    });
    client.requestAccessToken();
  });
});

// Show welcome message
function showWelcome(name) {
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
}

// Trigger the cover page transition
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
let tokenClient;

window.onload = function () {
  // Initialize Google OAuth token client
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: '678440281179-jqiml6orsrn6beunlgbe0sgav3970v2r.apps.googleusercontent.com',
    scope: 'email profile openid',
    callback: (tokenResponse) => {
      fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: {
          Authorization: `Bearer ${tokenResponse.access_token}`
        }
      })
        .then(res => res.json())
        .then(user => {
          showWelcome(user.name);
          triggerCoverTransition();
        });
    }
  });

  // Google button click
  const googleBtn = document.getElementById('googleBtn');
  googleBtn?.addEventListener('click', () => {
    tokenClient.requestAccessToken();
  });

  // Floating Menu logic
  const menuBtn = document.getElementById('menuBtn');
  const menuOptions = document.getElementById('menuOptions');
  menuBtn?.addEventListener('click', () => {
    const isOpen = menuOptions.style.display === 'flex';
    menuOptions.style.display = isOpen ? 'none' : 'flex';
    menuBtn.textContent = isOpen ? '≡' : '✕';
  });
};

// Display welcome message on top
function showWelcome(name) {
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
}

// Cover to home transition animation
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
