import { ethers } from 'ethers';
import React from 'react';
import { Button, Box } from '@chakra-ui/react';

export enum MetamaskConnectionStates {
  UNDEFINED,
  NOT_INSTALLED,
  NOT_CONNECTED,
  WRONG_NETWORK,
  CONNECTED,
}

type MetamaskProps = {
  metamaskState: MetamaskConnectionStates;
};
export function Metamask(props: MetamaskProps) {
  const { metamaskState } = props;

  // Tries to authorize metamask
  const connectToMetamask = async () => {
    console.log('Attempting to connect to metamask...');
    if (metamaskState === MetamaskConnectionStates.NOT_INSTALLED) {
      console.log('Must have metamask installed!');
      return;
    }
    const provider = new ethers.providers.Web3Provider(
      (window as any).ethereum
    );
    try {
      await provider?.send('eth_requestAccounts', []);
    } catch {
      console.log('Failed to connect to metamask');
    }
  };

  const getRenderObject = (): JSX.Element => {
    switch (metamaskState) {
      case MetamaskConnectionStates.UNDEFINED:
        return (
          <Box
            as="button"
            borderRadius="md"
            bg="yellow.500"
            color="white"
            px={'16px'}
            h={'40px'}
          >
            Loading...
          </Box>
        );
      case MetamaskConnectionStates.NOT_INSTALLED:
        return (
          <Box
            as="button"
            borderRadius="md"
            bg="yellow.500"
            color="white"
            px={'16px'}
            h={'40px'}
          >
            Please install Metamask and refresh the page
          </Box>
        );
      case MetamaskConnectionStates.NOT_CONNECTED:
        return (
          <div>
            <Button
              colorScheme="orange"
              variant="solid"
              onClick={connectToMetamask}
            >
              Connect To Metamask
            </Button>
          </div>
        );
      case MetamaskConnectionStates.WRONG_NETWORK:
        return (
          <Box
            as="button"
            borderRadius="md"
            bg="yellow.500"
            color="white"
            px={'16px'}
            h={'40px'}
          >
            Please change to Goerli network
          </Box>
        );
      case MetamaskConnectionStates.CONNECTED:
        return (
          <Box
            as="button"
            borderRadius="md"
            bg="yellow.500"
            color="white"
            px={'16px'}
            h={'40px'}
          >
            Connected to metamask!
          </Box>
        );
    }
  };

  return (
    <div>
      <Box>{getRenderObject()}</Box>
    </div>
  );
}
