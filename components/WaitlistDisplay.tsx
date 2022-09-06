import React from "react";
import {
  getHexFromBigNumberString,
  getLeadingHexFromBigNumberString,
} from "../utils/Parsing";
import { WaitlistContractStateType, WaitlistDisplayStates } from "./Waitlist";

type WaitlistDisplayProps = {
  waitlistDisplayState: WaitlistDisplayStates;
  waitlistContractState?: WaitlistContractStateType;
  waitlistContractStateLoading: boolean;
  updateWaitlistContractState: () => void;
};

export default function WaitlistDisplay(props: WaitlistDisplayProps) {
  const updateButton = (
    <button onClick={props.updateWaitlistContractState}>
      Update Waitlist State
    </button>
  );
  const userCommitments = props.waitlistContractState?.userCommitments;
  const userNullifiers = props.waitlistContractState?.userNullifiers;
  if (props.waitlistContractStateLoading) {
    return <div>Loading waitlist state...</div>;
  }
  if (!props.waitlistContractState) {
    return (
      <div>
        {updateButton}
        <br />
        Could not fetch waitlist state.
      </div>
    );
  }
  return (
    <div>
      {updateButton}
      <br />
      The following commitment(s) are claimed in the waitlist:
      <br />
      {props.waitlistContractState.commitments.map((c, i) => (
        <div key={i + 1}>
          {i + 1 + ". " + getLeadingHexFromBigNumberString(c) + "..."}
        </div>
      ))}
      {userCommitments && userCommitments.length > 0 ? (
        <div>
          You have claimed the waitlist spot(s) corresponding to the following
          commitment(s):
          <br />
          {userCommitments.map((c, i) => (
            <div key={i + 1}>{i + 1 + ". " + getHexFromBigNumberString(c)}</div>
          ))}
        </div>
      ) : null}
      The following nullifier(s) have been used:
      <br />
      {props.waitlistContractState.nullifiers.map((n, i) => (
        <div key={i + 1}>
          {i + 1 + ". " + getLeadingHexFromBigNumberString(n) + "..."}
        </div>
      ))}
      {userNullifiers && userNullifiers.length > 0 ? (
        <div>
          You have redeemed the waitlist spot(s) corresponding to the following
          nullifiers(s):
          <br />
          {userNullifiers.map((n, i) => (
            <div key={i + 1}>{i + 1 + ". " + getHexFromBigNumberString(n)}</div>
          ))}
        </div>
      ) : null}
      There are{" "}
      {props.waitlistContractState.maxWaitlistSpots -
        props.waitlistContractState.commitments.length}{" "}
      spot(s) remaining on the waitlist.
      <br />
      {props.waitlistContractState.isLocked ? (
        <div>The waitlist is locked.</div>
      ) : (
        <div>The waitlist is not locked.</div>
      )}
      Merkle root:{" "}
      {getHexFromBigNumberString(props.waitlistContractState.merkleRoot)}
    </div>
  );
}
