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

// ==========================
// ✅ SOCKET.IO CONNECTION
// ==========================
let socket = null;
let currentUser = null;
let currentRoomId = null;

function initSocket() {
  socket = io(); // Connect to same origin (Flask server)
  
  socket.on('message', (data) => {
    displayMessage(data.username, data.message);
  });
  
  socket.on('connect', () => {
    console.log('Connected to server');
  });
  
  socket.on('disconnect', () => {
    console.log('Disconnected from server');
  });
}

// ==========================
// ✅ GOOGLE SIGN-IN
// ==========================
async function signInWithGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  try {
    const result = await auth.signInWithPopup(provider);
    const user = result.user;
    console.log("Signed in:", user.displayName);
    
    // Send username to Flask backend
    await fetch('/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `username=${encodeURIComponent(user.displayName)}`
    });
    
    currentUser = user;
    document.getElementById('signIn').style.display = 'none';
    document.getElementById('cover').style.display = 'flex';
    
    // Initialize Socket.IO after authentication
    initSocket();
    
  } catch (error) {
    console.error("Sign in failed:", error.message);
  }
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
const mapImage = document.querySelector('.map-image');
let currentScale = 1;
const MIN_SCALE = 0.3;
const MAX_SCALE = 2;

function applyMapScale() {
  mapImage.style.transform = `scale(${currentScale})`;
  mapImage.style.transformOrigin = 'top left';
}

window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('zoomIn')?.addEventListener('click', () => {
    if (currentScale < MAX_SCALE) {
      currentScale = Math.min(currentScale + 0.1, MAX_SCALE);
      applyMapScale();
    }
  });

  document.getElementById('zoomOut')?.addEventListener('click', () => {
    if (currentScale > MIN_SCALE) {
      currentScale = Math.max(currentScale - 0.1, MIN_SCALE);
      applyMapScale();
    }
  });

  // Menu button event listeners
  document.getElementById('createRoomBtn')?.addEventListener('click', () => {
    openRoomModal('create');
  });

  document.getElementById('joinRoomBtn')?.addEventListener('click', () => {
    openRoomModal('join');
  });

  // Enter key to send message
  document.getElementById('messageInput')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });
});

// ==========================
// ✅ LOGOUT
// ==========================
async function logout() {
  await auth.signOut();
  // Also logout from Flask backend
  await fetch('/logout');
  location.reload();
}

// ==========================
// ✅ ROOM SYSTEM
// ==========================
function openRoomModal(type) {
  const modal = document.getElementById('roomModal');
  const title = document.getElementById('modalTitle');
  const createBtn = document.getElementById('createBtn');
  const joinBtn = document.getElementById('joinBtn');
  
  if (type === 'create') {
    title.textContent = 'Create Room';
    createBtn.style.display = 'inline-block';
    joinBtn.style.display = 'none';
  } else {
    title.textContent = 'Join Room';
    createBtn.style.display = 'none';
    joinBtn.style.display = 'inline-block';
  }
  
  modal.style.display = 'flex';
}

function closeRoomModal() {
  document.getElementById('roomModal').style.display = 'none';
  document.getElementById('roomInput').value = '';
}

async function createRoom() {
  if (!currentUser) {
    alert('Please sign in first');
    return;
  }

  try {
    const response = await fetch('/create_room');
    if (response.redirected) {
      // Extract room ID from redirect URL
      const url = new URL(response.url);
      const roomId = url.pathname.split('/').pop();
      
      currentRoomId = roomId;
      joinSocketRoom(roomId);
      showRoomPage(roomId);
      closeRoomModal();
    }
  } catch (error) {
    console.error('Error creating room:', error);
    alert('Failed to create room');
  }
}

async function joinRoom() {
  const roomCode = document.getElementById('roomInput').value.trim();
  
  if (!roomCode) {
    alert('Please enter a room code');
    return;
  }

  if (!currentUser) {
    alert('Please sign in first');
    return;
  }

  try {
    const response = await fetch('/join_room', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `room_code=${encodeURIComponent(roomCode)}`
    });

    if (response.ok) {
      if (response.redirected) {
        // Extract room ID from redirect URL
        const url = new URL(response.url);
        const roomId = url.pathname.split('/').pop();
        
        currentRoomId = roomId;
        joinSocketRoom(roomId);
        showRoomPage(roomId);
        closeRoomModal();
      }
    } else {
      const text = await response.text();
      alert(text || 'Invalid room code or failed to join');
    }
  } catch (error) {
    console.error('Error joining room:', error);
    alert('Failed to join room');
  }
}

function joinSocketRoom(roomId) {
  if (socket && currentUser) {
    socket.emit('join', {
      username: currentUser.displayName,
      room: roomId
    });
  }
}

async function leaveRoom() {
  if (currentRoomId) {
    try {
      await fetch(`/leave/${currentRoomId}`);
      currentRoomId = null;
      document.getElementById('home').style.display = 'flex';
      document.getElementById('roomPage').style.display = 'none';
    } catch (error) {
      console.error('Error leaving room:', error);
    }
  }
}

function showRoomPage(roomId) {
  document.getElementById('home').style.display = 'none';
  document.getElementById('roomPage').style.display = 'block';
  document.getElementById('roomIdDisplay').textContent = roomId;
}

function sendMessage() {
  const messageInput = document.getElementById('messageInput');
  const message = messageInput.value.trim();
  
  if (message && socket && currentRoomId && currentUser) {
    socket.emit('send_message', {
      username: currentUser.displayName,
      message: message,
      room: currentRoomId
    });
    messageInput.value = '';
  }
}

function displayMessage(username, message) {
  const chatMessages = document.getElementById('chatMessages');
  if (!chatMessages) return;
  
  const messageElement = document.createElement('div');
  messageElement.className = 'message';
  messageElement.innerHTML = `<strong>${username}:</strong> ${message}`;
  chatMessages.appendChild(messageElement);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// ==========================
// ✅ LOCATION TRACKING
// ==========================
function initLocationTracking() {
  console.log("📡 initLocationTracking() called");

  if (!navigator.geolocation) {
    alert("Geolocation is not supported by your browser.");
    return;
  }

  const mapImage = document.getElementById("mapImage");
  const marker = document.createElement("div");
  marker.className = "user-location";
  mapImage.parentElement.appendChild(marker);

  // 🌏 India bounding box (approx.)
  const latTop = 37.6;
  const latBottom = 6.5;
  const lonLeft = 68.1;
  const lonRight = 97.4;

  // 🗺 Map dimensions (must match actual image size in px)
  const mapWidth = 6202.6;
  const mapHeight = 2481.04;

  navigator.geolocation.watchPosition(
    (position) => {
      const { latitude, longitude } = position.coords;

      if (
        latitude > latTop || latitude < latBottom ||
        longitude < lonLeft || longitude > lonRight
      ) {
        marker.style.display = "none";
        console.warn("🚫 Out of bounds.");
        return;
      }

      marker.style.display = "block";

      const xRatio = (longitude - lonLeft) / (lonRight - lonLeft);
      const yRatio = (latTop - latitude) / (latTop - latBottom);

      const x = xRatio * mapWidth;
      const y = yRatio * mapHeight;

      marker.style.left = `${x}px`;
      marker.style.top = `${y}px`;

      console.log("Latitude:", latitude);
      console.log("Longitude:", longitude);
      console.log("Mapped X:", x);
      console.log("Mapped Y:", y);
    },
    (error) => {
      console.error("⚠️ Location error:", error.message);
    },
    {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 10000
    }
  );
}