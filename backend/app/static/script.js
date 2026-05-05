// ==========================
// 🚨 DEMO CONFIGURATION
// ==========================
const TEST_MODE = true; // SET TO FALSE FOR ACTUAL CAMPUS DEMO

// ==========================
// ✅ INITIALIZE FIREBASE (UNCHANGED)
// ==========================
const firebaseConfig = {
  apiKey: typeof FIREBASE_API_KEY !== 'undefined' ? FIREBASE_API_KEY : "",
  authDomain: "my-map-project-deffb.firebaseapp.com",
  projectId: "my-map-project-deffb",
  storageBucket: "my-map-project-deffb.firebasestorage.app",
  messagingSenderId: "225623703410",
  appId: "1:225623703410:web:dd234f03917e6155b427eb",
  measurementId: "G-LNVYY4PLKS"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.firestore();

// ==========================
// ✅ SOCKET.IO CONNECTION
// ==========================
let socket = null;
let currentUser = null;
let currentRoomId = null;
let roomListener = null;
let locationSharingEnabled = true;
let locationWatchId = null;

function initSocket() {
  if (socket) return; 
  socket = io(); 
  
  socket.on('message', (data) => {
    console.log('Message received:', data);
    displayMessage(data.username, data.message, data.timestamp);
  });
  
  socket.on('location_update', (data) => {
    console.log('Location update:', data);
    updateRoomMembersLocations(data);
  });
  
  socket.on('connect', () => {
    console.log('✅ Connected to server');
    if (currentRoomId && currentUser) {
        joinSocketRoom(currentRoomId);
    }
  });
  
  socket.on('disconnect', () => {
    console.log('❌ Disconnected from server');
  });
  
  socket.on('connect_error', (error) => {
    console.error('Connection error:', error);
  });
}

// ==========================
// ✅ AUTHENTICATION - OAUTH WITH POPUP
// ==========================
// Uses signInWithPopup() instead of signInWithRedirect()
// This prevents redirect URI configuration issues
// ⚠️  IMPORTANT: Add these domains to Firebase Console:
//     1. Go to Authentication → Settings → Authorized domains
//     2. Add: localhost:5000 (development)
//     3. Add: your-production-domain.com (when deployed)

async function signInWithGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  
  // Set custom parameters for Google OAuth (optional: restrict to specific domains)
  provider.setCustomParameters({
    'hd': 'jiit.ac.in' // Restrict to specific Google Workspace domain if needed
  });
  
  try {
    console.log("🔐 Initiating Google Sign-In with popup...");
    const result = await auth.signInWithPopup(provider);
    console.log("✅ User signed in successfully:", result.user.displayName);
    console.log("📧 Email:", result.user.email);
    // The auth.onAuthStateChanged will handle the rest
  } catch (error) {
    console.error("❌ Sign in failed:", error.code, error.message);
    
    // Handle specific Firebase auth errors
    if (error.code === 'auth/popup-blocked') {
      alert("Pop-up was blocked. Please allow pop-ups and try again.");
    } else if (error.code === 'auth/popup-closed-by-user') {
      alert("Sign-in cancelled. Please try again.");
    } else if (error.code === 'auth/unauthorized-domain') {
      alert("Error: This domain is not authorized in Firebase Console.\nPlease add it to: Authentication → Settings → Authorized domains");
    } else {
      alert("Sign in failed: " + error.message);
    }
  }
}

function handleLoginSuccess(user) {
    currentUser = user;
    document.querySelector('.sign-in-page').style.display = 'none';
    document.querySelector('.cover-page').style.display = 'flex'; 
    
    // Set dynamic greeting
    const userNameDisplay = document.getElementById('userNameDisplay');
    if (userNameDisplay) userNameDisplay.textContent = user.displayName;
    
    initSocket();
    
    // Fetch user's persistent rooms for the dashboard
    fetchUserRooms();
}

auth.onAuthStateChanged(async (user) => {
    if (user) {
        try {
            await fetch('/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `username=${encodeURIComponent(user.displayName)}`
            });
        } catch (error) {
            console.error("Backend sync failed:", error);
        }
        handleLoginSuccess(user);
    }
});

