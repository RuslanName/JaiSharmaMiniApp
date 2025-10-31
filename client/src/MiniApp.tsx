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
    const [confirmTimeout, setConfirmTimeout] = useState<number>(30000);
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
                const { isPending, requestTime: serverRequestTime, activatedAt, confirmTimeout: serverConfirmTimeout } = response.data;

                if (isPending) {
                    setSignalState('waiting');
                    setRequestTime(serverRequestTime);
                    setReadySince(null);
                    setConfirmTimeout(30000);
                    localStorage.setItem('signalState', 'waiting');
                    localStorage.setItem('signalRequestTime', serverRequestTime.toString());
                    localStorage.removeItem('readySince');
                    localStorage.removeItem('confirmTimeout');
                } else {
                    const signalsResponse = await api.get('/signals', {
                        headers: { Authorization: `Bearer ${token}` },
                        params: { page: 1, limit: 10 },
                    });
                    const { data: signals } = signalsResponse.data;
                    const activeSignal = signals.find(
                        (s: any) => s.status === 'active' && s.user.id === user.id,
                    );

                    if (activeSignal && activatedAt) {
                        setSignalState('ready');
                        setSignalId(activeSignal.id);
                        setSignalData(activeSignal);
                        setReadySince(activatedAt);
                        setRequestTime(serverRequestTime || activatedAt);
                        setConfirmTimeout(serverConfirmTimeout || 30000);
                        localStorage.setItem('signalState', 'ready');
                        localStorage.setItem('signalId', activeSignal.id.toString());
                        localStorage.setItem('signalData', JSON.stringify(activeSignal));
                        localStorage.setItem('readySince', activatedAt.toString());
                        localStorage.setItem('confirmTimeout', (serverConfirmTimeout || 30000).toString());
                        localStorage.setItem('signalRequestTime', (serverRequestTime || activatedAt).toString());
                    } else {
                        resetSignalState();
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
            setConfirmTimeout(30000);
            localStorage.removeItem('signalState');
            localStorage.removeItem('signalId');
            localStorage.removeItem('signalData');
            localStorage.removeItem('signalRequestTime');
            localStorage.removeItem('readySince');
            localStorage.removeItem('confirmTimeout');
        };

        const storedState = localStorage.getItem('signalState');
        const storedId = localStorage.getItem('signalId');
        const storedData = localStorage.getItem('signalData');
        const storedReqTime = localStorage.getItem('signalRequestTime');
        const storedReady = localStorage.getItem('readySince');
        const storedTimeout = localStorage.getItem('confirmTimeout');

        if (storedState === 'ready' && storedId && storedData && storedReady && storedTimeout) {
            setSignalState('ready');
            setSignalId(parseInt(storedId));
            setSignalData(JSON.parse(storedData));
            setReadySince(parseInt(storedReady));
            setRequestTime(parseInt(storedReqTime || '0'));
            setConfirmTimeout(parseInt(storedTimeout));
        } else if (storedState === 'waiting' && storedReqTime) {
            setSignalState('waiting');
            setRequestTime(parseInt(storedReqTime));
        }

        pollSignalStatus();
        const interval = setInterval(pollSignalStatus, 5000);
        return () => clearInterval(interval);
    }, [user, token, refreshSignals]);

    useEffect(() => {
        const interval = setInterval(() => {}, 1000);
        return () => clearInterval(interval);
    }, []);

    const handleSignalClick = async () => {
        if (!user || !token) return;

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
                await api.post('/signals/request', {}, {
                    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                });
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
                const activeSignal = signals.find(
                    (s: any) => s.id === signalId && s.status === 'active' && s.user.id === user.id,
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

    const resetSignalState = () => {
        setSignalState('idle');
        setSignalId(null);
        setSignalData(null);
        setReadySince(null);
        setRequestTime(null);
        setConfirmTimeout(30000);
        localStorage.removeItem('signalState');
        localStorage.removeItem('signalId');
        localStorage.removeItem('signalData');
        localStorage.removeItem('signalRequestTime');
        localStorage.removeItem('readySince');
        localStorage.removeItem('confirmTimeout');
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
                        activatedAt={readySince}
                        confirmTimeout={confirmTimeout}
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