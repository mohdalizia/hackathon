// ==========================
// ✅ INITIALIZE FIREBASE
// ==========================
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
const db = firebase.firestore();

// ==========================
// ✅ GOOGLE SIGN-IN
// ==========================
function signInWithGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider)
    .then(result => {
      const user = result.user;
      console.log("Signed in:", user.displayName);
      document.getElementById('signIn').style.display = 'none';
      document.getElementById('cover').style.display = 'flex';
    })
    .catch(error => {
      console.error("Sign in failed:", error.message);
    });
}

// ==========================
// ✅ COVER PAGE TO HOME PAGE TRANSITION
// ==========================
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

  setTimeout(() => glow.classList.add('active'), 1000);
  setTimeout(() => {
    cover.style.opacity = 0;
    home.style.display = 'flex';
    home.style.opacity = 1;
    initLocationTracking();
  }, 3000);
  setTimeout(() => (cover.style.display = 'none'), 4000);
});

// ==========================
// ✅ SPARKLES
// ==========================
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

// ==========================
// ✅ MENU TOGGLE
// ==========================
const menuBtn = document.getElementById('menuBtn');
const menuOptions = document.getElementById('menuOptions');

menuBtn?.addEventListener('click', () => {
  const isOpen = menuOptions.style.display === 'flex';
  menuOptions.style.display = isOpen ? 'none' : 'flex';
  menuBtn.textContent = isOpen ? '≡' : '✕';
});

// ==========================
// ✅ MAP ZOOM CONTROLS
// ==========================
window.addEventListener('DOMContentLoaded', () => {
  const mapImage = document.querySelector('.map-image');
  let currentScale = 1;

  document.getElementById('zoomIn')?.addEventListener('click', () => {
    currentScale += 0.1;
    mapImage.style.transform = `scale(${currentScale})`;
    mapImage.style.transformOrigin = 'top left';
  });

  document.getElementById('zoomOut')?.addEventListener('click', () => {
    currentScale = Math.max(0.2, currentScale - 0.1);
    mapImage.style.transform = `scale(${currentScale})`;
    mapImage.style.transformOrigin = 'top left';
  });
});

// ==========================
// ✅ LOGOUT
// ==========================
function logout() {
  auth.signOut().then(() => {
    location.reload();
  });
}

// ==========================
// ✅ LOCATION TRACKING
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

// ==========================
// ✅ ROOM SYSTEM WITH MODAL
// ==========================
let currentUser = null;
let currentRoomId = null;

auth.onAuthStateChanged(user => {
  if (user) currentUser = user;
});

document.querySelector("#menuOptions button:nth-child(2)").addEventListener("click", () => {
  openRoomModal(); // View Room (Create)
});

document.querySelector("#menuOptions button:nth-child(3)").addEventListener("click", () => {
  openRoomModal(); // Join Room
});

function openRoomModal() {
  document.getElementById("roomModal").style.display = "flex";
}

function closeRoomModal() {
  document.getElementById("roomModal").style.display = "none";
}

async function createRoom() {
  const roomCode = document.getElementById("roomInput").value.trim();

  if (!currentUser) return alert("Please sign in to create a room.");
  if (!roomCode) return alert("Please enter a room code.");

  const roomRef = db.collection("rooms").doc(roomCode);
  const roomDoc = await roomRef.get();

  if (!roomDoc.exists) {
    await roomRef.set({
      admin: currentUser.uid,
      members: {
        [currentUser.uid]: {
          name: currentUser.displayName,
          email: currentUser.email
        }
      }
    });
    alert(`Room "${roomCode}" created successfully.`);
  } else {
    alert("Room already exists. You’ve been added as a member.");
    await roomRef.update({
      [`members.${currentUser.uid}`]: {
        name: currentUser.displayName,
        email: currentUser.email
      }
    });
  }

  currentRoomId = roomCode;
  closeRoomModal();
}

async function requestToJoinRoom() {
  const joinCode = document.getElementById("roomInput").value.trim();

  if (!currentUser) return alert("Please sign in to join a room.");
  if (!joinCode) return alert("Please enter a room code.");

  const roomRef = db.collection("rooms").doc(joinCode);
  const roomDoc = await roomRef.get();

  if (!roomDoc.exists) {
    return alert("Room does not exist.");
  }

  await roomRef.update({
    [`members.${currentUser.uid}`]: {
      name: currentUser.displayName,
      email: currentUser.email
    }
  });

  alert(`You joined room "${joinCode}" successfully.`);
  currentRoomId = joinCode;
  closeRoomModal();
}
