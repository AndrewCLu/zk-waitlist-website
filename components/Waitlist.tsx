import { ethers } from 'ethers';
import React, { useEffect, useState } from 'react';
import { WAITLIST_CONTRACT_ABI, WAITLIST_CONTRACT_ADDRESS } from '../utils/Constants';
import Commit from './Commit';
import Lock from './Lock';
import Redeem from './Redeem';

type WaitlistContractStateType = {
  commitments: string[],
  isLocked: boolean,
  maxWaitlistSpots: number,
  merkleRoot: string
}

type DisplayWaitlistContractStateProps = {
  waitlistContractState?: WaitlistContractStateType,
  updateWaitlistContractState: () => void
}

function displayWaitlistContractState(props: DisplayWaitlistContractStateProps) {
  const updateButton = <button onClick={props.updateWaitlistContractState}>Update Waitlist State</button>;
  if (!props.waitlistContractState) {
    return (
      <div>
        {updateButton}
        <br/>
        Loading waitlist state...
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
      There are {props.waitlistContractState.maxWaitlistSpots - props.waitlistContractState.commitments.length} spots remaining on the waitlist.
      <br/>
      {props.waitlistContractState.isLocked ? <div>The waitlist is locked.</div> : <div>The waitlist is not locked.</div>}
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

  useEffect(() => {
    updateWaitlistContractState();
  }, [waitlistContract])

  useEffect(() => {
    const waitlistContract: ethers.Contract = new ethers.Contract(WAITLIST_CONTRACT_ADDRESS, WAITLIST_CONTRACT_ABI, signer);
    setWaitlistContract(waitlistContract);
  }, [signer])

  const updateWaitlistContractState = async () => {
    const waitlist = waitlistContract;
    if (!waitlist) { return; }

    const commitments: string[] = []
    const usedWaitlistSpots: number = await waitlist.usedWaitlistSpots();
    const maxWaitlistSpots: number = await waitlist.maxWaitlistSpots();
    for (let i=0; i<usedWaitlistSpots; i++) {
      const c = await waitlist.commitments(i);
      commitments.push(c.toString());
    }
    const isLocked: boolean = await waitlist.isLocked();
    const merkleRoot: string = await waitlist.merkleRoot();
    const newState: WaitlistContractStateType = {
      commitments,
      isLocked,
      maxWaitlistSpots,
      merkleRoot
    }
    setWaitlistContractState(newState);
  }

  const getWaitlistDisplayComponent = () => {
    if (!waitlistContractState || !waitlistContract) {
      return (
        <div>
          Loading waitlist state...
        </div>
      )
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
      {displayWaitlistContractState({ waitlistContractState, updateWaitlistContractState })}
      <br/>
      {getWaitlistDisplayComponent()}
    </div>
  )
}