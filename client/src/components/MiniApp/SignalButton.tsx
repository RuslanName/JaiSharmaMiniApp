import React, { useState, useEffect } from 'react';
import ArrowIcon from '../../assets/arrow-icon.svg';
import WaitingSignalIcon from '../../assets/waiting-signal-icon.svg';
import MakeBetIcon from '../../assets/make-bet-button-icon.svg';

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
    const [currentTime, setCurrentTime] = useState(Date.now());

    useEffect(() => {
        if (state === 'waiting' || state === 'ready') {
            const interval = setInterval(() => {
                setCurrentTime(Date.now());
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [state]);

    const buttonStyles = {
        idle: 'bg-gradient-to-r from-[#007910] to-[#00FF21]',
        waiting: 'bg-gradient-to-r from-[#FF9F0A] to-[#F5BD28]',
        ready: 'bg-[#00CC42]',
    };

    const getButtonText = () => {
        if (state === 'idle') return 'GET SIGNAL';

        if (state === 'waiting' && requestTime) {
            const elapsed = Math.floor((currentTime - requestTime) / 1000);
            return `WAIT FOR SIGNAL - ${elapsed}s`;
        }

        if (state === 'ready' && activatedAt && confirmTimeout) {
            const elapsed = currentTime - activatedAt;
            const remaining = Math.max(0, Math.floor((confirmTimeout - elapsed) / 1000));
            return `MAKE BET IN GAME - ${remaining}s`;
        }

        return 'MAKE BET IN GAME';
    };

    return (
        <div className="relative w-full mt-[8px]">
            {state === 'idle' ? (
                <div
                    className="rounded-[12px] p-[1.5px]"
                    style={{
                        background: 'linear-gradient(127deg, #007910, #00FF21)',
                    }}
                >
                    <div
                        className="rounded-[12px]"
                        style={{
                            background: 'linear-gradient(-43deg, rgba(255, 255, 255, 0.3) 15%, rgba(255, 255, 255, 0) 85%)',
                            padding: '1.5px',
                        }}
                    >
                        <button
                            onClick={async (e) => {
                                if (!disabled) {
                                    await onClick();
                                } else {
                                    e.preventDefault();
                                }
                            }}
                    className={`
                        relative px-[32px] py-[14px] rounded-[12px] text-[18px] font-semibold w-full
                        text-white bg-gradient-to-r from-[#007910] to-[#00FF21]
                        focus:outline-none active:outline-none active:transform-none active:scale-100
                        ${disabled
                        ? 'opacity-70'
                        : 'cursor-default'
                    }
                    `}
                            disabled={disabled}
                            type="button"
                        >
                            <div className="flex items-center justify-center gap-[4px]">
                                <span>{getButtonText()}</span>
                                <img src={ArrowIcon} alt="" className="w-6 h-6" />
                            </div>
                        </button>
                    </div>
                </div>
            ) : (
                <button
                    onClick={(e) => {
                        if (!disabled && state !== 'waiting') {
                            onClick();
                        } else {
                            e.preventDefault();
                        }
                    }}
                    className={`
                        relative px-[32px] py-[14px] rounded-[12px] text-[18px] font-semibold w-full
                        text-white
                        focus:outline-none active:outline-none active:transform-none active:scale-100
                        ${buttonStyles[state]}
                        ${disabled || state === 'waiting'
                        ? 'opacity-70'
                        : 'cursor-default'
                    }
                    `}
                    type="button"
                >
                    <div className="flex items-center justify-center gap-[4px]">
                        <span>{getButtonText()}</span>
                        {state === 'waiting' ? (
                            <img src={WaitingSignalIcon} alt="" className="w-6 h-6" />
                        ) : state === 'ready' ? (
                            <img src={MakeBetIcon} alt="" className="w-5 h-5" />
                        ) : null}
                    </div>
                </button>
            )}
        </div>
    );
};

export default SignalButton;