import { ethers } from 'ethers';
import { useEffect, useState } from 'react';

type WaitlistProps = {
  signer?: ethers.Signer;
}
export default function Waitlist (props: WaitlistProps) {
  const { signer } = props;
  const [displayCommitment, setDisplayCommitment] = useState(false);
  const [secret, setSecret] = useState('');
  const [commitment, setCommitment] = useState('');

  const updateSecret = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSecret(e.currentTarget.value);
  }
  const resetDisplayCommitment = () => {
    setDisplayCommitment(false);
  }

  const generateCommitment = async () => {
    setCommitment('hey');
    setDisplayCommitment(true);
  }

  const getProof = async () => {
    const json = fetch('/api/commitment').then(res => res.json)
    console.log(await json)
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