import { Socket } from "socket.io-client";
import { signals } from "../constants/signals";
import { Dispatch } from "react";
import {
    addParticipant,
    joinMeeting,
    newMessage, newProducer,
    removeParticipant,
    setParticipants,
    resumeConsumer,
    pauseConsumer,
    closeConsumer,
    newFile
} from '../slices/meeting';
import { show } from "../slices/toast";

const emitEventMiddleWare = (socket: Socket) => (store: any) => (next: any) => (action: any) => {
    console.log(`欢迎进入socket io 中间件,我是被action: ${action.type}触发的`);
    const { dispatch } = store;
    switch (action.type) {
        case 'meeting/requestToJoinMeeting':
            socket.emit(signals.REQUEST_JOIN, action.payload.meeting_id, action.payload.name, (response: any) => {
                dispatch(joinMeeting({id: socket.id, name: action.payload.name}));
            });
            break;
        case 'meeting/sendMessage':
            socket.emit(signals.SEND_MESSAGE, action.payload.meeting_id, action.payload.message, action.payload.time);
            break;
        case 'meeting/shareFile':
            socket.emit(signals.SHARE_FILE, action.payload);
            break;
        case 'meeting/getParticipants':
            socket.emit(signals.GET_PARTICIPANTS, action.payload.meeting_id, (participants: any[]) => {
                dispatch(setParticipants(participants));
            });
            break;
        case 'meeting/leaveMeeting':
            socket.emit(signals.LEAVE_MEETING, action.payload.meeting_id);
            break;
        default:
            break;
    }
    return next(action);
}

const listeners = [
    {
        name: signals.RESUME_CONSUMER,
        callback: (dispatch: Dispatch<any>, message: any) => {
            dispatch(resumeConsumer(message));
        }
    }, {
        name: signals.PAUSE_CONSUMER,
        callback: (dispatch: Dispatch<any>, message: any) => {
            dispatch(pauseConsumer(message));
        }
    }, {
        name: signals.CLOSE_CONSUMER,
        callback: (dispatch: Dispatch<any>, message: any) => {
            dispatch(closeConsumer(message));
        }
    },{
        name: signals.NEW_MESSAGE,
        callback: (dispatch: Dispatch<any>, message: any) => {
            dispatch(newMessage(message));
            dispatch(show('New message!'))
        }
    }, {
        name: signals.NEW_FILE,
        callback: (dispatch: Dispatch<any>, message: any) => {
            dispatch(newFile(message));
            dispatch(show('New share file!'))
        }
    },
    {
        name: signals.PARTICIPANT_OFFLINE,
        callback: (dispatch: Dispatch<any>, participantId: string) => {
            dispatch(removeParticipant(participantId));
        }
    }, {
        name: signals.NEW_PARTICIPANT,
        callback: (dispatch: Dispatch<any>, participant: any) => {
            dispatch(
                addParticipant({
                    name: participant.name,
                    id: participant.id,
                    stream: null,
                    screenStream: null,
                    audioEnabled: false,
                    videoEnabled: false,
                    screenEnabled: false
                })
            );
            dispatch(show(`${participant.name} has joined the meeting`));
        }
    }, {
        name: signals.NEW_PRODUCER,
        callback: (dispatch: Dispatch<any>, data: any) => {
            dispatch(newProducer(data));
        }
    }
];

export { emitEventMiddleWare, listeners };