async function logout() {
  try {
    stopRoomListener();
    if (currentRoomId) {
      await fetch(`/leave/${currentRoomId}`);
    }
    localStorage.removeItem('currentRoomId');
    await auth.signOut();
    window.location.href = "/";
  } catch (error) {
    console.error("Logout failed:", error);
  }
}

// ==========================
// ✅ UI ANIMATIONS (UNCHANGED)
// ==========================
const cover = document.querySelector('.cover-page');
const home = document.querySelector('.home-page');
const glow = document.querySelector('.glow');
let started = false;

if(cover) {
    cover.addEventListener('click', (e) => {
      if (started) return;
      started = true;
      
      createSparkles(e.clientX, e.clientY);
      const bg = cover.querySelector('.bg');
      if(bg) bg.classList.add('zoomed');
      setTimeout(() => glow.classList.add('active'), 1000);
      
      setTimeout(() => {
        cover.style.opacity = 0;
        document.body.classList.add('loaded');
        home.style.display = 'block';
        
        // Trigger Google Map Init
        initMap(); 
        
      }, 3000);
      
      setTimeout(() => (cover.style.display = 'none'), 4000);
    });
}

function createSparkles(x, y) {
  for (let i = 0; i < 20; i++) {
    const sparkle = document.createElement('div');
    sparkle.className = 'sparkle';
    const angle = Math.random() * 2 * Math.PI;
    const distance = Math.random() * 60 + 20;
    
    sparkle.style.left = `${x}px`;
    sparkle.style.top = `${y}px`;
    sparkle.style.setProperty('--scatter-transform', `translate(${Math.cos(angle)*distance}px, ${Math.sin(angle)*distance}px)`);
    
    document.body.appendChild(sparkle);
    setTimeout(() => sparkle.remove(), 800);
  }
}

const menuBtn = document.getElementById('menuBtn');
if(menuBtn) {
    menuBtn.addEventListener('click', () => {
      const menuOptions = document.querySelector('.menu-options');
      const isOpen = menuOptions.style.display === 'flex';
      menuOptions.style.display = isOpen ? 'none' : 'flex';
      menuBtn.textContent = isOpen ? '≡' : '✕';
    });
}

// ==========================
// ✅ ROOM LOGIC - IMPROVED
// ==========================
function openRoomModal(type) {
  const modal = document.getElementById('roomModal');
  const createBtn = document.getElementById('createBtn');
  const joinBtn = document.getElementById('joinBtn');
  const modalTitle = document.getElementById('modalTitle');
  const roomInput = document.getElementById('roomInput');
  
  roomInput.value = '';
  roomInput.placeholder = type === 'create' ? 'Creating new room...' : 'Enter Room Code';
  
  if(type === 'create') {
     modalTitle.textContent = 'Create Room';
     createBtn.style.display = 'inline-block';
     joinBtn.style.display = 'none';
     roomInput.style.display = 'none';
  } else {
     modalTitle.textContent = 'Join Room';
     createBtn.style.display = 'none';
     joinBtn.style.display = 'inline-block';
     roomInput.style.display = 'block';
  }
  modal.style.display = 'flex';
}

window.onclick = function(event) {
    const modal = document.getElementById('roomModal');
    if (event.target == modal) closeRoomModal();
}

function closeRoomModal() {
  const modal = document.getElementById('roomModal');
  if (modal) modal.style.display = "none";
}

// ==========================
// ✅ DASHBOARD & MULTI-ROOM
// ==========================
async function fetchUserRooms() {
  try {
    const response = await fetch('/api/user/rooms', {
      credentials: 'include'
    });
    const data = await response.json();
    
    if (data.status === 'success') {
      populateRoomsDropdown(data.rooms);
    }
  } catch (error) {
    console.error('Error fetching user rooms:', error);
  }
}

