import React, {ChangeEvent, useState} from "react";
import {RootState} from "../app/store";
import {useDispatch, useSelector} from "react-redux";
import {signals} from "../constants/signals";
import { sendMessage } from "../slices/meeting";

const getParticipants = (state: RootState) => state.meeting.participants;
const getMeetingId = (state: RootState) => state.meeting.id;
const getMeetingSelf = (state: RootState) => state.meeting.self;
const getMessages = (state: RootState) => state.meeting.messages;

const MeetingSidebar = ({isMobile, isOpen, toggleSidebar, tab='participants'}: {isMobile: boolean, isOpen: boolean, toggleSidebar: (arg: boolean) => void, tab?: string}) => {
    const [activeTab, setActiveTab] = useState(tab);
    const [message, setMessage] = useState('');

    const meetingId = useSelector(getMeetingId);
    const participants = useSelector(getParticipants);
    const self = useSelector(getMeetingSelf)
    const messages = useSelector(getMessages);

    const dispatch = useDispatch();

    const onMessageChange = (event: ChangeEvent<HTMLInputElement>) => {
        setMessage(event.currentTarget.value);
    }

    const send = () => {
        if (message) {
            const message_name = self.name;
            let current_datetime = new Date();
            const message_time = current_datetime.getFullYear() + "-" + 
                                    (current_datetime.getMonth() + 1) + "-" +   
                                    current_datetime.getDate() + " " + 
                                    current_datetime.getHours() + ":" + 
                                    current_datetime.getMinutes() + ":" + 
                                    current_datetime.getSeconds();

            dispatch(
                sendMessage({
                    event_name: signals.SEND_MESSAGE,
                    meeting_id: meetingId,
                    name: message_name,
                    time: message_time,
                    message: message
                })
            );
            setMessage('');
        }
    }

    return (
        <nav className={`bg-white ${ isMobile ? "fixed right-0 top-2": ""}  flex flex-col h-full w-full bg-grey-lightest shadow-md ${ isMobile ? isOpen ? "" : "transform translate-x-full" : ""} `}>
            { isMobile && <button className="p-2 ml-auto" onClick={() => toggleSidebar(!isOpen)}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="black"/>
                                </svg>
                            </button> }
            
            <div className="flex bg-gray-200 font-mono">
                <button className={`flex-1 p-4 ${activeTab === 'participants' ? 'border-b-2 border-green-600 text-green-600': ''} focus:outline-none`} onClick={() => setActiveTab('participants')}>Participants {participants.length}</button>
                <button className={`flex-1 p-4 ${activeTab === 'chat' ? 'border-b-2 border-green-600 text-green-600': ''} focus:outline-none`} onClick={() => setActiveTab('chat')}>Chat</button>
            </div>
            {
                activeTab === 'participants' && participants.length ? (
                    <div className="flex-1 w-full overflow-y-scroll p-2">
                        {
                            participants.map( (participant, index) => {
                                const audioSvg = participant.audioEnabled ? <svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><g><rect fill="none" height="24" width="24"/><rect fill="none" height="24" width="24"/><rect fill="none" height="24" width="24"/></g><g><g/><g><path d="M12,14c1.66,0,3-1.34,3-3V5c0-1.66-1.34-3-3-3S9,3.34,9,5v6C9,12.66,10.34,14,12,14z"/><path d="M17,11c0,2.76-2.24,5-5,5s-5-2.24-5-5H5c0,3.53,2.61,6.43,6,6.92V21h2v-3.08c3.39-0.49,6-3.39,6-6.92H17z"/></g></g></svg> : <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M19 11H17.3C17.3 11.74 17.14 12.43 16.87 13.05L18.1 14.28C18.66 13.3 19 12.19 19 11V11ZM14.98 11.17C14.98 11.11 15 11.06 15 11V5C15 3.34 13.66 2 12 2C10.34 2 9 3.34 9 5V5.18L14.98 11.17ZM4.27 3L3 4.27L9.01 10.28V11C9.01 12.66 10.34 14 12 14C12.22 14 12.44 13.97 12.65 13.92L14.31 15.58C13.6 15.91 12.81 16.1 12 16.1C9.24 16.1 6.7 14 6.7 11H5C5 14.41 7.72 17.23 11 17.72V21H13V17.72C13.91 17.59 14.77 17.27 15.54 16.82L19.73 21L21 19.73L4.27 3Z" fill="black"/>
                                </svg>
                                const videoSvg = participant.videoEnabled ? <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M15 8v8H5V8h10m1-2H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4V7c0-.55-.45-1-1-1z"/></svg> : <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M21 6.5L17 10.5V7C17 6.45 16.55 6 16 6H9.82L21 17.18V6.5ZM3.27 2L2 3.27L4.73 6H4C3.45 6 3 6.45 3 7V17C3 17.55 3.45 18 4 18H16C16.21 18 16.39 17.92 16.54 17.82L19.73 21L21 19.73L3.27 2Z" fill="black"/>
                                </svg>
                                
                                const screenSvg = participant.screenEnabled ? <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M20 18c1.1 0 1.99-.9 1.99-2L22 6c0-1.11-.9-2-2-2H4c-1.11 0-2 .89-2 2v10c0 1.1.89 2 2 2H0v2h24v-2h-4zM4 16V6h16v10.01L4 16zm9-6.87c-3.89.54-5.44 3.2-6 5.87 1.39-1.87 3.22-2.72 6-2.72v2.19l4-3.74L13 7v2.13z"/></svg> : <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><path d="M0 0h24v24H0z" fill="none"/><path d="M21.79 18l2 2H24v-2h-2.21zM1.11 2.98l1.55 1.56c-.41.37-.66.89-.66 1.48V16c0 1.1.9 2 2.01 2H0v2h18.13l2.71 2.71 1.41-1.41L2.52 1.57 1.11 2.98zM4 6.02h.13l4.95 4.93C7.94 12.07 7.31 13.52 7 15c.96-1.29 2.13-2.08 3.67-2.46l3.46 3.48H4v-10zm16 0v10.19l1.3 1.3c.42-.37.7-.89.7-1.49v-10c0-1.11-.9-2-2-2H7.8l2 2H20zm-7.07 3.13l2.79 2.78 1.28-1.2L13 7v2.13l-.07.02z"/></svg>
                                
                                
                                return (<div className="flex p-2 border-b-2 font-mono text-green-500" key={index} id={participant.id}>
                                    <svg xmlns="http://www.w3.org/2000/svg" height="30px" viewBox="0 0 24 24" width="30px" fill="#000000"><path d="M0 0h24v24H0z" fill="none"/><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                                    <div className="ml-3 mt-1 w-20" >
                                        {participant.name}
                                    </div>
                                    <div className="ml-1 mt-1">
                                        {audioSvg}
                                    </div>
                                    <div className="ml-1 mt-1">
                                        {videoSvg}
                                    </div>
                                    <div className="ml-2 mt-1">
                                        {screenSvg}
                                    </div>
                                    {self.id === participant.id ? <div className="ml-20 text-xl"> Me </div> : ''}
                                    </div>)
                            })
                        }
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto font-mono">
                        {
                            messages.length ? messages.map(
                                (message, index) => (
                                    <div className="p-2 border-b-2" key={index}>
                                        <div className="flex">
                                            <svg xmlns="http://www.w3.org/2000/svg" height="30px" viewBox="0 0 24 24" width="30px" fill="#000000"><path d="M0 0h24v24H0z" fill="none"/><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                                            <div className="text-green-600 ml-2 text-xl"> {message.name} </div>
                                            <div className="text-sm ml-8 mt-1">{message.time}</div>
                                        </div>
                                        <div className="ml-2 mt-2 bg-green-100  ">
                                            {message.message}
                                        </div>
                                    </div>
                                )
                            ) : (
                                <div className="text-center py-4">
                                    <p>No messages Yet!</p>
                                </div>
                            )
                        }
                    </div>
                )
            }
            {
                activeTab === 'chat' && (
                    <div className="flex flex-row bg-white p-4">
                        <input type="text" placeholder="Enter your message here" className="flex-1 flex-shrink focus:outline-none border-2 border-green-500"
                               value={message}
                               onChange={onMessageChange}
                               onKeyDown={(event) => {
                                   if (event.key.toLowerCase() === 'enter') {
                                       send();
                                   }
                               }}
                        />
                        <button onClick={send}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M2.01 21L23 12L2.01 3L2 10L17 12L2 14L2.01 21Z" fill="#059669"/>
                            </svg>
                        </button>
                    </div>
                )
            }
        </nav>
    )
}

export default MeetingSidebar;
