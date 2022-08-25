import type { NextApiRequest, NextApiResponse } from 'next';
const snarkjs = require("snarkjs");
const path = require('path');

type Commitment = {
  proof: string,
  publicSignals: string[]
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Commitment>) {
  const proofInput = { "inputs": ["69", "0"] };
	const { proof, publicSignals } = await snarkjs.plonk.fullProve(proofInput, path.join('circuits/poseidon_2/', 'poseidon_2.wasm'), path.join('circuits/poseidon_2/', 'poseidon_2_final.zkey'));
  console.log(proof);
  console.log(publicSignals)
  res.status(200).json({ proof: proof, publicSignals: publicSignals })
}