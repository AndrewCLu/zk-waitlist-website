import type { NextApiRequest, NextApiResponse } from 'next';
import { nonemptyAlphanumericRegex } from '../../utils/Constants';
const snarkjs = require('snarkjs');
const path = require('path');

const generateMerkleTree = async (commitments: string[]): Promise<string[] | Error> => {
  const proofInput = {'commitments': commitments}
  try {
    const { publicSignals } = await snarkjs.plonk.fullProve(
      proofInput, 
      path.join('circuits/merkle_tree/', 'merkle_tree.wasm'), 
      path.join('circuits/merkle_tree/', 'merkle_tree_final.zkey')
    );
    return publicSignals as string[];
  } catch (e) {
    return Error('Failed to build Merkle tree');
  }
}

const generateRedeemerProof = async (
  secret: string, 
  merkle_branch: string[], 
  node_is_left: string[]
): Promise<{proof: any, publicSignals: any} | Error> => {
  const proofInput = {'secret': secret, 'merkle_branch': merkle_branch, 'node_is_left': node_is_left};
  try {
    const { proof, publicSignals } = await snarkjs.plonk.fullProve(
      proofInput, 
      path.join('circuits/redeemer/', 'redeemer.wasm'), 
      path.join('circuits/redeemer/', 'redeemer_final.zkey')
    );
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
    if (!i.match(nonemptyAlphanumericRegex)) {
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