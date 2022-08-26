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

const generateMerkleProof = (
  merkleTree: string[], 
  index: number
): {merkle_branch: string[], node_is_left: string[]} | Error => {
  const treeSize = merkleTree.length;
  const treeDepth = Math.log2(treeSize);
  if (!Number.isInteger(treeDepth)) {
    return Error('Merkle tree size must be a power of 2');
  }
  if (!Number.isInteger(index) || index < 0 || index >= treeSize) {
    return Error('Index out of bounds');
  }

  let merkle_branch: string[] = [];
  let node_is_left: string[] = [];
  let currIndex = index;
  for (let i=0; i<treeDepth; i++) {
    if (currIndex % 2 == 0) {
      node_is_left.push('0');
      merkle_branch.push(merkleTree[currIndex + 1]);
    } else {
      node_is_left.push('1');
      merkle_branch.push(merkleTree[currIndex - 1]);
    }
    // Advance to the next level of the tree
    currIndex = Math.floor(currIndex / 2) + treeSize;
  }

  return { merkle_branch, node_is_left }
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
    query: { 
      secret,
      commitments,
      redeemableIndex
    }
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

  // Redeemable index must be a string representing a valid index in the commitments array
  if (typeof redeemableIndex !== 'string') {
    return res.status(400).send({ error: 'redeemable index must string representing an integer' });
  }
  let redeemableIndexNumber;
  try {
    redeemableIndexNumber = parseInt(redeemableIndex);
  } catch (e) {
    return res.status(400).send({ error: 'redeemable index must string representing an integer' });
  }
  if (redeemableIndexNumber < 0 || redeemableIndexNumber >= commitmentArray.length) {
    return res.status(400).send({ error: 'redeemable index out of bounds' });
  }

  // Build a Merkle tree from the commitments
  const merkleTreeResult = await generateMerkleTree(commitmentArray);
  if (merkleTreeResult instanceof Error) {
    return res.status(400).send({ error: merkleTreeResult.message });
  }

  // Generate a Merkle proof for the provided index
  const merkleProofResult = generateMerkleProof(merkleTreeResult, redeemableIndexNumber);
  if (merkleProofResult instanceof Error) {
    return res.status(400).send({ error: merkleProofResult.message });
  }
  const { merkle_branch, node_is_left } = merkleProofResult;

  // Generate proof for redemption using the Merkle proof
  const proofResult = await generateRedeemerProof(secret, merkle_branch, node_is_left);
  if (proofResult instanceof Error) {
    return res.status(400).send({ error: proofResult.message });
  }
  const { proof, publicSignals } = proofResult;
  res.status(200).json({ proof, publicSignals });
}