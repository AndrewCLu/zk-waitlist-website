# ZK Waitlist Frontend

## TODO
- Have frontend checks that return errors before executing txs matching contract checks
- Return generic errors from sending tx erroring out
- Dynamically fetch contract state - dont fetch nullifier info if contract is not locked

## Deploy Checklist
- Test an 8 person waitlist
- Refactor circuits - create a Merkle circuit and enforce power of 2 constraint on locker (remove todos)
- Update readme in both repos