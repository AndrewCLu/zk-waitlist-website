import Head from 'next/head';
import Script from 'next/script';
import Image from 'next/image';
import styles from '../styles/Index.module.css';
import { useEffect, useState } from 'react';
import { ethers } from 'ethers';

const GOERLI_CHAIN_ID = 5;

export default function IndexPage() {
  enum MetamaskConnectionStates {
    NOT_INSTALLED,
    NOT_CONNECTED,
    CONNECTING,
    WRONG_NETWORK,
    CONNECTED
  }
  
  const [metamaskState, setMetamaskState] = useState<MetamaskConnectionStates>();
  const [provider, setProvider] = useState<ethers.providers.Provider>();
  const [signer, setSigner] = useState<ethers.providers.JsonRpcSigner>();

  // Check if metamask is installed
  useEffect(() => {
    console.log("Checking to see if metamask is installed...")
    if (typeof (window as any).ethereum !== 'undefined') {
      console.log("Metamask is installed!")
      setMetamaskState(MetamaskConnectionStates.NOT_CONNECTED);
    } else {
      console.log("Metamask is not installed.")
      setMetamaskState(MetamaskConnectionStates.NOT_INSTALLED);
    }
  }, []);

  // Checks to see if metamask is connected
  useEffect(() => {
    updateMetamaskState();
  }, [])

  // Refresh the page if user changes metamask accounts or chain
  // Only refresh the page if a provider has already been initialized
  useEffect(() => {
    // Helper function to reload page if a provider has already been configured
    const reloadPageIfHasProvider = () => {
      if (provider) {
        window.location.reload();
      }
    }

    console.log("Setting event handlers...")
    const { ethereum } = window as any
    if (!ethereum) { return; }
    // Set up event listeners
    ethereum.on("accountsChanged", reloadPageIfHasProvider)
    ethereum.on("chainChanged", reloadPageIfHasProvider)
    // Clean up the event listeners
    return () => {
      console.log("Closing event handlers...")
      ethereum.removeListener('accountsChanged', reloadPageIfHasProvider);
      ethereum.removeListener('chainChanged', reloadPageIfHasProvider);
    }
  })

  // Checks to see if the current network is Goerli
  const checkProviderNetwork = async (provider: ethers.providers.Provider): Promise<boolean> => {
    const network = await provider.getNetwork();
    if (!network || network.chainId != GOERLI_CHAIN_ID) {
      return false;
    }
    return true;
  }

  // Checks if metamask is already connected, and if so, updates state
  const updateMetamaskState = async () => {
    console.log("Updating metamask state...")
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

    setProvider(provider);
    setSigner(signer);
    setMetamaskState(MetamaskConnectionStates.CONNECTED);
    console.log("Connected successfully to Metamask!");
  }

  // Tries to authorize metamask
  // TODO: Refactor this method so that it doesn't need to perform all the metamask checks.
  // Instead, have updateMetamask state return an error indicating if some data is not complete
  // TODO: Handle situation where user rejects metamask
  const connectToMetamask = async () => {
    console.log("Attempting to connect to metamask...");
    if (metamaskState === MetamaskConnectionStates.NOT_INSTALLED) {
      console.log("Must have metamask installed! Please install Metamask and refresh the page");
      return;
    }
    setMetamaskState(MetamaskConnectionStates.CONNECTING);
    const provider = new ethers.providers.Web3Provider((window as any).ethereum);
    await provider?.send("eth_requestAccounts", []);
    updateMetamaskState();
  }

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

      {metamaskState !== MetamaskConnectionStates.NOT_INSTALLED 
        ? 
          <div>
            {metamaskState === MetamaskConnectionStates.CONNECTED || metamaskState === MetamaskConnectionStates.WRONG_NETWORK
              ? 
                <div>
                  {metamaskState === MetamaskConnectionStates.WRONG_NETWORK ? "Please change to Goerli network and refresh the page.": "Connected to goerli"}
                </div>
              : 
                <button onClick={connectToMetamask}>Connect To Metamask</button>
            } 
          </div> 
        :
          "Please install metamask"
      }

      <main className={styles.main}>
        <h1 className={styles.title}>
          Welcome to <a href="https://nextjs.org">Next.js!</a>
        </h1>

        <p className={styles.description}>
          Get started by editing{' '}
          <code className={styles.code}>pages/index.js</code>
        </p>

        <div className={styles.grid}>
          <a href="https://nextjs.org/docs" className={styles.card}>
            <h2>Documentation &rarr;</h2>
            <p>Find in-depth information about Next.js features and API.</p>
          </a>

          <a href="https://nextjs.org/learn" className={styles.card}>
            <h2>Learn &rarr;</h2>
            <p>Learn about Next.js in an interactive course with quizzes!</p>
          </a>

          <a
            href="https://github.com/vercel/next.js/tree/canary/examples"
            className={styles.card}
          >
            <h2>Examples &rarr;</h2>
            <p>Discover and deploy boilerplate example Next.js projects.</p>
          </a>

          <a
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
            className={styles.card}
          >
            <h2>Deploy &rarr;</h2>
            <p>
              Instantly deploy your Next.js site to a public URL with Vercel.
            </p>
          </a>
        </div>
      </main>

      <footer className={styles.footer}>
        <a
          href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          Powered by{' '}
          <span className={styles.logo}>
            <Image src="/vercel.svg" alt="Vercel Logo" width={72} height={16} />
          </span>
        </a>
      </footer>
    </div>
  )
}
