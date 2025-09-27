
// client.js

document.addEventListener('DOMContentLoaded', () => {
    const socket = io(); // Connect to the server

    const form = document.getElementById('form');
    const input = document.getElementById('input');
    const messages = document.getElementById('messages');

    // Add online users list UI
    let onlineUsersDiv = document.getElementById('online-users');
    if (!onlineUsersDiv) {
        onlineUsersDiv = document.createElement('div');
        onlineUsersDiv.id = 'online-users';
        onlineUsersDiv.style.marginBottom = '12px';
        messages.parentNode.insertBefore(onlineUsersDiv, messages);
    }

    // Typing indicator
    let typingTimeout;
    let typingIndicator = null;

    // Prompt the user for their name and avatar
    const username = prompt("What's your name?");
    let avatar = prompt("Paste your avatar image URL or leave blank for initials:");

    // Send user info to server
    socket.emit('user info', { user: username, avatar });

    // Emit typing event when user types
    input.addEventListener('input', () => {
        socket.emit('typing', { user: username });
        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
            socket.emit('stop typing', { user: username });
        }, 1200);
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (input.value) {
            // Add timestamp
            const now = new Date();
            const timestamp = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            // Remove emoji picker: just send plain text
            const messageData = { user: username, message: input.value, avatar, timestamp };
            socket.emit('chat message', messageData);
            input.value = '';
            socket.emit('stop typing', { user: username });
        }
    });

    // Listen for incoming messages
    socket.on('chat message', (data) => {
        const item = document.createElement('div');
        item.classList.add('message');

        // Avatar
        let avatarElem;
        if (data.user !== 'System') {
            avatarElem = document.createElement('div');
            avatarElem.className = 'avatar avatar-initials';
            avatarElem.textContent = (data.user[0] || '').toUpperCase();
            item.appendChild(avatarElem);
        }

        const userTag = document.createElement('span');
        userTag.classList.add('user-tag');

        // Timestamp
        if (data.timestamp) {
            const timeTag = document.createElement('span');
            timeTag.className = 'timestamp';
            timeTag.textContent = data.timestamp;
            item.appendChild(timeTag);
        }

        // Style messages based on the sender
        if (data.user === 'System') {
            item.classList.add('system-message');
            item.textContent = data.message;
        } else {
            userTag.textContent = data.user;
            item.appendChild(userTag);
            item.append(data.message);
            if (data.user === username) {
                item.classList.add('my-message');
            } else {
                item.classList.add('other-message');
            }
        }
        messages.appendChild(item);
        messages.scrollTop = messages.scrollHeight;
    });
    // Remove emoji picker: no reaction updates needed

    // Show online users
    socket.on('online users', (users) => {
        onlineUsersDiv.innerHTML = '<strong>Online:</strong> ' + users.map(u => {
            return `<span class="avatar avatar-initials" style="width:24px;height:24px;vertical-align:middle;display:inline-flex;align-items:center;justify-content:center;">${(u.user[0] || '').toUpperCase()}</span> <span>${u.user}</span>`;
        }).join(', ');
    });

    // Show typing indicator when someone is typing
    socket.on('typing', (data) => {
        if (data.user !== username) {
            if (!typingIndicator) {
                typingIndicator = document.createElement('div');
                typingIndicator.className = 'typing-indicator';
                typingIndicator.textContent = `${data.user} is typing...`;
                messages.appendChild(typingIndicator);
                messages.scrollTop = messages.scrollHeight;
            } else {
                typingIndicator.textContent = `${data.user} is typing...`;
            }
        }
    });

    // Remove typing indicator when user stops typing
    socket.on('stop typing', (data) => {
        if (typingIndicator && data.user !== username) {
            typingIndicator.remove();
            typingIndicator = null;
        }
    });
});