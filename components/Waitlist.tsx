import { ethers } from 'ethers';
import React, { useEffect, useState } from 'react';
import Commit from './Commit';
import Lock from './Lock';

type WaitlistProps = {
  signer?: ethers.Signer;
}
export default function Waitlist (props: WaitlistProps) {
  const { signer } = props;

  return (
    <div>
      <Commit/>
      <Lock />
    </div>
  )
}