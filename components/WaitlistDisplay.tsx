import {
  Box,
  Button,
  HStack,
  Flex,
  Text,
  Heading,
  Spacer,
  IconButton,
  useToast,
} from '@chakra-ui/react';
import { CopyIcon, LockIcon, UnlockIcon } from '@chakra-ui/icons';

import React from 'react';
import {
  getHexFromBigNumberString,
  getLeadingHexFromBigNumberString,
} from '../utils/Parsing';
import { WaitlistContractStateType, WaitlistDisplayStates } from './Waitlist';

type WaitlistSpotProps = {
  index: number;
  text: string;
  isUserOwned: boolean;
};

function WaitlistSpot(props: WaitlistSpotProps) {
  const color = props.isUserOwned ? 'app.500' : 'app.200';
  return (
    <Box bg={color} borderRadius="lg" p={8} color="white" height="100px">
      <Text marginTop="5px">{props.index + '. ' + props.text}</Text>
      <Text textAlign="center">
        {props.isUserOwned ? '(claimed by you)' : null}
      </Text>
    </Box>
  );
}

type WaitlistDisplayProps = {
  waitlistDisplayState: WaitlistDisplayStates;
  waitlistContractAddress: string;
  waitlistContractState?: WaitlistContractStateType;
  waitlistContractStateLoading: boolean;
  updateWaitlistContractState: () => void;
  resetWaitlistDisplayState: () => void;
};

export default function WaitlistDisplay(props: WaitlistDisplayProps) {
  const toast = useToast();

  if (props.waitlistContractStateLoading || !props.waitlistContractState) {
    return (
      <Box bg="app.300" borderRadius="lg" p={6} width="100%">
        <Heading>Loading waitlist state...</Heading>
      </Box>
    );
  }

  const copyWaitlistAddress = () => {
    navigator.clipboard.writeText(props.waitlistContractAddress);
    toast({
      title: 'Copied address!',
      // eslint-disable-next-line quotes
      description: "You've copied the waitlist contract address.",
      status: 'success',
      duration: 1000,
      isClosable: true,
    });
  };

  const updateButton = (
    <Button onClick={props.updateWaitlistContractState}>
      Update Waitlist State
    </Button>
  );

  const lockComponent = props.waitlistContractState?.isLocked ? (
    <LockIcon color="red" />
  ) : (
    <UnlockIcon color="green" />
  );

  const userCommitments = props.waitlistContractState?.userCommitments;
  const commitmentComponent = (
    <Box bg="app.300" borderRadius="lg" p={6} width="100%">
      <Flex>
        <Heading textAlign="center">Your Waitlist</Heading>
        <Spacer />
        <Button onClick={props.resetWaitlistDisplayState} colorScheme="app">
          Create New Waitlist
        </Button>
      </Flex>
      <Flex>
        <HStack spacing={2}>
          {lockComponent}
          <Text color="app.500">
            {props.waitlistContractState.commitments.length} /{' '}
            {props.waitlistContractState.maxWaitlistSpots} spots claimed
          </Text>
        </HStack>
        <Spacer />
        <HStack>
          <Text color="app.500">
            Contract address: {props.waitlistContractAddress}
          </Text>
          <IconButton
            onClick={copyWaitlistAddress}
            aria-label="Copy waitlist address"
            icon={<CopyIcon color="app.500" />}
          ></IconButton>
        </HStack>
      </Flex>
      <br />
      <HStack spacing={6}>
        {props.waitlistContractState.commitments.map((c, i) =>
          WaitlistSpot({
            index: i,
            text: getLeadingHexFromBigNumberString(c) + '...',
            isUserOwned: userCommitments.includes(c),
          })
        )}
      </HStack>
    </Box>
  );

  const userNullifiers = props.waitlistContractState?.userNullifiers;
  const nullifierComponent = (
    <div>
      The following nullifier(s) have been used:
      <br />
      {props.waitlistContractState.nullifiers.map((n, i) => (
        <div key={i + 1}>
          {i + 1 + '. ' + getLeadingHexFromBigNumberString(n) + '...'}
        </div>
      ))}
      {userNullifiers && userNullifiers.length > 0 ? (
        <div>
          You have redeemed the waitlist spot(s) corresponding to the following
          nullifiers(s):
          <br />
          {userNullifiers.map((n, i) => (
            <div key={i + 1}>{i + 1 + '. ' + getHexFromBigNumberString(n)}</div>
          ))}
        </div>
      ) : null}
    </div>
  );

  const spotsRedeemedComponent = (
    <div>
      {props.waitlistContractState.nullifiers.length} out of{' '}
      {props.waitlistContractState.commitments.length} spots on the waitlist
      have been redeemed
    </div>
  );

  const getWaitlistDisplayComponent = () => {
    switch (props.waitlistDisplayState) {
      case WaitlistDisplayStates.COMMIT:
        return (
          <div>
            {updateButton}
            <br />
            {commitmentComponent}
          </div>
        );
      case WaitlistDisplayStates.LOCK:
        return (
          <div>
            {updateButton}
            <br />
            {commitmentComponent}
          </div>
        );
      case WaitlistDisplayStates.REDEEM:
        return (
          <div>
            {updateButton}
            <br />
            {commitmentComponent}
            <br />
            {spotsRedeemedComponent}
            <br />
            {nullifierComponent}
          </div>
        );
    }
  };

  return <div>{getWaitlistDisplayComponent()}</div>;
}
