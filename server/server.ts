import { createServer } from "http";
import { Server, Socket } from "socket.io";
import express from "express";
import { signals } from "./constants/signals";
import redis from "./lib/redis";
import { MEETING, MEETING_USERS, ONLINE_USERS, USERNAME } from "./constants/redis_keys";
import {createWorker} from "mediasoup";
import {Worker} from "mediasoup/lib/Worker";
import {DtlsParameters} from "mediasoup/lib/WebRtcTransport";
import {MediaKind, RtpCapabilities, RtpParameters} from "mediasoup/lib/RtpParameters";
import Room from "./entities/room";
import Peer from "./entities/peer";
import config from "./config/config";
import Logger from "./lib/Logger";
import interactiveServer from "./lib/interactiveServer";

// format output
const logger = new Logger('Server');

logger.info('- process.env.DEBUG:', process.env.DEBUG);
logger.info('- config.mediasoup.worker.logLevel:', config.mediasoup.worker.logLevel);
logger.info('- config.mediasoup.worker.logTags:', config.mediasoup.worker.logTags);

let roomsMap: Map<string, Room> = new Map<string, Room>();

// all mediasoup workers
let workers = new Array<Worker>();
let nextMediasoupWorkerIdx = 0;

// Open the interactive server.
const runInteractiveServer = async () => {
    await interactiveServer(roomsMap);
}

runInteractiveServer();


// const options = {
//      key: fs.readFileSync(path.join(__dirname, config.sslKey), 'utf-8'),
//      cert: fs.readFileSync(path.join(__dirname, config.sslCrt), 'utf-8')
// }
// const httpsServer = createServer(options, {});
const app = express();
app.use(function (req, res, next) {
    // Add cross-domain header
    res.header('Access-Control-Allow-Origin', '*')
  
    // Prevents IE and Chrome from MIME-sniffing a response. Reduces exposure to
    // drive-by download attacks on sites serving user uploaded content.
    res.header('X-Content-Type-Options', 'nosniff')
  
    // Prevent rendering of site within a frame.
    res.header('X-Frame-Options', 'DENY')
  
    // Enable the XSS filter built into most recent web browsers. It's usually
    // enabled by default anyway, so role of this headers is to re-enable for this
    // particular website if it was disabled by the user.
    res.header('X-XSS-Protection', '1; mode=block')
  
    // Force IE to use latest rendering engine or Chrome Frame
    res.header('X-UA-Compatible', 'IE=Edge,chrome=1')
    
    next()
  })

// use for client get ice server
app.get('/__rtcConfig__', (req, res) => {
    res.send({
        rtcConfig: config.rtcConfig
    })
})
app.use(express.static('build'));

// start server and create workers
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*"
    }
});

httpServer.listen(config.listenPort, async () => {
    // create workers
    await createWorkers();
    logger.info(`Server is listening at ${config.listenPort}`);
});


