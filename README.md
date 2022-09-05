# ZK Waitlist Frontend

## TODO
- Update waitlist contract state fetch to not change if there is a new waitlist contract
- Add buttons on success states to refresh waitlist contract state - successful commitment, lock, etc
- Create waitlist contract display states and pass to waitlist contract display

## Deploy Checklist
- Test an 8 person waitlist
- Refactor circuits - create a Merkle circuit and enforce power of 2 constraint on locker (remove todos)
- Update readme in both repos
- Use circomlibjs for api routes