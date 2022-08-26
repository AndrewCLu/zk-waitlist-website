import { ethers } from 'ethers';
import React, { useEffect, useState } from 'react';
import Commit from './Commit';
import Lock from './Lock';
import Redeem from './Redeem';

type WaitlistProps = {
  signer?: ethers.Signer;
}
export default function Waitlist (props: WaitlistProps) {
  const { signer } = props;

  return (
    <div>
      <Commit/>
      <br/>
      <Lock />
      <br/>
      <Redeem />
    </div>
  )
}