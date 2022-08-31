import { ethers } from 'ethers';
import React, { useState } from 'react';
import { NONEMPTY_ALPHANUMERIC_REGEX } from '../utils/Constants';

enum LockDisplayStates {
  LOCKABLE,
  LOCKING,
  SUCCESS,
  FAILURE
}

type LockProps = {
  waitlistContract: ethers.Contract,
  commitments: string[]
}

export default function Lock (props: LockProps) {
  const [lockDisplayState, setLockDisplayState] = useState<LockDisplayStates>(LockDisplayStates.LOCKABLE);
  const [root, setRoot] = useState();
  const [errorMessage, setErrorMessage] = useState('');

  // Generates proof to lock the waitlist and submits proof to Ethereum
  const lockWaitlist = async () => {
    for (let i of props.commitments) {
      if (!i.match(NONEMPTY_ALPHANUMERIC_REGEX)) { 
        setErrorMessage('All commitments must be non-empty and alphanumeric!');
        setLockDisplayState(LockDisplayStates.FAILURE);
        return; 
      }
    }
    setLockDisplayState(LockDisplayStates.LOCKING);
    const commitmentString = props.commitments.join(',')
    const url = '/api/locker?commitments=' + commitmentString;
    const res = await fetch(url);
    const json = await res.json();
    if (res.status === 200) {
      try {
        const { proof, publicSignals } = json;
        const publicSignalsCalldata = (publicSignals as string[]).map(ps => ethers.BigNumber.from(ps));
        const tx = await props.waitlistContract.lock(proof, publicSignalsCalldata);
        await tx.wait();
        setRoot(publicSignals[0]);
        setLockDisplayState(LockDisplayStates.SUCCESS);
        return;
      } catch (e) {
        setErrorMessage('Failed to submit locking transaction!');
        setLockDisplayState(LockDisplayStates.FAILURE);
        return;
      }
    } else {
      setErrorMessage('Unable to generate proof to lock waitlist!');
      setLockDisplayState(LockDisplayStates.FAILURE);
      if (res.status === 400) {
        console.log(json.error);
      }
    }
  }

  const resetLockDisplayState = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();
    setErrorMessage('');
    setLockDisplayState(LockDisplayStates.LOCKABLE);
  }

  const getLockDisplayComponent = () => {
    switch(lockDisplayState) {
      case LockDisplayStates.LOCKABLE:
        return (
          <div>
            <button onClick={lockWaitlist}>Lock the waitlist</button>
          </div>
        )
      case LockDisplayStates.LOCKING:
        return (
          <div>
            Locking the waitlist. This may take a while...
          </div>
        )
      case LockDisplayStates.SUCCESS:
        return (
          <div>
            Successfully locked the waitlist! 
            {root ? (
              <div>
                <br/>
                Locked with Merkle root: {root}
              </div>
            ) : null}
          </div>
        )
      case LockDisplayStates.FAILURE:
        return (
          <div>
            Failed to lock the waitlist.
            <br/>
            Error message: {errorMessage}
            <br/>
            <button onClick={resetLockDisplayState}>Go Back</button>
          </div>
        )
    }
  }

  return (
    <div>
      {getLockDisplayComponent()}
    </div>
  )
}