### Instructions
1. Start Redis server
> docker/start-redis.sh
2. In config -> env -> development.json (if NODE_ENV is default) set port and host for redis
3. run initialization ```npm run initialize```
4. run app ```npm run start``` 

### Transaction Minter (Backend/Services)

Transactions are an important part of the Storm platform. There is the potential for two Storm Players (users) to exchange 
Tokens between each other, providing a mutually agreed upon criteria is met. These agreements are only valid for a limited
time. If the criteria is not met, the agreement is voided.

#### User Story
> As a user who owns a coffee shop I want to pay Tokens to other Players who visit my coffee shop this week so I can drive foot traffic!

#### Goal

Provide a functional API interface that accepts transaction objects as defined in the Resources section. Transactions must have a state, which can change over time. That state should be one of the following: "new" for a freshly submitted request, "pending" for a request that has not been completed, "denied" for a request that has been rejected. Each user may have many transactions and each transaction may require approval of many users. For a transaction to be approved, all parties must agree to completion criteria. Once a user has approved or denied a transaction they may not change their mind. A transaction must have a limited time that it is active and attempts to change an expired transaction must be rejected. Value is only ever transfered from one user to another, never to a group.

## Resources

##### Transaction Request Example

```
{
  "id": 3,
  "value": 100,
  "from": "626a8af9-0d68-40bc-9d93-d79df27abfe6",
  "to": "f5c91da2-724d-41e4-ab42-c874fb013bcd",
  "expire": "2018-05-27T23:49:51.510Z",  
  "state": "new",
  "requireAdmin": true,
  "adminApproval": {
    "ec07649b-dc6c-4a65-b253-ef313fad07b1": { "approval": "pending", "approved": false }
  },
  "approved": false,
  "approvers": {
    "2018-05-27T23:49:51.510Z": {"approval": "pending", "approved": false},
    "f5c91da2-724d-41e4-ab42-c874fb013bcd": {"approval"": "pending", "approved": false},
    "76613401-d664-481e-b982-a5287b37d3e0": {"approval": "done", "approved": true}
  }
}
```