# ZK Waitlist Website
This website demonstrates a frontend for the zk waitlist specified here: https://github.com/AndrewCLu/zk-waitlist. 

The frontend allows a user to deploy a waitlist contract onto the Goerli testnet, as well as contracts to verify the zero knowledge proofs. Upon deploying all the contracts, users can claim and redeem their spots on the waitlist as described in the above link. 

This repo also includes Next.js API routes which generate the zero knowledge proofs used to interact with the waitlist smart contract. 

## Future Improvements
- Use circomlibjs for api routes
- Add redeemer address to proof to prevent frontrunning
- Option to generate random secrets
- Support for transferring waitlist spots
- Allow checks for accounts to have met certain requirements before joining the waitlist 