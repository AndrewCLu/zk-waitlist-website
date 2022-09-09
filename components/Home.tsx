import React from 'react';
import { Metamask, MetamaskConnectionStates } from './Metamask';
import { Heading } from '@chakra-ui/react';

type HomeProps = {
  metamaskState: MetamaskConnectionStates;
};
export default function Home(props: HomeProps) {
  return (
    <div>
      <div>
        <Heading size="4xl">ZK Waitlist</Heading>
      </div>
      <div>
        <Metamask metamaskState={props.metamaskState} />
      </div>
    </div>
  );
}
