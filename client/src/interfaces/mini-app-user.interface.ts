import type { MiniAppPassword } from './mini-app-password.interface';
import type { MiniAppSignal } from './mini-app-signal.interface';

export interface MiniAppUser {
    id: number;
    chat_id: string;
    username: string;
    password?: MiniAppPassword;
    energy: number;
    maxEnergy: number;
    level: string;
    is_access_allowed: boolean;
    best_signal: MiniAppSignal;
}

