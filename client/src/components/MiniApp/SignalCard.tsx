import React from 'react';
import { format, toZonedTime } from 'date-fns-tz';
import type {Signal} from '@/interfaces';
import ProtectedIcon from '../../assets/protected-icon.svg';

interface SignalCardProps {
    signal: Signal;
    timezone: string;
}

const SignalCard: React.FC<SignalCardProps> = ({ signal, timezone }) => {
    const date = toZonedTime(new Date(signal.created_at), timezone);
    const formattedDate = format(date, 'dd.MM.yyyy', { timeZone: timezone });
    const formattedTime = format(date, 'HH:mm', { timeZone: timezone });

    return (
        <div className="w-[154px] h-[118px] relative flex-shrink-0">
            <div className="absolute inset-0 bg-[rgba(0,255,33,0.06)] rounded-[18px] border-[2px] border-[#FFFFFF1A] shadow-[0px_5px_10px_0px_rgba(0,0,0,0.1)] overflow-hidden">
                <div className="absolute left-[20px] bottom-[-30px] w-[114px] h-[98px] bg-[rgba(194,194,194,0.2)] blur-[45px]" />
            </div>

            <div className="relative z-10 flex flex-col items-center justify-between px-[12px] pt-[12px] pb-[16px] h-full">
                <div className="flex flex-col items-center gap-[4px] w-full">
                    <div className="flex flex-col gap-[4px] w-full items-center">
                        <div className="flex items-center gap-[12px]">
                            <span className="text-[16px] font-semibold text-white uppercase">{formattedDate}</span>
                            <span className="text-[16px] font-normal text-[#FFFFFFB3]">{formattedTime}</span>
                        </div>
                        <div className="w-full h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />
                    </div>

                    <div className="text-[18px] font-semibold text-[#F4C91C] uppercase">{signal.multiplier.toFixed(2)}X</div>
                </div>

                <div className="w-full rounded-[8px] bg-[rgba(0,255,33,0.06)] border border-[#FFFFFF0D] px-[16px] py-[8px] flex items-center justify-center gap-[7px] mb-[12px]">
                    <span className="text-[13px] font-medium text-white uppercase">{signal.status}</span>
                    <img src={ProtectedIcon} alt="" className="w-5 h-5" />
                </div>
            </div>
        </div>
    );
};

export default SignalCard;