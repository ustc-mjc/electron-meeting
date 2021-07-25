import Video from "./Video";
import React from "react";
import {Participant} from "../interfaces/meeting";

const ParticipantVideo = ({ participant, size, forceMute=false, showMuteStatus=true, stream }: { participant: Participant, size: string, forceMute?: boolean, showMuteStatus?: boolean, stream?: MediaStream|null|undefined }) => {
    const videoDiv = participant.videoEnabled ? (
        <div>
           <Video className="absolute h-full w-full position-center object-cover" muted={forceMute || !participant.audioEnabled} autoPlay={true} playsInline={true}
                    srcObject={participant.stream!!}/> 
        </div>
    ) : (
        <div className="absolute w-full h-full bg-black"></div>
    )

    const screenDiv = participant.screenEnabled ? (
        <div>
           <Video className="absolute h-full w-full position-center object-cover" muted={forceMute || !participant.audioEnabled} autoPlay={true} playsInline={true}
                    srcObject={participant.screenStream!!}/> 
        </div>
    ) : (
        ''
    )

    const showMuteDiv = 
                <div className="absolute w-full h-full">
                {
                    showMuteStatus &&
                    (<span className="absolute left-0 bottom-0 m-2">
                            {participant.audioEnabled ? (
                                <svg xmlns="http://www.w3.org/2000/svg" enableBackground="new 0 0 24 24"
                                    height="24px" viewBox="0 0 24 24" width="24px" fill="#FFFFFF">
                                    <g>
                                        <rect fill="none" height="24" width="24"/>
                                        <rect fill="none" height="24" width="24"/>
                                        <rect fill="none" height="24" width="24"/>
                                    </g>
                                    <g>
                                        <g>
                                            <path
                                                d="M12,14c1.66,0,3-1.34,3-3V5c0-1.66-1.34-3-3-3S9,3.34,9,5v6C9,12.66,10.34,14,12,14z"/>
                                            <path
                                                d="M17,11c0,2.76-2.24,5-5,5s-5-2.24-5-5H5c0,3.53,2.61,6.43,6,6.92V21h2v-3.08c3.39-0.49,6-3.39,6-6.92H17z"/>
                                        </g>
                                    </g>
                                </svg>
                            ) : (
                                <div className="bg-red-600 rounded-full w-full h-full p-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" height="18px"
                                        viewBox="0 0 24 24"
                                        width="18px" fill="#FFFFFF">
                                        <path d="M0 0h24v24H0V0z" fill="none"/>
                                        <path
                                            d="M10.8 4.9c0-.66.54-1.2 1.2-1.2s1.2.54 1.2 1.2l-.01 3.91L15 10.6V5c0-1.66-1.34-3-3-3-1.54 0-2.79 1.16-2.96 2.65l1.76 1.76V4.9zM19 11h-1.7c0 .58-.1 1.13-.27 1.64l1.27 1.27c.44-.88.7-1.87.7-2.91zM4.41 2.86L3 4.27l6 6V11c0 1.66 1.34 3 3 3 .23 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.55-.9l4.2 4.2 1.41-1.41L4.41 2.86z"/>
                                    </svg>
                                </div>
                                )
                            }
                    </span>)
                }
                <p className="absolute right-0 bottom-0 text-white m-2">{participant.name}</p>
            </div>
    if (!participant.videoEnabled && participant.screenEnabled) {
        return (
            <div className={`relative ${size}`}>
                {screenDiv}
                {showMuteDiv}
            </div>
        )
    } else return (
            <div className={`relative ${size}`}>
                {videoDiv}
                {showMuteDiv}
            </div>
        )
}

export default ParticipantVideo;
