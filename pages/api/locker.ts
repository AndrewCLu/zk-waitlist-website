import type { NextApiRequest, NextApiResponse } from 'next';
import { NONEMPTY_ALPHANUMERIC_REGEX } from '../../utils/Parsing';
import { generateProofWithSolidityCalldata } from '../../utils/ZeroKnowledge';

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

  const proofInput = {'commitments': commitments};
  const proofResult = await generateProofWithSolidityCalldata(proofInput, 'locker');
  if (proofResult instanceof Error) {
    return res.status(400).send({ error: proofResult.message });
  }
  const { proofCalldata, publicSignalsCalldata } = proofResult;
  res.status(200).json({ proof: proofCalldata, publicSignals: publicSignalsCalldata });
}