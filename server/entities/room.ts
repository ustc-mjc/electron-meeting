import { Worker } from "mediasoup/lib/Worker";
import { Router } from "mediasoup/lib/Router";
import { DtlsParameters } from "mediasoup/lib/WebRtcTransport";
import { MediaKind, RtpCapabilities, RtpParameters} from "mediasoup/lib/RtpParameters";
import { Server } from "socket.io";
import Peer from "./peer";
import { signals } from "../constants/signals";
const config = require("../config/config");
import Logger from "../lib/Logger";
const logger = new Logger('Room');

export default class Room {
    readonly id: string;
    readonly router: Router;
    readonly peers: Map<string, Peer>;
    readonly io: Server;

    static async create(roomId: string, worker: Worker, io: Server) {
        const mediaCodecs = config.mediasoup.router.mediaCodecs;
        const router = await worker.createRouter({
            mediaCodecs
        });
        return new Room(roomId, router, io);
    }

    constructor(roomId: string, router: Router, io: Server) {
        this.id = roomId;
        this.router = router;
        this.io = io;
        this.peers = new Map<string, Peer>();
    }

    addPeer(peer: Peer) {
        this.peers.set(peer.id, peer);
    }

    getProducerListForPeer() {
        const producers = [];
        this.peers.forEach( peer => {
            const participant = {
                name: peer.name,
                id: peer.id,
                producers: []
            };
            peer.producers.forEach(producer => {
                participant.producers.push({
                    producer_id: producer.id,
                    producer_kind: producer.kind,
                    appData: producer.appData
                })
            });
            producers.push(participant);
        });
        return producers;
    }

    getRtpCapabilities() {
        return this.router.rtpCapabilities;
    }

    async createWebTransport(socketId: string) {
        const {maxIncomingBitrate, initialAvailableOutgoingBitrate} = config.mediasoup.webRtcTransport;
        const listenIps = config.mediasoup.webRtcTransport.listenIps;

        const transport = await this.router.createWebRtcTransport({
            listenIps: listenIps,
            enableUdp: true,
            enableTcp: true,
            preferTcp: true,
            initialAvailableOutgoingBitrate: initialAvailableOutgoingBitrate
        });
        await transport.setMaxIncomingBitrate(maxIncomingBitrate);
        this.peers.get(socketId).addTransport(transport);
        return {
            params: {
                id: transport.id,
                iceParameters: transport.iceParameters,
                iceCandidates: transport.iceCandidates,
                dtlsParameters: transport.dtlsParameters,
            }
        };
    }

    async connectPeerTransport(socketId: string, transportId: string, dtlsParameters: DtlsParameters) {
        const peer = this.peers.get(socketId);
        if (!peer) return;
        await peer.connectTransport(transportId, dtlsParameters);
    }

    async produce(socketId: string, producerTransportId: string, rtpParameters: RtpParameters, kind: MediaKind, appData: Object) {
        const producer = await this.peers.get(socketId).createProducer(producerTransportId, rtpParameters, kind, appData);
        logger.info(`用户${socketId}要创建producer ${producer.id}，向房间${this.id}中广播新的produce事件`);
        this.broadCast(socketId, signals.NEW_PRODUCER, {
            producer_id: producer.id,
            appData: producer.appData,
            socket_id: socketId,

        })
        return producer.id;
    }

    async consume(socketId: string, consumerTransportId: string, producerId: string, appData: Object, rtpCapabilities: RtpCapabilities) {
        if (!this.router.canConsume({ producerId: producerId, rtpCapabilities })) return;
        const { consumer, params } = await this.peers.get(socketId).createConsumer(consumerTransportId, producerId, appData, rtpCapabilities);

        consumer.on('producerclose', () => {
            logger.info(`用户${socketId}的consumer ${consumer.id}监听到producerclose事件,向房间${this.id}中广播关闭consumer${consumer.id}事件`);
            this.peers.get(socketId).removeConsumer(consumer.id);
            // this.io.to(socketId).emit(signals.CLOSE_CONSUMER, {
            //     consumer_id: consumer.id
            // });
        });

        consumer.on('producerpause', () => {
            logger.info(`用户${socketId}的consumer ${consumer.id}监听到producerpause事件,向房间${this.id}中广播暂停consumer${consumer.id}事件`);
            // this.io.to(socketId).emit(signals.PAUSE_CONSUMER, {
            //     consumer_id: consumer.id
            // });
        });

        consumer.on('producerresume', () => {
            logger.info(`用户${socketId}的consumer ${consumer.id}监听到producerresume事件,向房间${this.id}中恢复consumer${consumer.id}事件`);
            // this.io.to(socketId).emit(signals.RESUME_CONSUMER, {
            //     consumer_id: consumer.id
            // });
        });

        return params;
    }

    getPeers() {
        return this.peers;
    }

    async removePeer(socketId: string) {
        this.peers.get(socketId).close()
        this.peers.delete(socketId)
    }

    closeProducer(socketId: string, producerId: string) {
        this.peers.get(socketId).closeProducer(producerId);
    }

    async pauseProducer(socketId: string, producerId: string){
        await this.peers.get(socketId).pauseProducer(producerId);
    }
 
    async resumeProducer(socketId: string, producerId: string){
        await this.peers.get(socketId).resumeProducer(producerId);
    }

    broadCast(socketId: string, signal: signals, data: any) {
        for (const socket of Array.from(this.peers.keys()).filter(id => id !== socketId)) {
            this.io.to(socket).emit(signal, data);
        }
    }
}
