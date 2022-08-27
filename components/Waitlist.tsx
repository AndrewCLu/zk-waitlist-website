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

type WaitlistProps = {
  signer?: ethers.Signer;
}

export default function Waitlist (props: WaitlistProps) {
  const { signer } = props;
  const [waitlistContract, setWaitlistContract] = useState<ethers.Contract>();
  const [waitlistContractState, setWaitlistContractState] = useState<WaitlistContractStateType>();

  useEffect(() => {
    const waitlistContract: ethers.Contract = new ethers.Contract(WAITLIST_CONTRACT_ADDRESS, WAITLIST_CONTRACT_ABI, signer);
    setWaitlistContract(waitlistContract);
    console.log(waitlistContract.interface)
  }, [signer])

  const updateWaitlistContractState = async (waitlist: ethers.Contract) => {
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
    console.log(newState)
    setWaitlistContractState(newState);
  }

  const updateWaitlistStateClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();
    if (!waitlistContract) { return; }
    updateWaitlistContractState(waitlistContract);
  }

  return (
    <div>
      <div>
        <div>
          <button onClick={updateWaitlistStateClick}>Update Waitlist State</button>
        </div>
        <div>
          The following commitments are claimed in the waitlist: 
          {waitlistContractState?.commitments}
          <br/>
          There are {waitlistContractState?.maxWaitlistSpots! - waitlistContractState?.commitments?.length!} spots remaining on the waitlist.
          <br/>
          {waitlistContractState?.isLocked ? <div>The waitlist is locked</div> : <div>The waitlist is not locked</div>}
        </div>
      </div>
      {
        waitlistContract 
        ?
        <div>
          <br/>
          <Commit waitlistContract={waitlistContract}/>
          <br/>
          <Lock />
          <br/>
          <Redeem />
        </div>
        : 
        <div></div>
      } 
    </div>
  )
}