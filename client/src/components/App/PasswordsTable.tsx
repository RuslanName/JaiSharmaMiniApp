import {
    List,
    Datagrid,
    TextField,
    EditButton,
    DeleteButton,
    Edit,
    Create,
    SimpleForm,
    NumberInput,
    TextInput,
    ReferenceInput,
    SelectInput,
    type ListProps,
    type EditProps,
    type CreateProps,
    FunctionField,
} from 'react-admin';
import type {Password, User} from '@/interfaces';
import { required } from 'react-admin';

const passwordFilters = [
    <NumberInput source="id" label="ID" />,
    <TextInput source="user_id" label="Пользователь (Имя или ID)" alwaysOn />,
    <TextInput source="password" label="Пароль" />,
    <TextInput source="website_url" label="URL сайта" />,
];

export const PasswordsList = (props: ListProps<Password>) => (
    <List {...props} title="Пароли" filters={passwordFilters} pagination={<></>} perPage={25}>
        <Datagrid rowClick="edit">
            <TextField source="id" label="ID" />
            <TextField source="password" label="Пароль" />
            <TextField source="website_url" label="URL сайта" />
            <FunctionField
                label="Пользователь"
                render={(record: Password & { user?: User }) => {
                    return record.user && record.user.id
                        ? `${record.user.username || 'Без имени'} (${record.user.id})`
                        : `Не указан (ID: ${record.user_id || 'отсутствует'})`;
                }}
            />
            <FunctionField
                label="Дата создания"
                render={(record: Password) =>
                    record.created_at
                        ? new Date(record.created_at).toLocaleString('ru-RU')
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

export const PasswordsEdit = (props: EditProps<Password>) => (
    <Edit {...props} title="Редактирование пароля">
        <SimpleForm>
            <TextInput source="password" label="Пароль" validate={required('Пароль обязателен')} />
            <TextInput source="website_url" label="URL сайта" validate={required('URL сайта обязателен')} />
            <ReferenceInput source="user_id" reference="users" label="Пользователь">
                <SelectInput
                    optionText={(record: User) => {
                        return record ? `${record.username || 'Без имени'} (${record.id})` : '';
                    }}
                    optionValue="id"
                    emptyText="Без пользователя"
                    format={(value) => {
                        // Преобразуем user объект в user_id
                        if (typeof value === 'object' && value !== null && 'id' in value) {
                            return (value as any).id;
                        }
                        // null преобразуем в пустую строку для совместимости с MUI Select
                        return value === null || value === undefined ? '' : value;
                    }}
                    parse={(value) => {
                        // Пустую строку преобразуем в null для отправки на сервер
                        return value === '' ? null : value;
                    }}
                />
            </ReferenceInput>
        </SimpleForm>
    </Edit>
);

export const PasswordsCreate = (props: CreateProps<Password>) => (
    <Create {...props} title="Создание пароля">
        <SimpleForm>
            <TextInput source="password" label="Пароль" validate={required('Пароль обязателен')} />
            <TextInput source="website_url" label="URL сайта" validate={required('URL сайта обязателен')} />
            <ReferenceInput source="user_id" reference="users" label="Пользователь">
                <SelectInput
                    optionText={(record: User) => {
                        return record ? `${record.username || 'Без имени'} (${record.id})` : '';
                    }}
                    optionValue="id"
                    emptyText="Без пользователя"
                    format={(value) => {
                        // Преобразуем user объект в user_id
                        if (typeof value === 'object' && value !== null && 'id' in value) {
                            return (value as any).id;
                        }
                        // null преобразуем в пустую строку для совместимости с MUI Select
                        return value === null || value === undefined ? '' : value;
                    }}
                    parse={(value) => {
                        // Пустую строку преобразуем в null для отправки на сервер
                        return value === '' ? null : value;
                    }}
                />
            </ReferenceInput>
        </SimpleForm>
    </Create>
);