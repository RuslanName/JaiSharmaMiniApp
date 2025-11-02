import React, { useState, useEffect, lazy, Suspense, useRef, useCallback } from 'react';
import { locationManager } from '@telegram-apps/sdk';
import tzlookup from 'tz-lookup';
import Header from './components/MiniApp/Header';
import PlayerInfo from './components/MiniApp/PlayerInfo';
import ProgressBar from './components/MiniApp/ProgressBar';
import Auth from './components/MiniApp/Auth.tsx';
import { useAuthStore } from './store/auth';
import api from '../src/api/axios';

import EnergyModal from './components/MiniApp/EnergyModal';
import SignalModal from './components/MiniApp/SignalModal';

const LastSignals = lazy(() => import('./components/MiniApp/LastSignals'));
const SignalCircle = lazy(() => import('./components/MiniApp/SignalCircle'));
const SignalButton = lazy(() => import('./components/MiniApp/SignalButton'));
const TopWinners = lazy(() => import('./components/MiniApp/TopWinners'));

const AccessDeniedModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center px-[35px]"
            style={{
                background: 'rgba(15, 15, 15, 0.3)',
                backdropFilter: 'blur(15px)',
            }}
        >
            <div
                className="w-[360px] rounded-[22px] bg-[rgba(89,26,26,0.15)] border-[2px] border-[rgba(255,69,69,0.1)] py-[16px] px-[20px]"
                style={{ backdropFilter: 'blur(70px)' }}
            >
                <div className="flex flex-col gap-[32px]">
                    <div className="flex flex-col gap-[24px]">
                        <div className="flex flex-col gap-[16px]">
                            <h2 className="text-[24px] font-semibold text-[#FF4545]">
                                Access Denied
                            </h2>
                            <p className="text-[16px] font-light text-[rgba(255,255,255,0.8)] leading-[1.5em]">
                                Your access to signals is temporarily restricted. Please contact your manager to resolve this issue.
                            </p>
                        </div>
                        <a
                            href="https://t.me/your_manager_link"
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
                                    <span>Contact Manager</span>
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

