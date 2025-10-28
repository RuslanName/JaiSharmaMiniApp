import {
    List,
    Datagrid,
    TextField,
    EditButton,
    Edit,
    SimpleForm,
    TextInput,
    type ListProps,
    type EditProps,
    FunctionField,
    SaveButton,
    Toolbar
} from 'react-admin';
import type {Setting} from '@/interfaces';
import { SettingNameTranslations } from '@/providers/settingsProvider';
import { SettingKey } from '@/enums';

const SettingEditToolbar = () => (
    <Toolbar>
        <SaveButton label="Сохранить" />
    </Toolbar>
);

export const SettingsList = (props: ListProps<Setting>) => (
    <List {...props} title="Настройки" pagination={<></>} perPage={25}>
        <Datagrid rowClick="edit" bulkActionButtons={false}>
            <FunctionField
                label={SettingNameTranslations.key}
                render={(record: Setting) => SettingKey[record.key as keyof typeof SettingKey] || record.key}
            />
            <TextField source="value" label={SettingNameTranslations.value} />
            <EditButton label="Редактировать" />
        </Datagrid>
    </List>
);

export const SettingsEdit = (props: EditProps<Setting>) => (
    <Edit {...props} title="Редактирование настройки">
        <SimpleForm toolbar={<SettingEditToolbar />}>
            <TextInput source="key" disabled label={SettingNameTranslations.key} />
            <TextInput source="value" label={SettingNameTranslations.value} />
        </SimpleForm>
    </Edit>
);