io.on("connection", async (socket: Socket) => {
    logger.info(`??????????????????: ${socket.id}`);
    socket.on('disconnecting', async () => {
        const { rooms } = socket;
        rooms.forEach( async room => {
            await redis.srem(MEETING(room), socket.id);
            if (room && roomsMap.has(room)) {
                await roomsMap.get(room).removePeer(socket.id);
            }
        });
        await redis.srem(ONLINE_USERS, socket.id);
    });
    socket.on(signals.REGISTER, async (registerInfo: any, callback: (data: any) => any) => {
        logger.info(`${socket.id} ????????????????????????${registerInfo.username}`);
        await redis.hset(MEETING_USERS, registerInfo.username, registerInfo.password);
        callback(true);
    });
    socket.on(signals.REQUEST_LOGIN, async (loginInfo: any, callback: (data: boolean) => any) => {
        logger.info(`${socket.id} ????????????, username: ${loginInfo.username}`);
        let password = await redis.hget(MEETING_USERS, loginInfo.username);
        if (password && password === loginInfo.password) {
            callback(true);
            logger.info(`${socket.id} ????????????, username: ${loginInfo.username}`);
        } else {
            callback(false);
        }
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
        logger.info(`??????${socket.id}:${name}??????????????????${meeting_id}`);
        callback(room.id);
    });
    socket.on(signals.GET_ROUTER_CAPABILITIES, async (meeting_id: string, callback: (data: any) => any) => {
        const room = roomsMap.get(meeting_id);
        if (room) {
            callback(room.getRtpCapabilities());
            logger.info(`??????${socket.id}????????????${meeting_id}???????????????`);
        } else {
            callback({
                error: true,
            });
        }
    });

    socket.on(signals.CREATE_WEBRTC_TRANSPORT, async (meeting_id: string, callback: (data) => any) => {
        const { params } = await roomsMap.get(meeting_id).createWebTransport(socket.id);
        logger.info(`??????${socket.id}????????????transport ${params.id}`);
        callback(params);
    });

    socket.on(signals.CONNECT_TRANSPORT, async (meeting_id: string, transport_id: string, dtlsParameters: DtlsParameters, callback: (data) => any) => {
        await roomsMap.get(meeting_id).connectPeerTransport(socket.id, transport_id, dtlsParameters);
        logger.info(`??????${socket.id}????????????transport ${transport_id}`);
        callback(true);
    });

    socket.on(signals.PRODUCE, async (meeting_id: string, kind: MediaKind, rtpParameters: RtpParameters, appData: Object, producer_transport_id: string, callback: (data) => any) => {
        const producer_id = await roomsMap.get(meeting_id).produce(socket.id, producer_transport_id, rtpParameters, kind, appData);
        logger.info(`??????${socket.id}????????????producer ${producer_id}`);
        callback(producer_id);
    });

    socket.on(signals.PAUSE_PRODUCER, async (meeting_id: string, producer_id: string, callback: () => void) => {
        const room = roomsMap.get(meeting_id);
        const producer = room.peers.get(socket.id).getProducer(producer_id);
        await producer.pause();
        logger.info(`??????${socket.id}????????????producer ${producer_id}`);
        room.broadCast(socket.id, signals.PAUSE_CONSUMER, {
            participant_id: socket.id,
            kind: producer.kind,
            appData: producer.appData
        });
        logger.info(`?????????${meeting_id}??????????????????????????????????????????${socket.id}??????????????????${producer.kind}??????????????????appData ${producer.appData.source}}`);
        callback();
    });

    socket.on(signals.RESUME_PRODUCER, async (meeting_id: string, producer_id: string, callback: () => void) => {
        const room = roomsMap.get(meeting_id);
        const producer = room.peers.get(socket.id).getProducer(producer_id);
        await producer.resume();
        logger.info(`??????${socket.id}????????????producer ${producer_id}`);
        room.broadCast(socket.id, signals.RESUME_CONSUMER, {
            participant_id: socket.id,
            kind: producer.kind,
            appData: producer.appData
        });
        logger.info(`?????????${meeting_id}??????????????????????????????????????????${socket.id}??????????????????${producer.kind}??????????????????appData ${producer.appData.source}}`);
        callback();
    });

    socket.on(signals.CONSUME, async (meeting_id: string, consumer_transport_id: string, producer_id: string, appData: Object, rtpCapabilities: RtpCapabilities, callback: (data) => any) => {
        const params = await roomsMap.get(meeting_id).consume(socket.id, consumer_transport_id, producer_id, appData, rtpCapabilities);
        logger.info(`??????${socket.id}????????????consumer ${params.id}`);
        callback(params);
    });

    socket.on(signals.CLOSE_PRODUCER, async (meeting_id: string, producer_id: string, callback: ()=> any) => {
        const room = roomsMap.get(meeting_id);
        const producer = room.peers.get(socket.id).getProducer(producer_id);
        logger.info(`??????${socket.id}????????????producer ${producer_id}`);
        room.broadCast(socket.id, signals.CLOSE_CONSUMER, {
            participant_id: socket.id,
            kind: producer.kind,
            appData: producer.appData
        });
        logger.info(`?????????${meeting_id}??????????????????????????????????????????${socket.id}??????????????????${producer.kind}???producer ${producer.id}????????????appData ${producer.appData.source}}`);
        roomsMap.get(meeting_id).closeProducer(socket.id, producer_id);
        callback();
        
    });

    socket.on(signals.LEAVE_MEETING, async (meeting_id: string) => {
        await redis.srem(MEETING(meeting_id), socket.id);
        socket.leave(meeting_id);
        logger.info(`??????${socket.id}??????????????????${meeting_id}`);
        const room = await roomsMap.get(meeting_id);
        await room.removePeer(socket.id);
        if (room.getPeers().size === 0) {
            roomsMap.delete(meeting_id);
        }
    });

    socket.on(signals.SEND_MESSAGE, async (meeting_id: string, message: string, message_time: string) => {
        const username = await redis.get(USERNAME(socket.id));
        logger.info(`??????${socket.id}:${username}?????????${meeting_id}????????????${message}`);
        socket.to(meeting_id).emit(signals.NEW_MESSAGE, { name: username, message, message_time });
    });

    socket.on(signals.SHARE_FILE, async (file: any) => {
        const username = file.name;
        const meeting_id = file.meetingId;
        const file_name = file.fileName;
        logger.info(`??????${socket.id}:${username}?????????${meeting_id}????????????${file_name}`);
        socket.to(meeting_id).emit(signals.NEW_FILE, file);
    })
    socket.on(signals.GET_PARTICIPANTS, async (meeting_id: string, callback: (data) => any) => {
        const producers = roomsMap.get(meeting_id).getProducerListForPeer();
        logger.info(`??????${socket.id}????????????${meeting_id}???????????????????????????`);
        callback(producers);
    })
    await redis.sadd(ONLINE_USERS, socket.id);
});

// ??????socket.join()
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

    logger.info(`?????????????????????????????????${socketId}`);
});

// ??????socket.leave()
io.of("/").adapter.on("leave-room", async (room, socketId) => {
    const name = await redis.get(USERNAME(socketId));
    io.to(room).emit(signals.PARTICIPANT_OFFLINE, socketId, name);
    logger.info(`??????????????????????????????(???????????????)${socketId}`);
});

/**
 * create mediasoup workers
 */
async function createWorkers() {
    let { numWorkers } = config.mediasoup;
    logger.info(`create ${numWorkers} workers `)

    for (let i = 0; i < numWorkers; i++) {
        try {
            let worker: Worker = await createWorker({
                logLevel: config.mediasoup.worker.logLevel,
                logTags: config.mediasoup.worker.logTags,
                rtcMinPort: config.mediasoup.worker.rtcMinPort,
                rtcMaxPort: config.mediasoup.worker.rtcMaxPort,
            });

            worker.on('died', () => {
                logger.error('mediasoup worker died, exiting in 2 seconds... [pid:%d]', worker.pid);
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
            logger.error('???????????????');
            logger.error(error);
        }
    }
}

/**
 * get next mediasoup worker.
 */
 function getMediasoupWorker() {
    const worker: Worker = workers[nextMediasoupWorkerIdx];
    logger.info(`workers size = ` + workers.length);
    if (++nextMediasoupWorkerIdx === workers.length) {
        nextMediasoupWorkerIdx = 0;
    }

    return worker;
}