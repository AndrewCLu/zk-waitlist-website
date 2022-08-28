import type { NextApiRequest, NextApiResponse } from 'next';
import { NONEMPTY_ALPHANUMERIC_REGEX } from '../../utils/Constants';
const snarkjs = require('snarkjs');
const path = require('path');
const fs = require('fs');

// Generates a locker proof and returns the proof and publicSignals as Solidity calldata
const generateLockerProof = async (commitments: string[]): Promise<{proof: any, publicSignals: any} | Error> => {
  const proofInput = {'commitments': commitments};
  try {
    const { proof: rawProof, publicSignals: rawPublicSignals } = await snarkjs.plonk.fullProve(
      proofInput, 
      path.join('circuits/locker/', 'locker.wasm'), 
      path.join('circuits/locker/', 'locker_final.zkey')
    );
    const solidityCalldata = await snarkjs.plonk.exportSolidityCallData(rawProof, rawPublicSignals);
    const proof = solidityCalldata.slice(0, solidityCalldata.indexOf(','));
    const publicSignals = JSON.parse(solidityCalldata.slice(solidityCalldata.indexOf(',') + 1));

    return { proof, publicSignals };
  } catch (e) {
    return Error('Failed to generate proof');
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const {
    query: { commitments }
  } = req;

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Commitments must all be nonempty alphanumeric strings
  if (typeof commitments !== 'string') {
    return res.status(400).send({ error: 'invalid commitments' });
  }
  const commitmentArray = commitments.split(',')
  for (let i of commitmentArray) {
    if (!i.match(NONEMPTY_ALPHANUMERIC_REGEX)) {
      return res.status(400).send({ error: 'one or more commitments is either empty or nonalphanumeric' });
    }
  }

  const proofResult = await generateLockerProof(commitmentArray);
  if (proofResult instanceof Error) {
    return res.status(400).send({ error: proofResult.message });
  }
  const { proof, publicSignals } = proofResult;
  res.status(200).json({ proof, publicSignals });
}