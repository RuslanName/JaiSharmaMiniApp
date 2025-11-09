import type { Password } from './password.interface';

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
    password?: Password | null;
    password_id?: number | null;
}

