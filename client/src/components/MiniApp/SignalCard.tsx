import React from 'react';
import { format, toZonedTime } from 'date-fns-tz';
import type {Signal} from '@/interfaces';

interface SignalCardProps {
    signal: Signal;
    timezone: string;
}

const SignalCard: React.FC<SignalCardProps> = ({ signal, timezone }) => {
    const date = toZonedTime(new Date(signal.created_at), timezone);
    const formattedDate = format(date, 'dd.MM.yyyy HH:mm', { timeZone: timezone });

    return (
        <div className="w-[154px] bg-[#74FF8D0F] relative overflow-hidden flex flex-col items-center rounded-[18px] border-[2px] border-[#FFFFFF1A] px-[12px] py-[9px]">
            <div className="absolute left-1/2 top-[80px] w-full blur-[30px] h-[97px] z-5 bg-[#C2C2C233] -translate-x-1/2"></div>
            <div className="flex items-center text-[16px] justify-center">
                <span className="font-semibold">{formattedDate}</span>
            </div>
            <div className="w-full h-[1px] rounded-full bg-[#FFFFFF99] mt-[4px]"></div>
            <span className="font-semibold text-[18px] text-center mt-[4px] !text-[#F4C91C]">
                {signal.multiplier}x
            </span>
            <button className="p-[4px] w-full rounded-[5px] bg-[#74FF8D0F] border-[2px] border-[#FFFFFF0D] capitalize">
                {signal.status}
            </button>
        </div>
    );
};

export default SignalCard;