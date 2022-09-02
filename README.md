# ZK Waitlist Frontend

## TODO
- Display correct metamask/contract revert errors when sending transactions or make errors prettier - right now, generic errors are shown
- Create separate ui states for generating proof vs sending tx in lock and redeem
- Display waitlist spots claimed/redeemed by a given user
- Remove loading state from waitlist display/make a more discreet animation

## Deploy Checklist
- Test an 8 person waitlist
- Refactor circuits - create a Merkle circuit and enforce power of 2 constraint on locker (remove todos)
- Update readme in both repos