import React from 'react';
import {
    List,
    Datagrid,
    TextField,
    BooleanField,
    NumberInput,
    TextInput,
    BooleanInput,
    Edit,
    SimpleForm,
    type ListProps,
    type EditProps,
    FunctionField,
    EditButton,
    DeleteButton,
    useDataProvider,
    useNotify,
    useRefresh,
    useRecordContext,
    ReferenceInput,
    SelectInput,
} from 'react-admin';
import type {User, Password} from '@/interfaces';
import { UserRole } from '@/enums';
import { required } from 'react-admin';

const userFilters = [
    <NumberInput source="id" label="ID" />,
    <TextInput source="username" label="Имя пользователя" alwaysOn />,
    <TextInput source="first_name" label="Имя" />,
    <SelectInput
        source="role"
        label="Роль"
        choices={[
            { id: 'admin', name: UserRole.admin },
            { id: 'user', name: UserRole.user },
        ]}
    />,
    <TextInput source="level" label="Уровень" />,
    <NumberInput source="energy" label="Энергия" />,
    <BooleanInput source="is_access_allowed" label="Доступ разрешён" />,
];

const ToggleAccessField = (props: any) => {
    const record = useRecordContext<User>(props);
    const dataProvider = useDataProvider();
    const notify = useNotify();
    const refresh = useRefresh();

    const handleToggleAccess = async (e: React.MouseEvent<HTMLSpanElement>) => {
        e.stopPropagation();
        if (!record) return;

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
        <BooleanField
            {...props}
            source="is_access_allowed"
            label="Доступ разрешён"
            onClick={handleToggleAccess}
        />
    );
};

export const UsersList = (props: ListProps<User>) => (
    <List {...props} title="Пользователи" filters={userFilters} pagination={<></>} perPage={25}>
        <Datagrid rowClick="edit">
            <TextField source="id" label="ID" />
            <TextField source="chat_id" label="Chat ID" />
            <TextField source="username" label="Имя пользователя" />
            <TextField source="first_name" label="Имя" />
            <TextField source="last_name" label="Фамилия" />
            <FunctionField
                label="Роль"
                render={(record: User) => UserRole[record.role as keyof typeof UserRole]}
            />
            <TextField source="level" label="Уровень" />
            <TextField source="energy" label="Энергия" />
            <ToggleAccessField label="Доступ разрешён" />
            <FunctionField
                label="Дата регистрации"
                render={(record: User) =>
                    record.registered_at
                        ? new Date(record.registered_at).toLocaleString('ru-RU')
                        : 'Не указано'
                }
            />
            <FunctionField
                label="Действия"
                render={() => (
                    <>
                        <EditButton label="Редактировать" />
                        <DeleteButton label="Удалить" />
                    </>
                )}
            />
        </Datagrid>
    </List>
);

export const UsersEdit = (props: EditProps<User>) => (
    <Edit {...props} title="Редактирование пользователя">
        <SimpleForm>
            <TextInput source="chat_id" disabled label="Chat ID" />
            <TextInput source="username" label="Имя пользователя" />
            <TextInput source="first_name" label="Имя" />
            <TextInput source="last_name" label="Фамилия" />
            <SelectInput
                source="role"
                label="Роль"
                choices={[
                    { id: 'admin', name: UserRole.admin },
                    { id: 'user', name: UserRole.user },
                ]}
                validate={required('Роль обязательна')}
            />
            <TextInput source="level" label="Уровень" />
            <NumberInput source="energy" label="Энергия" />
            <ReferenceInput source="password_id" reference="passwords" label="Пароль">
                <SelectInput
                    optionText={(record: Password) => {
                        return record ? `${record.password} (${record.id})` : '';
                    }}
                    optionValue="id"
                    emptyText="Без пароля"
                />
            </ReferenceInput>
            <BooleanInput source="is_access_allowed" label="Доступ разрешён" />
        </SimpleForm>
    </Edit>
);