import firebase_admin
from firebase_admin import credentials, firestore
import string
import random
import os
from datetime import datetime

# Initialize Firebase Admin
db = None

def init_firebase():
    global db
    if db is not None:
        return db
        
    try:
        # Path to your service account key
        service_account_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'serviceAccountKey.json')
        
        if not os.path.exists(service_account_path):
            print(f"❌ Service account key not found at: {service_account_path}")
            print("Please download your Firebase service account key and place it in the backend/ folder")
            return None
            
        cred = credentials.Certificate(service_account_path)
        
        # Check if Firebase is already initialized
        try:
            firebase_admin.get_app()
        except ValueError:
            # App doesn't exist, initialize it
            firebase_admin.initialize_app(cred)
            
        db = firestore.client()
        print("✅ Firebase Firestore initialized successfully!")
        return db
        
    except Exception as e:
        print(f"❌ Firebase initialization failed: {e}")
        return None

def generate_room_id():
    """Generate a random 6-character room ID"""
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

def create_room(username):
    """Create a new room with the given username as admin"""
    db = init_firebase()
    if not db:
        print("❌ Database not available")
        return None
        
    room_id = generate_room_id()
    
    try:
        # Make sure room ID is unique
        max_attempts = 10
        attempts = 0
        
        while attempts < max_attempts:
            doc_ref = db.collection('rooms').document(room_id)
            if not doc_ref.get().exists:
                break
            room_id = generate_room_id()
            attempts += 1
        
        # Create room document
        room_data = {
            'admin': username,
            'members': [username],
            'created_at': firestore.SERVER_TIMESTAMP
        }
        
        doc_ref.set(room_data)
        print(f"✅ Room {room_id} created successfully for {username}")
        return room_id
        
    except Exception as e:
        print(f"❌ Error creating room: {e}")
        return None

def join_room_by_code(room_code, username):
    """Join an existing room by code"""
    db = init_firebase()
    if not db:
        print("❌ Database not available")
        return False
        
    try:
        doc_ref = db.collection('rooms').document(room_code)
        doc = doc_ref.get()
        
        if doc.exists:
            room_data = doc.to_dict()
            members = room_data.get('members', [])
            
            if username not in members:
                members.append(username)
                doc_ref.update({'members': members})
                print(f"✅ {username} joined room {room_code}")
            else:
                print(f"ℹ️ {username} is already in room {room_code}")
            
            return True
        else:
            print(f"❌ Room {room_code} does not exist")
            return False
            
    except Exception as e:
        print(f"❌ Error joining room: {e}")
        return False

def leave_room(room_id, username):
    """Remove user from room"""
    db = init_firebase()
    if not db:
        print("❌ Database not available")
        return False
        
    try:
        doc_ref = db.collection('rooms').document(room_id)
        doc = doc_ref.get()
        
        if doc.exists:
            room_data = doc.to_dict()
            members = room_data.get('members', [])
            
            if username in members:
                members.remove(username)
                
                # If room is empty, delete it
                if not members:
                    doc_ref.delete()
                    print(f"✅ Room {room_id} deleted (empty)")
                else:
                    doc_ref.update({'members': members})
                    print(f"✅ {username} left room {room_id}")
                
                return True
            else:
                print(f"ℹ️ {username} was not in room {room_id}")
                return False
        else:
            print(f"❌ Room {room_id} does not exist")
            return False
            
    except Exception as e:
        print(f"❌ Error leaving room: {e}")
        return False

def get_room_members(room_id):
    """Get list of members in a room"""
    db = init_firebase()
    if not db:
        print("❌ Database not available")
        return []
        
    try:
        doc_ref = db.collection('rooms').document(room_id)
        doc = doc_ref.get()
        
        if doc.exists:
            room_data = doc.to_dict()
            members = room_data.get('members', [])
            print(f"ℹ️ Room {room_id} has {len(members)} members: {members}")
            return members
        else:
            print(f"❌ Room {room_id} does not exist")
            return []
            
    except Exception as e:
        print(f"❌ Error getting room members: {e}")
        return []

def room_exists(room_id):
    """Check if room exists"""
    db = init_firebase()
    if not db:
        return False
        
    try:
        doc_ref = db.collection('rooms').document(room_id)
        exists = doc_ref.get().exists
        print(f"ℹ️ Room {room_id} exists: {exists}")
        return exists
        
    except Exception as e:
        print(f"❌ Error checking room existence: {e}")
        return False

def is_room_admin(room_id, username):
    """Check if user is admin of the room"""
    db = init_firebase()
    if not db:
        return False
        
    try:
        doc_ref = db.collection('rooms').document(room_id)
        doc = doc_ref.get()
        
        if doc.exists:
            room_data = doc.to_dict()
            is_admin = room_data.get('admin') == username
            print(f"ℹ️ {username} is admin of room {room_id}: {is_admin}")
            return is_admin
        else:
            print(f"❌ Room {room_id} does not exist")
            return False
            
    except Exception as e:
        print(f"❌ Error checking admin status: {e}")
        return False

def get_all_rooms():
    """Get all active rooms (for debugging)"""
    db = init_firebase()
    if not db:
        return []
        
    try:
        rooms_ref = db.collection('rooms')
        docs = rooms_ref.stream()
        
        rooms = []
        for doc in docs:
            room_data = doc.to_dict()
            rooms.append({
                'id': doc.id,
                'admin': room_data.get('admin'),
                'members': room_data.get('members', []),
                'created_at': room_data.get('created_at')
            })
        
        print(f"ℹ️ Found {len(rooms)} active rooms")
        return rooms
        
    except Exception as e:
        print(f"❌ Error getting all rooms: {e}")
        return []