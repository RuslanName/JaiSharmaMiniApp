export const SignalStatus = {
    active: 'Активный',
    completed: 'Завершённый',
} as const;

export type SignalStatus = typeof SignalStatus[keyof typeof SignalStatus];

export const SettingKey = {
    manager_link: 'Ссылка для связи с менеджером',
    max_energy: 'Максимальная энергия для пользователей',
    min_analysis_coefficient: 'Минимальный коэффициент для анализа',
    max_analysis_coefficient: 'Максимальный коэффициент для анализа',
    min_issuing_coefficient: 'Минимальный коэффициент для выдачи',
    max_issuing_coefficient: 'Максимальный коэффициент для выдачи',
    analysis_percentage: 'Необходимый процент при анализе',
    analysis_rounds: 'Количество раундов для анализа',
    signal_receive_time: 'Время получения сигнала после успешного анализа (в сек)',
    signal_confirm_timeout: 'Время на подтверждение сигнала (в сек)',
    pending_signal_max_age: 'Максимальное время ожидания сделки (в сек)',
    signal_request_recovery_time: 'Период восстановления для выдачи нового запроса (в мин)',
    max_users_get_signal_request: 'Максимальное количество пользователей для выдачи запросов',
    signal_request_ranges: 'Диапазоны времени для выдачи запросов на сигнал'
} as const;

export type SettingKey = typeof SettingKey[keyof typeof SettingKey];

export const UserRole = {
    admin: 'Администратор',
    user: 'Пользователь',
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];