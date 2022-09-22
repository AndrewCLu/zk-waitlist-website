import { Button, FormControl, FormLabel, Heading, NumberInput, NumberInputField, VStack } from '@chakra-ui/react';
import { ethers } from 'ethers';
import React, { useState } from 'react';
import { getErrorMessage } from '../utils/Errors';
import { getHexFromBigNumberString } from '../utils/Parsing';
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
              Enter secret number to redeem your waitlist spot:
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
          <div>
            Generating a commitment based on the secret you chose. This will
            take a second...
          </div>
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
          <div>
            Joining the waitlist using the commitment. This may take a while...
          </div>
        );
      case CommitDisplayStates.SUCCESS:
        return (
          <div>
            Successfully joined the waitlist using commitment:
            <br />
            {commitment}
            <br />
            <button onClick={resetCommitDisplayState}>Ok</button>
          </div>
        );
      case CommitDisplayStates.FAILURE:
        return (
          <div>
            Failed to claim your spot on the waitlist: {errorMessage}
            <br />
            <button onClick={resetCommitDisplayState}>Try again</button>
          </div>
        );
    }
  };

  const commitDisplayText = "asd"

  return (
    <VStack marginTop={'3%'} marginBottom={'5%'} spacing={'3%'}>
      <Heading size="2xl" textColor={'app.200'}>
        Redeem
      </Heading>
      {commitDisplayText}
      {getCommitDisplayComponent()}
    </VStack>
  );
}
