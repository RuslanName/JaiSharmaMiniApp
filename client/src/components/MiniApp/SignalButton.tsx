import React from 'react';

interface GetSignalButtonProps {
    onClick: () => void;
    state: 'idle' | 'waiting' | 'ready';
    disabled?: boolean;
    requestTime?: number | null;
    readySince?: number | null;
}

const SignalButton: React.FC<GetSignalButtonProps> = ({ onClick, state, disabled, requestTime, readySince }) => {
    const buttonStyles = {
        idle: 'bg-gradient-to-r from-[#46AA6E] to-[#33E870]',
        waiting: 'bg-gradient-to-r from-[#FF9F0A] to-[#F5BD28]',
        ready: 'bg-[#00CC42]',
    };

    const getButtonText = () => {
        if (state === 'idle') {
            return 'GET SIGNAL';
        } else if (state === 'waiting' && requestTime) {
            const elapsedSeconds = Math.floor((Date.now() - requestTime) / 1000);
            return `WAIT FOR SIGNAL - ${elapsedSeconds}s`;
        } else if (state === 'ready' && readySince) {
            const maxReadyTime = 30000;
            const remainingSeconds = Math.max(0, Math.floor((maxReadyTime - (Date.now() - readySince)) / 1000));
            return `MAKE BET IN GAME - ${remainingSeconds}s`;
        }
        return state === 'waiting' ? 'WAIT FOR SIGNAL' : 'MAKE BET IN GAME';
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