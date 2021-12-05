import React, {useEffect, useState} from "react";
import MeetingSidebar from "../components/MeetingSidebar";
import {RootState} from "../app/store";
import {useSelector} from "react-redux";
import { useHistory, useParams} from "react-router-dom";
import {default as MeetingInterface, Participant, MeetingStatus} from "../interfaces/meeting";
import {leaveMeeting, muteMic, unmuteMic, videoOff, videoOn, screenOff, screenOn, recordOff, recordOn} from "../slices/meeting";
import {useAppDispatch as useDispatch} from "../app/hooks";
import ParticipantVideo from "../components/ParticipantVideo";
import NewMeeting from "./new_meeting";
import Navigation from "../components/Navigation";

const getMeeting = (state: RootState) => state.meeting

const Meeting = () => {
    const [isOpen, setOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [activeIndex, setActiveIndex] = useState(0);
    const { id } = useParams<{id: string}>();
    const meeting: MeetingInterface = useSelector(getMeeting);
    const history = useHistory();
    const dispatch = useDispatch();

    const handleWindowSizeChange = () => setIsMobile(window.innerWidth <= 768);

    useEffect(() => {
        window.addEventListener('resize', handleWindowSizeChange);
        if (!meeting.id) {
            history.replace(`/?mid=${id}`);
        }
        return () => {
            window.removeEventListener('resize', handleWindowSizeChange);
        }
    });

    const toggleAudio = () => {
        if (meeting.self.audioEnabled) {
            dispatch(muteMic());
        } else {
            dispatch(unmuteMic())
        }
    }

    const toggleVideo = () => {
        if (meeting.self.videoEnabled) {
            dispatch(videoOff());
        } else {
            dispatch(videoOn());
        }
    }
    const toggleScreen = () => {
        if (!meeting.self.screenEnabled) {
            dispatch(screenOn());
        } else {
            dispatch(screenOff());
        }
    }

    const recordScreen = () => {
        if (!meeting.recorded) {
            dispatch(recordOn());
        } else {
            dispatch(recordOff());
        }
    }

    const setActive = (index: any) => () => { console.log(index); console.log("CLick initiated"); setActiveIndex(index); };

    if (meeting.status === MeetingStatus.IN_MEETING) {
        let participants: Participant[] = [];
        //@ts-ignore
        let self: Participant = {};
        // get all participants, move self to first
        meeting.participants.forEach((participant: Participant) => {
            if (participant.id !== meeting.self.id) {
                if (!participant.videoEnabled && participant.screenEnabled) {
                    const _participant = {
                        name: participant.name,
                        id: participant.id,
                        stream: participant.stream,
                        audioEnabled: participant.audioEnabled,
                        videoEnabled: false,
                        screenEnabled: false,
                        screenStream: participant.screenStream
                    }
                    participants.push(_participant);
                } else {
                    participants.push(participant);
                }
                if (participant.screenEnabled) {
                    const new_participant: Participant = 
                    {
                        name: participant.name,
                        id: participant.id,
                        stream: participant.stream,
                        audioEnabled: participant.audioEnabled,
                        videoEnabled: false,
                        screenEnabled: participant.screenEnabled,
                        screenStream: participant.screenStream
                    }
                    participants.push(new_participant);
                }
            } else {
                self = participant;
            }
        })
        if (!self.videoEnabled && self.screenEnabled) {
            const _self: Participant = {
                name: self.name,
                id: self.id,
                stream: self.stream,
                audioEnabled: self.audioEnabled,
                videoEnabled: false,
                screenEnabled: false,
                screenStream: self.screenStream
            }
            participants.unshift(_self, self);
        } else if (self.videoEnabled && self.screenEnabled) {
            const new_self: Participant = 
            {
                name: self.name,
                id: self.id,
                stream: self.stream,
                audioEnabled: self.audioEnabled,
                videoEnabled: false,
                screenEnabled: self.screenEnabled,
                screenStream: self.screenStream
            }
            participants.unshift(self, new_self);
        } else {
            participants.unshift(self);
        }

        return (
            <div className="h-screen max-h-screen max-w-full flex flex-col">
                <div className="flex w-full">
                    <Navigation isOpen={isOpen} toggleSidebar={setOpen}/>
                </div>
                <div className="flex flex-wrap h-full ">
                    <div className="flex-1 flex flex-col max-h-full max-w-full">
                        <div className="flex flex-row flex-nowrap overflow-x-auto p-2 gap-2">
                            {
                                participants.map((participant: Participant, index: number) => {
                                    return (
                                        <div key={index} onClick={setActive(index)} className={`rounded ${activeIndex>participants.length-1 ? (index === 0 ? 'border-4 border-green-500': '') : (activeIndex === index ? 'border-4 border-green-500': '') }`}>
                                            <ParticipantVideo participant={participant} size="w-20 h-20" forceMute={true} showMuteStatus={false} />
                                        </div>
                                    )
                                })
                            }
                        </div>
                        <div className="flex-1 p-2">
                            <ParticipantVideo participant={participants[activeIndex] ? participants[activeIndex] : participants[0]} forceMute={participants[activeIndex] ?  (participants[activeIndex].id === meeting.self.id ? true : false): (false)} size="w-full h-full" />
                        </div>

                        <div className="flex flex-row justify-center gap-x-3 py-4 bg-white-400">
                             <button id="toggleAudio" className="bg-white rounded-full shadow-xl p-4 focus:outline-none" onClick={toggleAudio}>
                                 {
                                    meeting.self.audioEnabled ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><g><rect fill="none" height="24" width="24"/><rect fill="none" height="24" width="24"/><rect fill="none" height="24" width="24"/></g><g><g/><g><path d="M12,14c1.66,0,3-1.34,3-3V5c0-1.66-1.34-3-3-3S9,3.34,9,5v6C9,12.66,10.34,14,12,14z"/><path d="M17,11c0,2.76-2.24,5-5,5s-5-2.24-5-5H5c0,3.53,2.61,6.43,6,6.92V21h2v-3.08c3.39-0.49,6-3.39,6-6.92H17z"/></g></g></svg>) : (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M19 11H17.3C17.3 11.74 17.14 12.43 16.87 13.05L18.1 14.28C18.66 13.3 19 12.19 19 11V11ZM14.98 11.17C14.98 11.11 15 11.06 15 11V5C15 3.34 13.66 2 12 2C10.34 2 9 3.34 9 5V5.18L14.98 11.17ZM4.27 3L3 4.27L9.01 10.28V11C9.01 12.66 10.34 14 12 14C12.22 14 12.44 13.97 12.65 13.92L14.31 15.58C13.6 15.91 12.81 16.1 12 16.1C9.24 16.1 6.7 14 6.7 11H5C5 14.41 7.72 17.23 11 17.72V21H13V17.72C13.91 17.59 14.77 17.27 15.54 16.82L19.73 21L21 19.73L4.27 3Z" fill="black"/>
                                        </svg>
                                        )
                                }
                            </button>
                            <button id="toggleVideo" className="bg-white rounded-full shadow-xl p-4 focus:outline-none" onClick={toggleVideo}>
                                {
                                    meeting.self.videoEnabled ? (<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M15 8v8H5V8h10m1-2H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4V7c0-.55-.45-1-1-1z"/></svg>) : (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M21 6.5L17 10.5V7C17 6.45 16.55 6 16 6H9.82L21 17.18V6.5ZM3.27 2L2 3.27L4.73 6H4C3.45 6 3 6.45 3 7V17C3 17.55 3.45 18 4 18H16C16.21 18 16.39 17.92 16.54 17.82L19.73 21L21 19.73L3.27 2Z" fill="black"/>
                                    </svg>)
                                }
                            </button>
                            <button id="toggleScreen" className="bg-white rounded-full shadow-xl p-4 focus:outline-none" onClick={toggleScreen}>
                                {
                                    !meeting.self.screenEnabled ? (<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M20 18c1.1 0 1.99-.9 1.99-2L22 6c0-1.11-.9-2-2-2H4c-1.11 0-2 .89-2 2v10c0 1.1.89 2 2 2H0v2h24v-2h-4zM4 16V6h16v10.01L4 16zm9-6.87c-3.89.54-5.44 3.2-6 5.87 1.39-1.87 3.22-2.72 6-2.72v2.19l4-3.74L13 7v2.13z"/></svg>) 
                                        : (<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><path d="M0 0h24v24H0z" fill="none"/><path d="M21.79 18l2 2H24v-2h-2.21zM1.11 2.98l1.55 1.56c-.41.37-.66.89-.66 1.48V16c0 1.1.9 2 2.01 2H0v2h18.13l2.71 2.71 1.41-1.41L2.52 1.57 1.11 2.98zM4 6.02h.13l4.95 4.93C7.94 12.07 7.31 13.52 7 15c.96-1.29 2.13-2.08 3.67-2.46l3.46 3.48H4v-10zm16 0v10.19l1.3 1.3c.42-.37.7-.89.7-1.49v-10c0-1.11-.9-2-2-2H7.8l2 2H20zm-7.07 3.13l2.79 2.78 1.28-1.2L13 7v2.13l-.07.02z"/></svg>)
                                }
                            </button>
                            <button id="recordScreen" className="bg-white rounded-full shadow-xl p-4 focus:outline-none" onClick={recordScreen}>
                                {
                                    !meeting.recorded ? (<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><path d="M0 0h24v24H0z" fill="none"/><path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm0-5C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/></svg>) 
                                    : (<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><path d="M0 0h24v24H0z" fill="none"/><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/></svg>)
                                }
                            </button>
                            {
                                isMobile && (
                                    <button className="bg-white rounded-full shadow-xl p-4 focus:outline-none" onClick={() => { setOpen(!isOpen) }}>
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M20 2H4C2.9 2 2.01 2.9 2.01 4L2 22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2ZM6 9H18V11H6V9ZM14 14H6V12H14V14ZM18 8H6V6H18V8Z" fill="black"/>
                                        </svg>
                                    </button>
                                )
                            }
                            <button id="leaveMeeting" className="bg-red-600 rounded-full shadow-xl p-4 focus:outline-none" onClick={() => {
                                dispatch(leaveMeeting({ meeting_id: meeting.id, history: history }));}}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 9C10.4 9 8.85 9.25 7.4 9.72V12.82C7.4 13.21 7.17 13.56 6.84 13.72C5.86 14.21 4.97 14.84 4.18 15.57C4 15.75 3.75 15.85 3.48 15.85C3.2 15.85 2.95 15.74 2.77 15.56L0.29 13.08C0.11 12.91 0 12.66 0 12.38C0 12.1 0.11 11.85 0.29 11.67C3.34 8.78 7.46 7 12 7C16.54 7 20.66 8.78 23.71 11.67C23.89 11.85 24 12.1 24 12.38C24 12.66 23.89 12.91 23.71 13.09L21.23 15.57C21.05 15.75 20.8 15.86 20.52 15.86C20.25 15.86 20 15.75 19.82 15.58C19.03 14.84 18.13 14.22 17.15 13.73C16.82 13.57 16.59 13.23 16.59 12.83V9.73C15.15 9.25 13.6 9 12 9Z" fill="white"/>
                                </svg>
                            </button>
                            
                        </div>
                    </div>
                    <div className={`flex items-center h-full xl:w-1/3 ${isOpen ? "" : "hidden"}`}>
                        <MeetingSidebar tab="participants" isOpen={isOpen} isMobile={isMobile} toggleSidebar={setOpen} />
                    </div>
                </div>
            </div>
        );
    } else {
        return <NewMeeting />
    }
};

export default Meeting;
