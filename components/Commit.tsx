import {
  Button,
  FormControl,
  FormLabel,
  Heading,
  NumberInput,
  NumberInputField,
  Text,
  VStack,
} from '@chakra-ui/react';
import { ethers } from 'ethers';
import React, { useState } from 'react';
import { getErrorMessage } from '../utils/Errors';
import { getHexFromBigNumberString } from '../utils/Parsing';
import { FailurePanel, LoadingPanel, SuccessPanel } from './Utils';
import { WaitlistContractStateType } from './Waitlist';

enum CommitDisplayStates {
  ENTER_SECRET,
  GENERATING,
  GENERATED,
  SUBMITTING,
  SUCCESS,
  FAILURE,
}

type CommitProps = {
  waitlistContract: ethers.Contract;
  waitlistContractState: WaitlistContractStateType;
  updateWaitlistContractState: () => void;
};

export default function Commit(props: CommitProps) {
  const [commitDisplayState, setCommitDisplayState] =
    useState<CommitDisplayStates>(CommitDisplayStates.ENTER_SECRET);
  const [secret, setSecret] = useState<string>('');
  const [commitment, setCommitment] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const updateSecret = (valueAsString: string) => {
    setSecret(valueAsString);
  };

  // Generates a commitment by passing the secret to the api/commitment endpoint
  // Displays the commitment if successful
  const generateCommitment = async (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    event.preventDefault();
    if (secret.length === 0) {
      setErrorMessage('Secret cannot be empty!');
      setCommitDisplayState(CommitDisplayStates.FAILURE);
      return;
    }
    setCommitDisplayState(CommitDisplayStates.GENERATING);
    const url = '/api/commitment?secret=' + secret;
    const res = await fetch(url);
    const json = await res.json();
    if (res.status === 200) {
      setCommitment(json.commitment);
      setCommitDisplayState(CommitDisplayStates.GENERATED);
    } else {
      let errorMessage = 'Unable to generate commitment';
      if (res.status === 400) {
        errorMessage += ': ' + json.error;
      }
      setErrorMessage(errorMessage);
      setCommitDisplayState(CommitDisplayStates.FAILURE);
    }
  };

  const joinWaitlist = async (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    event.preventDefault();
    if (commitment.length === 0) {
      setErrorMessage('Must provide commitment string!');
      setCommitDisplayState(CommitDisplayStates.FAILURE);
      return;
    }
    if (props.waitlistContractState.isLocked) {
      setErrorMessage(
        'The waitlist has been locked! No more entries are allowed.'
      );
      setCommitDisplayState(CommitDisplayStates.FAILURE);
      return;
    }
    if (props.waitlistContractState.userCommitments.length > 0) {
      setErrorMessage('You have already claimed a spot on the waitlist!');
      setCommitDisplayState(CommitDisplayStates.FAILURE);
      return;
    }
    if (
      props.waitlistContractState.commitments.length >=
      props.waitlistContractState.maxWaitlistSpots
    ) {
      setErrorMessage('The waitlist is full! No more entries are allowed.');
      setCommitDisplayState(CommitDisplayStates.FAILURE);
      return;
    }
    for (const c of props.waitlistContractState.commitments) {
      if (commitment === c) {
        setErrorMessage(
          'This secret has already been used to claim a spot. Please try another.'
        );
        setCommitDisplayState(CommitDisplayStates.FAILURE);
        return;
      }
    }
    setCommitDisplayState(CommitDisplayStates.SUBMITTING);
    try {
      const joinTx = await props.waitlistContract.join(commitment);
      await joinTx.wait();
      setCommitDisplayState(CommitDisplayStates.SUCCESS);
    } catch (error) {
      setErrorMessage(
        'Failed to send transaction to claim your spot on the waitlist.'
      );
      console.log(getErrorMessage(error));
      setCommitDisplayState(CommitDisplayStates.FAILURE);
    }
  };

  const resetCommitDisplayState = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    event.preventDefault();
    props.updateWaitlistContractState();
    setSecret('');
    setCommitment('');
    setErrorMessage('');
    setCommitDisplayState(CommitDisplayStates.ENTER_SECRET);
  };

  const getCommitDisplayComponent = () => {
    switch (commitDisplayState) {
      case CommitDisplayStates.ENTER_SECRET:
        return (
          <FormControl width="35%">
            <FormLabel>
              Enter a secret number to claim your waitlist spot:
            </FormLabel>
            <NumberInput value={secret} onChange={updateSecret}>
              <NumberInputField />
            </NumberInput>
            <Button onClick={generateCommitment} marginTop={3} color="app.500">
              Submit
            </Button>
          </FormControl>
        );
      case CommitDisplayStates.GENERATING:
        return (
          <LoadingPanel loadingMessage="Generating a commitment based on the secret you chose..." />
        );
      case CommitDisplayStates.GENERATED:
        return (
          <div>
            <div>
              Successfully generated a commitment based on your secret:
              <br />
              {getHexFromBigNumberString(commitment)}
            </div>
            <br />
            <button onClick={joinWaitlist}>Join the waitlist</button>
            <button onClick={resetCommitDisplayState}>
              Use a different secret
            </button>
          </div>
        );
      case CommitDisplayStates.SUBMITTING:
        return (
          <LoadingPanel loadingMessage="Sending your commitment to the waitlist contract..." />
        );
      case CommitDisplayStates.SUCCESS:
        return (
          <SuccessPanel
            successMessage={
              'Successfully joined the waitlist using commitment:\n' +
              getHexFromBigNumberString(commitment)
            }
            proceedFunction={resetCommitDisplayState}
            proceedFunctionMessage="Ok"
          />
        );
      case CommitDisplayStates.FAILURE:
        return (
          <FailurePanel
            failureMessage={
              'Failed to claim your spot on the waitlist:\n' + errorMessage
            }
            proceedFunction={resetCommitDisplayState}
            proceedFunctionMessage="Try Again"
          />
        );
    }
  };

  const commitDisplayText = (
    <Text color="app.100" maxWidth={'50%'}>
      To join the waitlist, a user must first make a commitment. First, they
      select a secret number - the secret must remain private amongst the
      parties who wish to be able to redeem the claimed spot later on. This
      secret is then hashed into a public commitment which is sent to the
      waitlist smart contract.
      <br />
      <br />
      In this demo, every user is entitled to one spot on the waitlist as long
      as they provide a commitment corresponding to a unique secret. In the
      future, it is possible to require users to meet certain requirements to
      join the waitlist, such as having a certain account balance or having
      participated in a previous waitlist.
    </Text>
  );

  return (
    <VStack marginTop={'3%'} marginBottom={'5%'} spacing={'3%'}>
      <Heading size="2xl" textColor={'app.200'}>
        Commit
      </Heading>
      {commitDisplayText}
      {getCommitDisplayComponent()}
    </VStack>
  );
}
