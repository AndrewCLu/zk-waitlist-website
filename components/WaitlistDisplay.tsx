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
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  useDisclosure,
  ModalFooter,
} from '@chakra-ui/react';
import { CopyIcon, LockIcon, UnlockIcon } from '@chakra-ui/icons';

import React from 'react';
import { getLeadingHexFromBigNumberString } from '../utils/Parsing';
import { WaitlistContractStateType, WaitlistDisplayStates } from './Waitlist';

type CommitmentSpotProps = {
  index: number;
  commitment: string | null;
  isUserOwned: boolean;
};

function CommitmentSpot(props: CommitmentSpotProps) {
  if (props.commitment == null) {
    return (
      <Box
        bg={'white'}
        borderRadius="lg"
        p={8}
        color="app.500"
        width="200px"
        height="120px"
        textAlign="center"
        border="1px"
        borderColor="app.500"
      >
        <Text marginTop="5px">{'Commitment ' + props.index + ':'}</Text>
        <Text>Not claimed</Text>
      </Box>
    );
  } else
    return (
      <Box
        bg={props.isUserOwned ? 'app.500' : 'app.200'}
        borderRadius="lg"
        p={8}
        color="white"
        width="200px"
        height="120px"
        textAlign="center"
      >
        <Text marginTop="5px">{'Commitment ' + props.index + ':'}</Text>
        <Text>{props.commitment}</Text>
        <Text>{props.isUserOwned ? '(claimed by you)' : null}</Text>
      </Box>
    );
}

type NullifierSpotProps = {
  index: number;
  nullifier: string | null;
  isUserOwned: boolean;
};

function NullifierSpot(props: NullifierSpotProps) {
  if (props.nullifier == null) {
    return (
      <Box
        bg={'white'}
        borderRadius="lg"
        p={8}
        color="app.500"
        width="200px"
        height="120px"
        textAlign="center"
        border="1px"
        borderColor="app.500"
      >
        <Text marginTop="5px">{'Nullifier ' + props.index + ':'}</Text>
        <Text>Not redeemed</Text>
      </Box>
    );
  } else
    return (
      <Box
        bg={props.isUserOwned ? 'app.500' : 'app.200'}
        borderRadius="lg"
        p={8}
        color="white"
        width="200px"
        height="120px"
        textAlign="center"
      >
        <Text marginTop="5px">{'Nullifier ' + props.index + ':'}</Text>
        <Text>{props.nullifier}</Text>
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
  const { isOpen, onOpen, onClose } = useDisclosure();
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

  const headerComponent = (
    <Flex>
      <HStack spacing={2}>
        <Heading textAlign="center">Your Waitlist</Heading>
        {lockComponent}
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
      <Spacer />
      <Button onClick={onOpen} colorScheme="app">
        Create New Waitlist
      </Button>
    </Flex>
  );

  const commitments = props.waitlistContractState.commitments;
  const userCommitments = props.waitlistContractState?.userCommitments;
  const commitmentComponent = (
    <VStack>
      <Text color="app.500" as="b">
        {commitments.length} / {props.waitlistContractState.maxWaitlistSpots}{' '}
        spots claimed
      </Text>
      <HStack spacing={6}>
        {[...Array(props.waitlistContractState.maxWaitlistSpots)].map(
          (_, i) => {
            if (i < commitments.length) {
              return CommitmentSpot({
                index: i,
                commitment:
                  getLeadingHexFromBigNumberString(commitments[i]) + '...',
                isUserOwned: userCommitments.includes(commitments[i]),
              });
            } else
              return CommitmentSpot({
                index: i,
                commitment: null,
                isUserOwned: false,
              });
          }
        )}
      </HStack>
    </VStack>
  );

  const nullifiers = props.waitlistContractState.nullifiers;
  const userNullifiers = props.waitlistContractState?.userNullifiers;
  const nullifierComponent = (
    <VStack>
      <Text color="app.500" as="b">
        {props.waitlistContractState.nullifiers.length} /{' '}
        {props.waitlistContractState.commitments.length} spots redeemed
      </Text>
      <HStack spacing={6}>
        {[...Array(props.waitlistContractState.maxWaitlistSpots)].map(
          (_, i) => {
            if (i < nullifiers.length) {
              return NullifierSpot({
                index: i,
                nullifier:
                  getLeadingHexFromBigNumberString(nullifiers[i]) + '...',
                isUserOwned: userNullifiers.includes(nullifiers[i]),
              });
            } else
              return NullifierSpot({
                index: i,
                nullifier: null,
                isUserOwned: false,
              });
          }
        )}
      </HStack>
    </VStack>
  );

  const resetWaitlistModal = (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Confirm Create New Waitlist</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          Once you create a new waitlist, you current waitlist state will be
          refreshed. Do you wish to proceed?
        </ModalBody>

        <ModalFooter>
          <Button colorScheme="app" mr={3} onClick={onClose}>
            Close
          </Button>
          <Button color="app.500" onClick={props.resetWaitlistDisplayState}>
            Create New Waitlist
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );

  return (
    <Box bg="app.300" marginTop={'3%'} borderRadius="lg" p={6} width="100%">
      <VStack align="left" spacing={5}>
        {headerComponent}
        {commitmentComponent}
        {props.waitlistContractState.isLocked ? nullifierComponent : null}
      </VStack>
      {resetWaitlistModal}
    </Box>
  );
}
