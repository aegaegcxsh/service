
# API Reference (all endpoints are prefixed with /api)

This document lists the application's HTTP endpoints, required headers, request payloads and sample responses.

Notes
- All endpoints are reachable under the `/api` global prefix (set in `main.ts`). E.g. the login route is `POST /api/auth/login`.
- Validation: DTO validation is enabled; requests must use `Content-Type: application/json` for JSON bodies.
- Protected endpoints require an Authorization header: `Authorization: Bearer <JWT>`.

## Auth

- POST /api/auth/register
  - Headers:
    - Content-Type: application/json
  - Body (application/json):
    - username: string
    - password: string (min length 6)
  - Success: 201 Created
    - Example response body:
      {
        "id": 12,
        "username": "alice"
      }
  - Errors: 400 (validation) / 409 (user exists)

- POST /api/auth/login
  - Headers:
    - Content-Type: application/json
  - Body (application/json):
    - username: string
    - password: string
  - Success: 200 OK
    - Example response body:
      {
        "accessToken": "eyJhbGci...", 
        "user": { "id": 12, "username": "alice" }
      }
    - Notes: the token is also commonly returned in the Authorization response header in some setups; this project returns it in the response body.
  - Errors: 401 Unauthorized

- GET /api/auth/me (protected)
  - Headers: Authorization: Bearer <token>
  - Success: 200 OK
    - Example response:
      { "id": 12, "username": "alice" }
  - Errors: 401 if token missing/invalid

## Users

- GET /api/users
  - Headers: Authorization: Bearer <token>
  - Success: 200
    - Example: [ { id, username, createdAt, updatedAt }, ... ]

- GET /api/users/:id
  - Headers: Authorization: Bearer <token>
  - Params: id (integer)
  - Success: 200 -> { id, username, createdAt, updatedAt }
  - Errors: 404

- POST /api/users
  - Headers: Content-Type: application/json
  - Body: { username: string, password: string }
  - Success: 201 -> created user (password is never returned)
  - Errors: 400 / 409

- PATCH /api/users/:id
  - Headers: Authorization: Bearer <token>, Content-Type: application/json
  - Body: partial { username?: string, password?: string }
  - Success: 200 -> updated user
  - Errors: 400 / 404 / 409

- DELETE /api/users/:id
  - Headers: Authorization: Bearer <token>
  - Success: 204 No Content
  - Errors: 404

## Clients (protected by JWT)

- POST /api/clients
  - Headers: Authorization: Bearer <token>, Content-Type: application/json
  - Body: { name: string, email?: string, phone: string }
  - Success: 201 -> created client
  - Example response:
    {
      "id": 5,
      "name": "John",
      "email": "john@example.com",
      "phone": "+1234567890",
      "createdAt": "2025-10-09T00:00:00.000Z"
    }

- GET /api/clients
  - Headers: Authorization: Bearer <token>
  - Success: 200 -> array of clients

- GET /api/clients/:id
  - Headers: Authorization: Bearer <token>
  - Params: id
  - Success: 200 -> client

- PATCH /api/clients/:id
  - Headers: Authorization: Bearer <token>, Content-Type: application/json
  - Body: partial CreateClientDto
  - Success: 200 -> updated client

- DELETE /api/clients/:id
  - Headers: Authorization: Bearer <token>
  - Success: 204

## Country

- GET /api/country
  - Success: 200 -> [countries]
  - Example response:
    [ { "id": 1, "title": "USA" }, { "id": 2, "title": "Russia" } ]

- GET /api/country/:id
  - Params: id
  - Success: 200 -> country

- POST /api/country
  - Headers: Authorization: Bearer <token>, Content-Type: application/json
  - Body: { title: string }
  - Success: 201 -> created country

- PATCH /api/country/:id
  - Headers: Authorization: Bearer <token>, Content-Type: application/json
  - Body: partial { title?: string }
  - Success: 200 -> updated country

- DELETE /api/country/:id
  - Headers: Authorization: Bearer <token>
  - Success: 204

## Events

- GET /api/events
  - Success: 200 -> [events]

- GET /api/events/:id
  - Params: id
  - Success: 200 -> event

- POST /api/events
  - Headers: Authorization: Bearer <token>, Content-Type: application/json
  - Body:
    - title: string
    - description?: string
    - startDate: string (ISO)
    - endDate?: string (ISO)
    - isActive?: boolean
  - Success: 201 -> created event
  - Errors: 400 (invalid dates)

- PATCH /api/events/:id
  - Headers: Authorization: Bearer <token>, Content-Type: application/json
  - Body: partial CreateEventDto
  - Success: 200 -> updated event

- DELETE /api/events/:id
  - Headers: Authorization: Bearer <token>
  - Success: 204

## Broadcast

- POST /api/broadcast
  - Headers: Authorization: Bearer <token>, Content-Type: application/json
  - Body: SendBroadcastDto
    - message: string
    - filter_country_id?: number
    - filter_event_id?: number
  - Success: 201 -> saved broadcast log
  - Notes: BroadcastService sends messages via WhatsApp. The endpoint triggers sending — long-running operations may take time. See BroadcastService for details.

## Root

- GET /api/
  - Success: 200
    - Body: plain text from `AppService.getHello()`

## Example requests

- Login request

  POST /api/auth/login
  Headers:
    Content-Type: application/json

  Body:
  {
    "username": "alice",
    "password": "secret"
  }

  Sample successful response (200):
  {
    "accessToken": "eyJhbGci...",
    "user": { "id": 12, "username": "alice" }
  }

- Protected request example

  GET /api/clients
  Headers:
    Authorization: Bearer eyJhbGci...

  Response (200):
  [ { id: 1, name: 'John', phone: '+123456' }, ... ]

## Additional notes
- If your frontend needs cookies/credentials, set the env var `FRONTEND_URL` to the frontend origin and the server will enable CORS with credentials.
- Passwords are hashed with bcrypt and never included in API responses.


