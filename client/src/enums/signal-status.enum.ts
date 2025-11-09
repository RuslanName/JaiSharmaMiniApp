export const SignalStatus = {
    active: 'Активный',
    completed: 'Завершённый',
} as const;

export type SignalStatus = typeof SignalStatus[keyof typeof SignalStatus];

