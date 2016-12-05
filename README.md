# Pollson
/pɔʊlzɒn/

## Run the server
All you need to do once you've cloned the repo is run MongoDB with `mongod`, do an `npm install` and an `npm start`. The server will the be running on `localhost:3030`.
Note: All the following requests should have a `Content-Type: application/json` header.

## Create a user
To add a user, `POST` on `localhost:3030/users` a request with the following body:

```json
{
  "email": "super@admin.com",
  "password": "LetMeIn123"
}
```
The expected response is a `201 created`.

## Get user's JWT
To get a user's token (JSON Web Token), `POST` a request with the email and password. This token should be attached as an `Authorization` header in subsequent requests where the user needs to be identified.

```json
{
  "email": "super@admin.com",
  "password": "LetMeIn123"
}
```

The expected response is a `201 created` with the token in return body.

## Get a guest token
The guest token is used to answer questions. It is only valid for one room.
If you wish to post new rooms, you should create a new user. To obtain a guest token, `POST` on the `/guests` endpoint a request with the room for which it will be valid.

```json
{
  "room": 1234
}
```

The expected response is a `201 created` with the token and the long id (e.g. `58453c57f7b27d31f4637a90`) in return body.

### Rooms with password
If the room has a password and you do not provide one, you will reveive a `400 bad request` with an error message saying `"message": "This room requires a password"`.
If you provide the wrong password, the response will also be a `400`, but with `"message": "Wrong password"`.

## Create a room
To create a new room, `POST` it on the `/rooms` endpoint. Here's a small example room (the format is very likely to change in the near future):

```json
{
	"name": "My first room",
	"questions":
	[
		{
			"text": "How old is the universe?",
			"options":
			[
				{"text": "1 Million years"},
				{"text": "1 Billion years"}
			],
			"open": "true"
		}
	]
}
```

You can optionnaly add a 4 number password (e.g. `"password": 1212`).
