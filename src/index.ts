import express, { Express, Request, Response } from 'express';
import * as socketIo from "socket.io";
import { EventEmitter } from 'events';
import bodyParser from 'body-parser';
import { config } from 'dotenv';
import * as  http from 'http';
import cors from 'cors';

config();

const emitter = new EventEmitter();

const app: Express = express();
app.set("port", process.env.PORT || 3000);

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const server = http.createServer(app);
const io = new socketIo.Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

function getRandomInt(min: number, max: number) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

const connections: socketIo.Socket[] = [];
io.sockets.on('connection', (socket: socketIo.Socket) => {
    connections.push(socket);

    console.log('%s sockets is connected', connections.length);

    socket.on('disconnect', () => {
        connections.splice(connections.indexOf(socket), 1);
    });
});

emitter.on('update-assists', (data) => {
    console.log(data, connections.length);

    connections.forEach(function(socket) {
        socket.emit('update-assists', data);
    });
});

app.post('/messages/send', function (req, res, next) {
    const timestamp = Date.now();

    const data = [{
        timestamp: timestamp,
        players: [{ name: "john", assists: getRandomInt(10, 100) }, { name: "paul", assists: getRandomInt(10, 100) }]
    }];
    emitter.emit('update-assists', data);

    res.send({ ok: true, time: timestamp });
});

app.get('/', (req: Request, res: Response) => {
    res.send('Express + TypeScript Server');
});

server.listen(3000, () => {
    console.log(`⚡️[server]: Server is running at http://localhost:3000`);
});