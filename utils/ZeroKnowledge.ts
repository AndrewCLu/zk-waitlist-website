import { getErrorMessage } from "./Errors";

// Utils to help with zero knowledge proofs
const snarkjs = require('snarkjs');
const fs = require('fs');

// Runs the prover specified by circuit with given input
// Returns the resulting proof and publicSignals, or an error if encountered
export const generateProof = async (
  input: any, 
  circuit: string
): Promise<{proof: any, publicSignals: any} | Error> => {
  try {
    const { proof, publicSignals } = await snarkjs.plonk.fullProve(
      input, 
      'circuits/' + {circuit} + '/' + {circuit} + '.wasm', 
      'circuits/' + {circuit} + '/' + {circuit} + '_final.zkey'
    );
    return { proof, publicSignals };
  } catch (error) {
    return Error(getErrorMessage(error));
  }
}

// Runs the verifier corresponding to the specified circuit
// Returns a boolean indicating if the proof was successfully verified
export const verifyProof = async (
  proof: any, 
  publicSignals: any, 
  circuit: string
): Promise<boolean> => {
  try {
    const verificationKeyFile = 'circuits/' + {circuit} + '/' + {circuit} + '_verification_key.json';
    const verificationKey = JSON.parse(fs.readFileSync(verificationKeyFile));
    const verified = await snarkjs.plonk.verify(verificationKey, publicSignals, proof);
    return verified;
  } catch (error) {
    console.log('Error verifiying proof: ', getErrorMessage(error));
    return false;
  }
}

// Takes a raw proof and publicSignals and transforms them into solidity calldata
// Returns the calldata or an error if encountered
export const getProofSolidityCalldata = async (
  proof: any, 
  publicSignals: any
): Promise<{proofCalldata: any, publicSignalsCalldata: any} | Error> => {
  try {
    const solidityCalldata = await snarkjs.plonk.exportSolidityCallData(proof, publicSignals);
    const proofCalldata: string = solidityCalldata.slice(0, solidityCalldata.indexOf(','));
    const publicSignalsCalldata: string[] = JSON.parse(solidityCalldata.slice(solidityCalldata.indexOf(',') + 1));
    return { proofCalldata, publicSignalsCalldata };
  } catch (error) {
    return Error(getErrorMessage(error));
  }
}