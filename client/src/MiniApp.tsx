import React, { useState, useEffect, lazy, Suspense } from 'react';
import { locationManager } from '@telegram-apps/sdk';
import tzlookup from 'tz-lookup';
import Header from './components/MiniApp/Header';
import PlayerInfo from './components/MiniApp/PlayerInfo';
import ProgressBar from './components/MiniApp/ProgressBar';
import Auth from './components/MiniApp/Auth.tsx';
import { useAuthStore } from './store/auth';
import api from '../src/api/axios';
import SignalModal from './components/MiniApp/SignalModal';

const LastSignals = lazy(() => import('./components/MiniApp/LastSignals'));
const SignalCircle = lazy(() => import('./components/MiniApp/SignalCircle'));
const EnergyModal = lazy(() => import('./components/MiniApp/EnergyModal'));
const SignalButton = lazy(() => import('./components/MiniApp/SignalButton'));
const TopWinners = lazy(() => import('./components/MiniApp/TopWinners'));

const MiniApp: React.FC = () => {
    const [isEnergyModalOpen, setIsEnergyModalOpen] = useState(false);
    const [isSignalModalOpen, setIsSignalModalOpen] = useState(false);
    const [timezone, setTimezone] = useState<string>('UTC');
    const [signalState, setSignalState] = useState<'idle' | 'waiting' | 'ready'>('idle');
    const [signalId, setSignalId] = useState<number | null>(null);
    const [signalData, setSignalData] = useState<any>(null);
    const [refreshSignals, setRefreshSignals] = useState(false);
    const [readySince, setReadySince] = useState<number | null>(null);
    const [requestTime, setRequestTime] = useState<number | null>(null);
    const [timer, setTimer] = useState<number>(0);
    const { user, token, setUser } = useAuthStore();

    useEffect(() => {
        const fetchUserTimezone = async () => {
            try {
                if (locationManager.isSupported() && locationManager.mount.isAvailable()) {
                    await locationManager.mount();
                    const location = await locationManager.requestLocation();
                    const userTimezone = tzlookup(location.latitude, location.longitude);
                    setTimezone(userTimezone);
                } else {
                    setTimezone('UTC');
                }
            } catch (err) {
                console.error('Error fetching location:', err);
                if (locationManager.openSettings.isAvailable()) {
                    locationManager.openSettings();
                }
            }
        };
        fetchUserTimezone();
    }, []);

    useEffect(() => {
        if (!user || !token) return;

        const fetchUserData = async () => {
            try {
                const response = await api.get('/users/me', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setUser(response.data);
            } catch (error) {
                console.error('Error fetching user data:', error);
            }
        };

        fetchUserData();
        const interval = setInterval(fetchUserData, 5000);
        return () => clearInterval(interval);
    }, [user, token, setUser]);

    useEffect(() => {
        if (!user || !token) return;

        const pollSignalStatus = async () => {
            try {
                const response = await api.get('/signals/status', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const { isPending, requestTime: serverRequestTime } = response.data;

                const maxWaitTime = 310000;
                const maxReadyTime = 30000;

                if (isPending) {
                    setSignalState('waiting');
                    setRequestTime(serverRequestTime);
                    setReadySince(null);
                    localStorage.setItem('signalState', 'waiting');
                    localStorage.setItem('signalRequestTime', serverRequestTime.toString());
                    localStorage.removeItem('readySince');
                } else {
                    const signalsResponse = await api.get('/signals', {
                        headers: { Authorization: `Bearer ${token}` },
                        params: { page: 1, limit: 10 },
                    });
                    const { data: signals } = signalsResponse.data;
                    console.log(signals);
                    const activeSignal = signals.find((s: any) => s.status === 'active' && s.user.id === user.id);
                    if (activeSignal) {
                        const now = Date.now();
                        if (signalState !== 'ready') {
                            setSignalState('ready');
                            setReadySince(now);
                            setRequestTime(serverRequestTime);
                            localStorage.setItem('readySince', now.toString());
                        }
                        setSignalId(activeSignal.id);
                        setSignalData(activeSignal);
                        localStorage.setItem('signalState', 'ready');
                        localStorage.setItem('signalId', activeSignal.id.toString());
                        localStorage.setItem('signalData', JSON.stringify(activeSignal));
                        localStorage.setItem('signalRequestTime', serverRequestTime.toString());
                    } else {
                        const storedRequestTime = localStorage.getItem('signalRequestTime');
                        if (storedRequestTime && Date.now() - parseInt(storedRequestTime) > maxWaitTime) {
                            await api.post('/signals/clear-request', {}, {
                                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                            });
                            resetSignalState();
                            alert('Signal request timed out. Please try again.');
                        } else if (!activeSignal && signalState === 'ready' && readySince && Date.now() - readySince > maxReadyTime) {
                            resetSignalState();
                            alert('Signal confirmation time expired. Please request a new signal.');
                        } else if (!activeSignal) {
                            resetSignalState();
                        }
                    }
                }
            } catch (error: any) {
                console.error('Error polling signal status:', error);
            }
        };

        const resetSignalState = () => {
            setSignalState('idle');
            setSignalId(null);
            setSignalData(null);
            setReadySince(null);
            setRequestTime(null);
            localStorage.removeItem('signalState');
            localStorage.removeItem('signalId');
            localStorage.removeItem('signalData');
            localStorage.removeItem('signalRequestTime');
            localStorage.removeItem('readySince');
        };

        const storedSignalState = localStorage.getItem('signalState');
        const storedSignalId = localStorage.getItem('signalId');
        const storedSignalData = localStorage.getItem('signalData');
        const storedRequestTime = localStorage.getItem('signalRequestTime');
        const storedReadySince = localStorage.getItem('readySince');
        const maxWaitTime = 310000;
        const maxReadyTime = 30000;

        if (storedSignalState === 'ready' && storedSignalId && storedSignalData && storedReadySince) {
            const elapsed = Date.now() - parseInt(storedReadySince);
            if (elapsed <= maxReadyTime) {
                setSignalState('ready');
                setSignalId(parseInt(storedSignalId));
                setSignalData(JSON.parse(storedSignalData));
                setReadySince(parseInt(storedReadySince));
                setRequestTime(parseInt(storedRequestTime || '0'));
            } else {
                resetSignalState();
            }
        } else if (storedSignalState === 'waiting' && storedRequestTime) {
            const elapsed = Date.now() - parseInt(storedRequestTime);
            if (elapsed <= maxWaitTime) {
                setSignalState('waiting');
                setRequestTime(parseInt(storedRequestTime));
            } else {
                resetSignalState();
            }
        }

        pollSignalStatus();
        const interval = setInterval(pollSignalStatus, 5000);
        return () => clearInterval(interval);
    }, [user, token, refreshSignals]);

    useEffect(() => {
        const timerInterval = setInterval(() => {
            setTimer((prev) => prev + 1);
        }, 1000);
        return () => clearInterval(timerInterval);
    }, []);

    const handleSignalClick = async () => {
        if (!user || !token) {
            console.error('User or token not available');
            return;
        }

        if (!user.password) {
            setIsSignalModalOpen(true);
            return;
        }

        if (signalState === 'idle') {
            if (user.energy < 1) {
                setIsEnergyModalOpen(true);
                return;
            }
            try {
                await api.post('/signal/request', {}, {
                    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                });
                setSignalState('waiting');
                setRequestTime(Date.now());
                setReadySince(null);
                localStorage.setItem('signalState', 'waiting');
                localStorage.setItem('signalRequestTime', Date.now().toString());
                localStorage.removeItem('readySince');
            } catch (error: any) {
                console.error('Error requesting signal:', error);
                alert(error.response?.data?.message || 'Failed to request signal');
            }
        } else if (signalState === 'ready' && signalId) {
            try {
                const signalsResponse = await api.get('/signals', {
                    headers: { Authorization: `Bearer ${token}` },
                    params: { page: 1, limit: 10 },
                });
                const { data: signals } = signalsResponse.data;
                const activeSignal = signals.find((s: any) => s.id === signalId && s.status === 'active' && s.user.id === user.id);
                if (!activeSignal) {
                    setSignalState('idle');
                    setSignalId(null);
                    setSignalData(null);
                    setReadySince(null);
                    setRequestTime(null);
                    localStorage.removeItem('signalState');
                    localStorage.removeItem('signalId');
                    localStorage.removeItem('signalData');
                    localStorage.removeItem('signalRequestTime');
                    localStorage.removeItem('readySince');
                    alert('Signal is no longer valid. Please request a new signal.');
                    return;
                }

                await api.post(`/signal/claim/${signalId}`, {}, {
                    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                });
                setSignalState('idle');
                setSignalId(null);
                setSignalData(null);
                setReadySince(null);
                setRequestTime(null);
                localStorage.removeItem('signalState');
                localStorage.removeItem('signalId');
                localStorage.removeItem('signalData');
                localStorage.removeItem('signalRequestTime');
                localStorage.removeItem('readySince');
                setRefreshSignals((prev) => !prev);
            } catch (error: any) {
                console.error('Error claiming signal:', error);
                alert(error.response?.data?.message || 'Failed to claim signal');
                setSignalState('idle');
                setSignalId(null);
                setSignalData(null);
                setReadySince(null);
                setRequestTime(null);
                localStorage.removeItem('signalState');
                localStorage.removeItem('signalId');
                localStorage.removeItem('signalData');
                localStorage.removeItem('signalRequestTime');
                localStorage.removeItem('readySince');
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
        <div className="bg-[#090909] flex flex-col min-h-screen overflow-y-auto">
            <Auth />
            <Header />
            <div className="border-t-[3px] border-[#29C76E] bg-[radial-gradient(circle,rgba(7,235,102,0.2)_0%,#07EB6600_50%)] bg-[#090909] mt-[20px] relative w-full rounded-t-[32px] p-[16px]">
                <div className="absolute left-1/2 -top-[38px] w-[275px] h-[167px] z-0 bg-[#D9D9D9] blur-[150px] -translate-x-1/2"></div>
                <PlayerInfo onAddEnergy={handleAddEnergy} />
                <ProgressBar />
                <Suspense fallback={<div>Loading components...</div>}>
                    <LastSignals timezone={timezone} refresh={refreshSignals} />
                    <SignalCircle
                        onClick={handleSignalClick}
                        signalState={signalState}
                        signal={signalData}
                        disabled={signalState === 'waiting'}
                    />
                    <SignalButton
                        onClick={handleSignalClick}
                        state={signalState}
                        disabled={signalState === 'waiting'}
                        requestTime={requestTime}
                        readySince={readySince}
                    />
                    <TopWinners />
                    {isEnergyModalOpen && <EnergyModal onClose={() => setIsEnergyModalOpen(false)} />}
                    {isSignalModalOpen && <SignalModal onClose={() => setIsSignalModalOpen(false)} />}
                </Suspense>
            </div>
        </div>
    );
};

export default MiniApp;