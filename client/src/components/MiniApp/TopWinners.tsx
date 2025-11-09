import React, { useEffect, useState, useRef } from 'react';
import api from '../../api/axios';
import { useAuthStore } from '@/store/auth';
import type {TopWinnerSignal} from '@/interfaces';
import WinnerCard from './WinnerCard';
import CrownIcon from '../../assets/crown-icon.svg';

const TopWinners: React.FC = () => {
    const { token } = useAuthStore();
    const [winners, setWinners] = useState<TopWinnerSignal[]>([]);
    const [loading, setLoading] = useState(true);
    const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const hasInitializedPolling = useRef(false);

    const fetchTopWinnerSignals = async () => {
        if (!token) return;
        try {
            const response = await api.get('/top-winner-signals?page=1&limit=10', {
                headers: { Authorization: `Bearer ${token}` },
            });
            setWinners(response.data.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching top winner signals:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!token) {
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
                pollIntervalRef.current = null;
            }
            hasInitializedPolling.current = false;
            return;
        }

        if (hasInitializedPolling.current) return;
        hasInitializedPolling.current = true;

        fetchTopWinnerSignals();

        if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
        }
        pollIntervalRef.current = setInterval(fetchTopWinnerSignals, 5000);

        return () => {
            hasInitializedPolling.current = false;
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
                pollIntervalRef.current = null;
            }
        };
    }, [token]);

    return (
        <div className="my-[4px]">
            <div className="flex items-center gap-[16px] mb-[16px]">
                <div className="flex items-center pt-[2px]">
                    <img src={CrownIcon} alt="" className="w-5 h-5" />
                </div>
                <h2 className="text-[24px] font-semibold text-white">Top winners</h2>
            </div>
            {loading ? (
                <div className="text-white">Loading...</div>
            ) : (
                <div className="overflow-y-scroll hide-scrollbar max-h-[400px] space-y-[12px]">
                    {winners.map((winner) => (
                        <WinnerCard key={winner.id} winner={winner} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default TopWinners;