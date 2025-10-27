interface TelegramWebApp {
    initData: string;
    initDataUnsafe: any;
    ready: () => void;
}

interface Window {
    Telegram: {
        WebApp: TelegramWebApp;
    };
}