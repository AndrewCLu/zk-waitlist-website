import { ethers } from 'ethers';
import React, { useEffect, useState } from 'react';
import { useSessionStorage } from 'usehooks-ts';
import { WAITLIST_CONTRACT_ABI, WAITLIST_CONTRACT_ADDRESS } from '../utils/WaitlistContract';
import { getErrorMessage } from '../utils/Errors';
import Commit from './Commit';
import Lock from './Lock';
import Redeem from './Redeem';
import { getHexFromBigNumberString, getLeadingHexFromBigNumberString } from '../utils/Parsing';
import Deploy from './Deploy';

export enum WaitlistDisplayStates {
  LOADING,
  DEPLOY, 
  COMMIT,
  LOCK,
  REDEEM,
  FAILURE
}

export type WaitlistContractStateType = {
  maxWaitlistSpots: number,
  commitments: string[],
  userCommitments: string[],
  isLocked: boolean,
  merkleRoot: string,
  nullifiers: string[],
  userNullifiers: string[],
}

type DisplayWaitlistContractStateProps = {
  waitlistDisplayState: WaitlistDisplayStates,
  waitlistContractState?: WaitlistContractStateType,
  waitlistContractStateLoading: boolean,
  updateWaitlistContractState: () => void
}

function displayWaitlistContractState(props: DisplayWaitlistContractStateProps) {
  const updateButton = <button onClick={props.updateWaitlistContractState}>Update Waitlist State</button>;
  const userCommitments = props.waitlistContractState?.userCommitments;
  const userNullifiers = props.waitlistContractState?.userNullifiers;
  if (props.waitlistContractStateLoading) {
    return (
      <div>
        Loading waitlist state...
      </div>
    )
  }
  if (!props.waitlistContractState) {
    return (
      <div>
        {updateButton}
        <br/>
        Could not fetch waitlist state.
      </div>
    )
  }
  return (
    <div>
      {updateButton}
      <br/>
      The following commitment(s) are claimed in the waitlist: 
      <br/>
      {props.waitlistContractState.commitments.map((c, i) => 
        <div key={i+1}>{(i+1) + '. ' + getLeadingHexFromBigNumberString(c) + '...'}</div>
      )}
      { (userCommitments && userCommitments.length > 0) ? 
        <div>
          You have claimed the waitlist spot(s) corresponding to the following commitment(s): 
          <br/>
          {userCommitments.map((c, i) => 
            <div key={i+1}>{(i+1) + '. ' + getHexFromBigNumberString(c)}</div>
          )}
        </div>
      : null }
      The following nullifier(s) have been used: 
      <br/>
      {props.waitlistContractState.nullifiers.map((n, i) => 
        <div key={i+1}>{(i+1) + '. ' + getLeadingHexFromBigNumberString(n) + '...'}</div>
      )}
      { (userNullifiers && userNullifiers.length > 0) ? 
        <div>
          You have redeemed the waitlist spot(s) corresponding to the following nullifiers(s): 
          <br/>
          {userNullifiers.map((n, i) => 
            <div key={i+1}>{(i+1) + '. ' + getHexFromBigNumberString(n)}</div>
          )}
        </div>
      : null }
      There are {props.waitlistContractState.maxWaitlistSpots - props.waitlistContractState.commitments.length} spot(s) remaining on the waitlist.
      <br/>
      {props.waitlistContractState.isLocked ? <div>The waitlist is locked.</div> : <div>The waitlist is not locked.</div>}
      Merkle root: {getHexFromBigNumberString(props.waitlistContractState.merkleRoot)}
    </div>
  )
}

type WaitlistProps = {
  signer: ethers.Signer;
  provider: ethers.providers.Provider;
}

