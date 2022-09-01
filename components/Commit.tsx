import { ethers } from 'ethers';
import React, { useState } from 'react';
import { getErrorMessage } from '../utils/Errors';
import { getHexFromBigNumberString } from '../utils/Parsing';

enum CommitDisplayStates {
  ENTER_SECRET,
  GENERATING,
  GENERATED,
  SUBMITTING,
  SUCCESS,
  FAILURE
}

type CommitProps = {
  waitlistContract: ethers.Contract
}

export default function Commit (props: CommitProps) {
  const [commitDisplayState, setCommitDisplayState] = useState<CommitDisplayStates>(CommitDisplayStates.ENTER_SECRET);
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
    setCommitDisplayState(CommitDisplayStates.SUBMITTING);
    try {
      const joinTx = await props.waitlistContract.join(commitment);
      await joinTx.wait();
      setCommitDisplayState(CommitDisplayStates.SUCCESS);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
      setCommitDisplayState(CommitDisplayStates.FAILURE);
    }
  }

  const resetCommitDisplayState = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    event.preventDefault();
    setSecret('');
    setCommitment('');
    setErrorMessage('');
    setCommitDisplayState(CommitDisplayStates.ENTER_SECRET);
  }

  const getCommitDisplayComponent = () => {
    switch(commitDisplayState) {
      case CommitDisplayStates.ENTER_SECRET:
        return (
          <div>
            Choose a secret to join the waitlist:
            <form onSubmit={generateCommitment}>
              <label>
                Secret:
                <input type="number" value={secret} onChange={updateSecret} /> 
              </label>
              <input type="submit" value="Submit" />
            </form>
          </div>
        )
      case CommitDisplayStates.GENERATING:
        return (
          <div>
            Generating a commitment based on the secret you chose. This will take a second...
          </div>
        )
      case CommitDisplayStates.GENERATED:
        return (
          <div>
            <div>
              Successfully generated a commitment based on your secret:
              <br/>
              {getHexFromBigNumberString(commitment)}
            </div>
            <br/>
            <button onClick={joinWaitlist}>Join the waitlist</button>
            <button onClick={resetCommitDisplayState}>Use a different secret</button>
          </div>
        )
      case CommitDisplayStates.SUBMITTING:
        return (
          <div>
            Joining the waitlist using the commitment. This may take a while...
          </div>
        )
      case CommitDisplayStates.SUCCESS:
        return (
          <div>
            Successfully joined the waitlist using commitment:
            <br/>
            {commitment}
            <br/>
            <button onClick={resetCommitDisplayState}>Ok</button>
          </div>
        )
      case CommitDisplayStates.FAILURE:
        return (
          <div>
            Failed to claim your spot on the waitlist: {errorMessage}
            <br/>
            <button onClick={resetCommitDisplayState}>Try again</button>
          </div>
        )
    }
  }

  return (
    <div>
      {getCommitDisplayComponent()}
    </div>
  )
}