import { toast } from 'react-toastify';

interface NotifyOptions {
    type: 'success' | 'error';
}

export const notify = (message: string, options: NotifyOptions) => {
    toast(message, {
        type: options.type,
        position: 'top-right',
        autoClose: 3000,
    });
};