// Utils to help with zero knowledge proofs

import { getErrorMessage } from './Errors';
/* eslint-disable @typescript-eslint/no-var-requires */
const snarkjs = require('snarkjs');
const path = require('path');
const fs = require('fs');
/* eslint-enable @typescript-eslint/no-var-requires */

export type Circuit = 'locker' | 'merkle_tree' | 'poseidon_2' | 'redeemer';

// Runs the prover specified by circuit with given input
// Returns the resulting proof and publicSignals, or an error if encountered
export const generateProof = async (
  input: any,
  circuit: Circuit
): Promise<{ proof: any; publicSignals: any } | Error> => {
  try {
    const { proof, publicSignals } = await snarkjs.plonk.fullProve(
      input,
      path.join('pages/api/circuits', circuit, circuit + '.wasm'),
      path.join('pages/api/circuits', circuit, circuit + '_final.zkey')
    );
    return { proof, publicSignals };
  } catch (error) {
    return Error(getErrorMessage(error));
  }
};

// Runs the verifier corresponding to the specified circuit
// Returns a boolean indicating if the proof was successfully verified
export const verifyProof = async (
  proof: any,
  publicSignals: any,
  circuit: string
): Promise<boolean> => {
  try {
    const verificationKeyPath = path.join(
      'pages/api/circuits',
      circuit,
      circuit + '_verification_key.json'
    );
    const verificationKey = JSON.parse(fs.readFileSync(verificationKeyPath));
    const verified = await snarkjs.plonk.verify(
      verificationKey,
      publicSignals,
      proof
    );
    return verified;
  } catch (error) {
    console.log('Error verifiying proof: ', getErrorMessage(error));
    return false;
  }
};

// Takes a raw proof and publicSignals and transforms them into solidity calldata
// Returns the calldata or an error if encountered
export const getProofSolidityCalldata = async (
  proof: any,
  publicSignals: any
): Promise<{ proofCalldata: any; publicSignalsCalldata: any } | Error> => {
  try {
    const solidityCalldata = await snarkjs.plonk.exportSolidityCallData(
      proof,
      publicSignals
    );
    const proofCalldata: string = solidityCalldata.slice(
      0,
      solidityCalldata.indexOf(',')
    );
    const publicSignalsCalldata: string[] = JSON.parse(
      solidityCalldata.slice(solidityCalldata.indexOf(',') + 1)
    );
    return { proofCalldata, publicSignalsCalldata };
  } catch (error) {
    return Error(getErrorMessage(error));
  }
};

// Generates a proof given an input, verifies the proof, then returns the proof as solidity calldata
// Returns the calldata or an error if encountered
export const generateProofWithSolidityCalldata = async (
  input: any,
  circuit: Circuit
): Promise<{ proofCalldata: any; publicSignalsCalldata: any } | Error> => {
  const generateProofResult = await generateProof(input, circuit);
  if (generateProofResult instanceof Error) {
    return generateProofResult;
  }
  const { proof, publicSignals } = generateProofResult;
  const verified = await verifyProof(proof, publicSignals, circuit);
  if (!verified) {
    return Error('Failed to verify proof.');
  }
  const getCalldataResult = await getProofSolidityCalldata(
    proof,
    publicSignals
  );
  if (getCalldataResult instanceof Error) {
    return getCalldataResult;
  }
  const { proofCalldata, publicSignalsCalldata } = getCalldataResult;
  return { proofCalldata, publicSignalsCalldata };
};
