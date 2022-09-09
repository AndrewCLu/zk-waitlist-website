import React from 'react';
import { Metamask, MetamaskConnectionStates } from './Metamask';
import { VStack, Heading, Center, Text, Link } from '@chakra-ui/react';
import { ExternalLinkIcon } from '@chakra-ui/icons';

type HomeProps = {
  metamaskState: MetamaskConnectionStates;
};
export default function Home(props: HomeProps) {
  return (
    <div>
      <VStack marginTop={'10%'} spacing={'5%'}>
        <Heading size="4xl" textColor={'purple.500'}>
          ZK Waitlist
        </Heading>
        <Text textColor={'purple.300'} maxWidth={'50%'}>
          This app demonstrates a reusable on-chain waitlist where users can privately claim and subsequently redeem their spots.
          <br />
          <br />
          Circuits and contracts: <Link href="https://github.com/AndrewCLu/zk-waitlist" isExternal>
            https://github.com/AndrewCLu/zk-waitlist{' '}
            <ExternalLinkIcon mx="2px" />
          </Link>
          <br />
          This frontend: <Link
            href="https://github.com/AndrewCLu/zk-waitlist-website"
            isExternal
          >
            https://github.com/AndrewCLu/zk-waitlist-website{' '}
            <ExternalLinkIcon mx="2px" />
          </Link>
        </Text>
        <Metamask metamaskState={props.metamaskState} />
      </VStack>
    </div>
  );
}