const MiniApp: React.FC = () => {
    const [isEnergyModalOpen, setIsEnergyModalOpen] = useState(false);
    const [isSignalModalOpen, setIsSignalModalOpen] = useState(false);
    const [isAccessDeniedModalOpen, setIsAccessDeniedModalOpen] = useState(false);
    const [timezone, setTimezone] = useState<string>('UTC');
    const [signalState, setSignalState] = useState<'idle' | 'waiting' | 'ready'>('idle');
    const [signalId, setSignalId] = useState<number | null>(null);
    const [signalData, setSignalData] = useState<any>(null);
    const [, setRefreshSignals] = useState(false);
    const [readySince, setReadySince] = useState<number | null>(null);
    const [requestTime, setRequestTime] = useState<number | null>(null);
    const [confirmTimeout, setConfirmTimeout] = useState<number>(30000);
    const [, setCanRequest] = useState(true);
    const [cooldownSeconds, setCooldownSeconds] = useState<number | null>(null);
    const { user, token, setUser } = useAuthStore();

    const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const userIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const isPollingRef = useRef(false);
    const userIdRef = useRef<number | null>(null);
    const isAccessAllowedRef = useRef<boolean>(false);
    const hasInitializedUserPolling = useRef(false);
    const hasInitializedSignalPolling = useRef(false);

    useEffect(() => {
        if (user) {
            userIdRef.current = user.id;
            isAccessAllowedRef.current = user.is_access_allowed || false;
        }
    }, [user?.id, user?.is_access_allowed]);

    useEffect(() => {
        const fetchUserTimezone = async () => {
            try {
                if (locationManager.isSupported() && locationManager.mount.isAvailable()) {
                    await locationManager.mount();
                    const location = await locationManager.requestLocation();
                    const userTimezone = tzlookup(location.latitude, location.longitude);
                    setTimezone(userTimezone);
                } else {
                    const fallbackTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
                    setTimezone(fallbackTimezone || 'UTC');
                }
            } catch (err) {
                console.error('Error fetching location:', err);
                try {
                    const fallbackTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
                    setTimezone(fallbackTimezone || 'UTC');
                } catch (fallbackErr) {
                    setTimezone('UTC');
                }
                if (locationManager.openSettings.isAvailable()) {
                    locationManager.openSettings();
                }
            }
        };
        fetchUserTimezone();
    }, []);

    useEffect(() => {
        if (user && !user.is_access_allowed) {
            setIsAccessDeniedModalOpen(true);
        }
    }, [user]);

    const fetchUserData = useCallback(async () => {
        if (!token) return;
        try {
            const response = await api.get('/users/me', {
                headers: { Authorization: `Bearer ${token}` },
            });
            setUser(response.data);
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    }, [token, setUser]);

    useEffect(() => {
        if (!token) {
            if (userIntervalRef.current) {
                clearInterval(userIntervalRef.current);
                userIntervalRef.current = null;
            }
            hasInitializedUserPolling.current = false;
            return;
        }

        if (hasInitializedUserPolling.current) return;
        hasInitializedUserPolling.current = true;

        fetchUserData();

        if (userIntervalRef.current) {
            clearInterval(userIntervalRef.current);
        }
        userIntervalRef.current = setInterval(fetchUserData, 5000);

        return () => {
            hasInitializedUserPolling.current = false;
            if (userIntervalRef.current) {
                clearInterval(userIntervalRef.current);
                userIntervalRef.current = null;
            }
        };
    }, [token, fetchUserData]);

    const resetSignalState = useCallback(() => {
        setSignalState('idle');
        setSignalId(null);
        setSignalData(null);
        setReadySince(null);
        setRequestTime(null);
        setConfirmTimeout(30000);
    }, []);

    const pollSignalStatus = useCallback(async () => {
        if (isPollingRef.current) return;
        if (!token || !userIdRef.current || !isAccessAllowedRef.current) return;

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

            setCanRequest(serverCanRequest);
            setCooldownSeconds(serverCooldown ?? null);

            if (isPending) {
                setSignalState('waiting');
                setRequestTime(serverRequestTime);
                setReadySince(null);
                setConfirmTimeout(30000);
            } else if (activatedAt) {
                const signalsResponse = await api.get('/signals', {
                    headers: { Authorization: `Bearer ${token}` },
                    params: { page: 1, limit: 10 },
                });
                const { data: signals } = signalsResponse.data;
                const activeSignal = signals.find(
                    (s: any) => s.status === 'active' && s.user?.id === userIdRef.current
                );

                if (activeSignal) {
                    setSignalState('ready');
                    setSignalId(activeSignal.id);
                    setSignalData(activeSignal);
                    setReadySince(activatedAt);
                    setRequestTime(serverRequestTime || activatedAt);
                    setConfirmTimeout(serverConfirmTimeout || 30000);
                } else {
                    const currentSignalId = signalId;
                    if (currentSignalId) {
                        const foundSignal = signals.find(
                            (s: any) => s.id === currentSignalId && s.user?.id === userIdRef.current
                        );
                        if (foundSignal && foundSignal.status === 'active') {
                            setSignalState('ready');
                            setSignalId(foundSignal.id);
                            setSignalData(foundSignal);
                            setReadySince(activatedAt);
                            setRequestTime(serverRequestTime || activatedAt);
                            setConfirmTimeout(serverConfirmTimeout || 30000);
                        } else {
                            resetSignalState();
                        }
                    } else {
                        resetSignalState();
                    }
                }
            } else {
                const currentSignalId = signalId;
                if (currentSignalId) {
                    const signalsResponse = await api.get('/signals', {
                        headers: { Authorization: `Bearer ${token}` },
                        params: { page: 1, limit: 10 },
                    });
                    const { data: signals } = signalsResponse.data;
                    const activeSignal = signals.find(
                        (s: any) => s.id === currentSignalId && s.status === 'active' && s.user?.id === userIdRef.current
                    );

                    if (activeSignal) {
                        setSignalState('ready');
                        setSignalId(activeSignal.id);
                        setSignalData(activeSignal);
                        setReadySince(activeSignal.activated_at ? new Date(activeSignal.activated_at).getTime() : null);
                        setRequestTime(serverRequestTime || (activeSignal.activated_at ? new Date(activeSignal.activated_at).getTime() : null));
                        setConfirmTimeout(serverConfirmTimeout || 30000);
                    } else {
                        resetSignalState();
                    }
                } else {
                    resetSignalState();
                }
            }
        } catch (error: any) {
            console.error('Error polling signal status:', error);
        } finally {
            isPollingRef.current = false;
        }
    }, [token, signalId, resetSignalState]);

    useEffect(() => {
        const userId = user?.id ?? null;
        const isAccessAllowed = user?.is_access_allowed ?? false;
        
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
    }, [token, user?.id, user?.is_access_allowed, pollSignalStatus]);

    useEffect(() => {
        if (cooldownSeconds === null || cooldownSeconds <= 0) return;
        const timer = setInterval(() => {
            setCooldownSeconds((prev) => (prev && prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, [cooldownSeconds]);

    const handleSignalClick = async () => {
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
    };

    const handleAddEnergy = () => {
        if (!user?.password) {
            setIsSignalModalOpen(true);
            return;
        }
        setIsEnergyModalOpen(true);
    };

    return (
        <div className="bg-[#090909] flex flex-col min-h-screen overflow-y-auto overflow-x-hidden relative">
            <div className="absolute inset-x-0 top-0 bottom-0 z-0 pointer-events-none">
                <div className="absolute inset-x-0 top-0 h-[105px] bg-black/50"></div>
                <div className="absolute inset-x-0 top-0 h-[56px] bg-black/70"></div>
            </div>

            <Auth />
            <Header />
            <div className="relative w-full mt-[8px] bg-[#090909] rounded-t-[32px] border-t-[3px] border-[#00FF21] p-[14px]">
                <div className="absolute left-0 right-0 top-0 h-[3px] bg-[#00FF21] blur-[18px] opacity-90 z-[5]"></div>
                <div className="absolute left-1/2 -top-[120px] -translate-x-1/2 w-full h-[250px] bg-[radial-gradient(ellipse_at_center_bottom,rgba(0,255,33,0.35)_0%,rgba(0,255,33,0)_100%)] blur-[100px] pointer-events-none z-[3]"></div>
                <div className="absolute left-1/2 top-0 -translate-x-1/2 w-full h-[100px] bg-[radial-gradient(ellipse_at_center_top,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0)_100%)] blur-[50px] pointer-events-none z-[2]"></div>
                <div className="absolute left-1/2 top-0 -translate-x-1/2 w-full h-[200px] bg-[radial-gradient(ellipse_at_center_top,rgba(0,255,33,0.18)_0%,rgba(0,255,33,0)_100%)] blur-[60px] pointer-events-none z-[3]"></div>

                <div className="relative z-10 flex flex-col gap-[16px]">
                    <div className="w-full">
                        <PlayerInfo onAddEnergy={handleAddEnergy} />
                        <ProgressBar />
                    </div>

                    <Suspense fallback={<div className="text-white">Loading...</div>}>
                        <LastSignals timezone={timezone} />

                        <SignalCircle
                            onClick={handleSignalClick}
                            signalState={signalState}
                            signal={signalData}
                            disabled={
                                signalState === 'waiting' ||
                                user?.is_access_allowed === false
                            }
                        />

                        <SignalButton
                            onClick={handleSignalClick}
                            state={signalState}
                            disabled={
                                signalState === 'waiting' ||
                                user?.is_access_allowed === false
                            }
                            requestTime={requestTime}
                            activatedAt={readySince}
                            confirmTimeout={confirmTimeout}
                        />

                        <TopWinners />

                        {isEnergyModalOpen && <EnergyModal onClose={() => setIsEnergyModalOpen(false)} />}
                        {isSignalModalOpen && <SignalModal onClose={() => setIsSignalModalOpen(false)} />}
                        {isAccessDeniedModalOpen && <AccessDeniedModal onClose={() => setIsAccessDeniedModalOpen(false)} />}
                    </Suspense>
                </div>
            </div>
        </div>
    );
};

export default MiniApp;