function populateRoomsDropdown(rooms) {
  const dropdown = document.getElementById('roomsDropdown');
  if (!dropdown) return;
  
  dropdown.innerHTML = '';
  
  if (!rooms || rooms.length === 0) {
    dropdown.innerHTML = '<div style="padding: 10px; color: #aaa; font-size: 14px;">No active rooms</div>';
    return;
  }
  
  rooms.forEach(roomId => {
    const btn = document.createElement('button');
    btn.textContent = `Room: ${roomId}`;
    btn.onclick = () => switchRoom(roomId);
    dropdown.appendChild(btn);
  });
}

function toggleRoomsDropdown() {
  const dropdown = document.getElementById('roomsDropdown');
  if (!dropdown) return;
  dropdown.style.display = dropdown.style.display === 'flex' ? 'none' : 'flex';
}

// Close dropdown if clicked outside
window.addEventListener('click', function(e) {
  if (!document.getElementById('viewRoomsBtn')?.contains(e.target) && !document.getElementById('roomsDropdown')?.contains(e.target)) {
    const dropdown = document.getElementById('roomsDropdown');
    if (dropdown) dropdown.style.display = 'none';
  }
});

async function switchRoom(roomId) {
  // If already in this room, do nothing
  if (currentRoomId === roomId) {
    await showRoomPage(roomId);
    return;
  }
  
  // If in another room, leave the socket for the old room
  if (currentRoomId) {
    stopRoomListener();
    if (socket) {
      socket.emit('leave', { username: currentUser?.displayName, room: currentRoomId });
    }
    Object.values(memberMarkers).forEach(marker => marker.setMap(null));
    memberMarkers = {};
  }
  
  currentRoomId = roomId;
  localStorage.setItem('currentRoomId', roomId);
  
  const dropdown = document.getElementById('roomsDropdown');
  if (dropdown) dropdown.style.display = 'none';
  
  await joinSocketRoom(roomId);
  await startRoomListener(roomId);
  await showRoomPage(roomId);
}

// ==========================
// ✅ SETTINGS MODAL
// ==========================
function openSettingsModal() {
  const modal = document.getElementById('settingsModal');
  if (modal) modal.style.display = 'flex';
}

function closeSettingsModal() {
  const modal = document.getElementById('settingsModal');
  if (modal) modal.style.display = 'none';
}

async function createRoom() {
  if (!currentUser) return alert('Please sign in first');
  
  const createBtn = document.getElementById('createBtn');
  const originalText = createBtn.textContent;
  createBtn.innerHTML = 'Creating...<div class="spinner"></div>';
  createBtn.disabled = true;

  try {
     const response = await fetch('/create_room', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       credentials: 'include'
     });
     
     const data = await response.json();
     
     if (data.status === 'success') {
       currentRoomId = data.room_id;
       showRoomCodeModal(data.room_id);
       closeRoomModal();
     } else {
       alert('Error: ' + data.message);
     }
  } catch (error) {
     console.error("Create room failed", error);
     alert('Failed to create room');
  } finally {
     createBtn.innerHTML = originalText;
     createBtn.disabled = false;
  }
}

function showRoomCodeModal(roomId) {
  const modal = document.getElementById('roomModal');
  const modalTitle = document.getElementById('modalTitle');
  const roomInput = document.getElementById('roomInput');
  const createBtn = document.getElementById('createBtn');
  const joinBtn = document.getElementById('joinBtn');
  
  modalTitle.textContent = '✅ Room Created!';
  roomInput.value = roomId;
  roomInput.readOnly = true;
  roomInput.style.display = 'block';
  roomInput.style.fontSize = '18px';
  roomInput.style.fontWeight = 'bold';
  roomInput.style.textAlign = 'center';
  roomInput.style.cursor = 'pointer';
  createBtn.style.display = 'none';
  joinBtn.textContent = 'Copy & Enter Room';
  joinBtn.style.display = 'inline-block';
  
  modal.style.display = 'flex';
  
  // Allow clicking to copy room code
  roomInput.onclick = () => {
    roomInput.select();
    document.execCommand('copy');
    alert('Room code copied to clipboard!');
  };
  
  // Change button to enter room
  joinBtn.onclick = async () => {
    roomInput.select();
    document.execCommand('copy');
    
    // Join the room
    await switchRoom(roomId);
    closeRoomModal();
    fetchUserRooms(); // Refresh dashboard list
  };
}

