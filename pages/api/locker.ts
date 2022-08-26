import type { NextApiRequest, NextApiResponse } from 'next';
import { nonemptyAlphanumericRegex } from '../../utils/Constants';
const snarkjs = require('snarkjs');
const path = require('path');

const generateLockerProof = async (commitments: string[]): Promise<{proof: any, publicSignals: any} | Error> => {
  const proofInput = {'commitments': commitments}
  try {
    const { proof, publicSignals } = await snarkjs.plonk.fullProve(
      proofInput, 
      path.join('circuits/locker/', 'locker.wasm'), 
      path.join('circuits/locker/', 'locker_final.zkey')
    );
    return { proof, publicSignals };
  } catch (e) {
    return Error('Failed to generate proof')
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
  const inputArray = commitments.split(',')
  for (let i of inputArray) {
    if (!i.match(nonemptyAlphanumericRegex)) {
      return res.status(400).send({ error: 'one or more commitments is either empty or nonalphanumeric' });
    }
  }

  const proofResult = await generateLockerProof(inputArray);
  if (proofResult instanceof Error) {
    return res.status(400).send({ error: proofResult.message });
  }
  const { proof, publicSignals } = proofResult;
  res.status(200).json({ proof, publicSignals });
}