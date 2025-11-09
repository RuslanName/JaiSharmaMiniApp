import React from 'react';
import { useAuthStore } from '@/store/auth';
import Energy from '../../assets/energy-icon.svg';
import AddButton from '../../assets/add-button-icon.svg';
import ProfileIcon from '../../assets/profile-icon.svg';

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
                <div 
                    className="w-[36px] h-[36px] rounded-full flex items-center justify-center p-[0.5px]"
                    style={{
                        background: 'linear-gradient(-43deg, rgba(255, 255, 255, 0.3) 15%, rgba(255, 255, 255, 0) 85%)',
                    }}
                >
                    <div 
                        className="w-full h-full rounded-full flex items-center justify-center"
                        style={{
                            background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.3) 0%, rgba(78, 73, 73, 1) 100%)',
                            backdropFilter: 'blur(24px)',
                        }}
                    >
                        <img src={ProfileIcon} alt="" className="w-6 h-6" />
                    </div>
                </div>
                <div className="flex flex-col justify-between">
                    <span className="text-[#FFFFFF73] text-[13px] font-thin">Player nickname</span>
                    <span className="text-white font-semibold text-[14px]">{password}</span>
                </div>
            </div>
            <button
                onClick={onAddEnergy}
                className="rounded-full px-[9px] flex items-center justify-center gap-[8px] py-[5px] border-1 border-[#FFFFFF0D] bg-[#8989890D] cursor-pointer"
            >
                <img src={Energy} alt="energy" />
                <div className="text-[14px] font-semibold">
                    <span className="font-bold">{energy}</span>/{maxEnergy}
                </div>
                <div className="w-[19px] h-[19px] flex items-center justify-center">
                    <img src={AddButton} alt="Add" className="w-full h-full" />
                </div>
            </button>
        </div>
    );
};

export default PlayerInfo;