import React from 'react';
import { Button, useDataProvider, useNotify, useRefresh } from 'react-admin';
import { User } from '@/interfaces';

interface ToggleAccessButtonProps {
    record?: User;
}

export const ToggleAccessButton = ({ record }: ToggleAccessButtonProps) => {
    const dataProvider = useDataProvider();
    const notify = useNotify();
    const refresh = useRefresh();

    if (!record) return null;

    const handleToggleAccess = async () => {
        try {
            await dataProvider.toggleAccess('user', {
                id: record.id,
                data: { is_access_allowed: !record.is_access_allowed },
            });
            notify('Доступ успешно изменён', { type: 'success' });
            refresh();
        } catch (error: any) {
            notify(`Ошибка при изменении доступа: ${error.message}`, { type: 'error' });
        }
    };

    return (
        <Button
            label={record.is_access_allowed ? 'Запретить доступ' : 'Разрешить доступ'}
            onClick={handleToggleAccess}
        />
    );
};