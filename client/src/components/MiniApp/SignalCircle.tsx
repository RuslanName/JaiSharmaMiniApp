import React from 'react';

interface SignalCircleProps {
    onClick: () => Promise<void>;
    signalState: 'idle' | 'waiting' | 'ready';
    signal?: any;
    disabled?: boolean;
}

const SignalCircle: React.FC<SignalCircleProps> = ({
                                                       onClick,
                                                       signalState,
                                                       signal,
                                                       disabled,
                                                   }) => {
    let content;
    if (signalState === 'ready' && signal) {
        content = (
            <>
                <span className="text-[32px]">{signal.multiplier.toFixed(2)}X</span>
                <div className="flex flex-col gap-[2px] text-[13px]">
                    <span className="font-thin">Ai Protocol</span>
                    <span>Current signal</span>
                </div>
            </>
        );
    } else if (signalState === 'waiting') {
        content = (
            <>
                <span className="text-[24px]">Waiting...</span>
                <div className="flex flex-col gap-[2px] text-[13px]">
                    <span className="font-thin">Ai Protocol</span>
                    <span>Signal pending</span>
                </div>
            </>
        );
    } else {
        content = (
            <>
                <span className="text-[24px]">No Signal</span>
                <div className="flex flex-col gap-[2px] text-[13px]">
                    <span className="font-thin">Ai Protocol</span>
                    <span>Click to request</span>
                </div>
            </>
        );
    }

    return (
        <div className="w-[255px] mt-auto aspect-square rounded-full border-[2px] border-[#83FF6433] mx-auto p-[28px]">
            <button
                onClick={onClick}
                className={`bg-[#29C76E99] border-[8px] text-center flex-col border-[#29C76E] rounded-full w-full h-full flex items-center justify-center
          ${disabled || signalState === 'waiting' ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                disabled={disabled || signalState === 'waiting'}
            >
                {content}
            </button>
        </div>
    );
};

export default SignalCircle;