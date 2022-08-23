import { useEffect, useState } from 'react';

export default function Waitlist (props) {
  const { signer } = props;
  const [accountBalance, setAccountBalance] = useState('');

  useEffect(() => {
    updateAccountBalance();
  })

  const updateAccountBalance = async () => {
    const balance = await signer.getBalance();
    setAccountBalance(balance.toString());
  }

  return (
    <div>
      Your current account balance is: {accountBalance}
    </div>
  )
}