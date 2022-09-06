import { ethers } from 'ethers';
import React, { useState } from 'react';
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
  const [errorMessage, setErrorMessage] = useState('');

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

    const lockerVerifier = await lockerVerifierFactory.deploy();
    const lockerVerifierAddress = lockerVerifier.address;
    const redeemerVerifier = await redeemerVerifierFactory.deploy();
    const redeemerVerifierAddress = redeemerVerifier.address;
    const waitlist = await waitlistFactory.deploy(
      2,
      lockerVerifierAddress,
      redeemerVerifierAddress
    );
    const waitlistAddress = waitlist.address;

    await Promise.all([
      lockerVerifier.deployTransaction.wait(),
      redeemerVerifier.deployTransaction.wait(),
      waitlist.deployTransaction.wait(),
    ]);

    props.setDeployedWaitlistContractAddress(waitlistAddress);
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
    }
  };

  return <div>{getDeployDisplayComponent()}</div>;
}
