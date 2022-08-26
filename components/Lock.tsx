import { ethers } from 'ethers';
import React, { useState } from 'react';

export default function Lock () {
  const [displayProof, setDisplayProof] = useState(false);
  const [inputs, setInputs] = useState<string[4]>([]);
  const [proof, setProof] = useState('');

  const updateInputs = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputs(e.currentTarget.value);
  }

  // Generates a proof to lock the waitlist by calling the api/locker
  const generateProof = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (secret.length === 0) { return; }
    const url = '/api/commitment?secret='+secret;
    const res = await fetch(url);
    const json = await res.json();
    if (res.status === 200) {
      setCommitment(json.commitment);
      setDisplayCommitment(true);
      return;
    } else {
      alert('Unable to generate commitment');
      if (res.status === 400) {
        console.log(json.error);
      }
    }
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
          <button onClick={resetDisplayProof}>Generate new commitment</button>
        </div>
        :
        <div>
          <form onSubmit={generateProof}>
            <label>
              Input 0:
              <input type="text" value={inputs[0]} name="0" onChange={updateInputs} /> 
            </label>
            <label>
              Input 1:
              <input type="text" value={inputs[1]} name="1" onChange={updateInputs} /> 
            </label>
            <label>
              Input 2:
              <input type="text" value={inputs[2]} name="2" onChange={updateInputs} /> 
            </label>
            <label>
              Input 3:
              <input type="text" value={inputs[3]} name="3" onChange={updateInputs} /> 
            </label>
            <input type="submit" value="Submit" />
          </form>
        </div>
      }
    </div>
  )
}