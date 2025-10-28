import {
    List,
    Datagrid,
    TextField,
    EditButton,
    DeleteButton,
    Edit,
    Create,
    SimpleForm,
    DateInput,
    type ListProps,
    type EditProps,
    type CreateProps,
    FunctionField,
    TextInput,
} from 'react-admin';
import type {Raffle} from '@/interfaces';

export const RafflesList = (props: ListProps<Raffle>) => (
    <List {...props} title="Розыгрыши" pagination={<></>} perPage={25}>
        <Datagrid rowClick="edit">
            <TextField source="id" label="ID" />
            <TextField source="content" label="Контент" />
            <FunctionField
                label="Дата отправки"
                render={(record: Raffle) => new Date(record.send_at).toLocaleString('ru-RU')}
            />
            <FunctionField
                label="Дата создания"
                render={(record: Raffle) =>
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

export const RafflesEdit = (props: EditProps<Raffle>) => (
    <Edit {...props} title="Редактирование розыгрыша">
        <SimpleForm>
            <TextInput source="content" label="Контент" multiline />
            <DateInput source="send_at" label="Дата отправки" />
        </SimpleForm>
    </Edit>
);

export const RafflesCreate = (props: CreateProps<Raffle>) => (
    <Create {...props} title="Создание розыгрыша">
        <SimpleForm>
            <TextInput source="content" label="Контент" multiline />
            <DateInput source="send_at" label="Дата отправки" />
        </SimpleForm>
    </Create>
);