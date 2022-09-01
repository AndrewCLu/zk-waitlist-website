import { ethers } from 'ethers';
export const NONEMPTY_ALPHANUMERIC_REGEX = /^[a-z0-9]+$/i;
// Takes a string s which represents a BigNumber and returns its hex string equivalent
// Returns the original string if conversion fails
export const getHexFromBigNumberString = (s: string): string => {
  try {
    const bn = ethers.BigNumber.from(s);
    return bn.toHexString();
  } catch (error) {
    return s;
  }
}
// Takes a string s which represents a BigNumber and returns 
// the first numLetters of its hex string equivalent
// Returns the original string if conversion fails
export const getLeadingHexFromBigNumberString = (s: string, numLetters: number = 8): string => {
  try {
    const bn = ethers.BigNumber.from(s);
    return bn.toHexString().substring(0, numLetters);
  } catch (error) {
    return s;
  }
}