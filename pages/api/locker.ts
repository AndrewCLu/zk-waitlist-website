import type { NextApiRequest, NextApiResponse } from 'next';
import { NONEMPTY_ALPHANUMERIC_REGEX } from '../../utils/Parsing';
import { getErrorMessage } from '../../utils/Errors';
/* eslint-disable @typescript-eslint/no-var-requires */
const snarkjs = require('snarkjs');
const path = require('path');
const fs = require('fs');
/* eslint-enable @typescript-eslint/no-var-requires */

// Generates a proof given an input, verifies the proof, then returns the proof as solidity calldata
// Returns the calldata or an error if encountered
// We copy this function across api endpoints to avoid loading unnecessary circuit dependencies for each given endpoint, which would place the serverless function beyond the size limit
const generateLockerProofWithSolidityCalldata = async (
  input: any
): Promise<{ proofCalldata: any; publicSignalsCalldata: any } | Error> => {
  try {
    const { proof, publicSignals } = await snarkjs.plonk.fullProve(
      input,
      path.resolve('public/circuits/locker/locker.wasm'),
      path.resolve('public/circuits/locker/locker_final.zkey')
    );
    const verificationKeyPath = path.resolve(
      'public/circuits/locker/locker_verification_key.json'
    );
    const verificationKey = JSON.parse(fs.readFileSync(verificationKeyPath));
    const verified = await snarkjs.plonk.verify(
      verificationKey,
      publicSignals,
      proof
    );
    if (!verified) {
      return Error('Failed to verify proof.');
    }
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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const {
    query: { commitments },
  } = req;

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Commitments must all be nonempty alphanumeric strings
  if (typeof commitments !== 'string') {
    return res.status(400).send({ error: 'invalid commitments' });
  }
  const commitmentArray = commitments.split(',');
  for (const i of commitmentArray) {
    if (!i.match(NONEMPTY_ALPHANUMERIC_REGEX)) {
      return res.status(400).send({
        error: 'one or more commitments is either empty or nonalphanumeric',
      });
    }
  }

  // Generate a proof to lock the waitlist
  const lockerProofInput = { commitments: commitmentArray };
  const lockerProofResult = await generateLockerProofWithSolidityCalldata(
    lockerProofInput
  );
  if (lockerProofResult instanceof Error) {
    return res.status(400).send({ error: lockerProofResult.message });
  }
  const { proofCalldata, publicSignalsCalldata } = lockerProofResult;
  res
    .status(200)
    .json({ proof: proofCalldata, publicSignals: publicSignalsCalldata });
}
