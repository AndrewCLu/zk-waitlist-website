import { ethers } from 'ethers';
import React, { useState } from 'react';
import { NONEMPTY_ALPHANUMERIC_REGEX } from '../utils/Constants';

type LockProps = {
  waitlistContract: ethers.Contract,
  commitments: string[]
}

export default function Lock (props: LockProps) {
  const [displayRoot, setDisplayRoot] = useState(false);
  const [root, setRoot] = useState('');

  // Generates proof to lock the waitlist and submits proof to Ethereum
  const lockWaitlist = async () => {
    for (let i of props.commitments) {
      if (!i.match(NONEMPTY_ALPHANUMERIC_REGEX)) { 
        alert('All commitments must be non-empty and alphanumeric!');
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
        const lockResult = await props.waitlistContract.lock(proof, publicSignals);
        console.log(lockResult);
      } catch (e) {
        console.log('Failed to lock waitlist');
        return;
      }
      console.log('Proof: ', proof);
      console.log('Public signals: ', publicSignals);
      setRoot(publicSignals[0]);
      setDisplayRoot(true);
      return;
    } else {
      alert('Unable to generate proof!');
      if (res.status === 400) {
        console.log(json.error);
      }
    }
  }

  const resetDisplayRoot = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();
    setDisplayRoot(false);
  }

  return (
    <div>
      { 
        displayRoot
        ? 
        <div>
          <div>
            Proof generated with Merkle root:
            {root}
          </div>
          <br/>
          <button onClick={submitLockProof}>Lock the waitlist</button>
          <button onClick={resetDisplayRoot}>Cancel</button>
        </div>
        :
        <div>
          <button onClick={lockWaitlist}>Lock the waitlist</button>
        </div>
      }
    </div>
  )
}