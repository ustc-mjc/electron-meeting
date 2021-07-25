import {Socket} from "socket.io-client";
import {Dispatch} from "react";
import {signals} from "../constants/signals";

export const attachListeners = (
    listeners: { name: signals; callback: (dispatch: Dispatch<any>, ...data: any[]) => void; }[],
    socket: Socket,
    { dispatch }: { dispatch: Dispatch<any> }
    ) => {
    listeners.forEach(listener => {
        socket.on(listener.name, (...data: any[]) => {
            listener.callback(dispatch, ...data);
        });
    });
};
