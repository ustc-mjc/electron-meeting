import { configureStore, getDefaultMiddleware } from '@reduxjs/toolkit';
import meetingReducer from '../slices/meeting';
import toastReducer from '../slices/toast';
import { io } from "socket.io-client";
import { Device } from "mediasoup-client";
import { emitEventMiddleWare, listeners } from "../middlewares/socket";
import { attachListeners } from "../utils/helpers";
import { mediasoup } from '../middlewares/mediasoup';

const reducer = {
  meeting: meetingReducer,
  toast: toastReducer
}

// "https://hellomjc.top:8888"
const device = new Device();
const address = process.env.SOCKET_ADDRESS || "http://127.0.0.1:8888";
console.log(process.env.SOCKET_ADDRESS);

const socket = io(address);

export const store = configureStore({
  reducer: reducer,
  middleware: [emitEventMiddleWare(socket), mediasoup(socket, device), ...getDefaultMiddleware({
    serializableCheck: false
  })]
});

// Adds event listeners to socket
attachListeners(listeners, socket, store)

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;

