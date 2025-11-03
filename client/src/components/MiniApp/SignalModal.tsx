import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuthStore } from '@/store/auth';
import CancelButton from '../../assets/cancel-button-icon.svg';
import ArrowIcon from '../../assets/arrow-icon.svg';

interface SignalModalProps {
    onClose: () => void;
}

const SignalModal: React.FC<SignalModalProps> = ({ onClose }) => {
    const [password, setPassword] = useState('');
    const [managerLink, setManagerLink] = useState('');
    const [isError, setIsError] = useState(false);
    const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);
    const { token, setUser } = useAuthStore();

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

    const handleSubmit = async () => {
        try {
            const response = await api.post(
                '/passwords/verify',
                { password },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.data.success) {
                const userResponse = await api.get('/users/me', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setUser(userResponse.data);
                setIsError(false);
                setAttemptsLeft(null);
                onClose();
            }
        } catch (error: any) {
            setIsError(true);
            console.error('Error fetching user link:', error);
            const attempts = error?.response?.data?.attempts_left;
            if (attempts !== undefined) {
                setAttemptsLeft(attempts);
            }
        }
    };

    return (
        <div 
            className="fixed inset-0 z-10 flex items-center justify-center px-[35px]"
            style={{
                background: 'rgba(15, 15, 15, 0.5)',
                WebkitBackdropFilter: 'blur(15px)',
                backdropFilter: 'blur(15px)',
                transform: 'translateZ(0)',
                WebkitTransform: 'translateZ(0)',
            }}
        >
            <div 
                className={`w-[360px] rounded-[22px] border-[2px] py-[16px] px-[20px] ${
                    isError 
                        ? 'bg-[rgba(89,26,26,0.4)] border-[rgba(255,69,69,0.1)]' 
                        : 'bg-[rgba(45,45,45,0.4)] border-[rgba(255,255,255,0.1)]'
                }`}
                style={{
                    WebkitBackdropFilter: 'blur(70px)',
                    backdropFilter: 'blur(70px)',
                    transform: 'translateZ(0)',
                    WebkitTransform: 'translateZ(0)',
                }}
            >
                <div className="flex flex-col gap-[32px]">
                    <div className="flex flex-col gap-[24px]">
                        <div className="flex flex-col gap-[16px]">
                            <div className="flex items-center justify-between">
                                <h2 className={`text-[24px] font-semibold ${isError ? 'text-[#FF4545]' : 'text-white'}`}>
                                    {isError ? 'Wrong password' : 'No signal'}
                                </h2>
                                <button 
                                    className="w-[31px] h-[32px] flex items-center justify-center"
                                    onClick={onClose}
                                >
                                    <img src={CancelButton} alt="Close" className="w-full h-full" />
                                </button>
                            </div>
                            <p className={`text-[16px] font-light leading-[1.5em] ${isError ? 'text-[#FF8282]' : 'text-[rgba(255,255,255,0.8)]'}`}>
                                {isError 
                                    ? 'The password is incorrect, please try again'
                                    : 'To receive the signal, you need to contact your manager and get the code'
                                }
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
                    
                    {/* Divider line */}
                    <div className="w-[320px] h-[2px] bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.6)] to-transparent"></div>
                    
                    <div className="flex flex-col gap-[18px]">
                        <div className="flex flex-col gap-[12px]">
                            <div className="w-[320px] h-[51px] rounded-[22px] bg-[rgba(0,0,0,0.55)] border border-[rgba(255,255,255,0.05)] flex items-center px-[24px]">
                                <input
                                    className="w-full bg-transparent text-[14px] font-normal text-[rgba(255,255,255,0.45)] focus:outline-none placeholder:text-[rgba(255,255,255,0.45)]"
                                    type="text"
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        setIsError(false);
                                    }}
                                    placeholder="Enter the code "
                                />
                            </div>
                            {isError && attemptsLeft !== null && (
                                <p className="text-[16px] font-light text-[#FF8282] leading-[1.5em]">
                                    You have {attemptsLeft} out of 3 attempts left to enter the code
                                </p>
                            )}
                        </div>
                        <div className="w-full flex gap-[15px]">
                            <button
                                className="h-[51px] rounded-[22px] text-[16px] font-bold text-white"
                                style={{ 
                                    width: '153px',
                                    border: '0.5px solid rgba(255, 255, 255, 0.6)'
                                }}
                                onClick={onClose}
                            >
                                Cancel
                            </button>
                            <button
                                className="h-[51px] rounded-[22px] bg-gradient-to-r from-[#007910] to-[#00FF21] text-[16px] font-bold text-white flex items-center justify-center gap-[4px]"
                                style={{ width: '152px' }}
                                onClick={handleSubmit}
                            >
                                <span>Submit</span>
                                <img src={ArrowIcon} alt="" className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SignalModal;