# Broadcast Server - CLI WebSocket Chat

Project URL: [https://github.com/wafiben/Broadcast-Server](https://github.com/wafiben/Broadcast-Server)

This project is a **CLI-based WebSocket chat application** using **NestJS** and **Socket.IO**.  
It allows you to start a server or connect as a client, send messages, set usernames, and view the list of connected users.

---

## Features
https://github.com/wafiben/Broadcast-Server
### Server
- Start a WebSocket server using `broadcast-server start`.
- Automatically tracks connected clients.
- Logs when clients connect or disconnect.
- Broadcasts messages to all connected clients.
- Handles username changes and broadcasts updates.
- Tracks the number of connected clients.
- Graceful shutdown with notification to all clients.

### Client
- Connect to the server using `broadcast-server connect` or a Socket.IO client.
- Send messages with a username.
- Change username dynamically.
- Request the list of currently connected users.
- Automatically opens the pre-configured Socket.IO client tool in the browser.

### Events
The following **Socket.IO events** are implemented:

| Event Name       | Direction        | Description |
|------------------|-----------------|-------------|
| `message`        | Client → Server | Send a message to all other clients. |
| `server-message` | Server → Client | Broadcast server messages (join, leave, username change, shutdown). |
| `set-username`   | Client → Server | Set or update the username for the client. |
| `get-users`      | Client → Server | Request the list of currently connected users. |
| `client-count`   | Server → Client | Broadcast the total number of connected clients. |

---

## How It Works

1. **Server Startup**
   - Start the server using:

     ```bash
     broadcast-server start
     ```

   - The server listens on `http://localhost:3000`.
   - Automatically opens the [Socket.IO Client Tool](https://amritb.github.io/socketio-client-tool/) in the browser with preloaded configuration for connecting as a client.

2. **Client Connection**
   - Clients can connect via the CLI or using the Socket.IO Client Tool.
   - Set a username using `set-username`.
   - Send messages using the `message` event.
   - Request the list of connected users using the `get-users` event.
   - All clients will see notifications for joins, leaves, and username changes.

3. **Message Flow**
   - Clients send messages via `message`.
   - Server broadcasts messages to all clients except the sender.
   - Server logs all messages in the console with username or client ID.

4. **Username Management**
   - Each client can set or change their username with `set-username`.
   - Username changes are broadcast to all connected clients.

5. **Client List**
   - Clients can request the list of connected users using `get-users`.
   - Server responds with all client IDs and usernames.

6. **Shutdown**
   - Server gracefully shuts down using `onModuleDestroy()`.
   - Notifies all clients about shutdown.
   - Closes all WebSocket connections and clears the client list.

---

## Installation

```bash
git clone https://github.com/wafiben/Broadcast-Server
cd Broadcast-Server
npm install
