# ZK Waitlist Frontend

## TODO
- Dont fetch all waitlist contract state on update - ex: max waitlist spots cannot change
- Display correct metamask/contract revert errors when sending transactions or make errors prettier - right now, generic errors are shown
- Use lock/redeem error pages for all errors - remove alerting/logging and display errors in errors page
- Display claimed nullifiers (change contract to also hold list of nullifiers)
- Get error messages from snarkjs library - convert e to error type
- Separate solidity calldata conversion into helper
- Display commitments/nullifiers/merkle roots as hex
- Create separate ui states for generating proof vs sending tx in lock and redeem
- Do not display a commit/lock/redeem state while loading waitlist contract - refactor display state to waitlist level enum