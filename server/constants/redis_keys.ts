const MEETING_USERS = "meeting_users";
const ONLINE_USERS = "users:online";
const USERNAME = (socketId: string) => `users:${socketId}`;
const MEETING = (meetingId: string) => `meetings:${meetingId}`;

export {MEETING_USERS, ONLINE_USERS, USERNAME, MEETING}