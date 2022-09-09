import React from 'react';
import { Metamask, MetamaskConnectionStates } from './Metamask';
import {
  VStack,
  Heading,
  Text,
  Link,
  OrderedList,
  ListItem,
  Box,
} from '@chakra-ui/react';
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
        <Box textColor={'purple.600'} maxWidth={'60%'}>
          <Text>
            This app demonstrates a reusable on-chain private waitlist. Through
            the use of zero knowledge proofs, users can join the waitlist with
            one account, and later prove from a different account that they had
            previously joined the waitlist, all without onlookers being able to
            link the two accounts.
            <br />
            <br />
            Users interact with the waitlist in 3 phases:
          </Text>
          <OrderedList>
            <ListItem>
              <u>Commit:</u> A user selects a private secret and hashes the
              secret into a public commitment. The user has joined the waitlist
              once the commitment is submitted to the waitlist contract.
            </ListItem>
            <ListItem>
              <u>Lock:</u> The waitlist is locked and no one else is allowed to
              join. The commitments are hashed into a Merkle tree and the root
              is stored in the contract.
            </ListItem>
            <ListItem>
              <u>Redeem:</u> Any user can submit a proof that they know a secret
              which corresponds to a valid commitment in Merkle tree. They
              present this proof along with a second hash of the secret known as
              the nullifier to the contract, which redeems their spot on the
              waitlist. The nullifier is used to prevent anyone from reusing the
              same secret.
            </ListItem>
          </OrderedList>
          <Text>
            <br />
            Connect to Metamask to get started! Code for the zero knowledge
            proof circuits, waitlist smart contract, and frontend can be found
            below.
          </Text>
        </Box>
        <Metamask metamaskState={props.metamaskState} />
        <Text textColor={'purple.800'} maxWidth={'60%'}>
          Circuits and contracts code:{' '}
          <Link href="https://github.com/AndrewCLu/zk-waitlist" isExternal>
            <u>https://github.com/AndrewCLu/zk-waitlist</u>
            <ExternalLinkIcon mx="2px" />
          </Link>
          <br />
          Frontend code:{' '}
          <Link
            href="https://github.com/AndrewCLu/zk-waitlist-website"
            isExternal
          >
            <u>https://github.com/AndrewCLu/zk-waitlist-website</u>
            <ExternalLinkIcon mx="2px" />
          </Link>
          <br />
          <br />
        </Text>
      </VStack>
    </div>
  );
}
