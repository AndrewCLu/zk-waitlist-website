import type { NextApiRequest, NextApiResponse } from 'next';

type Commitment = {
  proof: string,
  pubSignals: string[]
}

export default function commitment(req: NextApiRequest, res: NextApiResponse<Commitment>) {
  res.status(200).json({ proof: '', pubSignals: [] })
}