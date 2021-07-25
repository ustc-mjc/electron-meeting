import React, {useEffect} from "react";
import {RootState} from "../app/store";
import {useDispatch, useSelector} from "react-redux";
import {ToastStatus} from "../interfaces/toast";
import { hide } from "../slices/toast";

const toastSelector = (state: RootState) => state.toast;

const Toast = () => {
    const toast = useSelector(toastSelector);
    const dispatch = useDispatch();

    useEffect(() => {
        if (toast.status === ToastStatus.SHOW) {
            setTimeout(() => {
                dispatch(hide());
            },1500)
        }
    }, [toast.status]);

    return (
        <div className={`w-full h-14 flex flex-row justify-center items-center fixed mt-1 py-4 px-8 ${toast.status === ToastStatus.SHOW ? 'z-30' : ''}`}>
            <div className={`rounded bg-green-200 px-6 py-4 ${toast.status === ToastStatus.SHOW ? '': 'invisible'}`}>{toast.message}</div>
        </div>
    );
};

export default Toast;
