import {createSlice, PayloadAction} from "@reduxjs/toolkit";
import {ToastState, ToastStateEmpty, ToastStatus} from "../interfaces/toast";

const toastSlice = createSlice({
    name: 'toast',
    initialState: ToastStateEmpty,
    reducers: {
        show: (state: ToastState, action: PayloadAction<string>) => {
            state.message = action.payload;
            state.status = ToastStatus.SHOW;
        },

        hide: (state: ToastState) => {
            state.message = '';
            state.status = ToastStatus.HIDDEN;
        }
    }
});

export const {
    show,
    hide
} = toastSlice.actions;

export default toastSlice.reducer;
