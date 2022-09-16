import { VStack, Button, Text, Heading, Box, Spinner } from '@chakra-ui/react';
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
      WAITLIST_CONTRACT_BYTECODE,
      props.signer
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

  const deployDisplayText = (
    <Text color="app.100" maxWidth={'60%'}>
      Before we begin, we must deploy the waitlist smart contracts. We actually
      have three contracts to deploy, as we must create contracts to verify the
      zero knowledge proofs for locking the waitlist and redeeming a spot, as
      well as the waitlist itself. This verifier functionality could be included
      in the waitlist contract, but separating it allows us to swap in verifiers
      with different verification abilities in the future.
      <br />
      <br />
      Clicking the button below will trigger three deployments to the Goerli
      testnet. Each deployment will take around 15 seconds and requires Metamask
      approval. After you are done, we will be able to view the waitlist!
    </Text>
  );
  const getDeployDisplayComponent = () => {
    switch (deployDisplayState) {
      case DeployDisplayStates.NOT_DEPLOYED:
        return (
          <Button color="app.500" onClick={deployWaitlistContract}>
            Deploy Waitlist Contracts
          </Button>
        );
      case DeployDisplayStates.DEPLOYING_LOCKER_VERIFIER:
        return (
          <Box backgroundColor="app.300" borderRadius="lg" p={6} width="35%">
            <VStack spacing={'20%'}>
              <Text color="app.200" fontSize="xl" as="b" textAlign="center">
                (1/3) Deploying the locker verifier contract...
              </Text>
              <Spinner thickness="4px" speed="1s" color="app.200" size="xl" />
            </VStack>
          </Box>
        );
      case DeployDisplayStates.DEPLOYING_REDEEMER_VERIFIER:
        return (
          <Box backgroundColor="app.300" borderRadius="lg" p={6} width="35%">
            <VStack spacing={'20%'}>
              <Text color="app.200" fontSize="xl" as="b" textAlign="center">
                (2/3) Deploying the redeemer verifier contract...
              </Text>
              <Spinner thickness="4px" speed="1s" color="app.200" size="xl" />
            </VStack>
          </Box>
        );
      case DeployDisplayStates.DEPLOYING_WAITLIST:
        return (
          <Box backgroundColor="app.300" borderRadius="lg" p={6} width="35%">
            <VStack spacing={'20%'}>
              <Text color="app.200" fontSize="xl" as="b" textAlign="center">
                (3/3) Deploying the waitlist contract...
              </Text>
              <Spinner thickness="4px" speed="1s" color="app.200" size="xl" />
            </VStack>
          </Box>
        );
      case DeployDisplayStates.SUCCESS:
        return (
          <VStack>
            <Box bg="success.100" borderRadius="lg" p={3} color="white">
              Successfully deployed all contracts!
            </Box>
          </VStack>
        );
      case DeployDisplayStates.FAILURE:
        return (
          <VStack>
            <Box bg="errors.100" borderRadius="lg" p={3} color="white">
              Error: Failed to deploy contracts
            </Box>
            <Button onClick={resetDeployDisplayState}>Go Back</Button>
          </VStack>
        );
    }
  };

  return (
    <VStack marginTop={'10%'} spacing={'5%'}>
      <Heading size="2xl" textColor={'app.200'}>
        Deployment
      </Heading>
      {deployDisplayText}
      {getDeployDisplayComponent()}
    </VStack>
  );
}
