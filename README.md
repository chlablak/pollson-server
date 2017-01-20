# Pollson-server
**/pɔʊlzɒn/**

## Context
This application is being developped in the context of a [web technologies lesson](https://github.com/SoftEng-HEIGVD/Teaching-HEIGVD-TWEB-Lectures) given at HEIG-VD. It is being developped by [chlablak](https://github.com/chlablak) and [moodah](https://github.com/moodah). The client part of the project can be found in [this repo](https://github.com/chlablak/pollson).

## Technologies
Our application has been implemented with the MEAN stack (latest versions). We also used [Feathers](http://feathersjs.com) (later version) on top of Express to simplify database interactions.

## Building
Make sure you have MongoDB, Node.js and npm installed. All you need to do once you've cloned the repo is run MongoDB with `mongod`, do an `npm install` and an `npm start` from the repo directory. The server will the be running on `localhost:3030`. It is also hosted on Heroku at http://pollson.herokuapp.com.
Note: All the following requests should have a `Content-Type: application/json` header.

## Documentation

### Create a user
To add a user, `POST` on `localhost:3030/users` a request with the following body:

```json
{
  "email": "super@admin.com",
  "password": "LetMeIn123"
}
```
The expected response is a `201 created`.

### Get user's JWT
To get a user's token (JSON Web Token), `POST` a request with the email and password on `/auth/local`. This token should be attached as an `Authorization` header in subsequent requests where the user needs to be identified.

```json
{
  "email": "super@admin.com",
  "password": "LetMeIn123"
}
```

The expected response is a `201 created` with the token in return body.

### Get a guest token
The guest token is used to answer questions. It is only valid for one room.
If you wish to post new rooms, you should create a new user. To obtain a guest token, `POST` on the `/guests` endpoint a request with the room for which it will be valid.

```json
{
  "room": 1234
}
```

The expected response is a `201 created` with the token and the long id (e.g. `58453c57f7b27d31f4637a90`) in return body.

If a normal user wishes to answer an other user's questions, they need to `POST` on the `/guests` endpoint with their JWT. This will give them the long id to the room and subscribe them to the Socket.IO events on that room.

#### Rooms with password
If the room has a password and you do not provide one, you will reveive a `400 bad request` with an error message saying `"message": "This room requires a password"`.
If you provide the wrong password, the response will also be a `400`, but with `"message": "Wrong password"`.

### Join an other user's room
To answer questions in a room created by an other user, you will need to use the `/guests` endpoint, but will have to join the current user's token in the `Authorization` header, otherwise you will simply get a guest token in return. Joining the current user's token will allow them to answer questions in the new room and subscribe them to events happening in that room (see event management below).

The expected response is a `201 created` with the token and the long id (e.g. `58453c57f7b27d31f4637a90`) in return body, same as when getting a guest token.

### Create a room
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
The expected response is a `201 created`.

### Answer a question
To answer a question, you must `POST` on `/answers` endpoint. The header of the request needs to contain the guest's token and the body of the request should look something like this:

```json
{
	"answer": "5845413180076429eca241f5"
}
```
The expected response is a `201 created`.

### Event management
To keep all users up to date on voting, our application uses Socket.IO. When a user joins a room or creates one, they should open a websocket connection on the server, at the same address as the REST API. The user's token should be added as a query parameter (in the query's url, `?token=...`) so the server can identify the user or guest that opened the connection, in order to send them only the updates on the rooms they are interested in.

Every time a `PATCH` or `PUT` is done on a room, the server will send out the updated room status to all clients with an open socket connection that are subscribed to this room (users and guests). This allows the client application to update voting stats in real time.
