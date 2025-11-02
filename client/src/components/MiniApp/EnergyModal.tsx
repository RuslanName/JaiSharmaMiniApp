import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuthStore } from '@/store/auth';
import CancelButton from '../../assets/cancel-button-icon.svg';
import ArrowIcon from '../../assets/arrow-icon.svg';

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
            }
        };

        if (token) {
            fetchManagerLink();
        }
    }, [token]);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center px-[35px]"
            style={{
                background: 'rgba(15, 15, 15, 0.3)',
                backdropFilter: 'blur(15px)',
            }}
        >
            <div
                className="w-[360px] rounded-[22px] bg-[rgba(45,45,45,0.15)] border-[2px] border-[rgba(255,255,255,0.1)] py-[16px] px-[20px]"
                style={{ backdropFilter: 'blur(70px)' }}
            >
                <div className="flex flex-col gap-[26px]">
                    <div className="flex flex-col gap-[24px]">
                        <div className="flex flex-col gap-[16px]">
                            <div className="flex items-center justify-between">
                                <h2 className="text-[24px] font-semibold text-white">Add Energy</h2>
                                <button
                                    className="w-[31px] h-[32px] flex items-center justify-center"
                                    onClick={onClose}
                                >
                                    <img src={CancelButton} alt="Close" className="w-full h-full" />
                                </button>
                            </div>
                            <p className="text-[16px] font-light text-[rgba(255,255,255,0.8)] leading-[1.5em]">
                                To replenish your energy, please contact your manager
                            </p>
                        </div>
                        <a
                            href={managerLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="relative rounded-[12px] p-[1.5px]"
                            style={{
                                background: 'linear-gradient(93deg, #18A1F4, #54DDFF)',
                            }}
                        >
                            <div
                                className="rounded-[12px]"
                                style={{
                                    background: 'linear-gradient(-43deg, rgba(255, 255, 255, 0.3) 15%, rgba(255, 255, 255, 0) 85%)',
                                    padding: '1.5px',
                                }}
                            >
                                <div className="px-[32px] py-[10px] rounded-[12px] bg-gradient-to-r from-[#18A1F4] to-[#54DDFF] text-[18px] font-semibold text-white text-center flex items-center justify-center gap-[4px]">
                                    <span>contact manager</span>
                                    <img src={ArrowIcon} alt="" className="w-6 h-6" />
                                </div>
                            </div>
                        </a>
                    </div>

                    <div className="w-[320px] h-[2px] bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.6)] to-transparent"></div>

                    <div className="w-full flex justify-center">
                        <button
                            className="h-[51px] w-[152px] rounded-[22px] bg-gradient-to-r from-[#007910] to-[#00FF21] text-[16px] font-bold text-white flex items-center justify-center gap-[4px]"
                            onClick={onClose}
                        >
                            <span>Close</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EnergyModal;