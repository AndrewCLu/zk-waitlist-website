import { ethers } from 'ethers';
import React, { useState } from 'react';
import { nonemptyAlphanumericRegex } from '../utils/Constants';

export default function Lock () {
  const [displayRoot, setDisplayRoot] = useState(false);
  const [commitments, setCommitments] = useState<string[]>(['','','','']);
  const [root, setRoot] = useState('');

  const updateCommitments = (e: React.ChangeEvent<HTMLInputElement>) => {
    const index = parseInt(e.currentTarget.name);
    const newValue = e.currentTarget.value;
    setCommitments(currCommitments => {
      return [
        ...currCommitments.slice(0, index),
        newValue,
        ...currCommitments.slice(index + 1),
      ]
    });
  }

  // Generates a proof to lock the waitlist by calling the api/locker
  const generateProof = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    for (let i of commitments) {
      if (!i.match(nonemptyAlphanumericRegex)) { 
        alert('All commitments must be non-empty and alphanumeric!');
        return; 
      }
    }
    const commitmentString = commitments.join(',')
    const url = '/api/locker?commitments=' + commitmentString;
    const res = await fetch(url);
    const json = await res.json();
    if (res.status === 200) {
      const { proof, publicSignals } = json;
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
          <button onClick={resetDisplayRoot}>Generate new proof</button>
        </div>
        :
        <div>
          <form onSubmit={generateProof}>
            <label>
              Commitment 0:
              <input type="text" value={commitments[0]} name="0" onChange={updateCommitments} /> 
            </label>
            <br/>
            <label>
              Commitment 1:
              <input type="text" value={commitments[1]} name="1" onChange={updateCommitments} /> 
            </label>
            <br/>
            <label>
              Commitment 2:
              <input type="text" value={commitments[2]} name="2" onChange={updateCommitments} /> 
            </label>
            <br/>
            <label>
              Commitment 3:
              <input type="text" value={commitments[3]} name="3" onChange={updateCommitments} /> 
            </label>
            <br/>
            <input type="submit" value="Submit" />
          </form>
        </div>
      }
    </div>
  )
}