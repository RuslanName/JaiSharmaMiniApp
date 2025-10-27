import React from 'react';
import { useAuthStore } from '@/store/auth';

const ProgressBar: React.FC = () => {
    const { user } = useAuthStore();
    const energy = user?.energy || 0;
    const maxEnergy = user?.maxEnergy || 0;
    const progress = (energy / maxEnergy) * 100;

    return (
        <div className="mt-[16px]">
            <div className="text-[13px] font-medium justify-between items-center flex">
                <span>{energy} EXP</span>
                <span className="!text-[#FFFFFF66]">{maxEnergy} EXP</span>
            </div>
            <div className="bg-[#1D1D1D] mt-[3px] relative w-full rounded-full h-[8px]">
                <div
                    className="absolute bg-[#F4C91C] rounded-full h-full top-0 left-0"
                    style={{ width: `${progress}%` }}
                ></div>
            </div>
        </div>
    );
};

export default ProgressBar;