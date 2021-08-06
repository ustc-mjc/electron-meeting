import { RootState } from "../app/store";
import { useAppDispatch as useDispatch } from "../app/hooks";
import React, {ChangeEvent, useEffect, useLayoutEffect, useState, useRef} from "react";
import { useSelector } from "react-redux";
import { useHistory } from "react-router-dom";
import { MeetingStatus } from "../interfaces/meeting";
import { requestToJoinMeeting } from "../slices/meeting";
import { show } from "../slices/toast";
import { signals } from "../constants/signals";

const getMeeting = (state: RootState) => state.meeting;
const NewMeeting = () => {
    const [meetingId, setMeetingId] = useState('');
    const [name, setName] = useState('');
    const [audio, setAudio] = useState(true);
    const [video, setVideo] = useState(true);
    const dispatch = useDispatch();
    const meeting = useSelector(getMeeting);
    const history = useHistory();
    const videoRef = useRef<any>();

    useEffect(() => {
        if (meeting.status === MeetingStatus.IN_MEETING) {
            history.replace(`/meeting/${meeting.id}`);
        }
    });

    useLayoutEffect(() => {
        checkForVideoAudioAccess();
        navigator.mediaDevices.getUserMedia({ video: video }).then(async stream => {
            if(stream) {
                //@ts-ignore
                videoRef.current.srcObject = stream
            }
        }).catch(async error => {
            console.log(error);
            setVideo(false);
        });
        navigator.mediaDevices.getUserMedia({ audio: audio }).catch(async error => {
            setAudio(false);
        })
    }, [video]);

    const checkForVideoAudioAccess = async () => {
        try {
          const cameraResult = await navigator.permissions.query({ name: 'camera' });
          // The state property may be 'denied', 'prompt' and 'granted'
          const isCameraAccessGranted = cameraResult.state !== 'denied';

          const microphoneResult = await navigator.permissions.query({ name: 'microphone' });
          const isMicrophoneAccessGranted = microphoneResult.state !== 'denied';

          console.log(`isMicrophoneAccessGranted: ${isMicrophoneAccessGranted}, isCameraAccessGranted: ${isCameraAccessGranted}`)
        } catch(e) {
          console.error('An error occurred while checking the site permissions', e);
        }
        return true;
      }
    const onNameChange = (event: ChangeEvent<HTMLInputElement>) => {
        setName(event.currentTarget.value);
    }

    const onMeetingIdChange = (event: ChangeEvent<HTMLInputElement>) => {
        setMeetingId(event.currentTarget.value);
    }

    const startMeeting = () => {
        if(meetingId === "") {
            dispatch(show("Meeting ID or Your Name is null"));
            return;
        }
        if(name === '') {
            dispatch(show("Your Name is null"));
            return;
        }
        if (video) {
            //@ts-ignore
            videoRef.current.srcObject.getTracks().forEach(track => {
                track.stop();
            });
        }
        dispatch(
            requestToJoinMeeting({
                event_name: signals.REQUEST_JOIN,
                meeting_id: meetingId,
                name: name,
                audio: audio,
                video: video,
            })
        );
    }

    return (
        <div className="h-screen">
            {meeting.loginInfo.loginState && 
            (
                <div className="flex justify-end text-xl font-mono">
                    <div className="mt-6 mr-6">
                        <svg className="inline-block" xmlns="http://www.w3.org/2000/svg" height="36px" viewBox="0 0 24 24" width="36px" fill="#000000"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>
                        <div className="inline-block ml-2">{meeting.loginInfo.username}</div>
                    </div>
                </div>
            )
            }
            <div className="h-6"></div>
            <div className="container h-5/6 max-h-screen mx-auto px-4 py-8">
                <div className="flex flex-col h-full sm:flex-row sm:space-x-16">
                    <div className="flex-1 relative w-full max-w-screen-sm">
                        { video ? (<video className="absolute min-w-full h-full object-center object-cover rounded-xl" ref={videoRef} autoPlay={true} playsInline={true} />): (<div className="absolute bg-black w-full h-full" />)}
                        <div className="absolute z-50 w-full h-full flex flex-row gap-x-2 justify-center items-end py-3">
                        <button className={`rounded-full ${!audio ? 'bg-white': ''} border-2 p-3 focus:outline-none`} onClick={() => {
                                navigator.mediaDevices.enumerateDevices().then(devices => {
                                    if (!devices.filter(device => device.kind === 'audioinput').length) {
                                        dispatch(show('No audio devices found.'));
                                    } else {
                                        setAudio(!audio);
                                    }
                                })
                            }}>
                                {
                                    audio ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" enableBackground="new 0 0 24 24" height="24px" viewBox="0 0 24 24" width="24px" fill="#FFFFFF"><g><rect fill="none" height="24" width="24"/><rect fill="none" height="24" width="24"/><rect fill="none" height="24" width="24"/></g><g><g/><g><path d="M12,14c1.66,0,3-1.34,3-3V5c0-1.66-1.34-3-3-3S9,3.34,9,5v6C9,12.66,10.34,14,12,14z"/><path d="M17,11c0,2.76-2.24,5-5,5s-5-2.24-5-5H5c0,3.53,2.61,6.43,6,6.92V21h2v-3.08c3.39-0.49,6-3.39,6-6.92H17z"/></g></g></svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M10.8 4.9c0-.66.54-1.2 1.2-1.2s1.2.54 1.2 1.2l-.01 3.91L15 10.6V5c0-1.66-1.34-3-3-3-1.54 0-2.79 1.16-2.96 2.65l1.76 1.76V4.9zM19 11h-1.7c0 .58-.1 1.13-.27 1.64l1.27 1.27c.44-.88.7-1.87.7-2.91zM4.41 2.86L3 4.27l6 6V11c0 1.66 1.34 3 3 3 .23 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.55-.9l4.2 4.2 1.41-1.41L4.41 2.86z"/></svg>
                                    )
                                }
                            </button>
                            <button className={`rounded-full ${!video ? 'bg-white': ''} border-2 p-3 focus:outline-none`} onClick={() => {
                                navigator.mediaDevices.enumerateDevices().then(devices => {
                                    if (!devices.filter(device => device.kind === 'videoinput').length) {
                                        dispatch(show('No video devices found.'));
                                    } else {
                                        setVideo(!video);
                                    }
                                })
                            }}>
                                {
                                    video ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#FFFFFF"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M15 8v8H5V8h10m1-2H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4V7c0-.55-.45-1-1-1z"/></svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M9.56 8l-2-2-4.15-4.14L2 3.27 4.73 6H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.21 0 .39-.08.55-.18L19.73 21l1.41-1.41-8.86-8.86L9.56 8zM5 16V8h1.73l8 8H5zm10-8v2.61l6 6V6.5l-4 4V7c0-.55-.45-1-1-1h-5.61l2 2H15z"/></svg>
                                    )
                                }
                            </button>
                        </div>            
                    </div>
                    <div className="py-8">
                        <h1 className="text-xl md:text-2xl mb-8">Start your meeting right away!</h1>
                        <label>Meeting ID:</label>
                        <input value={meetingId} autoFocus={true} onChange={onMeetingIdChange} 
                                className="w-full mb-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-green-300 px-4 py-2 leading-5"
                                onKeyDown={(event) => {
                                    if (event.key.toLowerCase() === 'enter') {
                                        startMeeting()
                                    }
                            }}
                            type="text"
                            placeholder="Enter meeting id"
                        />
                        <label>Your Name:</label>
                        <input value={name} autoFocus={true} onChange={onNameChange}
                            onKeyDown={(event) => {
                                    if (event.key.toLowerCase() === 'enter') {
                                        startMeeting()
                                    }
                            }}
                            className="w-full mb-2 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-green-300 px-4 py-2 leading-5"
                            type="text"
                            placeholder="Enter your name"
                        />
                        <button className="w-full bg-green-500 rounded p-2" onClick={startMeeting}>
                            {
                                meeting.status === MeetingStatus.REQUEST_TO_JOIN ? 'Joining Meeting' : 'Start and Join Meeting'
                            }
                        </button>
                    </div>
                </div>
            </div> 
        </div>
    )
}
export default NewMeeting;