async function joinRoom() {
  const roomCode = document.getElementById('roomInput').value.trim().toUpperCase();
  if (!roomCode) {
    alert('Please enter a room code');
    return;
  }
  
  if (!currentUser) return alert('Please sign in first');
  
  const joinBtn = document.getElementById('joinBtn');
  const originalText = joinBtn.textContent;
  joinBtn.innerHTML = 'Joining...<div class="spinner"></div>';
  joinBtn.disabled = true;

  try {
    const response = await fetch('/join_room', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ room_code: roomCode })
    });
    
    const data = await response.json();
    
    if (data.status === 'success') {
      await switchRoom(data.room_id);
      closeRoomModal();
      fetchUserRooms(); // Refresh dashboard list
    } else {
      alert('Error: ' + data.message);
    }
  } catch (error) {
    console.error('Join failed', error);
    alert('Failed to join room');
  } finally {
    joinBtn.innerHTML = originalText;
    joinBtn.disabled = false;
  }
}

async function leaveRoom() {
  if (!currentRoomId) return;
  
  stopRoomListener();
  
  if (socket) {
    socket.emit('leave', { username: currentUser?.displayName, room: currentRoomId });
  }
  
  try { 
    await fetch(`/leave/${currentRoomId}`, { 
      method: 'POST',
      credentials: 'include'
    }); 
  } catch (e) {}
  
  // Cleanup local state
  Object.values(memberMarkers).forEach(marker => marker.setMap(null));
  memberMarkers = {};
  
  localStorage.removeItem('currentRoomId');
  currentRoomId = null;
  
  // Refresh dashboard list
  fetchUserRooms();
  
  // Go back to home
  const roomPage = document.getElementById('roomPage');
  const home = document.querySelector('.home-page');
  if (roomPage) roomPage.style.display = 'none';
  if (home) home.style.display = 'flex';
  
  // Reset map
  if (map) {
    map = null;
    const mapElement = document.getElementById("mapImage");
    mapElement.innerHTML = '';
    initMap();
  }
}

function goToDashboard() {
  const roomPage = document.getElementById('roomPage');
  const home = document.querySelector('.home-page');
  
  if (roomPage) roomPage.style.display = 'none';
  if (home) home.style.display = 'flex';
  
  // Refresh the dashboard room list
  fetchUserRooms();
}

async function joinSocketRoom(roomId) {
  if (socket && currentUser) {
    socket.emit('join', { username: currentUser.displayName, room: roomId });
  }
}

async function showRoomPage(roomId) {
  const home = document.querySelector('.home-page');
  const roomPage = document.getElementById('roomPage');
  
  if (home) home.style.display = 'none';
  if (roomPage) roomPage.style.display = 'block';
  
  const sidePanels = document.querySelector('.side-panels');
  if (sidePanels) sidePanels.style.display = 'flex';
  
  document.getElementById('roomIdDisplay').textContent = roomId;
  
  // Initialize room map
  setTimeout(() => {
    const roomMapContainer = document.getElementById('roomPageMap');
    if (roomMapContainer && !roomMapContainer.dataset.mapInitialized) {
      initRoomMap(roomMapContainer);
      roomMapContainer.dataset.mapInitialized = 'true';
    }
  }, 500);
}

// ==========================
// ✅ SERVER / PERSISTENCE INIT
// ==========================
async function initRoomFromServer(roomId) {
  currentRoomId = roomId;
  localStorage.setItem('currentRoomId', roomId);
  
  // Need to wait until currentUser is populated
  const checkUserInterval = setInterval(async () => {
    if (currentUser) {
      clearInterval(checkUserInterval);
      
      // Stop the main cover animation if it's still running
      const coverPage = document.getElementById('cover');
      if (coverPage) coverPage.style.display = 'none';
      document.body.classList.add('loaded');
      
      if (!map) initMap();
      
      // Auto-join the specific room
      await switchRoom(roomId);
    }
  }, 100);
}

