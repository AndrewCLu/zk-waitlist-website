import type { NextApiRequest, NextApiResponse } from 'next';
import { NONEMPTY_ALPHANUMERIC_REGEX } from '../../utils/Parsing';
import { getErrorMessage } from '../../utils/Errors';
/* eslint-disable @typescript-eslint/no-var-requires */
const snarkjs = require('snarkjs');
const path = require('path');
const fs = require('fs');
/* eslint-enable @typescript-eslint/no-var-requires */

// Creates a Merkle tree from the given inputs
const generateMerkleTree = async (
  inputs: string[]
): Promise<string[] | Error> => {
  const proofInput = { inputs: inputs };
  const proofResult = await generateMerkleZKProof(proofInput);
  if (proofResult instanceof Error) {
    return proofResult;
  }
  const { publicSignals } = proofResult;
  return publicSignals as string[];
};

// Given a Merkle tree and the index of a node, returns a valid Merkle proof for that node
const generateMerkleProof = (
  merkleTree: string[],
  index: number
): { merkle_branch: string[]; node_is_left: string[] } | Error => {
  const treeSize = merkleTree.length;
  const treeDepth = Math.log2((treeSize + 1) / 2);
  const numLeaves = 2 ** treeDepth;
  if (!Number.isInteger(treeDepth)) {
    return Error('Merkle tree size must be a power of 2');
  }
  if (!Number.isInteger(index) || index < 0 || index >= numLeaves) {
    return Error('Index out of bounds');
  }

  const merkle_branch: string[] = [];
  const node_is_left: string[] = [];
  let currIndex = index;
  for (let i = 0; i < treeDepth; i++) {
    if (currIndex % 2 === 0) {
      node_is_left.push('0');
      merkle_branch.push(merkleTree[currIndex + 1]);
    } else {
      node_is_left.push('1');
      merkle_branch.push(merkleTree[currIndex - 1]);
    }
    // Advance to the next level of the tree
    currIndex = Math.floor(currIndex / 2) + numLeaves;
  }

  return { merkle_branch, node_is_left };
};

// Runs the prover specified by circuit with given input
// Returns the resulting proof and publicSignals, or an error if encountered
// We copy this function across api endpoints to avoid loading unnecessary circuit dependencies for each given endpoint, which would place the serverless function beyond the size limit
const generateMerkleZKProof = async (
  input: any
): Promise<{ proof: any; publicSignals: any } | Error> => {
  try {
    const { proof, publicSignals } = await snarkjs.plonk.fullProve(
      input,
      path.resolve('public/circuits/merkle_tree/merkle_tree.wasm'),
      path.resolve('public/circuits/merkle_tree/merkle_tree_final.zkey')
    );
    return { proof, publicSignals };
  } catch (error) {
    return Error(getErrorMessage(error));
  }
};

// Generates a proof given an input, verifies the proof, then returns the proof as solidity calldata
// Returns the calldata or an error if encountered
// We copy this function across api endpoints to avoid loading unnecessary circuit dependencies for each given endpoint, which would place the serverless function beyond the size limit
const generateRedeemerProofWithSolidityCalldata = async (
  input: any
): Promise<{ proofCalldata: any; publicSignalsCalldata: any } | Error> => {
  try {
    const { proof, publicSignals } = await snarkjs.plonk.fullProve(
      input,
      path.resolve('public/circuits/redeemer/redeemer.wasm'),
      path.resolve('public/circuits/redeemer/redeemer_final.zkey')
    );
    const verificationKeyPath = path.resolve(
      'public/circuits/redeemer/redeemer_verification_key.json'
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
    query: { secret, commitments, redeemableIndex },
  } = req;

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Secret must be a string
  if (typeof secret !== 'string') {
    return res.status(400).send({ error: 'invalid secret parameter' });
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

  // Redeemable index must be a string representing a valid index in the commitments array
  if (typeof redeemableIndex !== 'string') {
    return res
      .status(400)
      .send({ error: 'redeemable index must string representing an integer' });
  }
  let redeemableIndexNumber;
  try {
    redeemableIndexNumber = parseInt(redeemableIndex);
  } catch (e) {
    return res
      .status(400)
      .send({ error: 'redeemable index must string representing an integer' });
  }
  if (
    redeemableIndexNumber < 0 ||
    redeemableIndexNumber >= commitmentArray.length
  ) {
    return res.status(400).send({ error: 'redeemable index out of bounds' });
  }

  // Build a Merkle tree from the commitments
  const merkleTreeResult = await generateMerkleTree(commitmentArray);
  if (merkleTreeResult instanceof Error) {
    return res.status(400).send({ error: merkleTreeResult.message });
  }

  // Generate a Merkle proof for the provided index
  const merkleProofResult = generateMerkleProof(
    merkleTreeResult,
    redeemableIndexNumber
  );
  if (merkleProofResult instanceof Error) {
    return res.status(400).send({ error: merkleProofResult.message });
  }
  const { merkle_branch, node_is_left } = merkleProofResult;

  // Generate proof for redemption using the Merkle proof
  const redeemerProofInput = {
    secret: secret,
    merkle_branch: merkle_branch,
    node_is_left: node_is_left,
  };
  const redeemerProofResult = await generateRedeemerProofWithSolidityCalldata(
    redeemerProofInput
  );
  if (redeemerProofResult instanceof Error) {
    return res.status(400).send({ error: redeemerProofResult.message });
  }
  const { proofCalldata, publicSignalsCalldata } = redeemerProofResult;
  res
    .status(200)
    .json({ proof: proofCalldata, publicSignals: publicSignalsCalldata });
}
