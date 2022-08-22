import Head from 'next/head';
import Script from 'next/script';
import Image from 'next/image';
import styles from '../styles/Index.module.css';
import { useEffect, useState } from 'react';
import { ethers } from 'ethers';

export default function IndexPage() {
  const [haveMetamask, setHaveMetamask] = useState(false);
  const [metamaskIsConnected, setMetamaskIsConnected] = useState(false);
  const [provider, setProvider] = useState<ethers.providers.Provider>();
  const [signer, setSigner] = useState<ethers.providers.JsonRpcSigner>();

  useEffect(() => {
    if (typeof (window as any).ethereum !== 'undefined') {
      setHaveMetamask(true);
    } else {
      setHaveMetamask(false);
    }
  })

  const connectToMetamask = async () => {
    if (!haveMetamask) {
      console.log("Must have metamask installed!");
      return;
    }

    const provider = new ethers.providers.Web3Provider((window as any).ethereum);
    const accounts = await provider.send("eth_requestAccounts", []);
    if (accounts.length == 0) {
      console.log("Could not connect to Metamask");
      return;
    }
    
    const signer = provider.getSigner();
    setProvider(provider);
    setSigner(signer);
    setMetamaskIsConnected(true);
    console.log("Connected to Metamask")
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

      {metamaskIsConnected ? "Metamask is connected" : <button onClick={connectToMetamask}>Connect To Metamask</button>}

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
