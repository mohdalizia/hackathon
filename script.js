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

      // Show interactive page
      document.getElementById('signIn').style.display = 'none';
      document.getElementById('interactive').style.display = 'flex';
    })
    .catch(error => {
      console.error("Sign in failed:", error.message);
    });
}

// Cover transition to home page
const coverImage = document.getElementById('coverImage');
const glow = document.getElementById('glow');

coverImage?.addEventListener('click', () => {
  glow.classList.add('sparkle');
  setTimeout(() => {
    document.getElementById('interactive').style.display = 'none';
    document.getElementById('home').style.display = 'flex';
  }, 2000);
});

// Menu toggle
const menuBtn = document.getElementById('menuBtn');
const menuOptions = document.getElementById('menuOptions');

menuBtn?.addEventListener('click', () => {
  const isOpen = menuOptions.style.display === 'flex';
  menuOptions.style.display = isOpen ? 'none' : 'flex';
  menuBtn.textContent = isOpen ? '≡' : '✕';
});

// Logout
function logout() {
  auth.signOut().then(() => {
    location.reload();
  });
}
