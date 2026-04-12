# Smart Support System
## Tech Stack
### Frontend
* **React**: Component-based architecture allows for a modular and highly responsive user interface. This is essential for the dashboard and ticket management views, ensuring that updates such as status changes or search filtering provide a smooth experience.

### Backend/API
* **NestJS**: Chosen for its modular architecture. It provides a structured environment that is well suited for a professional support platform, offering high testability and scalability as the system’s logic and API requirements grow.

### Database
* **PostgreSQL**: Selected for its reliability and strong support for relational data. It is ideal for maintaining the data integrity required for tracking tickets, user permissions, and support logs.

## API Contract
### Authentication
#### /api/login
##### Details
Receive an auth token from the server as part of a login.
##### Request
```json
{
    "username": "username",
    "password": "raw_password"
}
```
##### Response
```json
{
    "username": "username",
    "token": "abcdef",
    "status": "success"
}
```
##### Errors
 - *400 Bad Request* - Missing field
 - *401 Unauthorized* - Invalid credentials

---
#### /api/register
##### Details
Create an account. Does not log the user in automatically.
##### Request
```json
{
    "name": "name",
    "username": "username",
    "password": "raw_password"
}
```
##### Response
```json
{
    "status": "success"
}
```
##### Errors
 - *400 Bad Request* - Malformed username
 - *400 Bad Request* - Missing field
 - *400 Bad Request* - Weak password
 - *409 Conflict* - User already exists

---
#### /api/logout
##### Details
Log out an account. Requires auth token of same user.
##### Request
```json
{
    "username": "username"
}
```
##### Response
```json
{
    "status": "success"
}
```

---
### User information & management
#### /api/get-user
##### Details
Get user information. Whether or not a user is approved is only divulged to authorized users, or the user themself. Information of other users is only provided to unauthorized users if they are related in a ticket.
##### Request
```json
{
    "username": "username"
}
```
##### Response
```json
{
    "user_info": {
        "name": "name",
        "username": "username",
        "approved": "false",
        "is_agent": "false",
        "is_admin": "false"
    },
    "status": "success"
}
```
##### Errors
 - *404 Not Found* - Failed to find user

---
#### /api/list-users
##### Details
List users with an optional filter (supports basic search queries, such as "timothy", or value queries, such as "approved:false"). Only approved users may use this endpoint.
##### Request
```json
{
    "user_filter": "approved:false"
}
```
##### Response
```json
{
    "users": [
        {
            "name": "name",
            "username": "username",
            "approved": "false",
            "is_agent": "false",
            "is_admin": "false"
        },
        {
            "name": "name",
            "username": "username",
            "approved": "false",
            "is_agent": "false",
            "is_admin": "false"
        }
    ]
}
```
##### Errors
 - *400 Bad Request* - Invalid filter.

---
#### /api/update-user
##### Details
Update a user's information. Only personal name changes are available to unauthorized users.
##### Request
```json
{
    "username": "username",
    "user_info": {
        "name": "name",
        "approved": "false",
        "is_agent": "false",
        "is_admin": "false"
    }
}
```
##### Response
```json
{
    "status": "success"
}
```
##### Errors
 - *400 Bad Request* - Malformed user information.
 - *404 Not Found* - Failed to find user.

---
#### /api/delete-account
##### Details
Delete an account. Requires auth token of same user, or an admin auth token.
##### Request
```json
{
    "username": "username"
}
```
##### Response
```json
{
    "status": "success"
}
```

---
### Ticket information & management
#### /api/update-ticket
##### Details
Update a ticket. Not all info items must be passed in request, and certain info items can only be changed by authorized users (i.e. priority, status, category, assignee). Only authorized users may alter tickets that they are not involved in.
##### Request
```json
{
    "ticket_id": "12345",
    "ticket_info": {
        "title": "title",
        "description": "description",
        "priority": "high",
        "status": "open",
        "category": "tech",
        "assignee": "assignee"
    }
}
```
##### Response
```json
{
    "status": "success"
}
```
##### Errors
 - *400 Bad Request* - Malformed ticket information.
 - *404 Not Found* - Failed to find ticket.

---
#### /api/get-ticket
##### Details
Receive information associated with a ticket. Only authorized users may view tickets that they are not involved in.
##### Request
```json
{
    "ticket_id": "12345"
}
```
##### Response
```json
{
    "ticket_id": "12345",
    "ticket_info": {
        "title": "title",
        "description": "description",
        "priority": "high",
        "status": "open",
        "category": "tech",
        "user": "username",
        "assignee": "username"
    },
    "status": "success"
}
```
##### Errors
 - *404 Not Found* - Failed to find ticket.

---
#### /api/list-tickets
##### Details
List tickets according to a ticket filter. Valid filters include "info:value" (with regard to ticket info items) and basic search queries (i.e. "printer"). Filters can be separated with spaces. Only authorized users may view tickets that they are not involved in.
##### Request
```json
{
    "ticket_filter": "category:tech"
}
```
##### Response
```json
{
    "tickets": [
        {
            "ticket_id": "12345",
            "ticket_info": {
                "title": "title",
                "description": "description",
                "priority": "high",
                "status": "open",
                "category": "tech",
                "user": "username",
                "assignee": "username"
            }
        },
        {
            "ticket_id": "67890",
            "ticket_info": {
                "title": "title",
                "description": "description",
                "priority": "high",
                "status": "open",
                "category": "tech",
                "user": "username",
                "assignee": "username"
            }
        }
    ],
    "status": "success"
}
```
##### Errors
 - *400 Bad Request* - Invalid filter.

---
#### /api/create-ticket
##### Details
Create a new ticket. Only authorized users may create a ticket under a different user.
##### Request
```json
{
    "ticket_info": {
        "username": "username",
        "title": "title",
        "description": "description"
    }
}
```
##### Response
```json
{
    "status": "success"
}
```
##### Errors
 - *400 Bad Request* - Invalid ticket information.

---
#### /api/withdraw-ticket
##### Details
Withdraw a ticket. Only authorized users may withdraw tickets that they did not create.
##### Request
```json
{
    "ticket_id": "12345"
}
```
##### Response
```json
{
    "status": "success"
}
```
##### Errors
 - *404 Not Found* - Failed to find ticket.

---
#### /api/send-chat
##### Details
Send a chat message within a ticket. Only authorized users may chat in tickets they are not involved in.
##### Request
```json
{
    "ticket_id": "12345",
    "message": "message"
}
```
##### Response
```json
{
    "status": "success"
}
```
##### Errors
 - *400 Bad Request* - Invalid message.
 - *404 Not Found* - Failed to find ticket.

---
#### /api/list-chat
##### Details
List the chat messages within a ticket. Only authorized users may list chats they are not involved in.
##### Request
```json
{
    "ticket_id": "12345"
}
```
##### Response
```json
{
    "messages": [
        {
            "username": "username",
            "message": "message"
        }
    ],
    "status": "success"
}
```
##### Errors
 - *404 Not Found* - Failed to find ticket.

---
### Additional errors
 - *400 Bad Request* - Request is malformed in some unexpected way
 - *403 Forbidden* - Access token passed in header does not have the necessary permissions for this action
