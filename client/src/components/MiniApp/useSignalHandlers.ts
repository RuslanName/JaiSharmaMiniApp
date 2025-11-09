import { useState, useCallback } from 'react';
import api from '../../api/axios';
import { useAuthStore } from '@/store/auth';

interface UseSignalHandlersProps {
    signalState: 'idle' | 'waiting' | 'ready';
    signalId: number | null;
    resetSignalState: () => void;
    setRefreshSignals: (value: boolean | ((prev: boolean) => boolean)) => void;
}

export const useSignalHandlers = ({
    signalState,
    signalId,
    resetSignalState,
    setRefreshSignals,
}: UseSignalHandlersProps) => {
    const { user, token } = useAuthStore();
    const [isEnergyModalOpen, setIsEnergyModalOpen] = useState(false);
    const [isSignalModalOpen, setIsSignalModalOpen] = useState(false);
    const [isAccessDeniedModalOpen, setIsAccessDeniedModalOpen] = useState(false);

    const handleSignalClick = useCallback(async () => {
        if (user?.is_access_allowed === false) {
            setIsAccessDeniedModalOpen(true);
            return;
        }

        if (!user?.password) {
            setIsSignalModalOpen(true);
            return;
        }

        if ((user?.energy ?? 0) < 1) {
            setIsEnergyModalOpen(true);
            return;
        }

        if (signalState === 'ready' && signalId) {
            try {
                const signalsResponse = await api.get('/signals', {
                    headers: { Authorization: `Bearer ${token}` },
                    params: { page: 1, limit: 10 },
                });
                const { data: signals } = signalsResponse.data;
                const activeSignal = signals.find(
                    (s: any) => s.id === signalId && s.status === 'active' && s.user?.id === user?.id
                );
                if (!activeSignal) {
                    resetSignalState();
                    alert('Signal is no longer valid. Please request a new signal.');
                    return;
                }

                await api.post(`/signals/claim/${signalId}`, {}, {
                    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                });
                resetSignalState();
                setRefreshSignals((prev) => !prev);
            } catch (error: any) {
                console.error('Error claiming signal:', error);
                alert(error.response?.data?.message || 'Failed to claim signal');
                resetSignalState();
            }
        } else if (signalState === 'waiting') {
            alert('Signal request is already in progress. Please wait.');
        }
    }, [user, token, signalState, signalId, resetSignalState, setRefreshSignals]);

    const handleAddEnergy = useCallback(() => {
        if (!user?.password) {
            setIsSignalModalOpen(true);
            return;
        }
        setIsEnergyModalOpen(true);
    }, [user?.password]);

    return {
        isEnergyModalOpen,
        isSignalModalOpen,
        isAccessDeniedModalOpen,
        setIsEnergyModalOpen,
        setIsSignalModalOpen,
        setIsAccessDeniedModalOpen,
        handleSignalClick,
        handleAddEnergy,
    };
};