export default function Waitlist (props: WaitlistProps) {
  const { signer, provider } = props;
  const [waitlistContractAddress, setWaitlistContractAddress] = useSessionStorage('waitlist-contract-address', '');
  const [waitlistContract, setWaitlistContract] = useState<ethers.Contract>();
  const [waitlistContractState, setWaitlistContractState] = useState<WaitlistContractStateType>();
  const [waitlistDisplayState, setWaitlistDisplayState] = useState<WaitlistDisplayStates>(WaitlistDisplayStates.LOADING);
  const [waitlistContractStateLoading, setWaitlistContractStateLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Connect to the waitlist contract
  useEffect(() => {
    console.log("Updating wiatlist contract effect", waitlistContractAddress)
    // Contract address has not been set yet
    if (waitlistContractAddress.length === 0) {
      setWaitlistDisplayState(WaitlistDisplayStates.DEPLOY);
      return;
    }
    const waitlistContract: ethers.Contract = new ethers.Contract(WAITLIST_CONTRACT_ADDRESS, WAITLIST_CONTRACT_ABI, signer);
    setWaitlistContract(waitlistContract);
  }, [signer, waitlistContractAddress])

  // Fetch new waitlist state if the waitlist contract is ever changed
  useEffect(() => {
    console.log("Updating waitlist contract state effect", waitlistContract, waitlistContractAddress)
    updateWaitlistContractState();
  }, [waitlistContract])

  // Set listeners to waitlist update events
  useEffect(() => {
    const joinFilter = {
      address: WAITLIST_CONTRACT_ADDRESS,
      topics: [
        ethers.utils.id("Join(address,uint256)"),
      ]
    };
    provider.on(joinFilter, () => {
      console.log("join filter triggered")
      updateWaitlistContractState();
    })
    const lockFilter = {
      address: WAITLIST_CONTRACT_ADDRESS,
      topics: [
        ethers.utils.id("Lock(address)"),
      ]
    };
    provider.on(lockFilter, () => {
      console.log("lock filter triggered")
      updateWaitlistContractState();
    })
    const redeemFilter = {
      address: WAITLIST_CONTRACT_ADDRESS,
      topics: [
        ethers.utils.id("Redeem(address,uint256)"),
      ]
    };
    provider.on(redeemFilter, () => {
      console.log("redeem filter triggered")
      updateWaitlistContractState();
    })
  }, [provider])

  // Helper to fetch waitlist contract state
  const updateWaitlistContractState = async () => {
    const waitlist = waitlistContract;
    console.log('updating', props, waitlist, waitlistContract)
    if (!waitlist) { 
      setWaitlistDisplayState(WaitlistDisplayStates.DEPLOY);
      return; 
    }
    // Set loading animation if the waitlist has not been loaded yet
    if (!waitlistContractState) {
      setWaitlistContractStateLoading(true);
    }

    try {
      const maxWaitlistSpotsBigNumber: ethers.BigNumber = await waitlist.maxWaitlistSpots();
      const maxWaitlistSpots: number = maxWaitlistSpotsBigNumber.toNumber();
      const numCommitments: ethers.BigNumber = await waitlist.getNumCommitments();
      const commitments: string[] = []
      for (let i=0; i<numCommitments.toNumber(); i++) {
        const c = await waitlist.commitments(i);
        commitments.push(c.toString());
      }
      const numNullifiers: ethers.BigNumber = await waitlist.getNumNullifiers();
      const nullifiers: string[] = []
      for (let i=0; i<numNullifiers.toNumber(); i++) {
        const n = await waitlist.nullifiers(i);
        nullifiers.push(n.toString());
      }
      const isLocked: boolean = await waitlist.isLocked();
      const merkleRootBigNumber: ethers.BigNumber = await waitlist.merkleRoot();
      const merkleRoot: string = merkleRootBigNumber.toString();
      const commitmentFilter = {
        address: WAITLIST_CONTRACT_ADDRESS,
        topics: [
            ethers.utils.id("Join(address,uint256)"),
            ethers.utils.hexZeroPad(await signer.getAddress(), 32),
        ]
      };
      const commitmentEvents = await waitlistContract.queryFilter(commitmentFilter);
      const userCommitments: string[] = commitmentEvents.map((event: ethers.Event) => event["args"]!["commitment"].toString());
      const nullifierFilter = {
        address: WAITLIST_CONTRACT_ADDRESS,
        topics: [
            ethers.utils.id("Redeem(address,uint256)"),
            ethers.utils.hexZeroPad(await signer.getAddress(), 32),
        ]
      };
      const nullifierEvents = await waitlistContract.queryFilter(nullifierFilter);
      const userNullifiers: string[] = nullifierEvents.map((event: ethers.Event) => event["args"]!["nullifier"].toString());
      const newState: WaitlistContractStateType = {
        maxWaitlistSpots,
        commitments,
        userCommitments,
        isLocked,
        merkleRoot,
        nullifiers,
        userNullifiers
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
  }

  const getWaitlistDisplayComponent = () => {
    switch (waitlistDisplayState) {
      case WaitlistDisplayStates.LOADING:
        return (
          <div>
            Loading waitlist...
          </div>
        )
      case WaitlistDisplayStates.DEPLOY:
        return (
          <div>
            <Deploy setDeployedWaitlistContractAddress={setWaitlistContractAddress} />
          </div>
        )
      case WaitlistDisplayStates.COMMIT:
        return (
          <div>
            <Commit waitlistContract={waitlistContract!} waitlistContractState={waitlistContractState!} updateWaitlistContractState={updateWaitlistContractState}/>
          </div>
        )
      case WaitlistDisplayStates.LOCK:
        return (
          <div>
            <Lock waitlistContract={waitlistContract!} waitlistContractState={waitlistContractState!} updateWaitlistContractState={updateWaitlistContractState}/>
          </div>
        )
      case WaitlistDisplayStates.REDEEM:
        return (
          <div>
            <Redeem waitlistContract={waitlistContract!} waitlistContractState={waitlistContractState!} updateWaitlistContractState={updateWaitlistContractState}/>
          </div>
        )
      case WaitlistDisplayStates.FAILURE:
        return (
          <div>
            Error: {errorMessage}
          </div>
        )
    }
  }

  return (
    <div>
      {displayWaitlistContractState({ waitlistDisplayState, waitlistContractState, waitlistContractStateLoading, updateWaitlistContractState })}
      <br/>
      {getWaitlistDisplayComponent()}
    </div>
  )
}