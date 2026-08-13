const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Cho phép mọi Frontend kết nối tới
        methods: ["GET", "POST"]
    }
});

// Danh sách lưu người chơi đang online
let onlinePlayers = {};

io.on('connection', (socket) => {
    console.log('Một người chơi đã kết nối:', socket.id);

    // Người chơi đăng nhập/đặt tên
    socket.on('join_game', (username) => {
        onlinePlayers[socket.id] = {
            id: socket.id,
            username: username || `Nông dân #${socket.id.substring(0, 4)}`,
            isAdmin: false
        };

        // Gửi thông báo cho tất cả người chơi
        io.emit('chat_message', {
            sender: 'SYSTEM',
            text: `${onlinePlayers[socket.id].username} đã tham gia trang trại!`
        });

        // Cập nhật danh sách online
        io.emit('update_online_list', Object.values(onlinePlayers));
    });

    // Xử lý gửi tin nhắn Chat
    socket.on('send_message', (msgText) => {
        const player = onlinePlayers[socket.id];
        if (player) {
            io.emit('chat_message', {
                sender: player.username,
                text: msgText
            });
        }
    });

    // Khi người chơi ngắt kết nối
    socket.on('disconnect', () => {
        if (onlinePlayers[socket.id]) {
            io.emit('chat_message', {
                sender: 'SYSTEM',
                text: `${onlinePlayers[socket.id].username} đã rời đi.`
            });
            delete onlinePlayers[socket.id];
            io.emit('update_online_list', Object.values(onlinePlayers));
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server đang chạy trên port ${PORT}`);
});
