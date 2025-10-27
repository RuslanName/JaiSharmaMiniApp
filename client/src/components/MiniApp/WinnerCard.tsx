import React from 'react';
import type {MiniAppUser} from '@/interfaces';

interface WinnerCardProps {
    winner: MiniAppUser;
}

const WinnerCard: React.FC<WinnerCardProps> = ({ winner }) => {
    return (
        <div className="py-[9px] bg-[#74FF8D0F] rounded-full border-[2px] border-[#FFFFFF1A] px-[19px] flex items-center justify-between">
            <span className="font-bold text-[14px]">{winner.username || 'Anonymous'}</span>
            <div className="flex flex-col">
                <span className="text-[14px] !text-[#FFFFFFB2]">Level</span>
                <span className="text-[16px] font-bold capitalize">{winner.level || 1}</span>
            </div>
            <div className="flex flex-col items-center">
                <span className="text-[24px] font-bold">{winner.best_signal.multiplier || 'N/A'}x</span>
                <span className="text-[12px] !text-[#F4C91C]">+{winner.best_signal.amount  || '0'} INR</span>
            </div>
        </div>
    );
};

export default WinnerCard;