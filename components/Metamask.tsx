import { MetamaskConnectionStates } from '../utils/Constants';
import { ethers } from 'ethers';
import React from 'react';

type MetamaskProps = {
  metamaskState: MetamaskConnectionStates
}
export default function Metamask(props: MetamaskProps) {
  const { metamaskState } = props;

  // Tries to authorize metamask
  const connectToMetamask = async () => {
    console.log("Attempting to connect to metamask...");
    if (metamaskState === MetamaskConnectionStates.NOT_INSTALLED) {
      console.log("Must have metamask installed! Please install Metamask and refresh the page");
      return;
    }
    const provider = new ethers.providers.Web3Provider((window as any).ethereum);
    try {
      await provider?.send("eth_requestAccounts", []);
    } catch {
      console.log("Failed to connect to metamask");
    }
  }

  const getRenderObject = (): JSX.Element => {
    switch (metamaskState) {
      case MetamaskConnectionStates.UNDEFINED:
        return <div>loading...</div>;
      case MetamaskConnectionStates.NOT_INSTALLED:
        return <div>Please install metamask</div>;
      case MetamaskConnectionStates.NOT_CONNECTED:
        return <div><button onClick={connectToMetamask}>Connect To Metamask</button></div>;
      case MetamaskConnectionStates.WRONG_NETWORK:
        return <div>Please change to Goerli network and refresh the page.</div>;
      case MetamaskConnectionStates.CONNECTED:
        return <div>Connected to metamask!</div>;
    }
  }

  return (
    <div>
      {getRenderObject()}
    </div>
  )
}