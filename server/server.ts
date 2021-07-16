import { createServer } from "http";
import { Server, Socket } from "socket.io";
import { signals } from "./constants/signals";
import redis from "./lib/redis";
import { MEETING, ONLINE_USERS, USERNAME } from "./constants/redis_keys";
import {createWorker} from "mediasoup";
import {Worker} from "mediasoup/lib/Worker";
import {DtlsParameters} from "mediasoup/lib/WebRtcTransport";
import {MediaKind, RtpCapabilities, RtpParameters} from "mediasoup/lib/RtpParameters";
import Room from "./entities/room";
import Peer from "./entities/peer";
const config = require("./config/config");

let roomsMap: Map<string, Room> = new Map<string, Room>();

// all mediasoup workers
let workers = new Array<Worker>();
let nextMediasoupWorkerIdx = 0;

// const options = {
//      key: fs.readFileSync(path.join(__dirname, config.sslKey), 'utf-8'),
//      cert: fs.readFileSync(path.join(__dirname, config.sslCrt), 'utf-8')
// }
// const httpsServer = createServer(options, {});

// start server and create workers
const httpServer = createServer({});
const io = new Server(httpServer, {
    cors: {
        origin: "*"
    }
});

httpServer.listen(config.listenPort, async () => {
    // create workers
    await createWorkers();
    console.log(`Server is listening at ${config.listenPort}`);
});


io.on("connection", async (socket: Socket) => {
    socket.on('disconnecting', async () => {
        const { rooms } = socket;
        rooms.forEach( async room => {
            await redis.srem(MEETING(room), socket.id);
            if (roomsMap.has(room)) {
                await roomsMap.get(room).removePeer(socket.id);
            }
        });
        await redis.srem(ONLINE_USERS, socket.id);
    });
    socket.on(signals.REQUEST_JOIN, async (meeting_id: string, name: string, callback: (data) => any) => {
        let room = await roomsMap.get(meeting_id);
        if (!room) {
            let worker: Worker = getMediasoupWorker();
            room = await Room.create(meeting_id, worker, io);
            roomsMap.set(meeting_id, room);
        }
        room.addPeer(new Peer(socket.id, name));
        await redis.set(USERNAME(socket.id), name);
        await redis.sadd(MEETING(meeting_id), socket.id);
        socket.join(meeting_id);
        callback(room.id);
    });
    socket.on(signals.GET_ROUTER_CAPABILITIES, async (meeting_id: string, callback: (data: any) => any) => {
        const room = roomsMap.get(meeting_id);
        if (room) {
            callback(room.getRtpCapabilities());
        } else {
            callback({
                error: true,
            });
        }
    });

    socket.on(signals.CREATE_WEBRTC_TRANSPORT, async (meeting_id: string, callback: (data) => any) => {
        const { params } = await roomsMap.get(meeting_id).createWebTransport(socket.id);
        callback(params);
    });

    socket.on(signals.CONNECT_TRANSPORT, async (meeting_id: string, transport_id: string, dtlsParameters: DtlsParameters, callback: (data) => any) => {
        await roomsMap.get(meeting_id).connectPeerTransport(socket.id, transport_id, dtlsParameters);
        callback(true);
    });

    socket.on(signals.PRODUCE, async (meeting_id: string, kind: MediaKind, rtpParameters: RtpParameters, producer_transport_id: string, callback: (data) => any) => {
        const producer_id = await roomsMap.get(meeting_id).produce(socket.id, producer_transport_id, rtpParameters, kind);
        callback(producer_id);
    });

    socket.on(signals.PAUSE_PRODUCER, async (meeting_id: string, producer_id: string, callback: () => void) => {
        const room = roomsMap.get(meeting_id);
        const producer = room.peers.get(socket.id).getProducer(producer_id);
        await producer.pause();
        room.broadCast(socket.id, signals.PAUSE_CONSUMER, {
            participant_id: socket.id,
            kind: producer.kind
        });
        callback();
    });

    socket.on(signals.RESUME_PRODUCER, async (meeting_id: string, producer_id: string, callback: () => void) => {
        const room = roomsMap.get(meeting_id);
        const producer = room.peers.get(socket.id).getProducer(producer_id);
        await producer.resume();
        room.broadCast(socket.id, signals.RESUME_CONSUMER, {
            participant_id: socket.id,
            kind: producer.kind
        });
        callback();
    });

    socket.on(signals.CONSUME, async (meeting_id: string, consumer_transport_id: string, producer_id: string, rtpCapabilities: RtpCapabilities, callback: (data) => any) => {
        const params = await roomsMap.get(meeting_id).consume(socket.id, consumer_transport_id, producer_id, rtpCapabilities);
        callback(params);
    });

    socket.on(signals.CLOSE_PRODUCER, async (meeting_id: string, producer_id: string) => {
        roomsMap.get(meeting_id).closeProducer(socket.id, producer_id);
    });

    socket.on(signals.LEAVE_MEETING, async (meeting_id: string) => {
        await redis.srem(MEETING(meeting_id), socket.id);
        socket.leave(meeting_id);
        const room = await roomsMap.get(meeting_id);
        await room.removePeer(socket.id);
        if (room.getPeers().size === 0) {
            roomsMap.delete(meeting_id);
        }
    });

    socket.on(signals.SEND_MESSAGE, async (meeting_id: string, message: string) => {
        const username = await redis.get(USERNAME(socket.id));
        socket.to(meeting_id).emit(signals.MEETING_CHAT, { name: username, message });
    });
    socket.on(signals.GET_PARTICIPANTS, async (meeting_id: string, callback: (data) => any) => {
        const producers = roomsMap.get(meeting_id).getProducerListForPeer();
        callback(producers);
    })
    await redis.sadd(ONLINE_USERS, socket.id);
});

