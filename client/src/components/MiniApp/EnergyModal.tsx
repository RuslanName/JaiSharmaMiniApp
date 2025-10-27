import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuthStore } from '@/store/auth';
import { notify } from '@/utils/notify';

interface EnergyModalProps {
    onClose: () => void;
}

const EnergyModal: React.FC<EnergyModalProps> = ({ onClose }) => {
    const [managerLink, setManagerLink] = useState('');
    const { token } = useAuthStore();

    useEffect(() => {
        const fetchManagerLink = async () => {
            try {
                const response = await api.get('/settings/key/manager_link', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setManagerLink(response.data.value);
            } catch (error) {
                console.error('Error fetching manager link:', error);
                notify('Failed to fetch manager link', { type: 'error' });
            }
        };

        if (token) {
            fetchManagerLink();
        }
    }, [token]);

    return (
        <div className="fixed inset-0 z-10 backdrop-blur-lg flex items-center justify-center px-[35px]">
            <div className="w-full rounded-[22px] bg-[#2D2D2D26] border-[2px] border-[#FFFFFF1A] py-[16px] px-[20px]">
                <div className="flex items-center justify-between">
                    <h2 className="text-[24px] font-semibold">Add Energy</h2>
                    <button className="w-[25px] rounded-full h-[25px] bg-[#FFFFFF]" onClick={onClose}></button>
                </div>
                <p className="mt-[16px] text-[16px] text-[#FFFFFFCC] font-thin">
                    Contact your manager to receive more energy.
                </p>
                <a
                    href={managerLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-[14.5px] bg-gradient-to-r from-[#18A1F4] to-[#54DDFF] w-full rounded-[12px] mt-[24px] text-[18px] font-semibold text-center block"
                >
                    Contact Manager
                </a>
                <div className="w-full gap-[15px] flex mt-[18px]">
                    <button
                        className="flex-1 p-[16px] rounded-[22px] text-[16px] font-bold border-1 border-[#FFFFFF]"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button
                        className="flex-1 p-[16px] rounded-[22px] text-[16px] font-bold bg-gradient-to-r from-[#46AA6E] to-[#33E870]"
                        onClick={onClose}
                    >
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EnergyModal;