import {
    List,
    Datagrid,
    EditButton,
    Edit,
    SimpleForm,
    TextInput,
    type ListProps,
    type EditProps,
    FunctionField,
    SaveButton,
    Toolbar,
    useRecordContext
} from 'react-admin';
import type {Setting} from '@/interfaces';
import { SettingNameTranslations } from '@/providers/settingsProvider';
import { SettingKey } from '@/enums';
import { SignalRequestRangesInput } from './SignalRequestRangesInput';
import { TopWinnersDistributionInput } from './TopWinnersDistributionInput';

const SettingEditToolbar = () => (
    <Toolbar>
        <SaveButton label="Сохранить" />
    </Toolbar>
);

const formatValue = (record: Setting): string => {
    if (record.key === 'signal_request_ranges') {
        try {
            const parsed = typeof record.value === 'string' 
                ? JSON.parse(record.value) 
                : record.value;
            if (Array.isArray(parsed)) {
                return parsed.map((r: {start: string; end: string}) => `${r.start}-${r.end}`).join(', ') || 'Нет диапазонов';
            }
        } catch (e) {}
    }
    if (record.key === 'top_winners_distribution') {
        try {
            const parsed = typeof record.value === 'string' 
                ? JSON.parse(record.value) 
                : record.value;
            if (parsed && typeof parsed === 'object') {
                const parts = [];
                if (parsed.BANGLADESH) parts.push(`Бангладеш: ${parsed.BANGLADESH}%`);
                if (parsed.PAKISTAN) parts.push(`Пакистан: ${parsed.PAKISTAN}%`);
                if (parsed.SRI_LANKA) parts.push(`Шри-Ланка: ${parsed.SRI_LANKA}%`);
                if (parsed.INDIA) parts.push(`Индия: ${parsed.INDIA}%`);
                return parts.join(', ') || 'Не настроено';
            }
        } catch (e) {}
    }
    return String(record.value || '');
};

export const SettingsList = (props: ListProps<Setting>) => (
    <List {...props} title="Настройки" pagination={<></>} perPage={25}>
        <Datagrid rowClick="edit" bulkActionButtons={false}>
            <FunctionField
                label={SettingNameTranslations.key}
                render={(record: Setting) => SettingKey[record.key as keyof typeof SettingKey] || record.key}
            />
            <FunctionField
                label={SettingNameTranslations.value}
                render={(record: Setting) => formatValue(record)}
            />
            <EditButton label="Редактировать" />
        </Datagrid>
    </List>
);

const SettingsEditForm = () => {
    const record = useRecordContext<Setting>();
    const isSignalRequestRanges = record?.key === 'signal_request_ranges';
    const isTopWinnersDistribution = record?.key === 'top_winners_distribution';

    return (
        <SimpleForm toolbar={<SettingEditToolbar />}>
            <TextInput source="key" disabled label={SettingNameTranslations.key} />
            {isSignalRequestRanges ? (
                <SignalRequestRangesInput 
                    source="value" 
                    label={SettingNameTranslations.value}
                />
            ) : isTopWinnersDistribution ? (
                <TopWinnersDistributionInput 
                    source="value" 
                    label={SettingNameTranslations.value}
                />
            ) : (
                <TextInput source="value" label={SettingNameTranslations.value} />
            )}
        </SimpleForm>
    );
};

export const SettingsEdit = (props: EditProps<Setting>) => (
    <Edit {...props} title="Редактирование настройки">
        <SettingsEditForm />
    </Edit>
);