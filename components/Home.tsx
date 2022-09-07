import React from 'react';
import { Metamask, MetamaskConnectionStates } from './Metamask';

type HomeProps = {
  metamaskState: MetamaskConnectionStates;
};
export default function Home(props: HomeProps) {
  return (
    <div>
      <div>This is the home page</div>
      <div>
        <Metamask metamaskState={props.metamaskState} />
      </div>
    </div>
  );
}
