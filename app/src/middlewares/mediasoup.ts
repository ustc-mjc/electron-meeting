import { Socket } from "socket.io-client";
import { Device } from "mediasoup-client";
import { store } from "../app/store";
import { signals } from "../constants/signals";
import { Transport, TransportOptions } from "mediasoup-client/lib/Transport";
import { Producer } from "mediasoup-client/lib/Producer";
import { Consumer } from "mediasoup-client/lib/Consumer";
import { RtpCapabilities } from "mediasoup-client/lib/RtpParameters";
import { recordOff, screenOff, setParticipants, setSelfStream } from "../slices/meeting";
import { Participant } from "../interfaces/meeting";
import { deviceInfo } from "../utils/deviceInfo";
import ScreenShare from "../utils/screenShare";
import RecordRTC, { invokeSaveAsDialog } from "recordrtc";
import { getCurTime } from "../utils/getCurTime";
import { show } from "../slices/toast";

let sendTransport: Transport;
let receiveTransport: Transport;

let audioProducer: Producer|null;
let videoProducer: Producer|null;
let screenProducer: Producer|null;

const curDevice = deviceInfo();
let screenShare = ScreenShare.create(curDevice);
let recordScreenShare = ScreenShare.create(curDevice);

let canProduceAudio: boolean = false;
let canProduceVideo: boolean = false;
let canProduceScreen: boolean = false;

let stream: MediaStream|null = null;
let screenStream: MediaStream|null = null;

let recordStream: MediaStream;
let recorder: RecordRTC;

const getMediaStream =  async (constrains: any) => {
    let stream = await navigator.mediaDevices.getUserMedia(constrains);
    return stream;
}
const closeMediaStream = (stream: MediaStream|null, type: string) => {
    if(stream) {
        switch(type) {
            case 'audio':
                stream.getAudioTracks().forEach(track => {
                    track.stop();
                    stream.removeTrack(track);
                })
                break;
            case 'video':
                stream.getVideoTracks().forEach(track => {
                    track.stop();
                    stream.removeTrack(track);
                })
                break;
            default:
                break;
        }
    }
}

