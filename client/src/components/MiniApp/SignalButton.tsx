import React from 'react';

interface GetSignalButtonProps {
    onClick: () => void;
    state: 'idle' | 'waiting' | 'ready';
    disabled?: boolean;
    requestTime?: number | null;
    activatedAt?: number | null;
    confirmTimeout?: number | null;
}

const SignalButton: React.FC<GetSignalButtonProps> = ({
                                                          onClick,
                                                          state,
                                                          disabled,
                                                          requestTime,
                                                          activatedAt,
                                                          confirmTimeout = 30000,
                                                      }) => {
    const buttonStyles = {
        idle: 'bg-gradient-to-r from-[#46AA6E] to-[#33E870]',
        waiting: 'bg-gradient-to-r from-[#FF9F0A] to-[#F5BD28]',
        ready: 'bg-[#00CC42]',
    };

    const getButtonText = () => {
        if (state === 'idle') return 'GET SIGNAL';

        if (state === 'waiting' && requestTime) {
            const elapsed = Math.floor((Date.now() - requestTime) / 1000);
            return `WAIT FOR SIGNAL - ${elapsed}s`;
        }

        if (state === 'ready' && activatedAt && confirmTimeout) {
            const elapsed = Date.now() - activatedAt;
            const remaining = Math.max(0, Math.floor((confirmTimeout - elapsed) / 1000));
            return `MAKE BET IN GAME - ${remaining}s`;
        }

        return 'MAKE BET IN GAME';
    };

    return (
        <button
            onClick={onClick}
            className={`p-[16px] rounded-[22px] text-[18px] font-bold w-full mt-[16px] ${buttonStyles[state]} ${
                disabled || state === 'waiting' ? 'cursor-not-allowed' : 'cursor-pointer'
            }`}
            disabled={disabled || state === 'waiting'}
        >
            {getButtonText()}
        </button>
    );
};

export default SignalButton;