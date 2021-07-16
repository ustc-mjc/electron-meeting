const ONLINE_USERS = "users:online";
const USERNAME = (socketId: string) => `users:${socketId}`;
const MEETING = (meetingId: string) => `meetings:${meetingId}`;

export {ONLINE_USERS, USERNAME, MEETING}