import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

interface ConnectedClient {
  id?: string;
  socket?: Socket;
  username?: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private clients: Map<string, ConnectedClient> = new Map();

  /**
   * Handle new client connections
   */
  handleConnection(client: Socket) {
    console.log('start connection');
    const clientInfo: ConnectedClient = {
      id: client.id,
      socket: client,
    };

    this.clients.set(client.id, clientInfo);

    console.log(`✓ Client connected: ${client.id}`);
    console.log(`  Total clients: ${this.clients.size}`);

    // Notify all clients about new connection
    this.server.emit('server-message', {
      type: 'join',
      message: `Client ${client.id} joined the chat`,
      timestamp: new Date().toISOString(),
    });

    // Send current client count to all
    this.broadcastClientCount();
  }

  /**
   * Handle client disconnections
   */
  handleDisconnect(client: Socket) {
    const clientInfo = this.clients.get(client.id);

    if (clientInfo) {
      const username = clientInfo.username || client.id;
      this.clients.delete(client.id);

      console.log(`✗ Client disconnected: ${client.id}`);
      console.log(`  Total clients: ${this.clients.size}`);

      // Notify all clients about disconnection
      this.server.emit('server-message', {
        type: 'leave',
        message: `${username} left the chat`,
        timestamp: new Date().toISOString(),
      });

      this.broadcastClientCount();
    }
  }

  /**
   * Handle incoming messages and broadcast to all clients
   */
  @SubscribeMessage('message')
  handleMessage(
    @MessageBody() data: { message: string; username?: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const clientInfo = this.clients.get(client.id);

      if (!clientInfo) {
        this.logger.error(`Client ${client.id} not found in clients map`);
        return;
      }

      // Update username if provided
      if (data.username && !clientInfo.username) {
        clientInfo.username = data.username;
        console.log(`Client ${client.id} set username: ${data.username}`);
      }

      const username = clientInfo.username || client.id;

      console.log(`[${username}] ${data.message || '<empty message>'}`);

      // Broadcast to all clients EXCEPT the sender
      client.broadcast.emit('message', {
        id: client.id,
        username: username,
        message: data.message,
        timestamp: new Date().toISOString(),
      });

      console.log('other client should see ');

      // Confirm receipt to sender
      return {
        status: 'sent',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Error handling message: ${error.message}`);
      throw error;
    }
  }

  /**
   * Handle username changes
   */
  @SubscribeMessage('set-username')
  handleSetUsername(
    @MessageBody() username: string,
    @ConnectedSocket() client: Socket,
  ) {
    const clientInfo = this.clients.get(client.id);

    if (clientInfo) {
      const oldUsername = clientInfo.username || client.id;
      clientInfo.username = username;

      console.log(
        `Client ${client.id} changed username: ${oldUsername} → ${username}`,
      );

      // Notify all clients about username change
      this.server.emit('server-message', {
        type: 'username-change',
        message: `${oldUsername} is now known as ${username}`,
        timestamp: new Date().toISOString(),
      });

      return { success: true, username };
    }

    return { success: false, error: 'Client not found' };
  }

  /**
   * Get list of connected users
   */
  @SubscribeMessage('get-users')
  handleGetUsers(
    @MessageBody() connectedUsers: string,
    @ConnectedSocket() client: Socket,
  ) {
    const users = Array.from(this.clients.values()).map((c) => {
      return {
        id: c.id,
        username: c.username || c.id,
      };
    });

    console.log(`Client ${client.id} requested user list:`, users);

    return { users, count: users.length };
  }

  /**
   * Broadcast current client count to all clients
   */
  private broadcastClientCount() {
    this.server.emit('client-count', {
      count: this.clients.size,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Graceful shutdown
   */
  async onModuleDestroy() {
    console.log('⌛ Shutting down gateway...');

    // Notify all clients
    this.server.emit('server-message', {
      type: 'shutdown',
      message: 'Server is shutting down',
      timestamp: new Date().toISOString(),
    });

    // Close all connections
    this.server.close();
    this.clients.clear();

    console.log('✓ Gateway shut down successfully');
  }
}
