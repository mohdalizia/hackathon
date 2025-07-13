from flask import Blueprint, render_template, request, redirect, url_for, session
from flask_socketio import emit, join_room as socketio_join, leave_room as socketio_leave
from .rooms import create_room, join_room_by_code, leave_room, get_room_members
from . import socketio

main = Blueprint('main', __name__)

@main.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        username = request.form['username']
        session['username'] = username
        return redirect(url_for('main.lobby'))
    return render_template('index1.html')

@main.route('/lobby')
def lobby():
    if 'username' not in session:
        return redirect(url_for('main.index'))
    return render_template('index1.html', username=session['username'])

@main.route('/create_room')
def create():
    username = session.get('username')
    room_id = create_room(username)
    return redirect(url_for('main.room', room_id=room_id))

@main.route('/join_room', methods=['POST'])
def join():
    code = request.form['room_code']
    username = session.get('username')
    success = join_room_by_code(code, username)
    if success:
        return redirect(url_for('main.room', room_id=code))
    return "Invalid Room Code"

@main.route('/room/<room_id>')
def room(room_id):
    if 'username' not in session:
        return redirect(url_for('main.index'))
    members = get_room_members(room_id)
    return render_template('room.html', room_id=room_id, username=session['username'], members=members)

@main.route('/leave/<room_id>')
def leave(room_id):
    username = session.get('username')
    leave_room(room_id, username)
    return redirect(url_for('main.lobby'))

# Socket Events

@socketio.on('join')
def handle_join(data):
    username = data['username']
    room_id = data['room']
    socketio_join(room_id)
    emit('message', {'username': '🧭 System', 'message': f'{username} joined the room'}, room=room_id)

@socketio.on('send_message')
def handle_message(data):
    emit('message', data, room=data['room'])
