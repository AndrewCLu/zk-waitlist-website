import { ethers } from 'ethers';
import React, { useEffect, useState } from 'react';
import { WAITLIST_CONTRACT_ABI, WAITLIST_CONTRACT_ADDRESS } from '../utils/Constants';
import Commit from './Commit';
import Lock from './Lock';
import Redeem from './Redeem';

type WaitlistProps = {
  signer?: ethers.Signer;
}
export default function Waitlist (props: WaitlistProps) {
  const { signer } = props;
  const [waitlistContract, setWaitlistContract] = useState<ethers.Contract>();

  useEffect(() => {
    const waitlistContract: ethers.Contract = new ethers.Contract(WAITLIST_CONTRACT_ADDRESS, WAITLIST_CONTRACT_ABI, signer);
    setWaitlistContract(waitlistContract);
    console.log(waitlistContract.interface);
  }, [signer])

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