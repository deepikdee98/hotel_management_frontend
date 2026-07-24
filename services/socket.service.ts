"use client"

import { io, type Socket } from "socket.io-client"

export interface RealtimeChange {
  id: string
  modules: string[]
  resource: string
  action: "created" | "updated" | "deleted"
  propertyId: string | null
  actorId: string
  occurredAt: string
  targetUserId?: string | null
}

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3002"

class SocketService {
  private socket: Socket | null = null

  connect(token: string) {
    if (this.socket) {
      this.socket.auth = { token }
      if (!this.socket.connected) this.socket.connect()
      return this.socket
    }

    this.socket = io(SOCKET_URL, {
      auth: { token },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      reconnectionDelayMax: 5000,
      randomizationFactor: 0.5,
      transports: ["websocket", "polling"],
    })
    return this.socket
  }

  updateToken(token: string) {
    if (!this.socket) return this.connect(token)
    this.socket.auth = { token }
    if (this.socket.connected) {
      this.socket.disconnect().connect()
    } else {
      this.socket.connect()
    }
    return this.socket
  }

  selectProperty(propertyId: string) {
    this.socket?.emit("property:select", propertyId)
  }

  disconnect() {
    this.socket?.removeAllListeners()
    this.socket?.disconnect()
    this.socket = null
  }
}

export const socketService = new SocketService()
