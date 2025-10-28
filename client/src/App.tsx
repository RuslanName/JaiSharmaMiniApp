import { Admin, Resource } from 'react-admin';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import authProvider from './providers/authProvider';
import dataProvider from './providers/dataProvider';
import LoginPage from './components/App/Login';
import { UsersList, UsersEdit } from './components/App/UsersTable';
import { PasswordsList, PasswordsEdit, PasswordsCreate } from './components/App/PasswordsTable';
import { SignalsList, SignalsEdit, SignalsCreate } from './components/App/SignalsTable';
import { RafflesList, RafflesEdit, RafflesCreate } from './components/App/RafflesTable';
import { SettingsList, SettingsEdit } from './components/App/SettingsTable';
import { i18nProvider } from './i18n/i18n';

const queryClient = new QueryClient();

const App = () => (
    <QueryClientProvider client={queryClient}>
        <Admin
            authProvider={authProvider}
            dataProvider={dataProvider}
            i18nProvider={i18nProvider}
            loginPage={LoginPage}
            basename="/admin"
        >
            <Resource name="users" list={UsersList} edit={UsersEdit} />
            <Resource name="passwords" list={PasswordsList} edit={PasswordsEdit} create={PasswordsCreate} />
            <Resource name="signals" list={SignalsList} edit={SignalsEdit} create={SignalsCreate} />
            <Resource name="raffles" list={RafflesList} edit={RafflesEdit} create={RafflesCreate} />
            <Resource name="settings" list={SettingsList} edit={SettingsEdit} />
        </Admin>
    </QueryClientProvider>
);

export default App;