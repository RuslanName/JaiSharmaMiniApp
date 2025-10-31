import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useAuthStore } from '@/store/auth';
import type { Signal } from '@/interfaces';
import SignalCard from './SignalCard';

interface SignalsProps {
    timezone: string;
}

const LastSignals: React.FC<SignalsProps> = ({ timezone }) => {
    const { token } = useAuthStore();
    const [signals, setSignals] = useState<Signal[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!token) return;

        const fetchSignals = async () => {
            try {
                const response = await api.get('/signals?page=1&limit=10', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setSignals(response.data.data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching signals:', error);
                setLoading(false);
            }
        };

        fetchSignals();
        const interval = setInterval(fetchSignals, 5000);
        return () => clearInterval(interval);
    }, [token]);

    return (
        <div className="mt-[20px]">
            <div className="flex items-center gap-[16px]">
                <div className="flex items-center gap-[4px]">
                    <div className="bg-[#33E870] rounded-full w-[6px] h-[6px]"></div>
                    <div className="bg-[#46AA6E] rounded-full w-[6px] h-[6px]"></div>
                </div>
                <h2 className="text-[24px] font-semibold">Last Signals</h2>
            </div>
            {loading ? (
                <div>Loading...</div>
            ) : (
                <div className="overflow-x-auto flex flex-row gap-[12px] mt-[16px] hide-scrollbar h-[150px]">
                    {signals.map((signal) => (
                        <div key={signal.id} className="flex-shrink-0 w-[154px]">
                            <SignalCard signal={signal} timezone={timezone} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default LastSignals;