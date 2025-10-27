export interface User {
    id: number;
    chat_id: string;
    username: string;
    first_name: string;
    last_name: string;
    role: string;
    is_access_allowed: boolean;
    level: string;
    energy: number;
    registered_at: string;
}

export interface Password {
    id: number;
    password: string;
    website_url: string;
    user_id?: number;
    created_at: string;
}

export interface Signal {
    id: number;
    multiplier: number;
    amount: number;
    status: string;
    user_id?: number;
    created_at: string;
}

export interface Raffle {
    id: number;
    content: string;
    send_at: string;
    created_at: string;
}

export interface Setting {
    id: string;
    key: string;
    value: any;
}

export interface MiniAppUser {
    id: number;
    chat_id: string;
    username: string;
    password?: MiniAppPassword;
    energy: number;
    maxEnergy: number;
    level: string;
    best_signal: MiniAppSignal;
}

export interface MiniAppPassword {
    id: number;
    password: string;
}

export interface MiniAppSignal {
    id: number;
    multiplier: string;
    amount: string;
}

export interface JwtPayload {
    sub: number;
    role: string;
}