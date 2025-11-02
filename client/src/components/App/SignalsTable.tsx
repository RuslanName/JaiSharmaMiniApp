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
    ReferenceInput,
    SelectInput,
    type ListProps,
    type EditProps,
    type CreateProps,
    FunctionField,
    TextInput,
} from 'react-admin';
import type {Signal, User} from '@/interfaces';
import { required } from 'react-admin';
import { SignalStatus } from '@/enums';

const signalFilters = [
    <NumberInput source="id" label="ID" />,
    <TextInput source="user_id" label="Пользователь (Имя или ID)" alwaysOn />,
    <NumberInput source="multiplier" label="Мультипликатор" />,
    <NumberInput source="amount" label="Сумма" />,
    <TextInput source="status" label="Статус" />,
];

export const SignalsList = (props: ListProps<Signal>) => (
    <List {...props} title="Сигналы" filters={signalFilters} pagination={<></>} perPage={25}>
        <Datagrid rowClick="edit">
            <TextField source="id" label="ID" />
            <TextField source="multiplier" label="Мультипликатор" />
            <TextField source="amount" label="Сумма" />
            <FunctionField
                label="Статус"
                render={(record: Signal) => SignalStatus[record.status as keyof typeof SignalStatus] || 'Неизвестно'}
            />
            <FunctionField
                label="Пользователь"
                render={(record: Signal & { user?: User }) => {
                    return record.user && record.user.id
                        ? `${record.user.username || 'Без имени'} (${record.user.id})`
                        : `Не указан (ID: ${record.user_id || 'отсутствует'})`;
                }}
            />
            <FunctionField
                label="Дата создания"
                render={(record: Signal) =>
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

export const SignalsEdit = (props: EditProps<Signal>) => (
    <Edit {...props} title="Редактирование сигнала">
        <SimpleForm>
            <NumberInput source="multiplier" label="Мультипликатор" validate={required('Мультипликатор обязателен')} />
            <NumberInput source="amount" label="Сумма" validate={required('Сумма обязательна')} />
            <SelectInput
                source="status"
                label="Статус"
                choices={[
                    { id: 'active', name: SignalStatus.active },
                    { id: 'completed', name: SignalStatus.completed },
                ]}
                validate={required('Статус обязателен')}
            />
            <ReferenceInput source="user_id" reference="users" label="Пользователь">
                <SelectInput
                    optionText={(record: User) => {
                        return record ? `${record.username || 'Без имени'} (${record.id})` : '';
                    }}
                    optionValue="id"
                    validate={required('Пользователь обязателен')}
                    format={(value) => {
                        // Преобразуем user объект в user_id
                        if (typeof value === 'object' && value !== null && 'id' in value) {
                            return (value as any).id;
                        }
                        // null преобразуем в пустую строку для совместимости с MUI Select
                        return value === null || value === undefined ? '' : value;
                    }}
                    parse={(value) => {
                        // Пустую строку преобразуем в null для отправки на сервер (если нужно)
                        return value === '' ? null : value;
                    }}
                />
            </ReferenceInput>
        </SimpleForm>
    </Edit>
);

export const SignalsCreate = (props: CreateProps<Signal>) => (
    <Create {...props} title="Создание сигнала">
        <SimpleForm>
            <NumberInput source="multiplier" label="Мультипликатор" validate={required('Мультипликатор обязателен')} />
            <NumberInput source="amount" label="Сумма" validate={required('Сумма обязательна')} />
            <SelectInput
                source="status"
                label="Статус"
                choices={[
                    { id: 'active', name: SignalStatus.active },
                    { id: 'completed', name: SignalStatus.completed },
                ]}
                defaultValue="active"
                validate={required('Статус обязателен')}
            />
            <ReferenceInput source="user_id" reference="users" label="Пользователь">
                <SelectInput
                    optionText={(record: User) => {
                        return record ? `${record.username || 'Без имени'} (${record.id})` : '';
                    }}
                    optionValue="id"
                    validate={required('Пользователь обязателен')}
                    format={(value) => {
                        // Преобразуем user объект в user_id
                        if (typeof value === 'object' && value !== null && 'id' in value) {
                            return (value as any).id;
                        }
                        // null преобразуем в пустую строку для совместимости с MUI Select
                        return value === null || value === undefined ? '' : value;
                    }}
                    parse={(value) => {
                        // Пустую строку преобразуем в null для отправки на сервер (если нужно)
                        return value === '' ? null : value;
                    }}
                />
            </ReferenceInput>
        </SimpleForm>
    </Create>
);