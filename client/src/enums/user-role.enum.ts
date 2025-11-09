export const UserRole = {
    admin: 'Администратор',
    user: 'Пользователь',
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];

