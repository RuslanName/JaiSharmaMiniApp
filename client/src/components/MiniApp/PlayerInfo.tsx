import React from 'react';
import { useAuthStore } from '@/store/auth';
import Energy from '../../assets/energy.svg';

interface PlayerInfoProps {
    onAddEnergy: () => void;
}

const PlayerInfo: React.FC<PlayerInfoProps> = ({ onAddEnergy }) => {
    const { user } = useAuthStore();
    const password = user?.password?.password || 'N/A';
    const energy = user?.energy || 0;
    const maxEnergy = user?.maxEnergy || 5;

    return (
        <div className="flex justify-between items-start">
            <div className="flex gap-[8px] items-center">
                <div className="w-[36px] h-[36px] bg-[red] rounded-full" />
                <div className="flex flex-col justify-between">
                    <span className="text-[#FFFFFF73] text-[13px] font-thin">Player nickname</span>
                    <span className="text-white font-semibold text-[14px]">{password}</span>
                </div>
            </div>
            <div className="rounded-full px-[9px] flex items-center justify-center gap-[8px] py-[5px] border-1 border-[#FFFFFF0D] bg-[#8989890D]">
                <img src={Energy} alt="energy" />
                <div className="text-[14px] font-semibold">
                    <span className="font-thin">{energy}</span>/{maxEnergy}
                </div>
                <button
                    onClick={onAddEnergy}
                    className="w-[19px] h-[19px] flex items-center justify-center rounded-full bg-[#FFFFFF14] border-1 border-[#FFFFFF1F]"
                >
                    +
                </button>
            </div>
        </div>
    );
};

export default PlayerInfo;