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
    const generateWavyCircle = (cx: number, cy: number, radius: number, waveCount: number, waveAmplitude: number) => {
        const points: Array<[number, number]> = [];
        const segments = waveCount * 16;
        const angleStep = (2 * Math.PI) / segments;

        for (let i = 0; i <= segments; i++) {
            const angle = (i * angleStep);
            const waveOffset = Math.sin(angle * waveCount) * waveAmplitude;
            const r = radius + waveOffset;
            const x = cx + r * Math.cos(angle);
            const y = cy + r * Math.sin(angle);
            points.push([x, y]);
        }

        let path = `M ${points[0][0]},${points[0][1]}`;
        for (let i = 1; i < points.length - 1; i++) {
            const curr = points[i];
            const next = points[i + 1];

            const cp1X = curr[0] + (next[0] - curr[0]) * 0.3;
            const cp1Y = curr[1] + (next[1] - curr[1]) * 0.3;
            const cp2X = curr[0] + (next[0] - curr[0]) * 0.7;
            const cp2Y = curr[1] + (next[1] - curr[1]) * 0.7;

            path += ` C ${cp1X},${cp1Y} ${cp2X},${cp2Y} ${next[0]},${next[1]}`;
        }
        path += ' Z';
        return path;
    };

    let content;
    if (signalState === 'ready' && signal) {
        content = (
            <>
                <span className="text-[32px] font-normal text-white">{signal.multiplier.toFixed(2)}X</span>
                <div className="flex flex-col gap-[2px] text-[13px] text-center">
                    <span className="font-light">Ai Protocol:</span>
                    <span className="font-semibold text-white">ACTIVE</span>
                </div>
            </>
        );
    } else if (signalState === 'waiting') {
        content = (
            <>
                <span className="text-[24px] text-white">Waiting...</span>
                <div className="flex flex-col gap-[2px] text-[13px] text-center">
                    <span className="font-light">Ai Protocol:</span>
                    <span className="font-semibold text-white">PENDING</span>
                </div>
            </>
        );
    } else {
        content = (
            <>
                <span className="text-[24px] text-white">No Signal</span>
                <div className="flex flex-col gap-[2px] text-[13px] text-center">
                    <span className="font-light">Ai Protocol:</span>
                    <span className="font-semibold text-white">IDLE</span>
                </div>
            </>
        );
    }

    return (
        <div className="relative w-[283px] h-[295px] mx-auto flex-none">
            <style>{`
                @keyframes rotate1 {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                @keyframes rotate2 {
                    0% { transform: rotate(360deg); }
                    100% { transform: rotate(0deg); }
                }
                @keyframes rotate3 {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(-360deg); }
                }
                .wave-ring-1 {
                    animation: rotate1 12s linear infinite;
                    transform-origin: 141.5px 147.5px;
                }
                .wave-ring-2 {
                    animation: rotate2 15s linear infinite;
                    transform-origin: 141.5px 147.5px;
                }
                .wave-ring-3 {
                    animation: rotate3 18s linear infinite;
                    transform-origin: 141.5px 147.5px;
                }
            `}</style>

            <div className="absolute inset-[28px] rounded-full border-[23px] border-[#00FF21]/36 blur-[29.5px]" style={{ zIndex: 1 }} />

            <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                viewBox="0 0 283 295"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ zIndex: 3 }}
            >
                <g className="wave-ring-1">
                    <path
                        d={generateWavyCircle(141.5, 147.5, 105, 6, 5)}
                        stroke="white"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                        opacity="0.8"
                        transform="rotate(0 141.5 147.5)"
                    >
                        <animateTransform
                            attributeName="transform"
                            type="rotate"
                            from="0 141.5 147.5"
                            to="360 141.5 147.5"
                            dur="12s"
                            repeatCount="indefinite"
                        />
                    </path>
                </g>
                <g className="wave-ring-2">
                    <path
                        d={generateWavyCircle(141.5, 147.5, 115, 8, 7)}
                        stroke="white"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                        opacity="0.7"
                        transform="rotate(0 141.5 147.5)"
                    >
                        <animateTransform
                            attributeName="transform"
                            type="rotate"
                            from="360 141.5 147.5"
                            to="0 141.5 147.5"
                            dur="15s"
                            repeatCount="indefinite"
                        />
                    </path>
                </g>
                <g className="wave-ring-3">
                    <path
                        d={generateWavyCircle(141.5, 147.5, 125, 10, 8)}
                        stroke="white"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                        opacity="0.6"
                        transform="rotate(0 141.5 147.5)"
                    >
                        <animateTransform
                            attributeName="transform"
                            type="rotate"
                            from="0 141.5 147.5"
                            to="-360 141.5 147.5"
                            dur="18s"
                            repeatCount="indefinite"
                        />
                    </path>
                </g>
            </svg>

            <div className="absolute inset-[35px] rounded-full border-[16px] border-[#00FF21] flex items-center justify-center" style={{ boxShadow: '0 0 40px rgba(0, 255, 33, 0.6), 0 0 20px rgba(0, 255, 33, 0.4)', zIndex: 2 }}>
                <button
                    type="button"
                    onClick={async (e) => {
                        if (signalState === 'waiting') {
                            e.preventDefault();
                            return;
                        }
                        if (!disabled) {
                            await onClick();
                        }
                    }}
                    className={`
                        w-full h-full rounded-full flex flex-col items-center justify-center gap-[12px]
                        bg-transparent
                        focus:outline-none active:outline-none active:transform-none active:scale-100
                        ${disabled || signalState === 'waiting'
                        ? 'opacity-70'
                        : 'cursor-default'
                    }
                    `}
                    disabled={disabled || signalState === 'waiting'}
                >
                    {content}
                </button>
            </div>
        </div>
    );
};

export default SignalCircle;