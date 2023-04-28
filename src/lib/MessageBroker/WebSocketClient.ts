// © 2021 Brill Software Limited - Brill Framework, distributed under the MIT license.
import { MB } from "./MB"
import SockJS from "sockjs-client"
import { ErrorMsg } from "./ErrorMsg"
import { User } from "lib/ComponentLibraries/material_ui/button/LoginButton"
import { CryptoService } from "./CryptoService"
import { HashUtils } from "lib/utils/HashUtils"

/**
 * Handles all comminications with the server using Web Sockets.
 * 
 */

export class WebSocketClient {
    // The topic to use to reconnect a session after a disconnection.
    public static AUTH_RECONNECT_TOPIC = "auth:/${appName}/reconnect"

    // The topic to send a copy of all error messages to.
    public static APP_ERRORS_TOPIC = "app:errors:"

    // By default set USE_SOCKS_JS to true. Only set to false if you wish to view messages using the Chrome Developer tools.
    private static USE_SOCKS_JS: boolean = true

    private static MIN_RETRY_INTERVAL: number = 1000
    private static MAX_RETRY_INTERVAL: number = 15000

    private static MAX_LOG_ENTRY_LEN = 1000

    // TODO Possibly need to remove localhost.
    private static WS_DEV_SERVER_URL: string = "localhost:8080/brill_ws"    
    private static SOCKS_JS_DEV_SERVER_URL: string = "localhost:8080/brill_socksjs"    
    private static WS_SERVER_URL: string = "/brill_ws"
    private static SOCKS_JS_SERVER_URL: string = "/brill_socksjs"

    private static webSocket: WebSocket

    private static connected: boolean = false

    private static authenticationData: User | null

    private static msgQueue: string[] = []

    private static retryCount: number = 0;

    private static connectionLost: boolean = false

    public static sendMessage(message: string) {
        if (!this.connected) {
            this.openConnection()
            this.msgQueue.push(message)
        } else {
            this.webSocket.send(message)
            if (process.env.NODE_ENV !== "production") {
                console.log("Sent: " + WebSocketClient.truncate(message))
            }
        }
    }

    /**
     * Opens a connection either using either the SocksJS protocol or just plain WebSockets. The Brill Server makes available two endpoints, /brill_ws and /brill_socksjs.
     * 
     * SocksJS has fallback modes that will work even when WebSockets are blocked. The downside is that the messages can't be viewed using the Chrome Developer Network tool.
     * 
     */
    private static openConnection() {
        console.log("Opening WebSocket connection. Environment = " + process.env.NODE_ENV)
        
        if (WebSocketClient.USE_SOCKS_JS) {
            const wsUrl = window.location.protocol + "//" + (process.env.NODE_ENV === "production" ? window.location.host + WebSocketClient.SOCKS_JS_SERVER_URL : WebSocketClient.SOCKS_JS_DEV_SERVER_URL)
            const sockJsProtocols = [ "websocket", "xhr-streaming", "xhr-polling"] 
            WebSocketClient.webSocket = new SockJS(wsUrl, null, {transports: sockJsProtocols})
        } else {
            const wsUrl = (window.location.protocol === "https:" ? "wss://" : "ws://") +
            (process.env.NODE_ENV === "production" ? window.location.host + WebSocketClient.WS_SERVER_URL : WebSocketClient.WS_DEV_SERVER_URL)
            WebSocketClient.webSocket = new WebSocket(wsUrl)
        }

        WebSocketClient.webSocket.addEventListener("open", WebSocketClient.connectionOpened)
        WebSocketClient.webSocket.addEventListener("error", WebSocketClient.socketError)
        WebSocketClient.webSocket.addEventListener("message", WebSocketClient.messageReceived)
        WebSocketClient.webSocket.addEventListener("close", WebSocketClient.connectionClosed)

    }

