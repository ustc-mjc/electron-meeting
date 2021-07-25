export enum ToastStatus {
    HIDDEN,
    SHOW
}

export interface ToastState {
    message: string;
    status: ToastStatus
}

export const ToastStateEmpty: ToastState = {
    message: '',
    status: ToastStatus.HIDDEN
}

