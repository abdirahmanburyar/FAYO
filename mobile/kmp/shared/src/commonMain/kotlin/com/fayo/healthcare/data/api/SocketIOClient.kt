package com.fayo.healthcare.data.api

/**
 * Expect declaration for platform-specific Socket.IO client
 * Android implementation uses io.socket:socket.io-client
 * iOS would need a different implementation
 */
expect class SocketIOClient(url: String) {
    fun connect(): SocketIOConnection
    fun disconnect()
    fun isConnected(): Boolean
    fun on(event: String, callback: (Array<Any>) -> Unit)
    fun emit(event: String, vararg data: Any)
    fun off(event: String)
}

/**
 * Platform-agnostic interface for Socket.IO connection
 */
interface SocketIOConnection {
    fun isConnected(): Boolean
}

