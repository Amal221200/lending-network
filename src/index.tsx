'use client';
import styles from './index.module.css';
import demoImage from '@/assets/demo.gif';
import Header from '@/components/header';
import { useAccount } from '@particle-network/connectkit';
import { isEVMChain } from '@particle-network/connectkit/chains';
import TokenExchangeTabs from './components/token-exchange/TokenExchange';

export default function Index() {
  const { isConnected, chain } = useAccount();

  return (
    <>
      <Header />
      <main className={styles['main-content']}>
        {isConnected && chain && isEVMChain(chain) ? (
          <TokenExchangeTabs />
        ) : (
          <img sizes='100%' src={demoImage.src} style={{ width: '100%' }} alt='demo' />
        )}
      </main>
    </>
  );
}
