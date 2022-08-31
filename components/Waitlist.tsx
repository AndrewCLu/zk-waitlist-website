import { ethers } from 'ethers';
import React, { useEffect, useState } from 'react';
import { getErrorMessage, WAITLIST_CONTRACT_ABI, WAITLIST_CONTRACT_ADDRESS } from '../utils/Constants';
import Commit from './Commit';
import Lock from './Lock';
import Redeem from './Redeem';

type WaitlistContractStateType = {
  maxWaitlistSpots: number,
  commitments: string[],
  nullifiers: string[],
  isLocked: boolean,
  merkleRoot: string
}

type DisplayWaitlistContractStateProps = {
  waitlistContractState?: WaitlistContractStateType,
  waitlistContractStateLoading: boolean,
  updateWaitlistContractState: () => void
}

function displayWaitlistContractState(props: DisplayWaitlistContractStateProps) {
  const updateButton = <button onClick={props.updateWaitlistContractState}>Update Waitlist State</button>;
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
      The following commitments are claimed in the waitlist: 
      <br/>
      {props.waitlistContractState.commitments.map((c, i) => 
        <div key={i}>{i + '. ' + c}</div>
      )}
      The following nullifiers have been used: 
      <br/>
      {props.waitlistContractState.nullifiers.map((n, i) => 
        <div key={i}>{i + '. ' + n}</div>
      )}
      There are {props.waitlistContractState.maxWaitlistSpots - props.waitlistContractState.commitments.length} spots remaining on the waitlist.
      <br/>
      {props.waitlistContractState.isLocked ? <div>The waitlist is locked.</div> : <div>The waitlist is not locked.</div>}
      Merkle root: {props.waitlistContractState.merkleRoot}
    </div>
  )
}

type WaitlistProps = {
  signer?: ethers.Signer;
}

export default function Waitlist (props: WaitlistProps) {
  const { signer } = props;
  const [waitlistContract, setWaitlistContract] = useState<ethers.Contract>();
  const [waitlistContractState, setWaitlistContractState] = useState<WaitlistContractStateType>();
  const [waitlistContractStateLoading, setWaitlistContractStateLoading] = useState(false);

  useEffect(() => {
    updateWaitlistContractState();
  }, [waitlistContract])

  useEffect(() => {
    const waitlistContract: ethers.Contract = new ethers.Contract(WAITLIST_CONTRACT_ADDRESS, WAITLIST_CONTRACT_ABI, signer);
    setWaitlistContract(waitlistContract);
  }, [signer])

  const updateWaitlistContractState = async () => {
    setWaitlistContractStateLoading(true);
    const waitlist = waitlistContract;
    if (!waitlist) { return; }

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
      const newState: WaitlistContractStateType = {
        maxWaitlistSpots,
        commitments,
        nullifiers,
        isLocked,
        merkleRoot
      }
      setWaitlistContractState(newState);
    } catch (error) {
      console.log("Failed to load waitlist state: ", getErrorMessage(error));
    }
    setWaitlistContractStateLoading(false);
  }

  const getWaitlistDisplayComponent = () => {
    if (!waitlistContractState || !waitlistContract) {
      return null;
    } else if (waitlistContractState.isLocked) {
      return (
        <div>
          <Redeem waitlistContract={waitlistContract!} commitments={waitlistContractState.commitments} />
        </div>
      )
    } else if (waitlistContractState.commitments.length === waitlistContractState.maxWaitlistSpots) {
      return (
        <div>
          <Lock waitlistContract={waitlistContract!} commitments={waitlistContractState.commitments} />
        </div>
      )
    } else {
      return (
        <div>
          <Commit waitlistContract={waitlistContract!} />
        </div>
      )
    }
  }

  return (
    <div>
      {displayWaitlistContractState({ waitlistContractState, waitlistContractStateLoading, updateWaitlistContractState })}
      <br/>
      {getWaitlistDisplayComponent()}
    </div>
  )
}