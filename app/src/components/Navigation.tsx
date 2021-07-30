import React from "react";
import {RootState} from "../app/store";
import {useDispatch, useSelector} from "react-redux";
import { show } from "../slices/toast";
import Timer from "react-compound-timer/build";

const getMeetingId = (state: RootState) => state.meeting.id;
const getMeetingRecorded = (state: RootState) => state.meeting.recorded;


const Navigation = ({isOpen, toggleSidebar} : {isOpen: boolean, toggleSidebar: (arg: boolean) => void}) => {
    const meetingId = useSelector(getMeetingId);
    const meetingRecorded = useSelector(getMeetingRecorded);
    const dispatch = useDispatch();
    const copyToClipboard = async () => {
        await navigator.clipboard.writeText(meetingId);
        dispatch(show('meeting id copied to clipboard.'))
    };
    return (
        <nav className="flex items-center justify-between w-full flex-wrap p-3 bg-green-600">
            <div className="flex items-center flex-shrink-0 text-white">
                {/* <img src={logo} alt="" width='40' height='40' /> */}
                <svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="40px" viewBox="0 0 24 24" width="40px" fill="#000000"><rect fill="none" height="40" width="24"/><g><path d="M12,12.75c1.63,0,3.07,0.39,4.24,0.9c1.08,0.48,1.76,1.56,1.76,2.73L18,17c0,0.55-0.45,1-1,1H7c-0.55,0-1-0.45-1-1l0-0.61 c0-1.18,0.68-2.26,1.76-2.73C8.93,13.14,10.37,12.75,12,12.75z M4,13c1.1,0,2-0.9,2-2c0-1.1-0.9-2-2-2s-2,0.9-2,2 C2,12.1,2.9,13,4,13z M5.13,14.1C4.76,14.04,4.39,14,4,14c-0.99,0-1.93,0.21-2.78,0.58C0.48,14.9,0,15.62,0,16.43L0,17 c0,0.55,0.45,1,1,1l3.5,0v-1.61C4.5,15.56,4.73,14.78,5.13,14.1z M20,13c1.1,0,2-0.9,2-2c0-1.1-0.9-2-2-2s-2,0.9-2,2 C18,12.1,18.9,13,20,13z M24,16.43c0-0.81-0.48-1.53-1.22-1.85C21.93,14.21,20.99,14,20,14c-0.39,0-0.76,0.04-1.13,0.1 c0.4,0.68,0.63,1.46,0.63,2.29V18l3.5,0c0.55,0,1-0.45,1-1L24,16.43z M12,6c1.66,0,3,1.34,3,3c0,1.66-1.34,3-3,3s-3-1.34-3-3 C9,7.34,10.34,6,12,6z"/></g></svg>
                <span className="font-semibold text-xl tracking-tight ml-4 font-mono">Meeting</span>
            </div>
            <div className="flex items-center text-xl">
                <span>Meeting ID: {meetingId}</span>
                <span className="block bg-gray-300 hover:bg-gray-100 ml-4">
                    <button onClick={copyToClipboard} className="focus:outline-none ml-2 border-solid transform">
                        <svg className="inline-block" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
                        <span className="ml-1">COPY ID</span>
                    </button>
                </span>
            </div>
            <div className="flex items-center">
                <div className="flex text-xl items-center w-60">
                    {meetingRecorded ? (<div className="text-yellow-200 text-xl mr-4">正在录制</div>) : ''}
                    <svg className="mr-2" xmlns="http://www.w3.org/2000/svg" height="30px" viewBox="0 0 24 24" width="30px" fill="#000000"><path d="M0 0h24v24H0z" fill="none"/><path d="M15 1H9v2h6V1zm-4 13h2V8h-2v6zm8.03-6.61l1.42-1.42c-.43-.51-.9-.99-1.41-1.41l-1.42 1.42C16.07 4.74 14.12 4 12 4c-4.97 0-9 4.03-9 9s4.02 9 9 9 9-4.03 9-9c0-2.12-.74-4.07-1.97-5.61zM12 20c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/></svg>
                    <Timer formatValue={(value) => `${(value < 10 ? `0${value}:` : `${value}:`)} `}>
                        <Timer.Hours/>
                        <Timer.Minutes/>
                        <Timer.Seconds formatValue={(value) => `${(value < 10 ? `0${value}` : `${value}`)} `} />
                    </Timer>
                    
                </div>
                <div className="block">
                    <button onClick ={() => {toggleSidebar(!isOpen)}} className="flex items-center px-3 py-2 border rounded text-teal-200 border-teal-400 hover:text-white hover:border-white hover:translate-x-0 border-solid transform">
                    <svg className="fill-current h-4 w-4" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><title>Menu</title><path d="M0 3h20v2H0V3zm0 6h20v2H0V9zm0 6h20v2H0v-2z"/></svg>
                    </button>
                </div>
            </div>
        </nav>
    )
}

export default Navigation;
