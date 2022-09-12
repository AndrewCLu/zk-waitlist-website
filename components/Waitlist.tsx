import { ethers } from 'ethers';
import React, { useEffect, useState } from 'react';
import { useSessionStorage } from 'usehooks-ts';
import { WAITLIST_CONTRACT_ABI } from '../utils/WaitlistContract';
import { getErrorMessage } from '../utils/Errors';
import Commit from './Commit';
import Lock from './Lock';
import Redeem from './Redeem';
import Deploy from './Deploy';
import WaitlistDisplay from './WaitlistDisplay';

export enum WaitlistDisplayStates {
  LOADING,
  DEPLOY,
  COMMIT,
  LOCK,
  REDEEM,
  FAILURE,
}

export type WaitlistContractStateType = {
  maxWaitlistSpots: number;
  commitments: string[];
  userCommitments: string[];
  isLocked: boolean;
  merkleRoot: string;
  nullifiers: string[];
  userNullifiers: string[];
};

type WaitlistProps = {
  signer: ethers.Signer;
  provider: ethers.providers.Provider;
};

export default function Waitlist(props: WaitlistProps) {
  const { signer } = props;
  const [waitlistContractAddress, setWaitlistContractAddress] =
    useSessionStorage('waitlist-contract-address', '');
  const [waitlistContract, setWaitlistContract] = useState<ethers.Contract>();
  const [waitlistContractState, setWaitlistContractState] =
    useState<WaitlistContractStateType>();
  const [waitlistDisplayState, setWaitlistDisplayState] =
    useState<WaitlistDisplayStates>(WaitlistDisplayStates.LOADING);
  const [waitlistContractStateLoading, setWaitlistContractStateLoading] =
    useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Connect to the waitlist contract
  useEffect(() => {
    if (waitlistContractAddress.length === 0) {
      return;
    }
    const waitlistContract: ethers.Contract = new ethers.Contract(
      waitlistContractAddress,
      WAITLIST_CONTRACT_ABI,
      signer
    );
    setWaitlistContract(waitlistContract);
  }, [signer, waitlistContractAddress]);

  // Fetch new waitlist state if the waitlist contract is ever changed
  useEffect(() => {
    updateWaitlistContractState();
  }, [waitlistContract]);

  // Helper to fetch waitlist contract state
  const updateWaitlistContractState = async () => {
    if (waitlistContractAddress.length === 0) {
      setWaitlistDisplayState(WaitlistDisplayStates.DEPLOY);
      return;
    }
    const waitlist = waitlistContract;
    if (!waitlist) {
      return;
    }

    setWaitlistContractStateLoading(true);
    try {
      const maxWaitlistSpotsBigNumber: ethers.BigNumber =
        await waitlist.maxWaitlistSpots();
      const maxWaitlistSpots: number = maxWaitlistSpotsBigNumber.toNumber();
      const numCommitments: ethers.BigNumber =
        await waitlist.getNumCommitments();
      const commitments: string[] = [];
      for (let i = 0; i < numCommitments.toNumber(); i++) {
        const c = await waitlist.commitments(i);
        commitments.push(c.toString());
      }
      const numNullifiers: ethers.BigNumber = await waitlist.getNumNullifiers();
      const nullifiers: string[] = [];
      for (let i = 0; i < numNullifiers.toNumber(); i++) {
        const n = await waitlist.nullifiers(i);
        nullifiers.push(n.toString());
      }
      const isLocked: boolean = await waitlist.isLocked();
      const merkleRootBigNumber: ethers.BigNumber = await waitlist.merkleRoot();
      const merkleRoot: string = merkleRootBigNumber.toString();
      const commitmentFilter = {
        address: waitlistContractAddress,
        topics: [
          ethers.utils.id('Join(address,uint256)'),
          ethers.utils.hexZeroPad(await signer.getAddress(), 32),
        ],
      };
      const commitmentEvents = await waitlistContract.queryFilter(
        commitmentFilter
      );
      const userCommitments: string[] = commitmentEvents.map(
        (event: ethers.Event) => event['args']!['commitment'].toString()
      );
      const nullifierFilter = {
        address: waitlistContractAddress,
        topics: [
          ethers.utils.id('Redeem(address,uint256)'),
          ethers.utils.hexZeroPad(await signer.getAddress(), 32),
        ],
      };
      const nullifierEvents = await waitlistContract.queryFilter(
        nullifierFilter
      );
      const userNullifiers: string[] = nullifierEvents.map(
        (event: ethers.Event) => event['args']!['nullifier'].toString()
      );
      const newState: WaitlistContractStateType = {
        maxWaitlistSpots,
        commitments,
        userCommitments,
        isLocked,
        merkleRoot,
        nullifiers,
        userNullifiers,
      };
      setWaitlistContractState(newState);
      // Set current "mode" the waitlist is in
      if (isLocked) {
        setWaitlistDisplayState(WaitlistDisplayStates.REDEEM);
      } else if (commitments.length === maxWaitlistSpots) {
        setWaitlistDisplayState(WaitlistDisplayStates.LOCK);
      } else {
        setWaitlistDisplayState(WaitlistDisplayStates.COMMIT);
      }
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
      setWaitlistDisplayState(WaitlistDisplayStates.FAILURE);
    }
    setWaitlistContractStateLoading(false);
  };

  const resetWaitlistDisplayState = () => {
    setWaitlistContractAddress('');
    setWaitlistContract(undefined);
    setWaitlistContractState(undefined);
    setErrorMessage('');
    setWaitlistDisplayState(WaitlistDisplayStates.DEPLOY);
  };

  const getWaitlistDisplayComponent = () => {
    const waitlistDisplay = (
      <WaitlistDisplay
        waitlistDisplayState={waitlistDisplayState}
        waitlistContractAddress={waitlistContractAddress}
        waitlistContractState={waitlistContractState}
        waitlistContractStateLoading={waitlistContractStateLoading}
        updateWaitlistContractState={updateWaitlistContractState}
        resetWaitlistDisplayState={resetWaitlistDisplayState}
      />
    );
    switch (waitlistDisplayState) {
      case WaitlistDisplayStates.LOADING:
        return <div>Loading waitlist...</div>;
      case WaitlistDisplayStates.DEPLOY:
        return (
          <Deploy
            signer={signer}
            setDeployedWaitlistContractAddress={setWaitlistContractAddress}
          />
        );
      case WaitlistDisplayStates.COMMIT:
        return (
          <div>
            {waitlistDisplay}
            <br />
            <Commit
              waitlistContract={waitlistContract!}
              waitlistContractState={waitlistContractState!}
              updateWaitlistContractState={updateWaitlistContractState}
            />
          </div>
        );
      case WaitlistDisplayStates.LOCK:
        return (
          <div>
            {waitlistDisplay}
            <br />
            <Lock
              waitlistContract={waitlistContract!}
              waitlistContractState={waitlistContractState!}
              updateWaitlistContractState={updateWaitlistContractState}
            />
          </div>
        );
      case WaitlistDisplayStates.REDEEM:
        return (
          <div>
            {waitlistDisplay}
            <br />
            <Redeem
              waitlistContract={waitlistContract!}
              waitlistContractState={waitlistContractState!}
              updateWaitlistContractState={updateWaitlistContractState}
              resetWaitlistDisplayState={resetWaitlistDisplayState}
            />
          </div>
        );
      case WaitlistDisplayStates.FAILURE:
        return <div>Error: {errorMessage}</div>;
    }
  };

  return getWaitlistDisplayComponent();
}
