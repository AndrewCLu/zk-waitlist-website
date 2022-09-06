import { ethers } from 'ethers';
import React, { useState } from 'react';
import { getErrorMessage } from '../utils/Errors';
import { getHexFromBigNumberString } from '../utils/Parsing';
import { WaitlistContractStateType } from './Waitlist';

enum DeployDisplayStates {
  NOT_DEPLOYED,
  SUCCESS,
  FAILURE
}

type DeployProps = {
  waitlistContract: ethers.Contract,
  waitlistContractState: WaitlistContractStateType,
  setDeployedWaitlistContractAddress: () => void,
}

export default function Deploy (props: DeployProps) {
  const [deployDisplayState, setDeployDisplayState] = useState<DeployDisplayStates>(DeployDisplayStates.NOT_DEPLOYED);
  const [secret, setSecret] = useState<string>('');
  const [commitment, setCommitment] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const updateSecret = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSecret(event.currentTarget.value);
  }

  // Generates a commitment by passing the secret to the api/commitment endpoint
  // Displays the commitment if successful
  const generateCommitment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (secret.length === 0) { 
      setErrorMessage('Secret cannot be empty!');
      setCommitDisplayState(CommitDisplayStates.FAILURE);
      return; 
    }
    setCommitDisplayState(CommitDisplayStates.GENERATING);
    const url = '/api/commitment?secret='+secret;
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
  }

  const joinWaitlist = async (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    event.preventDefault();
    if (commitment.length === 0) {
      setErrorMessage('Must provide commitment string!');
      setCommitDisplayState(CommitDisplayStates.FAILURE);
      return; 
    } 
    if (props.waitlistContractState.isLocked) {
      setErrorMessage('The waitlist has been locked! No more entries are allowed.');
      setCommitDisplayState(CommitDisplayStates.FAILURE);
      return; 
    }
    if (props.waitlistContractState.userCommitments.length > 0) {
      setErrorMessage('You have already claimed a spot on the waitlist!');
      setCommitDisplayState(CommitDisplayStates.FAILURE);
      return; 
    }
    if (props.waitlistContractState.commitments.length >= props.waitlistContractState.maxWaitlistSpots) {
      setErrorMessage('The waitlist is full! No more entries are allowed.');
      setCommitDisplayState(CommitDisplayStates.FAILURE);
      return; 
    }
    for (const c of props.waitlistContractState.commitments) {
      if (commitment === c) {
        setErrorMessage('This secret has already been used to claim a spot. Please try another.');
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
      setErrorMessage("Failed to send transaction to claim your spot on the waitlist.");
      console.log(getErrorMessage(error));
      setCommitDisplayState(CommitDisplayStates.FAILURE);
    }
  }

  const resetCommitDisplayState = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    event.preventDefault();
    props.updateWaitlistContractState();
    setSecret('');
    setCommitment('');
    setErrorMessage('');
    setCommitDisplayState(CommitDisplayStates.ENTER_SECRET);
  }

  const getDeployDisplayComponent = () => {
    switch(deployDisplayState) {
      case DeployDisplayStates.NOT_DEPLOYED:
        return (
          <div>
            Need to deploy waitlist contract. 
            <br/>
            <button onClick={deployWaitlistContract}>Deploy Waitlist Contract</button>
          </div>
        )
    }
  }

  return (
    <div>
      {getDeployDisplayComponent()}
    </div>
  )
}