from flask import Blueprint, render_template, request, redirect, url_for, session, jsonify
from flask_socketio import emit, join_room as socketio_join, leave_room as socketio_leave
from .rooms import create_room, join_room_by_code, leave_room, get_room_members, get_user_rooms
from . import socketio

main = Blueprint('main', __name__)

@main.route('/')
def index():
    """Main route - serves the index.html template"""
    return render_template('index.html')

@main.route('/api/login', methods=['POST'])
def api_login():
    """Handle login from Firebase authenticated users"""
    data = request.get_json() or {}
    username = data.get('username')
    if username:
        session['username'] = username
        return jsonify({'status': 'success', 'message': 'Logged in successfully'})
    return jsonify({'status': 'error', 'message': 'Username required'}), 400

@main.route('/api/logout', methods=['GET', 'POST'])
def api_logout():
    """Handle logout"""
    session.pop('username', None)
    return jsonify({'status': 'success', 'message': 'Logged out successfully'})

@main.route('/login', methods=['POST'])
def login():
    """Handle login from Firebase authenticated users"""
    username = request.form.get('username')
    if username:
        session['username'] = username
        return jsonify({'status': 'success', 'message': 'Logged in successfully'})
    return jsonify({'status': 'error', 'message': 'Username required'}), 400

@main.route('/logout', methods=['GET', 'POST'])
def logout():
    """Handle logout"""
    session.pop('username', None)
    return jsonify({'status': 'success', 'message': 'Logged out successfully'})

@main.route('/lobby')
def lobby():
    if 'username' not in session:
        return redirect(url_for('main.index'))
    return render_template('index.html', username=session['username'])

@main.route('/api/create_room', methods=['POST', 'GET'])
def api_create_room():
    username = session.get('username')
    if not username:
        return jsonify({'status': 'error', 'message': 'Not authenticated'}), 401
    
    room_id = create_room(username)
    if room_id:
        return jsonify({'status': 'success', 'room_id': room_id, 'message': 'Room created successfully'})
    else:
        return jsonify({'status': 'error', 'message': 'Failed to create room'}), 500

@main.route('/create_room', methods=['POST', 'GET'])
def create():
    username = session.get('username')
    if not username:
        return jsonify({'status': 'error', 'message': 'Not authenticated'}), 401
    
    room_id = create_room(username)
    if room_id:
        return jsonify({'status': 'success', 'room_id': room_id, 'message': 'Room created successfully'})
    else:
        return jsonify({'status': 'error', 'message': 'Failed to create room'}), 500

@main.route('/api/join_room', methods=['POST'])
def api_join_room():
    data = request.get_json() or request.form
    code = data.get('room_code', '').strip()
    username = session.get('username')
    
    if not username:
        return jsonify({'status': 'error', 'message': 'Not authenticated'}), 401
    
    if not code:
        return jsonify({'status': 'error', 'message': 'Room code required'}), 400
    
    success = join_room_by_code(code, username)
    if success:
        return jsonify({'status': 'success', 'room_id': code, 'message': 'Successfully joined room'})
    return jsonify({'status': 'error', 'message': 'Invalid Room Code'}), 400

@main.route('/join_room', methods=['POST'])
def join():
    data = request.get_json() or request.form
    code = data.get('room_code', '').strip()
    username = session.get('username')
    
    if not username:
        return jsonify({'status': 'error', 'message': 'Not authenticated'}), 401
    
    if not code:
        return jsonify({'status': 'error', 'message': 'Room code required'}), 400
    
    success = join_room_by_code(code, username)
    if success:
        return jsonify({'status': 'success', 'room_id': code, 'message': 'Successfully joined room'})
    return jsonify({'status': 'error', 'message': 'Invalid Room Code'}), 400

@main.route('/api/leave_room/<room_id>', methods=['GET', 'POST'])
def api_leave_room(room_id):
    username = session.get('username')
    if username:
        leave_room(room_id, username)
    return jsonify({'status': 'success', 'message': 'Left room successfully'})

@main.route('/leave/<room_id>', methods=['GET', 'POST'])
def leave(room_id):
    username = session.get('username')
    if username:
        leave_room(room_id, username)
    return jsonify({'status': 'success', 'message': 'Left room successfully'})

@main.route('/room/<room_id>')
def room(room_id):
    if 'username' not in session:
        return redirect(url_for('main.index'))
    
    members = get_room_members(room_id)
    return render_template('index.html', room_id=room_id, username=session['username'], members=members)

@main.route('/api/room/<room_id>/members')
def api_get_room_members(room_id):
    """API endpoint to get room members"""
    if 'username' not in session:
        return jsonify({'status': 'error', 'message': 'Not authenticated'}), 401
    
    members = get_room_members(room_id)
    return jsonify({'members': members})

@main.route('/api/user/rooms')
def api_get_user_rooms():
    """API endpoint to get all rooms for the current user"""
    username = session.get('username')
    if not username:
        return jsonify({'status': 'error', 'message': 'Not authenticated'}), 401
        
    rooms = get_user_rooms(username)
    return jsonify({'status': 'success', 'rooms': rooms})

# Socket Events
@socketio.on('join')
def handle_join(data):
    username = data['username']
    room_id = data['room']
    avatar = data.get('avatar', 'default')
    socketio_join(room_id)
    emit('user_joined', {'username': username, 'avatar': avatar}, room=room_id)
    emit('message', {'username': '🧭 System', 'message': f'{username} joined the room'}, room=room_id)

@socketio.on('send_message')
def handle_message(data):
    room_id = data['room']
    username = data['username']
    message = data['message']
    avatar = data.get('avatar', 'default')
    timestamp = data.get('timestamp', '')
    
    emit('message', {
        'username': username,
        'message': message,
        'avatar': avatar,
        'timestamp': timestamp
    }, room=room_id)

@socketio.on('location_update')
def handle_location_update(data):
    room_id = data.get('room')
    username = data['username']
    latitude = data.get('latitude')
    longitude = data.get('longitude')
    avatar = data.get('avatar', 'default')
    
    emit('location_update', {
        'username': username,
        'latitude': latitude,
        'longitude': longitude,
        'avatar': avatar
    }, room=room_id)

@socketio.on('avatar_changed')
def handle_avatar_changed(data):
    room_id = data.get('room')
    username = data['username']
    avatar = data.get('avatar', 'default')
    
    emit('avatar_changed', {
        'username': username,
        'avatar': avatar
    }, room=room_id)

@socketio.on('leave')
def handle_leave(data):
    username = data['username']
    room_id = data['room']
    socketio_leave(room_id)
    emit('message', {'username': '🧭 System', 'message': f'{username} left the room'}, room=room_id)

@socketio.on('connect')
def handle_connect():
    print('User connected')

@socketio.on('disconnect')
def handle_disconnect():
    print('User disconnected')