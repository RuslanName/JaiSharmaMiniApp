import React, { useEffect, useState, useRef } from 'react';
import api from '../../api/axios';
import { useAuthStore } from '@/store/auth';
import type {Signal} from '@/interfaces';
import SignalCard from './SignalCard';

interface SignalsProps {
    timezone: string;
    refresh: boolean;
}

const LastSignals: React.FC<SignalsProps> = ({ timezone, refresh }) => {
    const { token } = useAuthStore();
    const [signals, setSignals] = useState<Signal[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const observer = useRef<IntersectionObserver | null>(null);
    const lastSignalRef = useRef<HTMLDivElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    const fetchSignals = async (pageNum: number, append = true) => {
        try {
            const response = await api.get(`/signals?page=${pageNum}&limit=10`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const newSignals = response.data.data;
            setSignals((prev) => (append ? [...prev, ...newSignals] : newSignals));
            setHasMore(newSignals.length === 10);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching signals:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!token) return;

        fetchSignals(1, false);
    }, [token, refresh]);

    useEffect(() => {
        if (!token) return;

        const pollSignals = async () => {
            try {
                const response = await api.get('/signals?page=1&limit=10', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const newSignals = response.data.data;
                setSignals((prev) => {
                    const existingIds = new Set(prev.map((s) => s.id));
                    const updatedSignals = newSignals.filter((s: Signal) => !existingIds.has(s.id));
                    return [...updatedSignals, ...prev];
                });
            } catch (error) {
                console.error('Error polling signals:', error);
            }
        };

        const interval = setInterval(pollSignals, 5000);
        return () => clearInterval(interval);
    }, [token]);

    useEffect(() => {
        if (loading || !hasMore) return;

        observer.current = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore) {
                    setPage((prev) => prev + 1);
                    fetchSignals(page + 1);
                }
            },
            { threshold: 0.1, rootMargin: '100px', root: containerRef.current }
        );

        if (lastSignalRef.current) {
            observer.current.observe(lastSignalRef.current);
        }

        return () => {
            if (observer.current) {
                observer.current.disconnect();
            }
        };
    }, [loading, hasMore, signals, page]);

    const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (containerRef.current) {
            containerRef.current.scrollLeft += e.deltaY + e.deltaX;
        }
    };

    const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
        e.stopPropagation();
        const container = containerRef.current;
        if (container) {
            const rect = container.getBoundingClientRect();
            const touch = e.touches[0];
            const touchX = touch.clientX;
            const touchY = touch.clientY;
            if (
                touchX >= rect.left &&
                touchX <= rect.right &&
                touchY >= rect.top &&
                touchY <= rect.bottom
            ) {
                e.preventDefault();
            }
        }
    };

    return (
        <div className="mt-[20px]">
            <div className="flex items-center gap-[16px]">
                <div className="flex items-center gap-[4px]">
                    <div className="bg-[#33E870] rounded-full w-[6px] h-[6px]"></div>
                    <div className="bg-[#46AA6E] rounded-full w-[6px] h-[6px]"></div>
                </div>
                <h2 className="text-[24px] font-semibold">Last Signals</h2>
            </div>
            {loading && page === 1 ? (
                <div>Loading...</div>
            ) : (
                <div
                    ref={containerRef}
                    className="signals-container overflow-x-auto overflow-y-hidden flex flex-row gap-[12px] mt-[16px] hide-scrollbar h-[150px]"
                    onWheel={handleWheel}
                    onTouchMove={handleTouchMove}
                    onTouchStart={(e) => e.stopPropagation()}
                >
                    {signals.map((signal, index) => (
                        <div
                            key={signal.id}
                            ref={index === signals.length - 1 ? lastSignalRef : null}
                            className="flex-shrink-0 w-[154px]"
                        >
                            <SignalCard signal={signal} timezone={timezone} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default LastSignals;