// ==========================
// ✅ MESSAGING
// ==========================
function sendMessage() {
  const messageInput = document.getElementById('messageInput');
  const message = messageInput.value.trim();
  
  if (message && socket && currentRoomId && currentUser) {
    socket.emit('send_message', {
      username: currentUser.displayName,
      message: message,
      room: currentRoomId,
      timestamp: new Date().toLocaleTimeString()
    });
    messageInput.value = '';
  }
}

function displayMessage(username, message, timestamp) {
  const chatMessages = document.getElementById('chatMessages');
  if (!chatMessages) return;
  
  const messageElement = document.createElement('div');
  messageElement.className = 'message';
  
  const timeStr = timestamp ? new Date(timestamp).toLocaleTimeString() : '';
  const isOwn = currentUser && username === currentUser.displayName;
  
  messageElement.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: start;">
      <strong style="color: ${isOwn ? '#00ff00' : '#00b4ff'}">${username}</strong>
      <span class="message-time">${timeStr}</span>
    </div>
    <div style="margin-top: 4px;">${message}</div>
  `;
  
  chatMessages.appendChild(messageElement);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// ==========================
// ✅ FIRESTORE SYNC - ENHANCED
// ==========================
function startRoomListener(roomId) {
  if (roomListener) roomListener();
  memberMarkers = {}; 
  
  roomListener = db.collection('rooms').doc(roomId).onSnapshot((doc) => {
    if (doc.exists) {
      const roomData = doc.to_dict?.() || doc.data?.() || doc;
      
      // Update members display
      updateMembersList(roomData.members || []);
      
      // Update locations
      updateRoomMembersLocations(roomData);
    }
  });
}

function stopRoomListener() {
  if (roomListener) {
    roomListener();
    roomListener = null;
  }
}

function updateMembersList(members) {
  const membersList = document.getElementById('membersList');
  if (!membersList) return;
  
  membersList.innerHTML = '';
  members.forEach(member => {
    const li = document.createElement('li');
    li.textContent = member;
    if (currentUser && member === currentUser.displayName) {
      li.classList.add('own-member');
      li.textContent = '✅ ' + member + ' (You)';
    }
    membersList.appendChild(li);
  });
}

// ==========================
// 🗺️ GOOGLE MAPS LOGIC WITH LIVE TUNER & ROOM MAP
// ==========================
let map;
let roomMap;
let overlay;
let roomOverlay;
let myMarker;
let memberMarkers = {};

function initRoomMap(containerElement) {
  if (roomMap) return;
  
  // Center on JIIT Campus
  const centerPoint = { lat: 28.6315, lng: 77.3745 };
  
  roomMap = new google.maps.Map(containerElement, {
    zoom: 18,
    center: centerPoint,
    mapTypeId: 'roadmap',
    disableDefaultUI: true,
    styles: mapStyles,
    gestureHandling: 'greedy',
    zoomControl: false,
    fullscreenControl: false,
    mapTypeControl: false,
    streetViewControl: false,
    backgroundColor: '#000000'
  });
  
  // Load overlay for room map
  loadRoomOverlay(currentBounds);
  
  // Start location tracking for room map
  startLocationTrackingForRoom();
  
  console.log("✅ Room Map Initialized");
}

function loadRoomOverlay(bounds) {
  if (roomOverlay) roomOverlay.setMap(null);
  
  const imagePath = "/static/Images/final-map-page-jmd.png";
  
  roomOverlay = new google.maps.GroundOverlay(imagePath, bounds, {
    opacity: 1.0,
    map: roomMap
  });
}

let currentBounds = {
    north: 28.6313, 
    south: 28.6287, 
    east:  77.3750, 
    west:  77.3703 
};

// Map Styles (FULLY HIDE all Google Maps background)
const mapStyles = [
    { featureType: "all", elementType: "all", stylers: [{ visibility: "off" }] },
    { featureType: "all", elementType: "labels", stylers: [{ visibility: "off" }] },
    { featureType: "all", elementType: "geometry", stylers: [{ visibility: "off" }] },
    { featureType: "road", stylers: [{ visibility: "off" }] },
    { featureType: "water", stylers: [{ visibility: "off" }] },
    { featureType: "poi", stylers: [{ visibility: "off" }] },
    { featureType: "landscape", stylers: [{ visibility: "off" }] },
    { featureType: "transit", stylers: [{ visibility: "off" }] },
    { featureType: "administrative", stylers: [{ visibility: "off" }] }
];

function initMap() {
    if (map) return;

    const mapElement = document.getElementById("mapImage");
    if (mapElement.tagName === 'IMG') {
        console.warn("Please change #mapImage tag from <img> to <div> in HTML!");
    }

    // Center on JIIT Campus
    const centerPoint = { lat: 28.6315, lng: 77.3745 };

    map = new google.maps.Map(mapElement, {
        zoom: 18,
        center: centerPoint,
        mapTypeId: 'roadmap',  // Changed from satellite to avoid tile visibility
        disableDefaultUI: true,
        
        styles: mapStyles,
        gestureHandling: 'greedy',
        zoomControl: false,
        fullscreenControl: false,
        mapTypeControl: false,
        streetViewControl: false
    });

    // Hide all map tiles by covering with invisible overlay
    const hideMapElement = document.createElement('div');
    hideMapElement.id = 'hideMapTiles';
    hideMapElement.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: transparent;
        pointer-events: none;
        z-index: 0;
    `;
    mapElement.appendChild(hideMapElement);

    // 1. Load the Overlay (Calling helper function)
    loadOverlay(currentBounds);

    console.log("✅ Map Initialized. Type tuneMap() in console to adjust overlay.");
    startLocationTracking();
}

