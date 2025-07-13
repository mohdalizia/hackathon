from flask import Blueprint, render_template, request, redirect, url_for, session, jsonify
from flask_socketio import emit, join_room as socketio_join, leave_room as socketio_leave
from .rooms import create_room, join_room_by_code, leave_room, get_room_members
from . import socketio

main = Blueprint('main', __name__)

@main.route('/')
def index():
    """Main route - serves the index.html template"""
    return render_template('index.html')

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

@main.route('/create_room')
def create():
    username = session.get('username')
    if not username:
        return jsonify({'status': 'error', 'message': 'Not authenticated'}), 401
    
    room_id = create_room(username)
    return redirect(url_for('main.room', room_id=room_id))

@main.route('/join_room', methods=['POST'])
def join():
    code = request.form['room_code']
    username = session.get('username')
    
    if not username:
        return jsonify({'status': 'error', 'message': 'Not authenticated'}), 401
    
    success = join_room_by_code(code, username)
    if success:
        return redirect(url_for('main.room', room_id=code))
    return jsonify({'status': 'error', 'message': 'Invalid Room Code'}), 400

@main.route('/room/<room_id>')
def room(room_id):
    if 'username' not in session:
        return redirect(url_for('main.index'))
    
    members = get_room_members(room_id)
    return render_template('index.html', room_id=room_id, username=session['username'], members=members)

@main.route('/leave/<room_id>')
def leave(room_id):
    username = session.get('username')
    if username:
        leave_room(room_id, username)
    return jsonify({'status': 'success', 'message': 'Left room successfully'})

@main.route('/api/room/<room_id>/members')
def get_room_members_api(room_id):
    """API endpoint to get room members"""
    if 'username' not in session:
        return jsonify({'status': 'error', 'message': 'Not authenticated'}), 401
    
    members = get_room_members(room_id)
    return jsonify({'members': members})

# Socket Events
@socketio.on('join')
def handle_join(data):
    username = data['username']
    room_id = data['room']
    socketio_join(room_id)
    emit('message', {'username': '🧭 System', 'message': f'{username} joined the room'}, room=room_id)

@socketio.on('send_message')
def handle_message(data):
    room_id = data['room']
    username = data['username']
    message = data['message']
    
    emit('message', {
        'username': username,
        'message': message
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