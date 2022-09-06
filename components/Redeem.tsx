import { ethers } from 'ethers';
import React, { useEffect, useState } from 'react';
import {
  getHexFromBigNumberString,
  NONEMPTY_ALPHANUMERIC_REGEX,
} from '../utils/Parsing';
import { getErrorMessage } from '../utils/Errors';
import { WaitlistContractStateType } from './Waitlist';

enum RedeemDisplayStates {
  ENTER_SECRET,
  ALL_SPOTS_REDEEMED,
  CHECKING_SECRET,
  REDEEMABLE,
  NOT_REDEEMABLE,
  GENERATING_PROOF,
  SENDING_REDEEM_TX,
  SUCCESS,
  FAILURE,
}

type RedeemProps = {
  waitlistContract: ethers.Contract;
  waitlistContractState: WaitlistContractStateType;
  updateWaitlistContractState: () => void;
  resetWaitlistDisplayState: () => void;
};

export default function Redeem(props: RedeemProps) {
  const [redeemDisplayState, setRedeemDisplayState] =
    useState<RedeemDisplayStates>(RedeemDisplayStates.ENTER_SECRET);
  const [secret, setSecret] = useState('');
  const [redeemableIndex, setRedeemableIndex] = useState<number>();
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (
      props.waitlistContractState.nullifiers.length ===
      props.waitlistContractState.commitments.length
    ) {
      setRedeemDisplayState(RedeemDisplayStates.ALL_SPOTS_REDEEMED);
    }
  });

  const updateSecret = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSecret(event.currentTarget.value);
  };

  // Checks to see if provided secret can redeem any of the commitments
  const checkRedeemable = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (secret.length === 0) {
      setErrorMessage('Secret cannot be empty!');
      setRedeemDisplayState(RedeemDisplayStates.FAILURE);
      return;
    }
    for (const i of props.waitlistContractState.commitments) {
      if (!i.match(NONEMPTY_ALPHANUMERIC_REGEX)) {
        setErrorMessage('All commitments must be non-empty and alphanumeric!');
        setRedeemDisplayState(RedeemDisplayStates.FAILURE);
        return;
      }
    }
    setRedeemDisplayState(RedeemDisplayStates.CHECKING_SECRET);
    const url = '/api/commitment?secret=' + secret;
    const res = await fetch(url);
    const json = await res.json();
    if (res.status === 200) {
      const commitment = json.commitment;
      let redeemable = false;
      props.waitlistContractState.commitments.forEach((c, i) => {
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
  };

  // Generates a proof to redeem the spot on the waitlist
  // corresponding to the provided secret and submits the proof
  const submitRedemption = async (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    event.preventDefault();
    if (secret.length === 0) {
      setErrorMessage('Secret cannot be empty!');
      setRedeemDisplayState(RedeemDisplayStates.FAILURE);
      return;
    }
    for (const i of props.waitlistContractState.commitments) {
      if (!i.match(NONEMPTY_ALPHANUMERIC_REGEX)) {
        setErrorMessage('All commitments must be non-empty and alphanumeric!');
        setRedeemDisplayState(RedeemDisplayStates.FAILURE);
        return;
      }
    }
    if (
      typeof redeemableIndex !== 'number' ||
      !Number.isInteger(redeemableIndex) ||
      redeemableIndex < 0 ||
      redeemableIndex >= props.waitlistContractState.commitments.length
    ) {
      setErrorMessage('No commitment is redeemable!');
      setRedeemDisplayState(RedeemDisplayStates.FAILURE);
      return;
    }
    if (!props.waitlistContractState.isLocked) {
      setErrorMessage(
        'Waitlist has not yet been locked. No redemptions can be made at this time.'
      );
      setRedeemDisplayState(RedeemDisplayStates.FAILURE);
      return;
    }
    setRedeemDisplayState(RedeemDisplayStates.GENERATING_PROOF);
    const commitmentString = props.waitlistContractState.commitments.join(',');
    const url =
      '/api/redeemer?secret=' +
      secret +
      '&commitments=' +
      commitmentString +
      '&redeemableIndex=' +
      redeemableIndex.toString();
    const res = await fetch(url);
    const json = await res.json();
    if (res.status === 200) {
      setRedeemDisplayState(RedeemDisplayStates.SENDING_REDEEM_TX);
      try {
        const { proof, publicSignals } = json;
        const publicSignalsCalldata = (publicSignals as string[]).map((ps) =>
          ethers.BigNumber.from(ps)
        );
        const nullifier = publicSignalsCalldata[0].toString();
        for (const n of props.waitlistContractState.nullifiers) {
          if (nullifier === n) {
            setErrorMessage(
              'The secret you inputted has already been used to redeem a waitlist spot!'
            );
            setRedeemDisplayState(RedeemDisplayStates.FAILURE);
            return;
          }
        }
        const redeemTx = await props.waitlistContract.redeem(
          proof,
          publicSignalsCalldata
        );
        await redeemTx.wait();
        setRedeemDisplayState(RedeemDisplayStates.SUCCESS);
        return;
      } catch (error) {
        setErrorMessage(
          'Failed to send transaction to redeem your spot on the waitlist.'
        );
        console.log(getErrorMessage(error));
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
  };

  const resetRedeemDisplayState = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    event.preventDefault();
    props.updateWaitlistContractState();
    setSecret('');
    setRedeemableIndex(undefined);
    setErrorMessage('');
    setRedeemDisplayState(RedeemDisplayStates.ENTER_SECRET);
  };

  const resetWaitlist = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    event.preventDefault();
    props.resetWaitlistDisplayState();
  };

  const getRedeemDisplayComponent = () => {
    switch (redeemDisplayState) {
    case RedeemDisplayStates.ENTER_SECRET:
      return (
        <div>
            Enter your secret to redeem a waitlist spot:
          <br />
          <form onSubmit={checkRedeemable}>
            <label>
                Secret:
              <input type="number" value={secret} onChange={updateSecret} />
            </label>
            <br />
            <input type="submit" value="Submit" />
          </form>
        </div>
      );
    case RedeemDisplayStates.ALL_SPOTS_REDEEMED:
      return (
        <div>
            All spots on the waitlist have been redeemed.
          <br />
          <button onClick={resetWaitlist}>Create a new waitlist</button>
        </div>
      );
    case RedeemDisplayStates.CHECKING_SECRET:
      return (
        <div>
            Checking to see if your secret can be redeemed. This will take a few
            seconds...
        </div>
      );
    case RedeemDisplayStates.REDEEMABLE:
      return (
        <div>
            Your secret can redeem the waitlist spot with commitment:
          <br />
          {getHexFromBigNumberString(
            props.waitlistContractState.commitments[redeemableIndex!]
          )}
          <br />
          <button onClick={submitRedemption}>Redeem my spot</button>
          <button onClick={resetRedeemDisplayState}>Cancel</button>
        </div>
      );
    case RedeemDisplayStates.NOT_REDEEMABLE:
      return (
        <div>
            The secret you provided does not correspond to any waitlist spot.
          <br />
          <button onClick={resetRedeemDisplayState}>Try again</button>
        </div>
      );
    case RedeemDisplayStates.SUCCESS:
      return (
        <div>
            Successfully redeemed the waitlist spot corresponding to commitment:
          <br />
          {getHexFromBigNumberString(
            props.waitlistContractState.commitments[redeemableIndex!]
          )}
          <br />
          <button onClick={resetRedeemDisplayState}>Ok</button>
          <button onClick={resetWaitlist}>Create a new waitlist</button>
        </div>
      );
    case RedeemDisplayStates.GENERATING_PROOF:
      return (
        <div>
            Generating proof to redeem your spot. This will take a few
            seconds...
        </div>
      );
    case RedeemDisplayStates.SENDING_REDEEM_TX:
      return (
        <div>
            Sending transaction to redeem your spot. This may take a while...
        </div>
      );
    case RedeemDisplayStates.FAILURE:
      return (
        <div>
            Failed to redeem your waitlist spot: {errorMessage}
          <br />
          <button onClick={resetRedeemDisplayState}>Go Back</button>
        </div>
      );
    }
  };

  return <div>{getRedeemDisplayComponent()}</div>;
}
