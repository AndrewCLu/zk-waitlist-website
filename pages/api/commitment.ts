import type { NextApiRequest, NextApiResponse } from 'next';
const snarkjs = require('snarkjs');
const path = require('path');

const generateCommitment = async (secret: string): Promise<string | Error> => {
  // Commitments are generated by poseidon hashing the secret with 0
  const proofInput = { 'inputs': [secret, '0'] }; 
  try {
    const { publicSignals } = await snarkjs.plonk.fullProve(
      proofInput, 
      path.join('circuits/poseidon_2/', 'poseidon_2.wasm'), 
      path.join('circuits/poseidon_2/', 'poseidon_2_final.zkey')
    );
    return publicSignals[0];
  } catch (e) {
    return Error('Failed to generate proof')
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const {
    query: { secret }
  } = req;

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Secret must be a string
  if (typeof secret !== 'string') {
    return res.status(400).send({ error: 'invalid secret parameter' });
  }
  const secretString = secret as string;

  // Secret must be convertable to a BigInt
  try {
    BigInt(secretString);
  } catch (e) {
    return res.status(400).send({ error: 'secret is not a valid BigInt' })
  }

  // Check that commitment has been generated successfully
  const commitmentResult = await generateCommitment(secretString);
  if (commitmentResult instanceof Error) {
    return res.status(400).send({ error: commitmentResult.message });
  }
  res.status(200).json({ commitment: commitmentResult });
}