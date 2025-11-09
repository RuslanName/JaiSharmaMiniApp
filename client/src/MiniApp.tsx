import React, { useState, lazy, Suspense } from 'react';
import Header from './components/MiniApp/Header';
import PlayerInfo from './components/MiniApp/PlayerInfo';
import ProgressBar from './components/MiniApp/ProgressBar';
import Auth from './components/MiniApp/Auth.tsx';
import { useAuthStore } from './store/auth';
import { useSignalPolling } from './components/MiniApp/useSignalPolling';
import { useUserPolling } from './components/MiniApp/useUserPolling';
import { useTimezone } from './components/MiniApp/useTimezone';
import { useSignalHandlers } from './components/MiniApp/useSignalHandlers';
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
                background: 'rgba(15, 15, 15, 0.5)',
                WebkitBackdropFilter: 'blur(15px)',
                backdropFilter: 'blur(15px)',
                transform: 'translateZ(0)',
                WebkitTransform: 'translateZ(0)',
            }}
        >
            <div
                className="w-[360px] rounded-[22px] bg-[rgba(89,26,26,0.4)] border-[2px] border-[rgba(255,69,69,0.1)] py-[16px] px-[20px]"
                style={{
                    WebkitBackdropFilter: 'blur(70px)',
                    backdropFilter: 'blur(70px)',
                    transform: 'translateZ(0)',
                    WebkitTransform: 'translateZ(0)',
                }}
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
    const { user, token } = useAuthStore();
    const [, setRefreshSignals] = useState(false);
    
    const timezone = useTimezone();
    useUserPolling();
    
    const {
        signalState,
        signalId,
        signalData,
        readySince,
        requestTime,
        confirmTimeout,
        resetSignalState,
    } = useSignalPolling(token, user?.id ?? null, user?.is_access_allowed ?? false);

    const {
        isEnergyModalOpen,
        isSignalModalOpen,
        isAccessDeniedModalOpen,
        setIsEnergyModalOpen,
        setIsSignalModalOpen,
        setIsAccessDeniedModalOpen,
        handleSignalClick,
        handleAddEnergy,
    } = useSignalHandlers({
        signalState,
        signalId,
        resetSignalState,
        setRefreshSignals,
    });

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