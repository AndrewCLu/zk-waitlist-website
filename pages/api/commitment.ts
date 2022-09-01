import type { NextApiRequest, NextApiResponse } from 'next';
import { generateProof } from '../../utils/ZeroKnowledge';

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

  // Commitments are generated by poseidon hashing the secret with 0
  const proofInput = { 'inputs': [secretString, '0'] }; 
  const proofResult = await generateProof(proofInput, 'poseidon_2');
  if (proofResult instanceof Error) {
    return res.status(400).send({ error: proofResult.message });
  }
  const { publicSignals } = proofResult;
  res.status(200).json({ commitment: publicSignals[0] });
}