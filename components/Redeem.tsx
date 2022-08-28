import { ethers } from 'ethers';
import React, { useState } from 'react';
import { NONEMPTY_ALPHANUMERIC_REGEX } from '../utils/Constants';

enum RedeemDisplayStates {
  ENTER_SECRET,
  REDEEMABLE,
  NOT_REDEEMABLE,
  SUCCESS,
  FAILURE
}

type RedeemProps = {
  waitlistContract: ethers.Contract,
  commitments: string[]
}

export default function Redeem(props: RedeemProps) {
  const [redeemDisplayState, setRedeemDisplayState] = useState<RedeemDisplayStates>(RedeemDisplayStates.ENTER_SECRET);
  const [secret, setSecret] = useState('');
  const [redeemableIndex, setRedeemableIndex] = useState<number>();
  const [errorMessage, setErrorMessage] = useState('');

  const updateSecret = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSecret(e.currentTarget.value);
  }

  // Checks to see if provided secret can redeem any of the commitments
  const checkRedeemable = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (secret.length === 0) { 
      alert('Secret cannot be empty!');
      return; 
    }
    for (let i of props.commitments) {
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
      props.commitments.forEach((c, i) => {
        if (c === commitment) {
          redeemable = true;
          setRedeemableIndex(i);
          setRedeemDisplayState(RedeemDisplayStates.REDEEMABLE);
          return;
        }
      });
      if (!redeemable) {
        setRedeemDisplayState(RedeemDisplayStates.NOT_REDEEMABLE);
        return;
      }
    } else {
      alert('Unable to check if your secret is redeemable.');
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

  const getRedeemDisplayComponent = () => {
    switch(redeemDisplayState) {
      case RedeemDisplayStates.ENTER_SECRET:
        return (
          <div>
            Enter your secret to redeem a waitlist spot:
            <br/>
            <form onSubmit={checkRedeemable}>
              <label>
                Secret:
                <input type="number" value={secret} onChange={updateSecret} /> 
              </label>
              <br/>
              <input type="submit" value="Submit" />
            </form>
          </div>
        )
      case RedeemDisplayStates.NOT_REDEEMABLE:
        return (
          <div>
            Unable to redeem any waitlist spot with the secret you provided. Try another?
            <br/>
            <form onSubmit={checkRedeemable}>
              <label>
                Secret:
                <input type="number" value={secret} onChange={updateSecret} /> 
              </label>
              <br/>
              <input type="submit" value="Submit" />
            </form>
          </div>
        )
    }
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
          
        }
        </div>
      }
    </div>
  )
}