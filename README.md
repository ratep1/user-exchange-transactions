### Transaction Minter (Backend/Services)

Transactions are an important part of the Storm platform. There is the potential for two Storm Players (users) to exchange 
Tokens between each other, providing a mutually agreed upon criteria is met. These agreements are only valid for a limited
time. If the criteria is not met, the agreement is voided.

#### User Story
> As a Storm Player (user) who owns a coffee shop I want to pay Storm Tokens to other Players who visit my coffee shop this week so I can drive foot traffic!

#### Requirements

Provide a functional API interface that accepts transaction objects as defined in the Resources section. Transactions must have a state, which can change over time. That state should be one of the following: "new" for a freshly submitted request, "pending" for a request that has not been completed, "denied" for a request that has been rejected. It could potentially have additional states. Each user may have many transactions and each transaction may require approval of many users. For a transaction to be approved, all parties must agree to completion criteria. Once a user has approved or denied a transaction they may not change their mind. A transaction must have a limited time that it is active and attempts to change an expired transaction must be rejected. Value is only ever transfered from one user to another, never to a group.

##### :point_up: Note on Requirements 

The Transaction request object has several properties, some of which may be useful for the scope of this exercise. If you find yourself thinking that the object could use additional properties then feel free to add them. Feel free to define additional objects, components or subsystems. When doing so, be sure to include some form of explanation as to why the choices were made so we can have the most informed discussion possbile after the assignment as been reviewed.

##### Submission

Please create a feature branch for your work and when complete open a pull request, tagging GitLab user `calvinh8` as the reviewer. 

##### Timeline

While we expect that an MVP could be coded up in an hour or two feel free to spend up-to four hours on the assignment. If you do go over the two hour mark, please note as much in your pull request. I do not watch the clock, but we expect honesty and transparency in our team and hold each other to those standards.

#### Acceptance Criteria

###### The language used to implement the assignment should be Javascript running on Node, unless a compelling case is made for another
###### The assignment must be capable of running off-line for development/testing
###### The API must use HTTP (get, post, patch, etc)
###### Include all required steps to build and run the assignment
###### If using a database MongoDB should be selected, unless a compelling case is made for another
###### If using a caching layer, Redis should be used, unless a compelling case is made for another
###### The API must provide a mechanism for:

1. Taking a new transaction request
2. Returning the status of a transaction request
3. Returning the number of open requests for a given user
4. Allow a user to approve/deny a transaction request 
5. Optionally requiring final authorization by Storm for transaction to be approved

###### Bonus (in no particular order):

1. Generate a "magic link" for approving a transaction
2. Generate a "magic link" for denying a transaction
3. Include a deployment script
4. Include unit tests/test coverage report
5. Reach out to calvin@stormx.io for clarification
6. Produce a report of transactions opened and closed over the last hour/day/week/month
7. Include a CI integration
8. Some way to visualize the system (dashboard)

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