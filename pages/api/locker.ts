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
  const commitmentArray = commitments.split(',');
  for (let i of commitmentArray) {
    if (!i.match(NONEMPTY_ALPHANUMERIC_REGEX)) {
      return res.status(400).send({ error: 'one or more commitments is either empty or nonalphanumeric' });
    }
  }

  // Generate a proof to lock the waitlist
  const lockerProofInput = {'commitments': commitmentArray};
  const lockerProofResult = await generateProofWithSolidityCalldata(lockerProofInput, 'locker');
  if (lockerProofResult instanceof Error) {
    return res.status(400).send({ error: lockerProofResult.message });
  }
  const { proofCalldata, publicSignalsCalldata } = lockerProofResult;
  res.status(200).json({ proof: proofCalldata, publicSignals: publicSignalsCalldata });
}