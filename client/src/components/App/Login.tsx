import React, { useState } from 'react';
import { useLogin, useNotify } from 'react-admin';
import { TextField, Button, Box, Typography } from '@mui/material';

const LoginPage = () => {
    const [password, setPassword] = useState('');
    const login = useLogin();
    const notify = useNotify();

    const handleSubmit = () => {
        if (!password) {
            notify('Пожалуйста, введите пароль', { type: 'error' });
            return;
        }
        login({ password })
            .then(() => notify('Вход выполнен успешно', { type: 'success' }))
            .catch(() => notify('Ошибка входа', { type: 'error' }));
    };

    return (
        <Box display="flex" flexDirection="column" alignItems="center" mt={4}>
            <Typography variant="h4">Вход в админ-панель</Typography>
            <TextField
                label="Пароль"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                fullWidth
                margin="normal"
            />
            <Button variant="contained" onClick={handleSubmit}>
                Войти
            </Button>
        </Box>
    );
};

export default LoginPage;