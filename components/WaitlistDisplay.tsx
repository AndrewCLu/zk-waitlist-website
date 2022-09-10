import { Box, HStack } from '@chakra-ui/react';
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
  return (
    <Box bg="purple" borderRadius="lg" p={8} color="white">
      {props.text}
    </Box>
  );
}

type WaitlistDisplayProps = {
  waitlistDisplayState: WaitlistDisplayStates;
  waitlistContractState?: WaitlistContractStateType;
  waitlistContractStateLoading: boolean;
  updateWaitlistContractState: () => void;
  resetWaitlistDisplayState: () => void;
};

export default function WaitlistDisplay(props: WaitlistDisplayProps) {
  if (props.waitlistContractStateLoading || !props.waitlistContractState) {
    return <div>Loading waitlist state...</div>;
  }

  const updateButton = (
    <button onClick={props.updateWaitlistContractState}>
      Update Waitlist State
    </button>
  );

  const resetButton = (
    <button onClick={props.resetWaitlistDisplayState}>
      Create New Waitlist
    </button>
  );

  const userCommitments = props.waitlistContractState?.userCommitments;
  const commitmentComponent = (
    <div>
      The following commitment(s) are claimed in the waitlist:
      <br />
      <HStack>
        {props.waitlistContractState.commitments.map((c, i) =>
          WaitlistSpot({
            index: i,
            text: getLeadingHexFromBigNumberString(c) + '...',
            isUserOwned: c in userCommitments,
          })
        )}
      </HStack>
      {userCommitments && userCommitments.length > 0 ? (
        <div>
          You have claimed the waitlist spot(s) corresponding to the following
          commitment(s):
          <br />
          {userCommitments.map((c, i) => (
            <div key={i + 1}>{i + 1 + '. ' + getHexFromBigNumberString(c)}</div>
          ))}
        </div>
      ) : null}
    </div>
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

  const lockedComponent = (
    <div>
      {props.waitlistContractState.isLocked ? (
        <div>The waitlist is locked.</div>
      ) : (
        <div>The waitlist is not locked.</div>
      )}
    </div>
  );

  const spotsClaimedComponent = (
    <div>
      {props.waitlistContractState.commitments.length} out of{' '}
      {props.waitlistContractState.maxWaitlistSpots} spots on the waitlist have
      been claimed
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
            {updateButton} {resetButton}
            <br />
            {spotsClaimedComponent}
            <br />
            {lockedComponent}
            <br />
            {commitmentComponent}
          </div>
        );
      case WaitlistDisplayStates.LOCK:
        return (
          <div>
            {updateButton} {resetButton}
            <br />
            {spotsClaimedComponent}
            <br />
            {lockedComponent}
            <br />
            {commitmentComponent}
          </div>
        );
      case WaitlistDisplayStates.REDEEM:
        return (
          <div>
            {updateButton} {resetButton}
            <br />
            {spotsClaimedComponent}
            <br />
            {lockedComponent}
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
