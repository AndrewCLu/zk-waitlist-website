import { ethers } from 'ethers';
import React, { useState } from 'react';

export default function Commit () {
  const [displayCommitment, setDisplayCommitment] = useState(false);
  const [secret, setSecret] = useState<string>('');
  const [commitment, setCommitment] = useState('');

  const updateSecret = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSecret(e.currentTarget.value);
  }

  // Generates a commitment by passing the secret to the api/commitment endpoint
  // Displays the commitment if successful
  const generateCommitment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (secret.length === 0) { 
      alert('Secret cannot be empty!');
      return; 
    }
    const url = '/api/commitment?secret='+secret;
    const res = await fetch(url);
    const json = await res.json();
    if (res.status === 200) {
      setCommitment(json.commitment);
      setDisplayCommitment(true);
      return;
    } else {
      alert('Unable to generate commitment!');
      if (res.status === 400) {
        console.log(json.error);
      }
    }
  }

  const resetDisplayCommitment = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();
    setSecret('');
    setDisplayCommitment(false);
  }

  return (
    <div>
      { 
        displayCommitment
        ? 
        <div>
          <div>
            Here is your commitment:
            {commitment}
          </div>
          <button onClick={resetDisplayCommitment}>Generate new commitment</button>
        </div>
        :
        <div>
          <form onSubmit={generateCommitment}>
            <label>
              Secret:
              <input type="number" value={secret} onChange={updateSecret} /> 
            </label>
            <input type="submit" value="Submit" />
          </form>
        </div>
      }
    </div>
  )
}