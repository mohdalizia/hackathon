// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyC-wnANGp8OGB1BFA9xYlBb2vtiGTuf1co",
  authDomain: "hackatgo-465620.firebaseapp.com",
  projectId: "hackatgo-465620",
  storageBucket: "hackatgo-465620.appspot.com",
  messagingSenderId: "678440281179",
  appId: "1:678440281179:web:8dfb8c978be67c173d8b7e",
  measurementId: "G-CJ67JRE3JF"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// Google Sign-In
function signInWithGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider)
    .then(result => {
      const user = result.user;
      console.log("Signed in:", user.displayName);
      // Show cover page after sign-in
      document.getElementById('signIn').style.display = 'none';
      document.getElementById('cover').style.display = 'flex';
    })
    .catch(error => {
      console.error("Sign in failed:", error.message);
    });
}

// Cover page transition to home page
const cover = document.getElementById('cover');
const coverImage = document.getElementById('coverImage');
const home = document.getElementById('home');
const glow = document.getElementById('glow');
let started = false;

cover?.addEventListener('click', (e) => {
  if (started) return;
  started = true;

  createSparkles(e.clientX, e.clientY);
  coverImage.classList.add('zoomed');

  setTimeout(() => {
    glow.classList.add('active');
  }, 1000);

  setTimeout(() => {
    cover.style.opacity = 0;
    home.style.display = 'flex';
    home.style.opacity = 1;

    // Start tracking location once home page shows
    initLocationTracking();
  }, 3000);

  setTimeout(() => {
    cover.style.display = 'none';
  }, 4000);
});

// Sparkle particle generator
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

    setTimeout(() => {
      sparkle.remove();
    }, 800);
  }
}

// Menu toggle
const menuBtn = document.getElementById('menuBtn');
const menuOptions = document.getElementById('menuOptions');

menuBtn?.addEventListener('click', () => {
  const isOpen = menuOptions.style.display === 'flex';
  menuOptions.style.display = isOpen ? 'none' : 'flex';
  menuBtn.textContent = isOpen ? '≡' : '✕';
});

// Zoom Controls
window.addEventListener('DOMContentLoaded', () => {
  const mapImage = document.querySelector('.map-image');
  let currentScale = 1;

  const zoomInBtn = document.getElementById('zoomIn');
  const zoomOutBtn = document.getElementById('zoomOut');

  zoomInBtn?.addEventListener('click', () => {
    currentScale += 0.1;
    mapImage.style.transform = `scale(${currentScale})`;
    mapImage.style.transformOrigin = 'top left';
  });

  zoomOutBtn?.addEventListener('click', () => {
    currentScale = Math.max(0.2, currentScale - 0.1);
    mapImage.style.transform = `scale(${currentScale})`;
    mapImage.style.transformOrigin = 'top left';
  });
});

// Logout
function logout() {
  auth.signOut().then(() => {
    location.reload();
  });
}

// ==========================
// ✅ REAL-TIME LOCATION TRACKING
// ==========================
function initLocationTracking() {
  if (!navigator.geolocation) {
    alert("Geolocation is not supported by your browser.");
    return;
  }

  const homePage = document.getElementById('home');
  let marker = document.createElement('div');
  marker.className = 'user-location';
  homePage.appendChild(marker);

  navigator.geolocation.watchPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      console.log("User Location:", latitude, longitude);

      // Mock positioning within the map image
      // This will be mapped to pixels manually (you can refine it later)
      const x = (longitude % 1) * 1000 + 200;
      const y = (latitude % 1) * 1000 + 200;

      marker.style.left = `${x}px`;
      marker.style.top = `${y}px`;
    },
    (error) => {
      console.error("Error getting location:", error.message);
    },
    {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 10000
    }
  );
}
