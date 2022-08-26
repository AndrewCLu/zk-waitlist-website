import { ethers } from 'ethers';
import React, { useState } from 'react';
import { NONEMPTY_ALPHANUMERIC_REGEX } from '../utils/Constants';

export default function Redeem() {
  const [displayRedeemable, setDisplayRedeemable] = useState(false);
  const [commitments, setCommitments] = useState<string[]>(['','','','']);
  const [secret, setSecret] = useState('');
  const [redeemable, setRedeemable] = useState('');
  const [redeemableIndex, setRedeemableIndex] = useState<number>();
  const [successfulRedemption, setSuccessfulRedemption] = useState(false);

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

  const updateSecret = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSecret(e.currentTarget.value);
  }

  // Checks to see if provided secret can redeem any of the commitments
  // Displays the commitment if successful
  const checkRedeemable = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (secret.length === 0) { 
      alert('Secret cannot be empty!');
      return; 
    }
    for (let i of commitments) {
      if (!i.match(NONEMPTY_ALPHANUMERIC_REGEX)) { 
        alert('All commitments must be non-empty and alphanumeric!');
        return; 
      }
    }
    const url = '/api/commitment?secret='+secret;
    const res = await fetch(url);
    const json = await res.json();
    if (res.status === 200) {
      const commitment = json.commitment;
      let redeemable = false;
      commitments.forEach((c, i) => {
        if (c === commitment) {
          redeemable = true;
          setRedeemableIndex(i);
          setRedeemable(commitment);
          setDisplayRedeemable(true);
          return;
        }
      });
      if (!redeemable) {
        alert('Unable to redeem any commitment with the provided secret!');
      }
      return;
    } else {
      alert('Unable to generate commitment!');
      if (res.status === 400) {
        console.log(json.error);
      }
    }
  }

  // Generates a proof to redeem the spot on the waitlist 
  // corresponding to the provided secret and submits the proof
  const submitRedemption = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();
    if (secret.length === 0) { 
      alert('Secret cannot be empty!');
      return; 
    }
    for (let i of commitments) {
      if (!i.match(NONEMPTY_ALPHANUMERIC_REGEX)) { 
        alert('All commitments must be non-empty and alphanumeric!');
        return; 
      }
    }
    if (redeemable.length === 0) {
      alert('No redeemable commitment!');
      return;
    }
    if (typeof redeemableIndex !== 'number') {
      alert('Must provide redeemable index!');
      return;
    }
    if (!Number.isInteger(redeemableIndex) || redeemableIndex < 0 || redeemableIndex >= commitments.length) {
      alert('Redeemable index is out of bounds!');
      return;
    }
    const commitmentString = commitments.join(',')
    const url = '/api/redeemer?secret=' + secret + '&commitments=' + commitmentString + '&redeemableIndex=' + redeemableIndex.toString();
    const res = await fetch(url);
    const json = await res.json();
    if (res.status === 200) {
      const { proof, publicSignals } = json;
      console.log('Proof: ', proof);
      console.log('Public signals: ', publicSignals);
      setSuccessfulRedemption(true);
      return;
    } else {
      alert('Unable to generate proof!');
      if (res.status === 400) {
        console.log(json.error);
      }
    }
  }

  const resetDisplayRedeemable = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();
    setSecret('');
    setRedeemable('');
    setRedeemableIndex(undefined);
    setDisplayRedeemable(false);
  }

  const resetSuccessfulRedemption = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();
    setSecret('');
    setRedeemable('');
    setRedeemableIndex(undefined);
    setDisplayRedeemable(false);
    setSuccessfulRedemption(false);
  }

  return (
    <div>
      {
        successfulRedemption 
        ? 
        <div>
          Successfully redeemed the waitlist spot corresponding to commitment: {redeemable}
          <button onClick={resetSuccessfulRedemption}>Redeem another spot</button>
        </div>
        :
        <div>
        { 
          displayRedeemable
          ? 
          <div>
            <div>
              Your secret can redeem the waitlist spot with commitment:
              {redeemable}
              Do you wish to redeem?
            </div>
            <button onClick={submitRedemption}>Redeem my spot</button>
            <button onClick={resetDisplayRedeemable}>Cancel</button>
          </div>
          :
          <div>
            <form onSubmit={checkRedeemable}>
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
              <label>
                Secret:
                <input type="number" value={secret} onChange={updateSecret} /> 
              </label>
              <br/>
              <input type="submit" value="Submit" />
            </form>
          </div>
        }
        </div>
      }
    </div>
  )
}