    private static async connectionOpened(event: any) {
        console.log("WebSocket open")
        WebSocketClient.connected = true;
        WebSocketClient.retryCount = 0;
        while (WebSocketClient.msgQueue.length > 0) {
            const msg: string | undefined = WebSocketClient.msgQueue.pop()
            if (msg !== undefined) {
                WebSocketClient.webSocket.send(msg)
                if (process.env.NODE_ENV !== "production") {
                    console.log("Sent: " + WebSocketClient.truncate(msg))
                }
            }
        }
        if (WebSocketClient.connectionLost) {
            WebSocketClient.connectionLost = false
            // Set up session
            if (WebSocketClient.authenticationData) {
                if (CryptoService.isSharedSecretAvailable()){
                    // Create a password using the username and session id. The session id changes on each re-connection, thus the 
                    // passsword is different every time and a replay type attack is not possible.
                    const hashHex = await HashUtils.hashPwd(WebSocketClient.authenticationData.username, WebSocketClient.authenticationData.sessionId)
                    WebSocketClient.authenticationData["password"] = await CryptoService.encrypt(hashHex)
                }
                /*eslint no-template-curly-in-string: 0*/
                MB.sendRequest(WebSocketClient.AUTH_RECONNECT_TOPIC, WebSocketClient.reconnectCallback, WebSocketClient.reconnectErrorCallback, WebSocketClient.authenticationData)
            } else {
                const error: ErrorMsg = new ErrorMsg("Connected", "The server connection was re-established. You may need to log in again.", ErrorMsg.SUCCESS_SEVERITY)
                MB.publish(WebSocketClient.APP_ERRORS_TOPIC, error)
            }
        }
    }

    public static reconnectCallback(topic: string, data: any) {
        WebSocketClient.authenticationData = data
        const error: ErrorMsg = new ErrorMsg("Connected", "The connection to the server was re-established. Please continue.", ErrorMsg.SUCCESS_SEVERITY)
        MB.publish(WebSocketClient.APP_ERRORS_TOPIC, error)
    }

    public static reconnectErrorCallback(topic: string, error: ErrorMsg) {
        console.error("Error: " + topic + " : "  + error.title + " " + error.detail)
    }

    private static messageReceived(event: any) {
        if (process.env.NODE_ENV !== "production") {
            console.log("Received: " + WebSocketClient.truncate(event.data))
        }
        const message: any = JSON.parse(event.data)
        switch (message.event) {
            case "publish":
                MB.publishReceivedFromServer(message.topic, message.content)
                break
            case "response":
                MB.publishReceivedFromServer(message.topic, message.content)
                break
            // case "authentication_success":   // Can possible be removed. Not used aymore?
            // case "authentication_failed":
            //     MB.callAuthenticateCallback(message)
            //     break
            case "error":
                MB.handleServerReportedError(message.topic, message.content)
                break
            default:
                console.log(`Unexpected event of ${message.event}`)
        }
    }

    private static truncate(msg: string) {
        if (msg.length < WebSocketClient.MAX_LOG_ENTRY_LEN) {
            return msg
        }
        return msg.substring(0, WebSocketClient.MAX_LOG_ENTRY_LEN) + "..."
    }

    private static socketError(event: Event) {
        console.log("Socket error")
    }

    /**
     * Attempts to re-open a closed connection. The delay before re-trying is initially a random value
     * of beteen 1s and 2s. As more retries occur, the delay increases to between 1s and 15s. 
     * The random delay is to prevent the server being hit with large numbers of simultaneous 
     * connection requests.
     * 
     * @param event 
     */
    private static connectionClosed(event: Event) {
        console.log("Connection closed")
        this.connected = false
        WebSocketClient.retryCount++
        let retryTimeout = Math.floor(Math.random() * WebSocketClient.retryCount * 1000) + WebSocketClient.MIN_RETRY_INTERVAL
        if (retryTimeout > WebSocketClient.MAX_RETRY_INTERVAL) {
            retryTimeout = WebSocketClient.MAX_RETRY_INTERVAL
            if (WebSocketClient.retryCount > 7) {
                WebSocketClient.retryCount -= 6
            }
        }
        console.log(`Trying to re-connect WebSocket session in ${retryTimeout / 1000} seconds. Retry count = ${WebSocketClient.retryCount}`)
        setTimeout(WebSocketClient.openConnection, retryTimeout)
        if (!WebSocketClient.connectionLost) {
            WebSocketClient.connectionLost = true
            const error: ErrorMsg = new ErrorMsg("Server Connection Lost", 
                "The connection to the server was lost. Please wait while the connection is re-established.", ErrorMsg.WARNING_SEVERITY)
            MB.publish(WebSocketClient.APP_ERRORS_TOPIC, error)
        }
    }

    public static saveAuthenticationResponse(user: User) {
        WebSocketClient.authenticationData = user   
    }

    public static clearAuthenticationResponse() {
        WebSocketClient.authenticationData = null
    }
}