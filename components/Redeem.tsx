import { VStack, Text, Heading, Box, Button, HStack } from '@chakra-ui/react';
import { ethers } from 'ethers';
import React, { useEffect, useState } from 'react';
import {
  getHexFromBigNumberString,
  NONEMPTY_ALPHANUMERIC_REGEX,
} from '../utils/Parsing';
import { getErrorMessage } from '../utils/Errors';
import { WaitlistContractStateType } from './Waitlist';
import { FailurePanel, LoadingPanel, SuccessPanel } from './Utils';

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

  const redeemDisplayText = (
    <Text color="app.100" maxWidth={'50%'}>
      Once the waitlist has been locked, anyone who possesses a secret used to
      generate a commitment can redeem the corresponding spot on the waitlist.
      The user generates a zero knowledge proof that they know the secret
      corresponding to a commitment which is part of the Merkle tree of
      commitments.
      <br />
      <br />
      While submitting a redemption, the user must also hash the secret into a
      nullifier, and prove that they performed the hash correctly. The nullifier
      is then stored in the waitlist contract so that multiple redemptions for
      the same commitment are not allowed.
    </Text>
  );

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
          <FailurePanel
            failureMessage={
              'All spots on the waitlist have been redeemed. Create a new waitlist to start again!'
            }
          />
        );
      case RedeemDisplayStates.CHECKING_SECRET:
        return (
          <LoadingPanel loadingMessage="Checking to see if your secret can be redeemed..." />
        );
      case RedeemDisplayStates.REDEEMABLE:
        return (
          <VStack>
            <Box bg="success.100" borderRadius="lg" p={3} color="white">
              {'Your secret can redeem the waitlist spot with commitment:\n' +
                getHexFromBigNumberString(
                  props.waitlistContractState.commitments[redeemableIndex!]
                )}
            </Box>
            <HStack>
              <Button onClick={submitRedemption}>Redeem Spot</Button>
              <Button onClick={resetRedeemDisplayState}>Cancel</Button>
            </HStack>
          </VStack>
        );
      case RedeemDisplayStates.NOT_REDEEMABLE:
        return (
          <FailurePanel
            failureMessage={
              'The secret you provided does not correspond to any waitlist spot.'
            }
            proceedFunction={resetRedeemDisplayState}
            proceedFunctionMessage="Try Again"
          />
        );
      case RedeemDisplayStates.GENERATING_PROOF:
        return (
          <LoadingPanel loadingMessage="(1/2) Generating proof to redeem your waitlist spot..." />
        );
      case RedeemDisplayStates.SENDING_REDEEM_TX:
        return (
          <LoadingPanel loadingMessage="(2/2) Sending transaction to redeem your waitlist spot..." />
        );
      case RedeemDisplayStates.SUCCESS:
        return (
          <SuccessPanel
            successMessage={
              'Successfully redeemed the waitlist spot corresponding to commitment:\n' +
              getHexFromBigNumberString(
                props.waitlistContractState.commitments[redeemableIndex!]
              )
            }
            proceedFunction={resetRedeemDisplayState}
            proceedFunctionMessage="Ok"
          />
        );
      case RedeemDisplayStates.FAILURE:
        return (
          <FailurePanel
            failureMessage={
              'Failed to redeem your waitlist spot:\n' + errorMessage
            }
            proceedFunction={resetRedeemDisplayState}
            proceedFunctionMessage="Go Back"
          />
        );
    }
  };

  return (
    <VStack marginTop={'3%'} marginBottom={'5%'} spacing={'3%'}>
      <Heading size="2xl" textColor={'app.200'}>
        Redeem
      </Heading>
      {redeemDisplayText}
      {getRedeemDisplayComponent()}
    </VStack>
  );
}
