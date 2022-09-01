# ZK Waitlist Frontend

## TODO
- Display correct metamask/contract revert errors when sending transactions or make errors prettier - right now, generic errors are shown
- Get error messages from snarkjs library - convert e to error type
- Separate solidity calldata conversion into helper
- Make errors and zk util
- Display commitments/nullifiers/merkle roots as hex
- Create separate ui states for generating proof vs sending tx in lock and redeem
- Remove loading state from waitlist display/make a more discreet animation

## Deploy Checklist
- Test an 8 person waitlist
- Refactor circuits - create a Merkle circuit and enforce power of 2 constraint on locker
- Update readme in both repos