// 监听socket.join()
io.of("/").adapter.on("join-room", async (room, socketId) => {
    if (room === socketId) {
        return;
    }

    const name = await redis.get(USERNAME(socketId));

    io.to(room).emit(signals.NEW_PARTICIPANT, {
        name,
        id: socketId,
        producers: {},
    });
});

// 监听socket.leave()
io.of("/").adapter.on("leave-room", (room, socketId) => {
    io.to(room).emit(signals.PARTICIPANT_OFFLINE, socketId);
});

/**
 * create mediasoup workers
 */
async function createWorkers() {
    let { numWorkers } = config.mediasoup;
    console.log(`create ${numWorkers} workers `)

    for (let i = 0; i < numWorkers; i++) {
        try {
            let worker: Worker = await createWorker({
                logLevel: config.mediasoup.worker.logLevel,
                logTags: config.mediasoup.worker.logTags,
                rtcMinPort: config.mediasoup.worker.rtcMinPort,
                rtcMaxPort: config.mediasoup.worker.rtcMaxPort,
            });

            worker.on('died', () => {
                console.error('mediasoup worker died, exiting in 2 seconds... [pid:%d]', worker.pid);
                setTimeout(() => process.exit(1), 2000);
            });
            workers.push(worker);

            try {
                // setInterval(async () => {
                //     const usage = await worker.getResourceUsage();
                //     console.info('mediasoup Worker resource usage [pid:%d]: %o', worker.pid, usage);
                // }, 120000);
            } catch (error) {
            }
        } catch (error) {
            console.log('捕获到异常');
            console.dir(error);
        }
    }
}

/**
 * get next mediasoup worker.
 */
 function getMediasoupWorker() {
    const worker: Worker = workers[nextMediasoupWorkerIdx];
    console.log(`workers size = ` + workers.length);
    if (++nextMediasoupWorkerIdx === workers.length) {
        nextMediasoupWorkerIdx = 0;
    }

    return worker;
}