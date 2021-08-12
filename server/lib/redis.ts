import IORedis from "ioredis";

const redis = new IORedis({
    port: 6379,
    host: "127.0.0.1",
    family: 4,
    password: "123456"
});

export default redis;