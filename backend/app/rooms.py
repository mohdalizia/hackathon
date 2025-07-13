import uuid

rooms = {}
user_room = {}
def create_room(username):
    room_id = str(uuid.uuid4())[:6]
    rooms[room_id] = [username]
    user_room[username] = room_id
    return room_id

def join_room_by_code(room_id, username):
    if room_id in rooms and username not in user_room:
        rooms[room_id].append(username)
        user_room[username] = room_id
        return True
    return False

def get_room_members(room_id):
    return rooms.get(room_id, [])

def leave_room(room_id, username):
    if room_id in rooms and username in rooms[room_id]:
        rooms[room_id].remove(username)
        if not rooms[room_id]:
            del rooms[room_id]
        if username in user_room:
            del user_room[username]
