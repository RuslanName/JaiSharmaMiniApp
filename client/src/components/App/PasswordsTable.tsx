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
    useDataProvider,
    useNotify,
    useRefresh,
} from 'react-admin';
import { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Typography,
    Button as MuiButton,
    Box,
    Slider,
} from '@mui/material';
import type {Password, User} from '@/interfaces';
import { required } from 'react-admin';

const passwordFilters = [
    <NumberInput source="id" label="ID" />,
    <TextInput source="user_id" label="Пользователь (Имя или ID)" alwaysOn />,
    <TextInput source="password" label="Пароль" />,
    <TextInput source="website_url" label="URL сайта" />,
];

const GeneratePasswordsButton = () => {
    const [open, setOpen] = useState(false);
    const [count, setCount] = useState(1);
    const dataProvider = useDataProvider();
    const notify = useNotify();
    const refresh = useRefresh();

    const handleGenerate = async () => {
        try {
            await dataProvider.generateMany('passwords', {
                data: { count },
            });
            notify(`Успешно сгенерировано ${count} паролей`, { type: 'success' });
            setOpen(false);
            setCount(1);
            refresh();
        } catch (error) {
            notify('Ошибка при генерации паролей', { type: 'error' });
        }
    };

    return (
        <>
            <MuiButton
                variant="contained"
                onClick={() => setOpen(true)}
                sx={{ whiteSpace: 'nowrap' }}
            >
                Сгенерировать пароли
            </MuiButton>
            <Dialog open={open} onClose={() => setOpen(false)}>
                <DialogTitle>Генерация паролей</DialogTitle>
                <DialogContent sx={{ overflow: 'hidden' }}>
                    <Box sx={{ paddingTop: 2, minWidth: 400, maxWidth: 450 }}>
                        <Typography variant="body2" sx={{ marginBottom: 3 }}>
                            Пароли будут состоять из заглавных латинских букв и цифр (8 символов)
                        </Typography>
                        
                        <Box sx={{ mb: 2, px: 1 }}>
                            <Typography gutterBottom>
                                Количество паролей: {count}
                            </Typography>
                            <Slider
                                value={count}
                                onChange={(_, value) => setCount(value as number)}
                                min={1}
                                max={100}
                                step={1}
                                marks={[
                                    { value: 1, label: '1' },
                                    { value: 25, label: '25' },
                                    { value: 50, label: '50' },
                                    { value: 75, label: '75' },
                                    { value: 100, label: '100' },
                                ]}
                                valueLabelDisplay="auto"
                            />
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <MuiButton onClick={() => setOpen(false)}>Отмена</MuiButton>
                    <MuiButton
                        onClick={handleGenerate}
                        variant="contained"
                    >
                        Сгенерировать
                    </MuiButton>
                </DialogActions>
            </Dialog>
        </>
    );
};

const PasswordsListActions = () => (
    <Box sx={{ display: 'flex', alignItems: 'center', padding: '1em' }}>
        <GeneratePasswordsButton />
    </Box>
);

export const PasswordsList = (props: ListProps<Password>) => (
    <List {...props} title="Пароли" filters={passwordFilters} pagination={<></>} perPage={25} actions={<PasswordsListActions />}>
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