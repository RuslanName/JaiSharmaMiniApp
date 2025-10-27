import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useAuthStore } from '@/store/auth';
import type {MiniAppUser} from '@/interfaces';
import WinnerCard from './WinnerCard';

const TopWinners: React.FC = () => {
    const { token } = useAuthStore();
    const [winners, setWinners] = useState<MiniAppUser[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const response = await api.get('/users/leaderboard?page=1&limit=10', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setWinners(response.data.data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching leaderboard:', error);
                setLoading(false);
            }
        };

        if (token) {
            fetchLeaderboard();
        }
    }, [token]);

    return (
        <div className="mt-[20px]">
            <div className="flex items-center gap-[16px]">
                <h2 className="text-[24px] font-semibold">Top winners</h2>
            </div>
            {loading ? (
                <div>Loading...</div>
            ) : (
                <div className="overflow-y-scroll hide-scrollbar max-h-[400px] space-y-[12px] mt-[16px]">
                    {winners.map((winner) => (
                        <WinnerCard key={winner.id} winner={winner} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default TopWinners;