package com.fayo.healthcare.data.api

import io.socket.client.IO
import io.socket.client.Socket
import java.net.URI

/**
 * Android-specific Socket.IO client wrapper
 * This is used to connect to Socket.IO servers (like NestJS with socket.io)
 */
actual class SocketIOClient actual constructor(private val url: String) {
    private var socket: Socket? = null
    
    actual fun connect(): SocketIOConnection {
        // Parse URL to extract base URL and path
        val uri = URI.create(url)
        val baseUrl = "${uri.scheme}://${uri.host}:${uri.port}"
        val socketIOPath = uri.path // e.g., "/api/v1/ws/appointments"
        
        println("📞 [SocketIO] Base URL: $baseUrl")
        println("📞 [SocketIO] Socket.IO Path: $socketIOPath")
        
        val options = IO.Options().apply {
            reconnection = true
            reconnectionAttempts = 10
            reconnectionDelay = 1000
            reconnectionDelayMax = 5000
            timeout = 20000
            // Set custom path - backend uses /api/v1/ws/appointments instead of default /socket.io/
            path = socketIOPath
            // Allow both websocket and polling transports
            transports = arrayOf("websocket", "polling")
        }
        
        socket = IO.socket(URI.create(baseUrl), options)
        socket?.connect()
        return SocketIOConnectionImpl(socket!!)
    }
    
    actual fun disconnect() {
        socket?.disconnect()
        socket = null
    }
    
    actual fun isConnected(): Boolean {
        return socket?.connected() == true
    }
    
    actual fun on(event: String, callback: (Array<Any>) -> Unit) {
        socket?.on(event) { args ->
            callback(args)
        }
    }
    
    actual fun emit(event: String, vararg data: Any) {
        socket?.emit(event, *data)
    }
    
    actual fun off(event: String) {
        socket?.off(event)
    }
    
    /**
     * Wrapper to make Socket compatible with SocketIOConnection interface
     */
    private class SocketIOConnectionImpl(private val socket: Socket) : SocketIOConnection {
        override fun isConnected(): Boolean = socket.connected()
    }
}

