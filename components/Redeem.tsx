import { ethers } from 'ethers';
import React, { useState } from 'react';
import { NONEMPTY_ALPHANUMERIC_REGEX } from '../utils/Parsing';
import { getErrorMessage } from '../utils/Errors';

enum RedeemDisplayStates {
  ENTER_SECRET,
  CHECKING_SECRET,
  REDEEMABLE,
  NOT_REDEEMABLE,
  REDEEMING,
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

  const updateSecret = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSecret(event.currentTarget.value);
  }

  // Checks to see if provided secret can redeem any of the commitments
  const checkRedeemable = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (secret.length === 0) { 
      setErrorMessage('Secret cannot be empty!');
      setRedeemDisplayState(RedeemDisplayStates.FAILURE);
      return; 
    }
    for (let i of props.commitments) {
      if (!i.match(NONEMPTY_ALPHANUMERIC_REGEX)) { 
        setErrorMessage('All commitments must be non-empty and alphanumeric!');
        setRedeemDisplayState(RedeemDisplayStates.FAILURE);
        return;
      }
    }
    setRedeemDisplayState(RedeemDisplayStates.CHECKING_SECRET);
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
      }
    } else {
      let errorMessage = 'Unable to check if your secret is redeemable';
      if (res.status === 400) {
        errorMessage += ': ' + json.error;
      }
      setErrorMessage(errorMessage);
      setRedeemDisplayState(RedeemDisplayStates.FAILURE);
    }
  }

  // Generates a proof to redeem the spot on the waitlist 
  // corresponding to the provided secret and submits the proof
  const submitRedemption = async (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    event.preventDefault();
    if (secret.length === 0) { 
      setErrorMessage('Secret cannot be empty!');
      setRedeemDisplayState(RedeemDisplayStates.FAILURE);
      return; 
    }
    for (let i of props.commitments) {
      if (!i.match(NONEMPTY_ALPHANUMERIC_REGEX)) { 
        setErrorMessage('All commitments must be non-empty and alphanumeric!');
        setRedeemDisplayState(RedeemDisplayStates.FAILURE);
        return;
      }
    }
    if (typeof redeemableIndex !== 'number' || !Number.isInteger(redeemableIndex) || redeemableIndex < 0 || redeemableIndex >= props.commitments.length) {
      setErrorMessage('No commitment is redeemable!');
      setRedeemDisplayState(RedeemDisplayStates.FAILURE);
      return; 
    }
    setRedeemDisplayState(RedeemDisplayStates.REDEEMING);
    const commitmentString = props.commitments.join(',');
    const url = '/api/redeemer?secret=' + secret + '&commitments=' + commitmentString + '&redeemableIndex=' + redeemableIndex.toString();
    const res = await fetch(url);
    const json = await res.json();
    if (res.status === 200) {
      try {
        const { proof, publicSignals } = json;
        const publicSignalsCalldata = (publicSignals as string[]).map(ps => ethers.BigNumber.from(ps));
        const redeemTx = await props.waitlistContract.redeem(proof, publicSignalsCalldata);
        await redeemTx.wait();
        setRedeemDisplayState(RedeemDisplayStates.SUCCESS);
        return;
      } catch (error) {
        setErrorMessage(getErrorMessage(error));
        setRedeemDisplayState(RedeemDisplayStates.FAILURE);
        return;
      }
    } else {
      let errorMessage = 'Unable to generate proof to redeem your spot';
      if (res.status === 400) {
        errorMessage += ': ' + json.error;
      }
      setErrorMessage(errorMessage);
      setRedeemDisplayState(RedeemDisplayStates.FAILURE);
    }
  }

  const resetRedeemDisplayState = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    event.preventDefault();
    setSecret('');
    setRedeemableIndex(undefined);
    setErrorMessage('');
    setRedeemDisplayState(RedeemDisplayStates.ENTER_SECRET);
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
      case RedeemDisplayStates.CHECKING_SECRET:
        return (
          <div>
            Checking to see if your secret can be redeemed. This will take a few seconds...
          </div>
        )
      case RedeemDisplayStates.REDEEMABLE:
        return (
          <div>
            Your secret can redeem the waitlist spot with commitment:
            <br/>
            {props.commitments[redeemableIndex!]}
            <br/>
            <button onClick={submitRedemption}>Redeem my spot</button>
            <button onClick={resetRedeemDisplayState}>Cancel</button>
          </div>
        )
      case RedeemDisplayStates.NOT_REDEEMABLE:
        return (
          <div>
            The secret you provided does not correspond to any waitlist spot.
            <br/>
            <button onClick={resetRedeemDisplayState}>Try again</button>
          </div>
        )
      case RedeemDisplayStates.SUCCESS:
        return (
          <div>
            Successfully redeemed the waitlist spot corresponding to commitment: 
            <br/>
            {props.commitments[redeemableIndex!]}
            <br/>
            <button onClick={resetRedeemDisplayState}>Ok</button>
          </div>
        )
      case RedeemDisplayStates.REDEEMING:
        return (
          <div>
            Redeeming your waitlist spot. This may take a while...
          </div>
        )
      case RedeemDisplayStates.FAILURE:
        return (
          <div>
            Failed to redeem your waitlist spot: {errorMessage}
            <br/>
            <button onClick={resetRedeemDisplayState}>Go Back</button>
          </div>
        )
    }
  }

  return (
    <div>
      {getRedeemDisplayComponent()}
    </div>
  )
}