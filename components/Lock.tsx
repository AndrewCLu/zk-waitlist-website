import { ethers } from 'ethers';
import React, { useState } from 'react';
import {
  getHexFromBigNumberString,
  NONEMPTY_ALPHANUMERIC_REGEX,
} from '../utils/Parsing';
import { getErrorMessage } from '../utils/Errors';
import { WaitlistContractStateType } from './Waitlist';

enum LockDisplayStates {
  LOCKABLE,
  GENERATING_PROOF,
  SENDING_LOCK_TX,
  SUCCESS,
  FAILURE,
}

type LockProps = {
  waitlistContract: ethers.Contract;
  waitlistContractState: WaitlistContractStateType;
  updateWaitlistContractState: () => void;
};

export default function Lock(props: LockProps) {
  const [lockDisplayState, setLockDisplayState] = useState<LockDisplayStates>(
    LockDisplayStates.LOCKABLE
  );
  const [root, setRoot] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Generates proof to lock the waitlist and submits proof to Ethereum
  const lockWaitlist = async () => {
    for (const i of props.waitlistContractState.commitments) {
      if (!i.match(NONEMPTY_ALPHANUMERIC_REGEX)) {
        setErrorMessage('All commitments must be non-empty and alphanumeric!');
        setLockDisplayState(LockDisplayStates.FAILURE);
        return;
      }
    }
    if (props.waitlistContractState.isLocked) {
      setErrorMessage('The waitlist has already been locked!');
      setLockDisplayState(LockDisplayStates.FAILURE);
      return;
    }
    if (
      props.waitlistContractState.commitments.length !==
      props.waitlistContractState.maxWaitlistSpots
    ) {
      setErrorMessage(
        'The waitlist is not full yet. Please wait for the waitlist to fill up before locking.'
      );
      setLockDisplayState(LockDisplayStates.FAILURE);
      return;
    }
    setLockDisplayState(LockDisplayStates.GENERATING_PROOF);
    const commitmentString = props.waitlistContractState.commitments.join(',');
    const url = '/api/locker?commitments=' + commitmentString;
    const res = await fetch(url);
    const json = await res.json();
    if (res.status === 200) {
      setLockDisplayState(LockDisplayStates.SENDING_LOCK_TX);
      try {
        const { proof, publicSignals } = json;
        const publicSignalsCalldata = (publicSignals as string[]).map((ps) =>
          ethers.BigNumber.from(ps)
        );
        const lockTx = await props.waitlistContract.lock(
          proof,
          publicSignalsCalldata
        );
        await lockTx.wait();
        setRoot(publicSignals[0]);
        setLockDisplayState(LockDisplayStates.SUCCESS);
        return;
      } catch (error) {
        setErrorMessage('Failed to send transaction to lock the waitlist.');
        console.log(getErrorMessage(error));
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
  };

  const resetLockDisplayState = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    event.preventDefault();
    props.updateWaitlistContractState();
    setRoot('');
    setErrorMessage('');
    setLockDisplayState(LockDisplayStates.LOCKABLE);
  };

  const getLockDisplayComponent = () => {
    switch (lockDisplayState) {
      case LockDisplayStates.LOCKABLE:
        return (
          <div>
            <button onClick={lockWaitlist}>Lock the waitlist</button>
          </div>
        );
      case LockDisplayStates.GENERATING_PROOF:
        return (
          <div>
            Generating proof to lock the waitlist. This will take a few
            seconds...
          </div>
        );
      case LockDisplayStates.SENDING_LOCK_TX:
        return (
          <div>
            Sending transaction to lock the waitlist. This may take a while...
          </div>
        );
      case LockDisplayStates.SUCCESS:
        return (
          <div>
            Successfully locked the waitlist with Merkle root:
            <br />
            {getHexFromBigNumberString(root)}
          </div>
        );
      case LockDisplayStates.FAILURE:
        return (
          <div>
            Failed to lock the waitlist: {errorMessage}
            <br />
            <button onClick={resetLockDisplayState}>Go Back</button>
          </div>
        );
    }
  };

  return <div>{getLockDisplayComponent()}</div>;
}
