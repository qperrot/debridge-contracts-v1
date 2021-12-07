<!--This file is autogenerated-->





# Functions
## submit
```solidity
  function submit(
            bytes32 _submissionId,
            bytes _signatures,
            uint8 _excessConfirmations
  ) external
```

Check confirmation (validate signatures) for the transfer request.

### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_submissionId` | bytes32 | Submission identifier.
|`_signatures` | bytes | Array of signatures by oracles.
|`_excessConfirmations` | uint8 | override min confirmations count


# Events
## Confirmed
```solidity
  event Confirmed(
        bytes32 submissionId,
        address operator
  )
```

Emitted once the submission is confirmed by one oracle.

## DeployConfirmed
```solidity
  event DeployConfirmed(
        bytes32 deployId,
        address operator
  )
```

Emitted once the submission is confirmed by min required amount of oracles.


