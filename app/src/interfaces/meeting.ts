export default interface Meeting {
    self: SelfStatus;
    status: MeetingStatus;
    id: string;
    participants: Participant[];
    messages: Message[];
}

interface SelfStatus {
    id: string;
    name: string;
    audioEnabled: boolean;
    videoEnabled: boolean;
    screenEnabled: boolean
}

export interface Message {
    name: string;
    time: string;
    message: string;
}

export enum MeetingStatus {
    NONE='',
    REQUEST_TO_JOIN = 'request_to_join',
    IN_MEETING = 'in_meeting',
    FAILED = 'failed'
}

export interface Participant {
    name: string;
    id: string;
    stream: MediaStream|null;
    audioEnabled?: boolean;
    videoEnabled?: boolean;
    screenEnabled?: boolean;
    screenStream: MediaStream|null;

}

export const EmptyMeeting: Meeting = {
    status: MeetingStatus.NONE,
    id: '',
    participants: [],
    messages: [],
    self: {
        id: '',
        name: '',
        audioEnabled: false,
        videoEnabled: false,
        screenEnabled: false
    }
}