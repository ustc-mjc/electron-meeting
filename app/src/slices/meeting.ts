import { Action, createSlice, PayloadAction } from '@reduxjs/toolkit';
import Meeting, { EmptyMeeting, LoginInfo, MeetingStatus } from '../interfaces/meeting';

const initialState: Meeting = EmptyMeeting;

export const meetingSlice = createSlice({
  name: 'meeting',
  initialState,
  // The `reducers` field lets us define reducers and generate associated actions
  reducers: {
    register: (state, action) => {

    },

    requestLogin: (state, action) => {
    },
    
    loginMeeting: (state: Meeting, action: PayloadAction<LoginInfo>) => {
        state.loginInfo = action.payload;
    },

    requestToJoinMeeting: (state: Meeting, action: PayloadAction<any>) => {
        state.status = MeetingStatus.REQUEST_TO_JOIN;
        state.id = action.payload.meeting_id;
        state.self.videoEnabled = action.payload.video;
        state.self.audioEnabled = action.payload.audio;
        state.self.screenEnabled = false;
    },

    joinMeeting: (state: Meeting, action: PayloadAction<any>) => {
        state.self.id = action.payload.id;
        state.self.name = action.payload.name
        state.status = MeetingStatus.IN_MEETING;
    },
    
    leaveMeeting: (state: Meeting, action) => {
        state.id = '';
        state.participants = [];
        state.self = {
            id: '',
            name: '',
            audioEnabled: false,
            videoEnabled: false,
            screenEnabled: false
        };
        state.messages = [];
        state.sharedFiles = [];
        state.status = MeetingStatus.NONE;
    },

    getParticipants: (state, action) => {},

    setParticipants: (state, action) => {
        state.participants = action.payload;
    },

    addParticipant: (state, action) => {
        state.participants.push(action.payload);
    },

    removeParticipant: (state, action) => {
        state.participants = state.participants.filter(participant => participant.id !== action.payload);
    },

    sendMessage: (state, action) => {
        state.messages.push({
            name: action.payload.name,
            time: action.payload.time,
            message: action.payload.message
        });
    },

    newMessage: (state, action) => {
        state.messages.push({
            name: action.payload.name,
            time: action.payload.message_time,
            message: action.payload.message
        });
    },

    shareFile: (state, action) => {
        state.sharedFiles.push({
            name: action.payload.name,
            time: action.payload.time,
            fileName: action.payload.fileName,
            fileSize: action.payload.fileSize,
            magnetUri: action.payload.magnetUri,
            is_progress:false,
            speed: 0,
            progress: 0,
            files: null,
        });
    },
    newFile: (state, action) => {
        state.sharedFiles.push({
            name: action.payload.name,
            time: action.payload.time,
            fileName: action.payload.fileName,
            fileSize: action.payload.fileSize,
            magnetUri: action.payload.magnetUri,
            is_progress:false,
            speed: 0,
            progress: 0,
            files: null,
        });
    },
    updataFileProgress: (state, action) => {
        state.sharedFiles.forEach(file => {
            if (file.magnetUri === action.payload.magnetUri) {
                file.is_progress = action.payload.is_progress;
                file.speed = action.payload.speed;
                file.progress = action.payload.progress;
                file.files = action.payload.files;
            }
        })
    },
    produce: (state, action) => {},

    newProducer: (state, action) => {
        const { stream, screenStream, socket_id, audioEnabled, videoEnabled, screenEnabled } = action.payload;
        for (const idx in state.participants) {
            if (state.participants[idx].id === socket_id) {
                state.participants[idx].audioEnabled = audioEnabled || state.participants[idx].audioEnabled;
                state.participants[idx].videoEnabled = videoEnabled || state.participants[idx].videoEnabled;
                state.participants[idx].screenEnabled = screenEnabled || state.participants[idx].screenEnabled;
                state.participants[idx].stream = stream;
                if (screenEnabled) {
                    state.participants[idx].screenStream = screenStream;
                }
                break;
            }
        }
    },

    muteMic: (state, action: Action) => {
        state.self.audioEnabled = false;
        state.participants.forEach( participant => {
            if(participant.id === state.self.id) {
                participant.audioEnabled=false;
            }
        })
    },

    unmuteMic: (state, action: Action) =>{
        state.self.audioEnabled = true;
        state.participants.forEach( participant => {
            if(participant.id === state.self.id) {
                participant.audioEnabled=true;
            }
        })
    },

    videoOff: (state, action: Action) => {
        state.self.videoEnabled = false;
        state.participants.forEach( participant => {
            if(participant.id === state.self.id) {
                participant.videoEnabled=false;
            }
        })
    },

    videoOn: (state, action: Action) => {
        state.self.videoEnabled = true;
        state.participants.forEach( participant => {
            if(participant.id === state.self.id) {
                participant.videoEnabled=true;
            }
        })
    },
    screenOff: (state, action: Action) => {
        state.self.screenEnabled = false;
        state.participants.forEach( participant => {
            if(participant.id === state.self.id) {
                participant.screenEnabled=false;
            }
        })
    },

    screenOn: (state, action: Action) => {
        state.self.screenEnabled = true;
        state.participants.forEach( participant => {
            if (participant.id === state.self.id) {
                participant.screenEnabled=true;
            }
        })
    },
    recordOff: (state, action: Action) => {
        state.recorded = false;
    },
    recordOn: (state, action: Action) => {
        state.recorded = true;
    },
    setSelfStream: (state, action: PayloadAction<any>) => {
        state.participants.forEach( participant => {
            if (participant.id === state.self.id) {
                switch(action.payload.type) {
                    case 'mediaStream':
                        participant.stream = action.payload.stream;
                        break;
                    case 'screenStream':
                        participant.screenStream = action.payload.stream;
                        break;
                    default:
                        break;
                }
            }
        })
    },

    resumeConsumer: (state, action: PayloadAction<any>) => {
        const idx = state.participants.findIndex(participant => participant.id === action.payload.participant_id);
        if (idx > -1) {
            state.participants[idx].videoEnabled = action.payload.appData.source === 'cam' ? true : state.participants[idx].videoEnabled;
            state.participants[idx].audioEnabled = action.payload.appData.source === 'mic' ? true : state.participants[idx].audioEnabled;
            state.participants[idx].screenEnabled = action.payload.appData.source === 'screen' ? true : state.participants[idx].screenEnabled;
        }
    },

    pauseConsumer: (state, action: PayloadAction<any>) => {
        const idx = state.participants.findIndex(participant => participant.id === action.payload.participant_id);
        if (idx > -1) {
            state.participants[idx].videoEnabled = action.payload.appData.source === 'cam' ? false : state.participants[idx].videoEnabled;
            state.participants[idx].audioEnabled = action.payload.appData.source === 'mic' ? false : state.participants[idx].audioEnabled;
            state.participants[idx].screenEnabled = action.payload.appData.source === 'screen' ? false : state.participants[idx].screenEnabled;
        }
    },

    closeConsumer: (state, action: PayloadAction<any>) => {
        const idx = state.participants.findIndex(participant => participant.id === action.payload.participant_id);
        if (idx > -1) {
            switch (action.payload.appData.source) {
                case 'mic':
                    state.participants[idx].videoEnabled = false;
                    state.participants[idx].stream?.getAudioTracks().forEach(track => {
                        track.stop();
                        state.participants[idx].stream?.removeTrack(track);
                    });
                    break;
                case 'cam':
                    state.participants[idx].videoEnabled = false;
                    state.participants[idx].stream?.getVideoTracks().forEach(track => {
                        track.stop();
                        state.participants[idx].stream?.removeTrack(track);
                    })
                    break;
                case 'screen':
                    state.participants[idx].screenEnabled = false;
                    state.participants[idx].screenStream?.getVideoTracks().forEach(track => {
                        track.stop();
                        state.participants[idx].screenStream?.removeTrack(track);
                    })
                    break;
            }
        }
    }
  },
});

export const {
    register,
    requestLogin,
    loginMeeting,
    joinMeeting,
    leaveMeeting,
    produce,
    requestToJoinMeeting,
    getParticipants,
    setParticipants,
    addParticipant,
    removeParticipant,
    newMessage,
    sendMessage,
    shareFile,
    newFile,
    updataFileProgress,
    newProducer,
    muteMic,
    unmuteMic,
    videoOff,
    videoOn,
    screenOff,
    screenOn,
    recordOff,
    recordOn,
    setSelfStream,
    pauseConsumer,
    resumeConsumer,
    closeConsumer
} = meetingSlice.actions;

// The function below is called a selector and allows us to select a value from
// the state. Selectors can also be defined inline where they're used instead of
// in the slice file. For example: `useSelector((state: RootState) => state.counter.value)`
// export const selectCount = (state: RootState) => state.counter.value;

export default meetingSlice.reducer;
