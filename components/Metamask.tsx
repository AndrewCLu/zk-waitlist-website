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

  return (
    <div>
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
    </div>
  )
}