import { ethers } from 'ethers';
import React, { useState } from 'react';
import { getErrorMessage } from '../utils/Errors';
import {
  LOCKER_VERIFIER_ABI,
  LOCKER_VERIFIER_BYTECODE,
  REDEEMER_VERIFIER_ABI,
  REDEEMER_VERIFIER_BYTECODE,
  WAITLIST_CONTRACT_ABI,
  WAITLIST_CONTRACT_BYTECODE,
} from '../utils/WaitlistContract';

enum DeployDisplayStates {
  NOT_DEPLOYED,
  DEPLOYING_LOCKER_VERIFIER,
  DEPLOYING_REDEEMER_VERIFIER,
  DEPLOYING_WAITLIST,
  SUCCESS,
  FAILURE,
}

type DeployProps = {
  signer: ethers.Signer;
  setDeployedWaitlistContractAddress: (address: string) => void;
};

export default function Deploy(props: DeployProps) {
  const [deployDisplayState, setDeployDisplayState] =
    useState<DeployDisplayStates>(DeployDisplayStates.NOT_DEPLOYED);

  const deployWaitlistContract = async (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    event.preventDefault();
    const lockerVerifierFactory = new ethers.ContractFactory(
      LOCKER_VERIFIER_ABI,
      LOCKER_VERIFIER_BYTECODE,
      props.signer
    );
    const redeemerVerifierFactory = new ethers.ContractFactory(
      REDEEMER_VERIFIER_ABI,
      REDEEMER_VERIFIER_BYTECODE,
      props.signer
    );
    const waitlistFactory = new ethers.ContractFactory(
      WAITLIST_CONTRACT_ABI,
      WAITLIST_CONTRACT_BYTECODE
    );

    try {
      setDeployDisplayState(DeployDisplayStates.DEPLOYING_LOCKER_VERIFIER);
      const lockerVerifier = await lockerVerifierFactory.deploy();
      const lockerVerifierAddress = lockerVerifier.address;
      await lockerVerifier.deployTransaction.wait();

      setDeployDisplayState(DeployDisplayStates.DEPLOYING_REDEEMER_VERIFIER);
      const redeemerVerifier = await redeemerVerifierFactory.deploy();
      const redeemerVerifierAddress = redeemerVerifier.address;
      await redeemerVerifier.deployTransaction.wait();

      setDeployDisplayState(DeployDisplayStates.DEPLOYING_WAITLIST);
      const waitlist = await waitlistFactory.deploy(
        2,
        lockerVerifierAddress,
        redeemerVerifierAddress
      );
      const waitlistAddress = waitlist.address;
      await waitlist.deployTransaction.wait();

      props.setDeployedWaitlistContractAddress(waitlistAddress);
      setDeployDisplayState(DeployDisplayStates.SUCCESS);
    } catch (error) {
      console.log(getErrorMessage(error));
      setDeployDisplayState(DeployDisplayStates.FAILURE);
    }
  };

  const resetDeployDisplayState = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    event.preventDefault();
    setDeployDisplayState(DeployDisplayStates.NOT_DEPLOYED);
  };

  const getDeployDisplayComponent = () => {
    switch (deployDisplayState) {
      case DeployDisplayStates.NOT_DEPLOYED:
        return (
          <div>
            Need to deploy waitlist contract.
            <br />
            <button onClick={deployWaitlistContract}>
              Deploy Waitlist Contract
            </button>
          </div>
        );
      case DeployDisplayStates.DEPLOYING_LOCKER_VERIFIER:
        return <div>Deploying the locker verifier contract...</div>;
      case DeployDisplayStates.DEPLOYING_REDEEMER_VERIFIER:
        return <div>Deploying the redeemer verifier contract...</div>;
      case DeployDisplayStates.DEPLOYING_WAITLIST:
        return <div>Deploying the waitlist contract...</div>;
      case DeployDisplayStates.SUCCESS:
        return <div>Successfully deployed all contracts.</div>;
      case DeployDisplayStates.FAILURE:
        return (
          <div>
            Failed to deploy contracts.
            <br />
            <button onClick={resetDeployDisplayState}>Go Back</button>
          </div>
        );
    }
  };

  return <div>{getDeployDisplayComponent()}</div>;
}
