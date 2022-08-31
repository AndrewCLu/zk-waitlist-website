import { ethers } from 'ethers';
import React, { useState } from 'react';
import { getErrorMessage, NONEMPTY_ALPHANUMERIC_REGEX } from '../utils/Constants';

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
  const [root, setRoot] = useState('');
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
    const commitmentString = props.commitments.join(',');
    const url = '/api/locker?commitments=' + commitmentString;
    const res = await fetch(url);
    const json = await res.json();
    if (res.status === 200) {
      try {
        const { proof, publicSignals } = json;
        const publicSignalsCalldata = (publicSignals as string[]).map(ps => ethers.BigNumber.from(ps));
        const lockTx = await props.waitlistContract.lock(proof, publicSignalsCalldata);
        await lockTx.wait();
        setRoot(publicSignals[0]);
        setLockDisplayState(LockDisplayStates.SUCCESS);
        return;
      } catch (error) {
        setErrorMessage(getErrorMessage(error));
        setLockDisplayState(LockDisplayStates.FAILURE);
        return;
      }
    } else {
      let errorMessage = 'Unable to generate proof to lock waitlist';
      if (res.status === 400) {
        errorMessage += ': ' + json.error;
      }
      setErrorMessage(errorMessage);
      setLockDisplayState(LockDisplayStates.FAILURE);
    }
  }

  const resetLockDisplayState = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    event.preventDefault();
    setRoot('');
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
            Successfully locked the waitlist with Merkle root: 
            <br/>
            {root}
          </div>
        )
      case LockDisplayStates.FAILURE:
        return (
          <div>
            Failed to lock the waitlist: {errorMessage}
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