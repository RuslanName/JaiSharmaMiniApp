import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuthStore } from '@/store/auth';
import { notify } from '@/utils/notify';

interface SignalModalProps {
    onClose: () => void;
}

const SignalModal: React.FC<SignalModalProps> = ({ onClose }) => {
    const [password, setPassword] = useState('');
    const [managerLink, setManagerLink] = useState('');
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
                notify('Failed to fetch manager link', { type: 'error' });
            }
        };

        if (token) {
            fetchManagerLink();
        }
    }, [token]);

    const handleSubmit = async () => {
        try {
            const response = await api.post(
                '/signals/verify-password',
                { password },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.data.success) {
                notify('Password verified!', { type: 'success' });
                const userResponse = await api.get('/user/me', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setUser(userResponse.data);
                onClose();
            }
        } catch (error) {
            notify('Invalid or already used password', { type: 'error' });
        }
    };

    return (
        <div className="fixed inset-0 z-10 backdrop-blur-lg flex items-center justify-center px-[35px]">
            <div className="w-full rounded-[22px] bg-[#2D2D2D26] border-[2px] border-[#FFFFFF1A] py-[16px] px-[20px]">
                <div className="flex items-center justify-between">
                    <h2 className="text-[24px] font-semibold">Enter Password</h2>
                    <button className="w-[25px] rounded-full h-[25px] bg-[#FFFFFF]" onClick={onClose}></button>
                </div>
                <p className="mt-[16px] text-[16px] text-[#FFFFFFCC] font-thin">
                    To receive signal, enter the password provided by your manager
                </p>
                <a
                    href={managerLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-[14.5px] bg-gradient-to-r from-[#18A1F4] to-[#54DDFF] w-full rounded-[12px] mt-[24px] text-[18px] font-semibold text-center block"
                >
                    Contact Manager
                </a>
                <input
                    className="py-[17px] px-[26px] bg-[#0000008C] border-[2px] border-[#FFFFFF1A] w-full rounded-full focus:outline-none mt-[32px]"
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                />
                <div className="w-full gap-[15px] flex mt-[18px]">
                    <button
                        className="flex-1 p-[16px] rounded-[22px] text-[16px] font-bold border-1 border-[#FFFFFF]"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button
                        className="flex-1 p-[16px] rounded-[22px] text-[16px] font-bold bg-gradient-to-r from-[#46AA6E] to-[#33E870]"
                        onClick={handleSubmit}
                    >
                        Submit
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SignalModal;