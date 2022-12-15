const express = require('express');
const path = require('path')

const socketio = require('socket.io');
const http = require('http');
const cors = require('cors');

const app = express();


const server = http.createServer(app);
const io = socketio(server, {
    cors:{
        origin: "*",
        methods: ["GET", "POST"],
        allowedHeaders: ["my-custom-header"],
        credentials: true
    }
});

//bodyParser middleware
app.use(express.json());
app.use(cors());

// //routes
// app.use('/api/signup',require('./routes/api/signup'));


//Serve static asserts if in production
if(process.env.NODE_ENV === 'production'){
    //Set static folder
    app.use(express.static('client/build'));

    app.get('*', (req,res) => {
        res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'))
    })
}

const users ={}

io.on("connect",(socket) => {
    console.log("Socket connected")

    if(!users[socket.id]){
        users[socket.id] = socket.id
    }

    socket.emit("yourId", socket.id);
    io.sockets.emit("allUsers", users);

    socket.on("disconnect", () => {
        delete users[socket.id]
        console.log("Socket Disconnected")
        io.sockets.emit("userDisconnected", socket.id);
    })

    socket.on("callUser", (data) => {
        io.to(data.userToCall).emit("hey", { signal:data.signalData, from:data.from })
    })

    socket.on("acceptCall", (data) => {
        io.to(data.to).emit("callAccepted", data.signal)
    })

})


const port = process.env.PORT || 5000 ;
server.listen(port, ()=>{console.log(`server running on port ${port}`)});