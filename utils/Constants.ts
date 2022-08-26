export const GOERLI_CHAIN_ID = 5;
export enum MetamaskConnectionStates {
  UNDEFINED,
  NOT_INSTALLED,
  NOT_CONNECTED,
  WRONG_NETWORK,
  CONNECTED
}
export const nonemptyAlphanumericRegex = /^[a-z0-9]+$/i;