// Helper to reload overlay dynamically
function loadOverlay(bounds) {
    if (overlay) overlay.setMap(null); // Remove old overlay

    const imagePath = "/static/Images/final-map-page-jmd.png"; 
    
    overlay = new google.maps.GroundOverlay(imagePath, bounds, {
        opacity: 1.0, // Fully opaque - custom map is the only visible layer
        map: map
    });
}

// 🚨 LIVE TUNING FUNCTION
// Call this from the browser console: tuneMap(north, south, east, west)
// Example: tuneMap(28.6328, 28.6304, 77.3762, 77.3728)
window.tuneMap = function(north, south, east, west) {
    currentBounds = { north, south, east, west };
    loadOverlay(currentBounds);
    console.log("✅ Map Bounds Updated:", currentBounds);
    console.log("📍 Bounds Details:");
    console.log(`   North: ${north}, South: ${south}`);
    console.log(`   East: ${east}, West: ${west}`);
    console.log("📌 Tip: Adjust bounds to completely cover the viewport with your image");
};

// Helper function to show current bounds
window.showBounds = function() {
    console.log("Current Bounds:", currentBounds);
    return currentBounds;
};

// Helper to expand bounds (useful for covering edges)
window.expandBounds = function(factor = 1.2) {
    const centerLat = (currentBounds.north + currentBounds.south) / 2;
    const centerLng = (currentBounds.east + currentBounds.west) / 2;
    const latDiff = (currentBounds.north - currentBounds.south) * (factor - 1) / 2;
    const lngDiff = (currentBounds.east - currentBounds.west) * (factor - 1) / 2;
    
    const newBounds = {
        north: centerLat + latDiff,
        south: centerLat - latDiff,
        east: centerLng + lngDiff,
        west: centerLng - lngDiff
    };
    
    window.tuneMap(newBounds.north, newBounds.south, newBounds.east, newBounds.west);
};

function startLocationTracking() {
    if (!navigator.geolocation) {
        console.warn('Geolocation not available');
        return;
    }

    if (locationWatchId) {
        navigator.geolocation.clearWatch(locationWatchId);
    }

    locationWatchId = navigator.geolocation.watchPosition((pos) => {
        if (!locationSharingEnabled) return;
        
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const userPos = { lat, lng };
        
        if (map && !myMarker) {
            myMarker = new google.maps.Marker({
                map: map,
                title: "Me",
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 8,
                    fillColor: "#00FF00",
                    fillOpacity: 1,
                    strokeWeight: 2,
                    strokeColor: "white",
                }
            });
        }
        
        if (myMarker) {
            myMarker.setPosition(userPos);
        }

        if (currentRoomId && currentUser) {
            updateUserLocationInRoom(lat, lng);
        }

    }, (err) => {
        console.error('Geolocation error:', err);
    }, { 
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
    });
}

