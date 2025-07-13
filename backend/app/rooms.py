import string
import random

# In-memory storage (replace with database in production)
rooms = {}

def generate_room_id():
    """Generate a random 6-character room ID"""
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

def create_room(username):
    """Create a new room with the given username as admin"""
    room_id = generate_room_id()
    
    # Make sure room ID is unique
    while room_id in rooms:
        room_id = generate_room_id()
    
    rooms[room_id] = {
        'admin': username,
        'members': [username],
        'created_at': None  # You can add timestamp if needed
    }
    
    return room_id

def join_room_by_code(room_code, username):
    """Join an existing room by code"""
    if room_code in rooms:
        if username not in rooms[room_code]['members']:
            rooms[room_code]['members'].append(username)
        return True
    return False

def leave_room(room_id, username):
    """Remove user from room"""
    if room_id in rooms and username in rooms[room_id]['members']:
        rooms[room_id]['members'].remove(username)
        
        # If room is empty, delete it
        if not rooms[room_id]['members']:
            del rooms[room_id]
        
        return True
    return False

def get_room_members(room_id):
    """Get list of members in a room"""
    if room_id in rooms:
        return rooms[room_id]['members']
    return []

def room_exists(room_id):
    """Check if room exists"""
    return room_id in rooms

def is_room_admin(room_id, username):
    """Check if user is admin of the room"""
    if room_id in rooms:
        return rooms[room_id]['admin'] == username
    return False