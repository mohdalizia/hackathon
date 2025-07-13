// ==========================
// ✅ CONFIGURATION
// ==========================
const BACKEND_URL = 'http://localhost:5000'; // Your Flask backend URL

// Firebase config (keep your existing config)
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
  socket = io(BACKEND_URL);
  
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
    await fetch(`${BACKEND_URL}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Important for session cookies
      body: JSON.stringify({ username: user.displayName })
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
// ✅ LOGOUT
// ==========================
async function logout() {
  await auth.signOut();
  // Also logout from Flask backend
  await fetch(`${BACKEND_URL}/api/logout`, {
    credentials: 'include'
  });
  location.reload();
}

// ==========================
// ✅ ROOM FUNCTIONS
// ==========================
async function createRoom() {
  if (!currentUser) {
    alert('Please sign in first');
    return;
  }

  try {
    const response = await fetch(`${BACKEND_URL}/api/create_room`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (data.status === 'success') {
      currentRoomId = data.room_id;
      joinSocketRoom(data.room_id);
      showRoomPage(data.room_id);
      closeRoomModal();
    } else {
      alert(data.message);
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
    const response = await fetch(`${BACKEND_URL}/api/join_room`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ room_code: roomCode })
    });

    const data = await response.json();
    
    if (data.status === 'success') {
      currentRoomId = data.room_id;
      joinSocketRoom(data.room_id);
      showRoomPage(data.room_id);
      closeRoomModal();
    } else {
      alert(data.message);
    }
  } catch (error) {
    console.error('Error joining room:', error);
    alert('Failed to join room');
  }
}

async function leaveRoom() {
  if (currentRoomId) {
    try {
      await fetch(`${BACKEND_URL}/api/leave_room/${currentRoomId}`, {
        method: 'POST',
        credentials: 'include'
      });
      
      currentRoomId = null;
      document.getElementById('home').style.display = 'flex';
      document.getElementById('roomPage').style.display = 'none';
    } catch (error) {
      console.error('Error leaving room:', error);
    }
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

function showRoomPage(roomId) {
  document.getElementById('home').style.display = 'none';
  
  // Create room page if it doesn't exist
  let roomPage = document.getElementById('roomPage');
  if (!roomPage) {
    roomPage = createRoomPageHTML();
    document.body.appendChild(roomPage);
  }
  
  roomPage.style.display = 'block';
  document.getElementById('roomIdDisplay').textContent = roomId;
}

function createRoomPageHTML() {
  const roomPage = document.createElement('div');
  roomPage.id = 'roomPage';
  roomPage.className = 'room-page';
  
  roomPage.innerHTML = `
    <div class="room-header">
      <h2>Room: <span id="roomIdDisplay"></span></h2>
      <button onclick="leaveRoom()">Leave Room</button>
    </div>
    
    <div class="room-content">
      <div class="members-panel">
        <h3>Members</h3>
        <ul id="membersList"></ul>
      </div>
      
      <div class="chat-panel">
        <div id="chatMessages" class="chat-messages"></div>
        <div class="chat-input">
          <input type="text" id="messageInput" placeholder="Type a message..." />
          <button onclick="sendMessage()">Send</button>
        </div>
      </div>
    </div>
  `;
  
  return roomPage;
}

// ==========================
// ✅ KEEP YOUR EXISTING CODE
// ==========================
// (Cover page transition, sparkles, menu toggle, zoom controls, location tracking)
// Just add the room modal and authentication parts

// Your existing code for cover page, sparkles, menu, etc. goes here...
// I'm not including it to keep this focused on the backend connection