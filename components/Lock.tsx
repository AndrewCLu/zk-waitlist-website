import { ethers } from 'ethers';
import React, { useState } from 'react';
import { nonemptyAlphanumericRegex } from '../utils/Constants';

export default function Lock () {
  const [displayProof, setDisplayProof] = useState(false);
  const [inputs, setInputs] = useState<string[]>(['','','','']);
  const [proof, setProof] = useState('');

  const updateInputs = (e: React.ChangeEvent<HTMLInputElement>) => {
    const index = parseInt(e.currentTarget.name);
    const newValue = e.currentTarget.value;
    setInputs(currInputs => {
      return [
        ...currInputs.slice(0, index),
        newValue,
        ...currInputs.slice(index + 1),
      ]
    });
  }

  // Generates a proof to lock the waitlist by calling the api/locker
  const generateProof = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    for (let i of inputs) {
      if (!i.match(nonemptyAlphanumericRegex)) { 
        alert('All inputs must be non-empty and alphanumeric!');
        return; 
      }
    }
    const inputString = inputs.join(',')
    const url = '/api/locker?inputs=' + inputString;
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