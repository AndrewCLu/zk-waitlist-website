import { ethers } from 'ethers';
import React, { useEffect, useState } from 'react';
import { WAITLIST_CONTRACT_ABI, WAITLIST_CONTRACT_ADDRESS } from '../utils/WaitlistContract';
import { getErrorMessage } from '../utils/Errors';
import Commit from './Commit';
import Lock from './Lock';
import Redeem from './Redeem';
import { getHexFromBigNumberString, getLeadingHexFromBigNumberString } from '../utils/Parsing';

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
        <div key={i}>{i + '. ' + getLeadingHexFromBigNumberString(c) + '...'}</div>
      )}
      The following nullifiers have been used: 
      <br/>
      {props.waitlistContractState.nullifiers.map((n, i) => 
        <div key={i}>{i + '. ' + getLeadingHexFromBigNumberString(n) + '...'}</div>
      )}
      There are {props.waitlistContractState.maxWaitlistSpots - props.waitlistContractState.commitments.length} spots remaining on the waitlist.
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
  const [waitlistContract, setWaitlistContract] = useState<ethers.Contract>();
  const [waitlistContractState, setWaitlistContractState] = useState<WaitlistContractStateType>();
  const [waitlistContractStateLoading, setWaitlistContractStateLoading] = useState(false);

  // Fetch new waitlist state if the waitlist contract is ever changed
  useEffect(() => {
    updateWaitlistContractState();
  }, [waitlistContract])

  // Connect to the waitlist contract
  useEffect(() => {
    const waitlistContract: ethers.Contract = new ethers.Contract(WAITLIST_CONTRACT_ADDRESS, WAITLIST_CONTRACT_ABI, signer);
    setWaitlistContract(waitlistContract);
  }, [signer])

  // Set listeners to waitlist update events
  useEffect(() => {
    const joinFilter = {
      address: WAITLIST_CONTRACT_ADDRESS,
      topics: [
        ethers.utils.id("Join(address,uint256)"),
      ]
    };
    provider.on(joinFilter, () => {
      updateWaitlistContractState();
    })
    const lockFilter = {
      address: WAITLIST_CONTRACT_ADDRESS,
      topics: [
        ethers.utils.id("Lock(address)"),
      ]
    };
    provider.on(lockFilter, () => {
      updateWaitlistContractState();
    })
    const redeemFilter = {
      address: WAITLIST_CONTRACT_ADDRESS,
      topics: [
        ethers.utils.id("Redeem(address,uint256)"),
      ]
    };
    provider.on(redeemFilter, () => {
      updateWaitlistContractState();
    })
  }, [provider])

  // Helper to fetch waitlist contract state
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