function startLocationTrackingForRoom() {
    if (!navigator.geolocation) {
        console.warn('Geolocation not available');
        return;
    }

    if (locationWatchId) {
        navigator.geolocation.clearWatch(locationWatchId);
    }

    locationWatchId = navigator.geolocation.watchPosition((pos) => {
        if (!locationSharingEnabled) return;
        
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const userPos = { lat, lng };
        
        if (roomMap && !myMarker) {
            myMarker = new google.maps.Marker({
                map: roomMap,
                title: "Me (" + currentUser?.displayName + ")",
                label: { 
                    text: "ME", 
                    color: "white", 
                    fontSize: "12px",
                    fontWeight: "bold"
                },
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 10,
                    fillColor: "#FF0000",
                    fillOpacity: 1,
                    strokeWeight: 3,
                    strokeColor: "#FFFF00",
                }
            });
        }
        
        if (myMarker && roomMap) {
            myMarker.setPosition(userPos);
            myMarker.setMap(roomMap);
        }

        if (currentRoomId && currentUser) {
            updateUserLocationInRoom(lat, lng);
        }

    }, (err) => {
        console.error('Geolocation error:', err);
    }, { 
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
    });
}

function togglePrivacy(checkbox) {
    locationSharingEnabled = checkbox.checked;
    
    // Update both toggles
    document.getElementById('privacyToggleSettings').checked = locationSharingEnabled;
    
    if (!locationSharingEnabled) {
        // Stop tracking temporarily
        if (myMarker) {
            myMarker.setMap(null);
            myMarker = null;
        }
        
        // Remove from firebase
        if (currentRoomId && currentUser) {
            db.collection('rooms').doc(currentRoomId).set({
                members_locations: {
                    [currentUser.displayName]: firebase.firestore.FieldValue.delete()
                }
            }, { merge: true });
        }
        alert('Location sharing disabled. Your location will not be visible to others.');
    } else {
        // Restart tracking
        if (currentRoomId) {
            startLocationTrackingForRoom();
        } else {
            startLocationTracking();
        }
        alert('Location sharing enabled. Your location will be visible to room members.');
    }
}

function updateUserLocationInRoom(lat, lng) {
    if(!currentRoomId) return;
    db.collection('rooms').doc(currentRoomId).set({
        members_locations: {
            [currentUser.displayName]: {
                latitude: lat, 
                longitude: lng, 
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            }
        }
    }, { merge: true });
}

function updateRoomMembersLocations(roomData) {
    const locs = roomData.members_locations || {};
    
    const mapToUse = roomMap || map;
    if (!mapToUse) return;
    
    Object.keys(locs).forEach(name => {
        if (currentUser && name === currentUser.displayName) return;
        
        const loc = locs[name];
        if (!loc) return;
        
        const pos = { lat: loc.latitude, lng: loc.longitude };

        if (!memberMarkers[name]) {
            memberMarkers[name] = new google.maps.Marker({
                position: pos,
                map: mapToUse,
                label: { 
                    text: name, 
                    color: "white", 
                    fontSize: "12px", 
                    className: "map-label" 
                },
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 6,
                    fillColor: "#007bff",
                    fillOpacity: 1,
                    strokeWeight: 2,
                    strokeColor: "white",
                }
            });
        } else {
            memberMarkers[name].setPosition(pos);
        }
    });

    Object.keys(memberMarkers).forEach(name => {
        if (!locs[name]) {
            memberMarkers[name].setMap(null);
            delete memberMarkers[name];
        }
    });
}

// ==========================
// ✅ BOOTSTRAP
// ==========================
window.addEventListener('DOMContentLoaded', () => {
    document.getElementById('createRoomBtn')?.addEventListener('click', () => openRoomModal('create'));
    document.getElementById('joinRoomBtn')?.addEventListener('click', () => openRoomModal('join'));
    
    window.initMap = initMap;
});