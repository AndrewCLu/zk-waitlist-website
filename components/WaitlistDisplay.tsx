import {
  Box,
  Button,
  HStack,
  Flex,
  Text,
  Heading,
  Spacer,
  IconButton,
  Center,
  useToast,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  VStack,
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
    <Box
      bg={color}
      borderRadius="lg"
      p={8}
      color="white"
      height="120px"
      textAlign="center"
    >
      <Text marginTop="5px">{'Commitment ' + props.index + ':'}</Text>
      <Text>{props.text}</Text>
      <Text>{props.isUserOwned ? '(claimed by you)' : null}</Text>
    </Box>
  );
}

type NullifierSpotProps = {
  index: number;
  text: string;
  isUserOwned: boolean;
};

function NullifierSpot(props: WaitlistSpotProps) {
  const color = props.isUserOwned ? 'app.500' : 'app.200';
  return (
    <Box
      bg={color}
      borderRadius="lg"
      p={8}
      color="white"
      height="120px"
      textAlign="center"
    >
      <Text marginTop="5px">{'Nullifier ' + props.index + ':'}</Text>
      <Text>{props.text}</Text>
      <Text>{props.isUserOwned ? '(redeemed by you)' : null}</Text>
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
      <Box bg="app.300" marginTop={'3%'} borderRadius="lg" p={6} width="100%">
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

  const lockComponent = props.waitlistContractState?.isLocked ? (
    <Popover trigger="hover">
      <PopoverTrigger>
        <IconButton
          aria-label="Locked waitlist"
          icon={<LockIcon color="red" />}
        ></IconButton>
      </PopoverTrigger>
      <PopoverContent color="white" bg="red.500" borderColor="red.500">
        <PopoverBody>
          <Center>
            The waitlist is locked. No more users are allowed to join the
            waitlist.
          </Center>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  ) : (
    <Popover trigger="hover">
      <PopoverTrigger>
        <IconButton
          aria-label="Unlocked waitlist"
          icon={<UnlockIcon color="green" />}
        ></IconButton>
      </PopoverTrigger>
      <PopoverContent color="white" bg="green.500" borderColor="green.500">
        <PopoverBody>
          <Center>
            The waitlist is unlocked. Ensure the waitlist is full and lock it to
            enable redemptions.
          </Center>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );

  const spotsRedeemedComponent = (
    <HStack spacing={2}>
      <Text color="app.500">
        {props.waitlistContractState.nullifiers.length} /{' '}
        {props.waitlistContractState.commitments.length} spots claimed
      </Text>
    </HStack>
  );

  const userNullifiers = props.waitlistContractState?.userNullifiers;
  const nullifierComponent = (
    <HStack spacing={6}>
      {props.waitlistContractState.nullifiers.map((n, i) =>
        NullifierSpot({
          index: i,
          text: getLeadingHexFromBigNumberString(n) + '...',
          isUserOwned: userNullifiers.includes(n),
        })
      )}
    </HStack>
  );

  const userCommitments = props.waitlistContractState?.userCommitments;
  const commitmentComponent = (
    <Box bg="app.300" marginTop={'3%'} borderRadius="lg" p={6} width="100%">
      <VStack align="left" spacing={3}>
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
        <HStack spacing={6}>
          {props.waitlistContractState.commitments.map((c, i) =>
            WaitlistSpot({
              index: i,
              text: getLeadingHexFromBigNumberString(c) + '...',
              isUserOwned: userCommitments.includes(c),
            })
          )}
        </HStack>
      </VStack>
    </Box>
  );

  const getWaitlistDisplayComponent = () => {
    switch (props.waitlistDisplayState) {
      case WaitlistDisplayStates.COMMIT:
        return commitmentComponent;
      case WaitlistDisplayStates.LOCK:
        return commitmentComponent;
      case WaitlistDisplayStates.REDEEM:
        return (
          <div>
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
