import React, { useEffect, useState, useRef } from 'react';
import api from '../../api/axios';
import { useAuthStore } from '@/store/auth';
import type { Signal } from '@/interfaces';
import SignalCard from './SignalCard';
import LastSignalsIcon from '../../assets/last-signals-icon.svg';

interface SignalsProps {
    timezone: string;
}

const LastSignals: React.FC<SignalsProps> = ({ timezone }) => {
    const { token } = useAuthStore();
    const [signals, setSignals] = useState<Signal[]>([]);
    const [loading, setLoading] = useState(true);
    const containerRef = useRef<HTMLDivElement>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const isFetchingRef = useRef(false);
    const hasInitializedRef = useRef(false);

    useEffect(() => {
        if (!token) {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            hasInitializedRef.current = false;
            return;
        }

        if (hasInitializedRef.current) return;
        hasInitializedRef.current = true;

        const fetchSignals = async () => {
            if (isFetchingRef.current) return;
            
            isFetchingRef.current = true;
            try {
                const response = await api.get('/signals?page=1&limit=10', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setSignals(response.data.data);
            } catch (error) {
                console.error('Error fetching signals:', error);
            } finally {
                setLoading(false);
                isFetchingRef.current = false;
            }
        };

        fetchSignals();
        
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
        intervalRef.current = setInterval(fetchSignals, 5000);
        
        return () => {
            hasInitializedRef.current = false;
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [token]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        let isScrolling = false;
        let startX = 0;
        let scrollLeft = 0;

        const handleWheel = (e: WheelEvent) => {
            const deltaX = e.deltaX;
            const deltaY = e.deltaY;

            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                container.scrollLeft += deltaX;
            } else {
                container.scrollLeft += deltaY;
                e.preventDefault();
            }
        };

        const handleTouchStart = (e: TouchEvent) => {
            isScrolling = true;
            startX = e.touches[0].pageX - container.offsetLeft;
            scrollLeft = container.scrollLeft;
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (!isScrolling) return;
            e.preventDefault();
            const x = e.touches[0].pageX - container.offsetLeft;
            const walk = (x - startX) * 2;
            container.scrollLeft = scrollLeft - walk;
        };

        const handleTouchEnd = () => {
            isScrolling = false;
        };

        container.addEventListener('wheel', handleWheel, { passive: false });
        container.addEventListener('touchstart', handleTouchStart, { passive: false });
        container.addEventListener('touchmove', handleTouchMove, { passive: false });
        container.addEventListener('touchend', handleTouchEnd, { passive: true });
        container.addEventListener('touchcancel', handleTouchEnd, { passive: true });

        return () => {
            container.removeEventListener('wheel', handleWheel);
            container.removeEventListener('touchstart', handleTouchStart);
            container.removeEventListener('touchmove', handleTouchMove);
            container.removeEventListener('touchend', handleTouchEnd);
            container.removeEventListener('touchcancel', handleTouchEnd);
        };
    }, [signals]);

    return (
        <div className="my-[4px] w-full">
            <div className="flex items-center gap-[16px] mb-[16px]">
                <img src={LastSignalsIcon} alt="" className="w-6 h-6" />
                <h2 className="text-[24px] font-semibold text-white">Last signals</h2>
            </div>
            {loading ? (
                <div className="text-white">Loading...</div>
            ) : (
                <div
                    ref={containerRef}
                    className="w-full overflow-x-auto overflow-y-hidden hide-scrollbar signals-container"
                    style={{
                        WebkitOverflowScrolling: 'touch',
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none'
                    }}
                >
                    <div className="inline-flex flex-row gap-[12px]">
                        {signals.map((signal) => (
                            <SignalCard key={signal.id} signal={signal} timezone={timezone} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default LastSignals;