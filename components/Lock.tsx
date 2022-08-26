import { ethers } from 'ethers';
import React, { useState } from 'react';
import { nonemptyAlphanumericRegex } from '../utils/Constants';

export default function Lock () {
  const [displayProof, setDisplayProof] = useState(false);
  const [commitments, setCommitments] = useState<string[]>(['','','','']);
  const [proof, setProof] = useState('');

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
    console.log(json);
  }

  const resetDisplayProof = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();
    setDisplayProof(false);
  }

  return (
    <div>
      { 
        displayProof
        ? 
        <div>
          <div>
            Here is your proof:
            {proof}
          </div>
          <button onClick={resetDisplayProof}>Generate new proof</button>
        </div>
        :
        <div>
          <form onSubmit={generateProof}>
            <label>
              Input 0:
              <input type="text" value={commitments[0]} name="0" onChange={updateCommitments} /> 
            </label>
            <label>
              Input 1:
              <input type="text" value={commitments[1]} name="1" onChange={updateCommitments} /> 
            </label>
            <label>
              Input 2:
              <input type="text" value={commitments[2]} name="2" onChange={updateCommitments} /> 
            </label>
            <label>
              Input 3:
              <input type="text" value={commitments[3]} name="3" onChange={updateCommitments} /> 
            </label>
            <input type="submit" value="Submit" />
          </form>
        </div>
      }
    </div>
  )
}