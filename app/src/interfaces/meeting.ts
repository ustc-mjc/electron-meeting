export default interface Meeting {
    self: SelfStatus;
    status: MeetingStatus;
    id: string;
    participants: Participant[];
    recorded: boolean;
    messages: Message[];
    sharedFiles: ShareFile[];
}

interface SelfStatus {
    id: string;
    name: string;
    audioEnabled: boolean;
    videoEnabled: boolean;
    screenEnabled: boolean;
}
export interface ShareFile {
    name: string;
    time: string;
    fileName: string;
    magnetUri: string;
    // 文件是否在下载中
    is_progress: boolean;
    // 下载进度条
    progress: number;
    // 下载速度 Byte
    speed: number;
    // 由magnet下载后得到的files
    files: any;
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
    recorded: false,
    participants: [],
    messages: [],
    self: {
        id: '',
        name: '',
        audioEnabled: false,
        videoEnabled: false,
        screenEnabled: false
    },
    sharedFiles: []
}