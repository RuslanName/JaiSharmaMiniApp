import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../api/axios';
import type { Signal } from '@/interfaces';

interface SignalPollingState {
    signalState: 'idle' | 'waiting' | 'ready';
    signalId: number | null;
    signalData: Signal | null;
    readySince: number | null;
    requestTime: number | null;
    confirmTimeout: number;
    canRequest: boolean;
    cooldownSeconds: number | null;
}

export const useSignalPolling = (
    token: string | null,
    userId: number | null,
    isAccessAllowed: boolean
) => {
    const [state, setState] = useState<SignalPollingState>({
        signalState: 'idle',
        signalId: null,
        signalData: null,
        readySince: null,
        requestTime: null,
        confirmTimeout: 30000,
        canRequest: true,
        cooldownSeconds: null,
    });

    const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const isPollingRef = useRef(false);
    const hasInitializedSignalPolling = useRef(false);
    const signalIdRef = useRef<number | null>(null);

    const resetSignalState = useCallback(() => {
        signalIdRef.current = null;
        setState((prev) => ({
            ...prev,
            signalState: 'idle',
            signalId: null,
            signalData: null,
            readySince: null,
            requestTime: null,
            confirmTimeout: 30000,
        }));
    }, []);

    const pollSignalStatus = useCallback(async () => {
        if (isPollingRef.current) return;
        if (!token || !userId || !isAccessAllowed) return;

        isPollingRef.current = true;
        try {
            const response = await api.get('/signals/status', {
                headers: { Authorization: `Bearer ${token}` },
            });

            const {
                canRequest: serverCanRequest,
                cooldownSeconds: serverCooldown,
                isPending,
                requestTime: serverRequestTime,
                activatedAt,
                confirmTimeout: serverConfirmTimeout,
            } = response.data;

            setState((prev) => ({
                ...prev,
                canRequest: serverCanRequest,
                cooldownSeconds: serverCooldown ?? null,
            }));

            if (isPending) {
                setState((prev) => ({
                    ...prev,
                    signalState: 'waiting',
                    requestTime: serverRequestTime,
                    readySince: null,
                    confirmTimeout: 30000,
                }));
            } else if (activatedAt) {
                const signalsResponse = await api.get('/signals', {
                    headers: { Authorization: `Bearer ${token}` },
                    params: { page: 1, limit: 10 },
                });
                const { data: signals } = signalsResponse.data;
                const activeSignal = signals.find(
                    (s: any) => s.status === 'active' && s.user?.id === userId
                );

                if (activeSignal) {
                    signalIdRef.current = activeSignal.id;
                    setState((prev) => ({
                        ...prev,
                        signalState: 'ready',
                        signalId: activeSignal.id,
                        signalData: activeSignal,
                        readySince: activatedAt,
                        requestTime: serverRequestTime || activatedAt,
                        confirmTimeout: serverConfirmTimeout || 30000,
                    }));
                } else {
                    const currentSignalId = signalIdRef.current;
                    if (currentSignalId) {
                        const foundSignal = signals.find(
                            (s: any) => s.id === currentSignalId && s.user?.id === userId
                        );
                        if (foundSignal && foundSignal.status === 'active') {
                            signalIdRef.current = foundSignal.id;
                            setState((prev) => ({
                                ...prev,
                                signalState: 'ready',
                                signalId: foundSignal.id,
                                signalData: foundSignal,
                                readySince: activatedAt,
                                requestTime: serverRequestTime || activatedAt,
                                confirmTimeout: serverConfirmTimeout || 30000,
                            }));
                        } else {
                            signalIdRef.current = null;
                            resetSignalState();
                        }
                    } else {
                        signalIdRef.current = null;
                        resetSignalState();
                    }
                }
            } else {
                const currentSignalId = signalIdRef.current;
                if (currentSignalId) {
                    const signalsResponse = await api.get('/signals', {
                        headers: { Authorization: `Bearer ${token}` },
                        params: { page: 1, limit: 10 },
                    });
                    const { data: signals } = signalsResponse.data;
                    const activeSignal = signals.find(
                        (s: any) => s.id === currentSignalId && s.status === 'active' && s.user?.id === userId
                    );

                    if (activeSignal) {
                        signalIdRef.current = activeSignal.id;
                        setState((prev) => ({
                            ...prev,
                            signalState: 'ready',
                            signalId: activeSignal.id,
                            signalData: activeSignal,
                            readySince: activeSignal.activated_at ? new Date(activeSignal.activated_at).getTime() : null,
                            requestTime: serverRequestTime || (activeSignal.activated_at ? new Date(activeSignal.activated_at).getTime() : null),
                            confirmTimeout: serverConfirmTimeout || 30000,
                        }));
                    } else {
                        signalIdRef.current = null;
                        resetSignalState();
                    }
                } else {
                    signalIdRef.current = null;
                    resetSignalState();
                }
            }
        } catch (error: any) {
            console.error('Error polling signal status:', error);
        } finally {
            isPollingRef.current = false;
        }
    }, [token, userId, isAccessAllowed, resetSignalState]);

    useEffect(() => {
        if (!token || !userId || !isAccessAllowed) {
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
                pollIntervalRef.current = null;
            }
            hasInitializedSignalPolling.current = false;
            return;
        }

        if (hasInitializedSignalPolling.current) return;
        hasInitializedSignalPolling.current = true;

        pollSignalStatus();

        if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
        }
        pollIntervalRef.current = setInterval(pollSignalStatus, 3000);

        return () => {
            hasInitializedSignalPolling.current = false;
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
                pollIntervalRef.current = null;
            }
        };
    }, [token, userId, isAccessAllowed, pollSignalStatus]);

    useEffect(() => {
        signalIdRef.current = state.signalId;
    }, [state.signalId]);

    useEffect(() => {
        if (state.cooldownSeconds === null || state.cooldownSeconds <= 0) return;
        const timer = setInterval(() => {
            setState((prev) => ({
                ...prev,
                cooldownSeconds: prev.cooldownSeconds && prev.cooldownSeconds > 0 ? prev.cooldownSeconds - 1 : 0,
            }));
        }, 1000);
        return () => clearInterval(timer);
    }, [state.cooldownSeconds]);

    return {
        ...state,
        resetSignalState,
    };
};