navigator.mediaDevices.enumerateDevices().then((devices: MediaDeviceInfo[]) => {
    devices.forEach(device => {
        canProduceAudio = device.kind === 'audioinput'? true: canProduceAudio;
        canProduceVideo = device.kind === 'videoinput'? true: canProduceVideo;
        canProduceScreen = device.kind === 'videoinput'? true: canProduceScreen;
    })
});
//mediasoup middleware
export const mediasoup = (socket: Socket, device: Device) => (store: any) => (next: any) => async (action: any) => {
    console.log(`????????????mediasoup?????????,?????????action: ${action.type}?????????`);
    switch (action.type) {
        case 'meeting/joinMeeting':
            const meetingId = store.getState().meeting.id;
            const { audioEnabled, videoEnabled, screenEnabled } = store.getState().meeting.self;
            if (audioEnabled || videoEnabled) {
                console.log(`client?????????stream?????????????????????stream`);
                stream = await getMediaStream({ video: videoEnabled, audio: audioEnabled});
            }
            socket.emit(signals.GET_ROUTER_CAPABILITIES, meetingId, async (routerRtpCapabilities: RtpCapabilities) => {
                if (!device.loaded) {
                    await device.load({ routerRtpCapabilities });
                }
                socket.emit(signals.CREATE_WEBRTC_TRANSPORT, meetingId, async (params: TransportOptions) => {
                    sendTransport = await device.createSendTransport(params);

                    sendTransport.on('connect', async ({ dtlsParameters }, callback, err) => {
                        socket.emit(signals.CONNECT_TRANSPORT, meetingId, sendTransport.id, dtlsParameters, () => {
                            callback();
                        });
                    });

                    sendTransport.on("produce", async ({ kind, rtpParameters, appData }, callback, err) => {
                        socket.emit(signals.PRODUCE, meetingId, kind, rtpParameters, appData, sendTransport.id, (producerId: string) => {
                            callback({ id: producerId });
                        });
                    });
                    if (audioEnabled) {
                        audioProducer = await sendTransport.produce({
                            track: stream!!.getAudioTracks()[0],
                            codec: device.rtpCapabilities.codecs?.find((codec) => codec.kind === 'audio'),
                            appData: {
                                source: 'mic'
                            }
                        });
                    }
                    if (videoEnabled) {
                        videoProducer = await sendTransport.produce({
                            track: stream!!.getVideoTracks()[0],
                            codec: device.rtpCapabilities.codecs?.find((codec) => codec.mimeType.toLocaleLowerCase() === 'video/h264'),
                            codecOptions : {
                                videoGoogleStartBitrate : 1000
                            },
                            appData: {
                                source: 'cam'
                            }
                        });
                    }
                });

                socket.emit(signals.CREATE_WEBRTC_TRANSPORT, meetingId, async (params: TransportOptions) => {
                    receiveTransport = await device.createRecvTransport(params);

                    receiveTransport.on('connect', async ({dtlsParameters}, callback, err) => {
                        socket.emit(signals.CONNECT_TRANSPORT, meetingId, receiveTransport.id, dtlsParameters, callback);
                    });

                    socket.emit(signals.GET_PARTICIPANTS, meetingId, async (participants: any) => {
                        const state: Participant[] = [];
                        for (let index in participants) {
                            if (participants.hasOwnProperty(index)) {
                                let participant = participants[index];
                                const item: Participant = {
                                    name: participant.name,
                                    id: participant.id,
                                    stream: null,
                                    audioEnabled: false,
                                    videoEnabled: false,
                                    screenEnabled: false,
                                    screenStream: null
                                }
                                if (participant.id === socket.id) {
                                    item.stream = stream;
                                    item.screenStream = screenStream;
                                    item.audioEnabled = audioEnabled;
                                    item.videoEnabled = videoEnabled;
                                    item.screenEnabled = screenEnabled
                                } else {
                                    const remoteStream: MediaStream = new MediaStream();
                                    const remoteScreenStream: MediaStream = new MediaStream();
                                    for (let producer of participant.producers) {
                                        const {paused, track} = await consumeParticipant(socket, meetingId, producer.producer_id, producer.appData, device.rtpCapabilities) as any;
                                        item.audioEnabled = producer.appData.source === 'mic' ? !paused : item.audioEnabled;
                                        item.videoEnabled = producer.appData.source === 'cam' ? !paused : item.videoEnabled;
                                        item.screenEnabled = producer.appData.source === 'screem' ? !paused : item.screenEnabled;
                                        if (producer.appData.source === 'screen') {
                                            remoteScreenStream.addTrack(track);
                                        } else {
                                            remoteStream.addTrack(track);
                                        }
                                    }
                                    item.stream = remoteStream;
                                    item.screenStream = remoteScreenStream;
                                }
                                state.push(item);
                            }
                        }
                        store.dispatch(setParticipants(state));
                    });
                });
            });
            break;
        case 'meeting/newProducer':
            const { producer_id, socket_id, appData } = action.payload;
            const { participants, id } = store.getState().meeting;
            console.log(`?????????producer??????socketId???${socket_id}?????????id???${producer_id}`);

            const remoteStream = participants.filter((participant: Participant) => participant.id === socket_id)[0].stream || new MediaStream();
            const remoteScreenStream = participants.filter((participant: Participant) => participant.id === socket_id)[0].screenStream || new MediaStream();

            const { paused, track } = await consumeParticipant(socket, id, producer_id, appData, device.rtpCapabilities) as any;
            if (appData.source === 'mic') {
                action.payload.audioEnabled = !paused;
            } else if (appData.source === 'cam') {
                action.payload.videoEnabled = !paused;
            } else if (appData.source === 'screen') {
                action.payload.screenEnabled = !paused;
            }
            remoteStream.addTrack(track);
            if (appData.source === 'screen') {
                remoteScreenStream.addTrack(track);
            }
            action.payload.stream = remoteStream;
            action.payload.screenStream = remoteScreenStream;
            break;
        case 'meeting/muteMic':
            if (audioProducer) {
                // closeMediaStream(stream, 'audio');
                await pauseProducer(audioProducer, socket);
                // audioProducer = null;
            }
            break;
        case 'meeting/unmuteMic':
            if (canProduceAudio) {
                if (!audioProducer) {
                    let track: MediaStreamTrack = (await getMediaStream({audio: true})).getAudioTracks()[0];
                    if (!stream) {
                        stream = await getMediaStream({audio: true, video: true});
                        console.log('new stream');
                    }
                    stream?.addTrack(track);
                    audioProducer = await sendTransport.produce({
                        track: stream!!.getAudioTracks()[0],
                        codec: device.rtpCapabilities.codecs?.find((codec) => codec.kind === 'audio'),
                        appData: {
                            source: 'mic'
                        }
                    });
                    store.dispatch(setSelfStream({stream: stream, type: 'mediaStream'}));
                }
                await resumeProducer(audioProducer, socket);
            }
            break;
        case 'meeting/videoOff':
            if (videoProducer) {
                closeMediaStream(stream, 'video');
                // await pauseProducer(videoProducer, socket);
                await closeProducer(videoProducer, socket);
                videoProducer = null;
            }
            break;
        case 'meeting/videoOn':
            if (canProduceVideo) {
                if (!videoProducer) {
                    let track: MediaStreamTrack = (await getMediaStream({video: true})).getVideoTracks()[0];
                    if (!stream) {
                        stream = await getMediaStream({audio: true, video: true});
                        console.log('new stream');
                    }
                    stream?.addTrack(track);
                    videoProducer = await sendTransport.produce({
                        track: stream!!.getVideoTracks()[0],
                        codec: device.rtpCapabilities.codecs?.find((codec) => codec.mimeType.toLocaleLowerCase() === 'video/h264'),
                        codecOptions : {
                            videoGoogleStartBitrate : 1000
                        },
                        appData: {
                            source: 'cam'
                        }
                    });
                    store.dispatch(setSelfStream({stream: stream, type: 'mediaStream'}));
                }
                // await resumeProducer(videoProducer, socket);
            }
            break;   
        case 'meeting/screenOn':
            if (canProduceScreen) {
                if (!screenProducer) {
                    //@ts-ignore
                    screenStream = await screenShare.start({
                        width       : { ideal: 1920 },
                        aspectRatio : 1.777, //16:9
                        frameRate: 15
                    });
                    screenProducer = await sendTransport.produce({
                        track: screenStream?.getVideoTracks()[0],
                        codec: device.rtpCapabilities.codecs?.find((codec) => codec.mimeType.toLocaleLowerCase() === 'video/h264'),
                        codecOptions: {
                            videoGoogleStartBitrate: 1000
                        },
                        appData: {
                            source : 'screen'
                        }
                    });
                    screenProducer.on('trackended', () => {
                        store.dispatch(screenOff());
                    })
                    store.dispatch(setSelfStream({stream: screenStream, type: 'screenStream' }));
                }
            }
            break;
        case 'meeting/screenOff':
            if (screenProducer) {
                // @ts-ignore
                screenShare.stop();
                await closeProducer(screenProducer, socket);
                screenProducer = null;
            }
            break;
        case 'meeting/recordOn':
            // @ts-ignore
            recordStream = await recordScreenShare.start({
                width       : { ideal: 1920 },
                aspectRatio : 1.777, //16:9
                frameRate: 20
            });
            store.dispatch(show('start record screen!'));
            recordStream.getTracks().forEach(track => {
                track.onended = ()=> {
                    store.dispatch(recordOff());
                }
            })
            recorder = new RecordRTC(recordStream, {
                type: 'video'
            });
            recorder.startRecording();
            // const sleep = (m: any) => new Promise(r => setTimeout(r, m));
            // await sleep(10000);
            break;
        case 'meeting/recordOff':
            store.dispatch(show('stop record screen!'));
            recorder.stopRecording(() => {
                let blob = recorder.getBlob();
                console.log(getCurTime().replaceAll(/:/g,'-'));
                invokeSaveAsDialog(blob, 'Record-'+getCurTime().replaceAll(/[:\s]/g,'-')+'.webm');
            });
            // @ts-ignore
            await recordScreenShare.stop();
            break;
        case 'meeting/leaveMeeting':
            if (recorder) {
                store.dispatch(show('stop record screen!'));
                recorder.stopRecording(() => {
                    let blob = recorder.getBlob();
                    console.log(getCurTime().replaceAll(/:/g,'-'));
                    invokeSaveAsDialog(blob, 'Record-'+getCurTime().replaceAll(/[:\s]/g,'-')+'.webm');
                });
                // @ts-ignore
                await recordScreenShare.stop();
            }
            break;
        default:
            break;      
    }
    return next(action);
}

