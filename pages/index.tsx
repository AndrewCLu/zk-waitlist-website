import React from 'react';
import Head from 'next/head';
import Script from 'next/script';
import styles from '../styles/Index.module.css';
import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { MetamaskConnectionStates } from '../components/Metamask';
import Waitlist from '../components/Waitlist';
import Home from '../components/Home';
import { GOERLI_CHAIN_ID } from '../utils/WaitlistContract';

export default function IndexPage() {
  const [metamaskState, setMetamaskState] = useState<MetamaskConnectionStates>(
    MetamaskConnectionStates.UNDEFINED
  );
  const [signer, setSigner] = useState<ethers.providers.JsonRpcSigner>();
  const [provider, setProvider] = useState<ethers.providers.Provider>();

  // Checks the current state of metamask connection
  useEffect(() => {
    updateMetamaskState();
  }, []);

  // Refresh the page if user's metamask connection changes
  useEffect(() => {
    const { ethereum } = window as any;
    if (!ethereum) {
      return;
    }
    // Set up event listeners
    ethereum.on('accountsChanged', reloadPage);
    ethereum.on('chainChanged', reloadPage);
    // Clean up the event listeners
    return () => {
      ethereum.removeListener('accountsChanged', reloadPage);
      ethereum.removeListener('chainChanged', reloadPage);
    };
  });

  // Helper function to reload the page
  const reloadPage = () => {
    window.location.reload();
  };

  // Checks if the network a provider is connected to is supported
  const checkProviderNetwork = async (
    provider: ethers.providers.Provider
  ): Promise<boolean> => {
    const network = await provider.getNetwork();
    if (!network || network.chainId != GOERLI_CHAIN_ID) {
      return false;
    }
    return true;
  };

  // Determines current state of metamask connection
  const updateMetamaskState = async () => {
    const { ethereum } = window as any;
    if (!ethereum) {
      setMetamaskState(MetamaskConnectionStates.NOT_INSTALLED);
      return;
    }

    const provider = new ethers.providers.Web3Provider(ethereum);
    const signer = provider?.getSigner();
    const accounts = await provider?.listAccounts();
    if (!provider || !signer || accounts.length == 0) {
      setMetamaskState(MetamaskConnectionStates.NOT_CONNECTED);
      return;
    }

    const correctNetwork = await checkProviderNetwork(provider);
    if (!correctNetwork) {
      setMetamaskState(MetamaskConnectionStates.WRONG_NETWORK);
      return;
    }

    setSigner(signer);
    setProvider(provider);
    setMetamaskState(MetamaskConnectionStates.CONNECTED);
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>ZK Waitlist</title>
        <meta name="description" content="A private waitlist" />
        <link rel="icon" href="/zk.ico" />
      </Head>
      <Script
        src="https://cdn.ethers.io/lib/ethers-5.2.umd.min.js"
        strategy="lazyOnload"
      />

      {metamaskState === MetamaskConnectionStates.CONNECTED ? (
        <Waitlist signer={signer!} provider={provider!} />
      ) : (
        <Home metamaskState={metamaskState} />
      )}
    </div>
  );
}
