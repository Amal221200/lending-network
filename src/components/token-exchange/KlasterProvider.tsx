"use client";

import { createKlaster } from "@/tokenMappings";
import { useAccount, useWallets } from "@particle-network/connectkit";
import { BiconomyV2AccountInitData, KlasterSDK } from "klaster-sdk";
import { createContext, useContext, useEffect, useState } from "react";



const KlasterContext = createContext<{ klaster: KlasterSDK<BiconomyV2AccountInitData> | undefined; }|undefined>(undefined);

const KlasterProvider = ({ children }: { children: React.ReactNode }) => {
    const { address, chain, status } = useAccount()
    if (!address) {
        throw new Error("Not connected")
    }
    // const klaster = createKlaster(address as `0x${string}`);
    const [klaster, setKlaster] = useState<KlasterSDK<BiconomyV2AccountInitData> | undefined>(undefined);

    useEffect(() => {
        (async () => {
            const klaster = await createKlaster(address as `0x${string}`);
            setKlaster(klaster);
        })()
    }, [address])
    return (
        <KlasterContext.Provider value={{klaster}}>
            {children}
        </KlasterContext.Provider>
    );
};

export const useKlasterContext = () => {
    const context = useContext(KlasterContext);
    
    // if(!context?.klaster){
    //     throw new Error("Klaster context not found")
    // }

    return context
}

export default KlasterProvider