const closeProducer = (producer: Producer, socket: Socket) => {
    return new Promise((resolve) => {
        const { id } = store.getState().meeting;
        socket.emit(signals.CLOSE_PRODUCER, id, producer.id, () => {
            producer.close();
            resolve(true);
        })
    })
}

const pauseProducer = (producer: Producer, socket: Socket) => {
    return new Promise((resolve) => {
        const { id } = store.getState().meeting;
        socket.emit(signals.PAUSE_PRODUCER, id, producer.id, () => {
            producer.pause();
            resolve(true);
        });
    })
}

const resumeProducer = (producer: Producer, socket: Socket) => {
    return new Promise(resolve => {
        const { id } = store.getState().meeting;
        socket.emit(signals.RESUME_PRODUCER, id, producer.id, () => {
            producer.resume();
            resolve(true);
        });
    });
}

const consumeParticipant = (socket: Socket, meetingId: string, producerId: string, appData: Object, rtpCapabilities: RtpCapabilities) => {
    return new Promise(resolve => {
        socket.emit(signals.CONSUME, meetingId, receiveTransport.id, producerId, appData, rtpCapabilities, async ({id, kind, rtpParameters}: any) => {
            const consumer: Consumer = await receiveTransport.consume({
                id,
                producerId: producerId,
                kind,
                rtpParameters,
                appData: appData
            });
            resolve({
                paused: consumer.paused,
                track: consumer.track,
                kind: kind,
                appData: appData
            })
        });
    });
}
