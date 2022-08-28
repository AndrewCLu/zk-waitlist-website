import { ethers } from 'ethers';
import React, { useState } from 'react';
import { NONEMPTY_ALPHANUMERIC_REGEX } from '../utils/Constants';

enum LockDisplayStates {
  LOCKABLE,
  SUCCESS,
  FAILURE
}

type LockProps = {
  waitlistContract: ethers.Contract,
  commitments: string[]
}

export default function Lock (props: LockProps) {
  const [lockdisplayState, setLockDisplayState] = useState<LockDisplayStates>(LockDisplayStates.LOCKABLE);
  const [errorMessage, setErorrMessage] = useState('');
  const [root, setRoot] = useState();

  // Generates proof to lock the waitlist and submits proof to Ethereum
  const lockWaitlist = async () => {
    for (let i of props.commitments) {
      if (!i.match(NONEMPTY_ALPHANUMERIC_REGEX)) { 
        setErorrMessage('All commitments must be non-empty and alphanumeric!');
        setLockDisplayState(LockDisplayStates.FAILURE);
        return; 
      }
    }
    const commitmentString = props.commitments.join(',')
    const url = '/api/locker?commitments=' + commitmentString;
    const res = await fetch(url);
    const json = await res.json();
    if (res.status === 200) {
      const { proof, publicSignals } = json;
      try {
        await props.waitlistContract.lock(proof, publicSignals);
        setRoot(publicSignals[0]);
        setLockDisplayState(LockDisplayStates.SUCCESS);
        return;
      } catch (e) {
        setErorrMessage('Failed to submit locking transaction!');
        setLockDisplayState(LockDisplayStates.FAILURE);
        return;
      }
    } else {
      setErorrMessage('Unable to generate proof to lock waitlist!');
      setLockDisplayState(LockDisplayStates.FAILURE);
      if (res.status === 400) {
        console.log(json.error);
      }
    }
  }

  const resetLockDisplayState = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();
    setErorrMessage('');
    setLockDisplayState(LockDisplayStates.LOCKABLE);
  }

  const getLockDisplayComponent = () => {
    switch(lockdisplayState) {
      case LockDisplayStates.LOCKABLE:
        return (
          <div>
            <button onClick={lockWaitlist}>Lock the waitlist</button>
          </div>
        )
      case LockDisplayStates.SUCCESS:
        return (
          <div>
            Successfully locked the waitlist! 
            {root ? (
              <div>
                <br/>
                'Locked with Merkle root: ' + {root}
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