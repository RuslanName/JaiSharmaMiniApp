import React from 'react';
import type {MiniAppUser} from '@/interfaces';

interface WinnerCardProps {
    winner: MiniAppUser;
}

const WinnerCard: React.FC<WinnerCardProps> = ({ winner }) => {
    return (
        <div className="relative h-[64px] w-full rounded-[32.5px] bg-[rgba(0,255,33,0.06)] border-[2px] border-[#FFFFFF1A] overflow-hidden">
            <div className="absolute right-[170px] top-[-21px] w-[79px] h-[68px] bg-[rgba(238,238,238,0.1)] rounded-full blur-[20px]" />

            <div className="relative z-10 flex items-center px-[18px] py-[8px] h-full">
                <div className="flex-1 min-w-0" style={{ maxWidth: 'calc(100% - 200px)' }}>
                    <span className="text-[14px] font-bold text-white leading-[21px] block truncate">
                        {winner.username || 'Anonymous'}
                    </span>
                </div>

                <div className="flex flex-col w-[58px] flex-shrink-0" style={{ marginLeft: 'auto', marginRight: '35px' }}>
                    <span className="text-[14px] font-normal text-[#FFFFFFB3] leading-[18px]">Level</span>
                    <span className="text-[16px] font-bold text-white uppercase leading-[24px]">
                        {winner.level || '1'}
                    </span>
                </div>

                <div className="flex flex-col items-end gap-[2px] min-w-0 flex-shrink-0 w-[64px]">
                    <span className="text-[24px] font-bold text-white uppercase leading-[36px] whitespace-nowrap">
                        {winner.best_signal?.multiplier || 'N/A'}x
                    </span>
                    <span className="text-[12px] font-medium text-[#F4C91C] uppercase leading-[18px] whitespace-nowrap">
                        +{winner.best_signal?.amount || '0'} INR
                    </span>
                </div>
            </div>
        </div>
    );
};

export default WinnerCard;