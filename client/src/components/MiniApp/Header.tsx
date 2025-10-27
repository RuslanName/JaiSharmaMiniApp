import React from 'react';
import Logo from '../../assets/logo.svg';

const Header: React.FC = () => {
    return (
        <div className="mt-[16px]">
            <div className="mx-auto flex justify-center items-center gap-[10px]">
                <img src={Logo} alt="logo" className="w-[41px] aspect-square" />
                <div className="flex flex-col">
                    <h1 className="text-[18px] font-semibold">Jai Sharma</h1>
                    <p className="text-[13px]">Ai Protocol</p>
                </div>
            </div>
        </div>
    );
};

export default Header;