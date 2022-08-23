import { ethers } from 'ethers';
import { useEffect, useState } from 'react';

type WaitlistProps = {
  signer?: ethers.Signer;
}
export default function Waitlist (props: WaitlistProps) {
  const { signer } = props;
  const [accountBalance, setAccountBalance] = useState('');

  useEffect(() => {
    updateAccountBalance();
  })

  const updateAccountBalance = async () => {
    if (!signer) { return; }
    const balance = await signer.getBalance();
    setAccountBalance(balance.toString());
  }

  return (
    <div>
      Your current account balance is: {accountBalance}
    </div>
  )
}