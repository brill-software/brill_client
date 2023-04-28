// © 2021 Brill Software Limited - Brill Framework, distributed under the MIT license.
import { WebSocketClient } from "lib/MessageBroker/WebSocketClient"
import { Filter, CallbackFunction, TopicEntry } from "lib/MessageBroker/TopicEntry"
import { ErrorMsg } from "lib/MessageBroker/ErrorMsg"

/**
 * Brill Middleware Client Message Broker. 
 * 
 * Handles communications between the client and server and locally
 * between components. 
 * 
 * Supports both subscribe/publish and request/response messaging.
 * 
 */

export class CombinedData {
    [fieldName: string]: any
}

export class Token {
    readonly app: string
    readonly topic: string
    readonly callbackFunc: CallbackFunction
    readonly errorCallback: CallbackFunction

    constructor(app: string, topic: string, callbackFunc: CallbackFunction, errorCallback: CallbackFunction) {
        this.app = app
        this.topic = topic
        this.callbackFunc = callbackFunc
        this.errorCallback = errorCallback
    }
}
export class MB {

    private static authenticateCallback: CallbackFunction | null = null
    private static topicMap: Map<string, TopicEntry> = new Map<string, TopicEntry>()
    private static currentApp: string = "brill_cms"

    /**
     * Sets the default app name.
     * 
     * @param appName App name.
     *
     */
    static setCurrentApp(appName: string) {
        this.currentApp = appName
    }

    /**
     * Returns the current default app name.
     */
    static getCurrentApp(): string {
        return this.currentApp
    }

    /**
     * Subscribe to a topic.
     * 
     * The filter is used to restict the amount of data retrived from the server and is typically
     * used to page through rows of data.
     * 
     * @param topic 
     * @param callbackFunc 
     * @param filter 
     */
    public static subscribe(topic: string, callbackFunc: CallbackFunction, errorCallback: CallbackFunction, filter?: object): Token {
        if (topic === undefined) {
            return new Token(this.currentApp, "", callbackFunc, errorCallback)
        }
        const resolvedTopic = this.resolve(topic, false)
       
        let topicEntry = MB.topicMap.get(resolvedTopic)
        if (topicEntry === undefined) {
            // There are no existing subscriptions to Topic.
            topicEntry = new TopicEntry(resolvedTopic, undefined, callbackFunc, errorCallback, filter)
            MB.topicMap.set(resolvedTopic, topicEntry)
        } else {
            // There's already at least one subscription to the Topic.
            topicEntry.addCallback(callbackFunc)
            // A trip to the Server can be avoided if we already have the data and there are no filters.
            if (topicEntry.getData() !== undefined && topicEntry.isFilterUndefined() && filter === undefined) {
                topicEntry.deliver(callbackFunc)
                return new Token(this.currentApp, resolvedTopic, callbackFunc, errorCallback)
            }
            topicEntry.setFilter(filter)
        }

        const fieldName = this.getFieldName(topic)
        if (fieldName) {
            const parentTopic = this.resolve(topic, true)
            let parentEntry = MB.topicMap.get(parentTopic)
            if (parentEntry && parentEntry.getData() !== undefined && parentEntry.isFilterUndefined() && filter === undefined) {
                parentEntry.deliverField(callbackFunc, fieldName)
                return new Token(this.currentApp, resolvedTopic, callbackFunc, errorCallback)
            }
        }

        MB.refreshTopicFromServer(topicEntry)
        return new Token(this.currentApp, resolvedTopic, callbackFunc, errorCallback)
    }

    /**
     * Sends a request using Reuest/Reponse messaging. Request/Response messaging is the equivalent of publishing content
     * to a topic and subscribing to the topic to receive back a single response. Its like REST but the transport 
     * is WebSockets and the request and response are JSON messages. The topic is the equivalent of the REST http URI. The 
     * Request/Response messaging currently only supports the client sending requests to the server and the server replying 
     * with a response.
     * 
     * The callback function will only be called once. When the response is recevied, the callback is called and the Topic Entry
     * and content deleted. It is recommended to unsubscribe in the componentWillUnmount() method, just in case the
     * component is unmounted before the response is received.
     * 
     * @param topic The topic.
     * @param callbackFunc Function to call with the response
     * @param content
     * @returns Token for unsubscribing.
     */
     public static sendRequest(topic: string, callbackFunc: CallbackFunction, errorCallback: CallbackFunction, content?: any): Token {
         if (topic === undefined) {
             return new Token(this.currentApp, "", callbackFunc, errorCallback)
         }
        // Send the request
        const resolvedTopic = this.resolve(topic, true)
        let topicEntry = MB.topicMap.get(resolvedTopic)
        if (topicEntry === undefined) {
            topicEntry = new TopicEntry(resolvedTopic, content, callbackFunc, errorCallback)
            MB.topicMap.set(resolvedTopic, topicEntry)
        } else {
            topicEntry.setData(content)
            topicEntry.addCallback(callbackFunc)
            topicEntry.addErrorCallback(errorCallback)
        }
        MB.sendRequestToOthers(topicEntry)
        return new Token(this.currentApp, resolvedTopic, callbackFunc, errorCallback)
     }

    /**
     * Unsubscribes from a topic, removing the callbacks.
     * 
     * The reason for using a token is to avoid issues with callbacks that use ".bind(this)". 
     * With ".bind(this)", a totally new function is created. The following wouldn't work:
     * 
     *    subscribe("newFeed", this.handleDataLoaded.bind(this))
     *    unsubscribes("newFeed", this.handleDataLoaded.bind(this))
     * 
     * The function passed to unsubscribe is NOT EQUAL to the function passed into subscribe. The solution is either the
     * component needs to keep a copy of the subscribe function or a token can be returned by the subscribe methods that
     * is used for the unsubscribe. Using a token hides the details from the component.
     * 
     * The deleteData parameter allows an app topic to be deleted. This can be used when a compoment knows that the
     * topic will no longer be used and frees up the memory taken by the topic data.
     * 
     * @param token The token that was returned by the subscibe function.
     * @param deleteData Deletes the topic if it's local and there are no subscriptions left.
     */
    public static unsubscribe(token: Token, deleteData = false) {
        if (token === undefined || token.topic === undefined || token.topic.length === 0) {
            return
        }
        let topicEntry = MB.topicMap.get(token.topic)
        if (topicEntry === undefined) {
            return
        }
        if (topicEntry.getCallbackLen() <= 1 && !token.topic.startsWith("app:")) {
            MB.topicMap.delete(token.topic)
            const message = { event: "unsubscribe", topic: token.topic }
            WebSocketClient.sendMessage(JSON.stringify(message))
            return
        }
        if (topicEntry.getCallbackLen() <= 1 && deleteData) {
            MB.topicMap.delete(token.topic)
            return
        }
        topicEntry.removeCallback(token.callbackFunc)
        topicEntry.removeErrorCallback(token.errorCallback)

        if (topicEntry.getCallbackLen() === 0 && deleteData) {
            MB.topicMap.delete(token.topic)
        }
    }

    public static unsubscribeAll(tokens: Token[]) {
        for (const token of tokens) {
            MB.unsubscribe(token)
        }
    }

    public static delete(topic: string) {
        const resolvedTopic = this.resolve(topic, false)
        let topicEntry = MB.topicMap.get(resolvedTopic)
        if (topicEntry) {
            MB.topicMap.delete(resolvedTopic)
        }
    }


    public static validationFailed(topicRoot: string): boolean {
        console.log("Validation failed called ")
        let validationFailed = false;
        MB.topicMap.forEach((value: TopicEntry, key: string) => {
            if (key.startsWith("app:" + topicRoot)) {
                const validationCallback = value.getValidationCallback()
                if (validationCallback !== null) {
                    const failed = value.devliverImmediate(validationCallback)
                    if (failed) {
                        console.log("Failed validation for " + key)
                        validationFailed = true
                    }
                }
            }
        })
        return validationFailed
    }

    public static changeFilter(topic: string, filter: Filter) {
        const resolvedTopic = this.resolve(topic, false)
        let topicEntry = MB.topicMap.get(resolvedTopic)
        if (topicEntry === undefined) {
            return
        }
        topicEntry.setFilter(filter)
        MB.refreshTopicFromServer(topicEntry)
    }

    public static getData(topicRoot: string): CombinedData {
        console.log("getTopicRoot calls")
        let result: CombinedData = {}
        MB.topicMap.forEach((value: TopicEntry, key: string) => {
            if (key.startsWith("app:" + topicRoot)) {
                const lastPart = key.substr(key.lastIndexOf('.') + 1)
                result[lastPart] = value.getData()
            }
        })
        return result
    }

    public static getCurrentData(topic: string): any {
        const resolvedTopic = this.resolve(topic, false)
        let topicEntry = MB.topicMap.get(resolvedTopic)
        if (topicEntry === undefined) {
            return undefined
        }
        return topicEntry.getData()
    }

    /**
     * Publishes data to a topic.
     * 
     * If an app: topic specifies a field name, the value in the parent topic is also updated. For example,
     * with the topic formData#username, the parent topic is formData and the field name is username. The
     * topic formData#username will be set to a new string value and the topic formData is expected to be an
     * object and the field username will also be set to the new string value. Only subscribers with a subscription
     * to formData#username will be notified of the change.
     * 
     * Currently fields are only supported for application local ( app: ) topics but support for server side
     * topics, where a field name is provided, could be added in the future.
     * 
     * @param topic 
     * @param newData 
     * @param validationCallback 
     * @returns 
     */
    public static publish(topic: string | undefined, newData: any, validationCallback?: CallbackFunction) {
        if (topic === undefined) {
            return
        }
        const resolvedTopic = this.resolve(topic, false)
        let topicEntry = MB.topicMap.get(resolvedTopic)
        if (topicEntry === undefined) {
            topicEntry = new TopicEntry(resolvedTopic)
            MB.topicMap.set(resolvedTopic, topicEntry)
        }
        topicEntry.setData(newData)
        if (validationCallback !== undefined) {
            topicEntry.setValidationCallback(validationCallback)
        }

        MB.publishTopicToOthers(topicEntry)
        // Publish to app:any: if there are any subscribers.
        if (topic !== "app:any:" && topic !== "app:errors:" && MB.topicMap.has("app:any:")) {
            MB.publish("app:any:", {topic: topic, data: newData})
        }
        
        // When the topic has a field name (e.g. userForm#username ) update the parent topic.
        // Note that subscribers to the parent topic are not notified of the change.
        const fieldName = this.getFieldName(topic)
        if (fieldName) {
            const parentTopic = this.resolve(topic, true)
            let parentEntry = MB.topicMap.get(parentTopic)
            if (parentEntry === undefined) {
                parentEntry = new TopicEntry(parentTopic)
                MB.topicMap.set(parentTopic, parentEntry)
            }
            parentEntry.setDataField(fieldName, newData)
        }
    }

    public static publishReceivedFromServer(topic: string, newData: any, validationCallback?: CallbackFunction) {
        const resolvedTopic = this.resolve(topic, true)
        let topicEntry = MB.topicMap.get(resolvedTopic)
        if (topicEntry === undefined) {
            topicEntry = new TopicEntry(resolvedTopic)
            topicEntry.setData(newData)
            if (validationCallback !== undefined) {
                topicEntry.setValidationCallback(validationCallback)
            }
            MB.topicMap.set(resolvedTopic, topicEntry)
        } else {
            topicEntry.setData(newData)
            topicEntry.callCallbacks()
        }
    }

    public static responseReceivedFromServer(topic: string, newData: any) {
        const resolvedTopic = this.resolve(topic, true)
        let topicEntry = MB.topicMap.get(resolvedTopic)
        if (topicEntry !== undefined) {
            topicEntry.setData(newData)
            topicEntry.callCallbacks()
            MB.topicMap.delete(resolvedTopic)
        }
    }

    /**
     * Sends an error to the server and calls any error callbacks.
     * 
     * @param topic 
     * @param error 
     */
    public static error(topic: string, error: ErrorMsg) {
        const resolvedTopic = this.resolve(topic, true)
        let topicEntry = MB.topicMap.get(resolvedTopic)
        if (topicEntry === undefined) {
            topicEntry = new TopicEntry(resolvedTopic)
            topicEntry.setError(error)
            MB.topicMap.set(resolvedTopic, topicEntry)
        } else {
            topicEntry.setError(error)
            topicEntry.callErrorCallbacks()
        }
        const message = { event: "error", topic: topicEntry.getTopic(), title: error.title, detail: error.detail }
        WebSocketClient.sendMessage(JSON.stringify(message))
    }

    /**
     * Handles errors reported by the server. The error callback will be called for each component that has a subscription
     * to the topic. 
     * 
     * Also the error will be published to the local topic app:errors. This allows a generic error handling component to 
     * subscribe to all errors.
     *
     * @param topic 
     * @param error 
     */
    public static handleServerReportedError(topic: string, error: ErrorMsg) {
        const resolvedTopic = this.resolve(topic, true)
        let topicEntry = MB.topicMap.get(resolvedTopic)
        if (topicEntry === undefined) {
            topicEntry = new TopicEntry(resolvedTopic)
            topicEntry.setError(error)
            MB.topicMap.set(resolvedTopic, topicEntry)
        } else {
            topicEntry.setError(error)
            topicEntry.callErrorCallbacks()
        }

        // Publish error to app:errors
        MB.publish("app:errors:", error)
    }

    private static refreshTopicFromServer(topicEntry: TopicEntry) {
        if ((!topicEntry.getTopic().startsWith("app:")) || topicEntry.getTopic().startsWith("@")) {
            const message = { event: "subscribe", topic: topicEntry.getTopic(), filter: topicEntry.getFilter() }
            WebSocketClient.sendMessage(JSON.stringify(message))
            return
        }
    }

    private static publishTopicToOthers(topicEntry: TopicEntry) {
        if ((!topicEntry.getTopic().startsWith("app:")) || topicEntry.getTopic().startsWith("@")) {
            // Publish to the Server.
            const message = { event: "publish", topic: topicEntry.getTopic(), content: topicEntry.getData() }
            WebSocketClient.sendMessage(JSON.stringify(message))
            return
        } else {
            // Local topic, so we won't get a publish back from the server, so call callbacks now.
            topicEntry.callCallbacks()
        }
    }

    private static sendRequestToOthers(topicEntry: TopicEntry) {
        if ((!topicEntry.getTopic().startsWith("app:")) || topicEntry.getTopic().startsWith("@")) {
            // Send a request to the server. The server will reply with a single response.
            const message = { event: "request", topic: topicEntry.getTopic(), content: topicEntry.getData() }
            WebSocketClient.sendMessage(JSON.stringify(message))
            return
        } else {
            // Local topic, so we won't get a response back from the server, so call callbacks now.
            topicEntry.callCallbacks()
        }
    }


    private static sendDeleteTopicToOthers(topicEntry: TopicEntry) {
        if ((!topicEntry.getTopic().startsWith("app:")) || topicEntry.getTopic().startsWith("@")) {
            // Publish to the Server.
            const message = { event: "delete", topic: topicEntry.getTopic() }
            WebSocketClient.sendMessage(JSON.stringify(message))
            return
        } else {
            // Local topic, so we won't get a publish back from the server, so call callbacks now.
            topicEntry.callCallbacks()
        }
    }

    /**
     * Resolves a topic that contains a partial URI. Adds the scheme, based on the file extension and also the
     * current app name. Partial URIs that start with a slash are for the server. Partial URIs that don't
     * start with a slash are app local and don't go to the server.
     * 
     * Examples:
     * 
     * myComponent.message -> app:myComponent.message
     * /resource/data.json -> json:/myapp/resource/data.json
     * file:/myapp/resource/file.json -> No change as already resolved
     * 
     * @param topic 
     * @returns 
     */
    public static resolve(topic: string, stripFieldStr: boolean = true): string {
        if (topic === undefined) {
            return "app:undefined_topic"
        }

        // Remove any field name from the topic.
        if (stripFieldStr) {
            topic = topic.split('#')[0]
        }

        /*eslint no-template-curly-in-string: 0*/
        topic = topic.replace("${appName}", MB.getCurrentApp())

        if (topic.indexOf("${") !== -1 && topic.indexOf("}") !== -1) {
            topic = this.performSubstitutions(topic)
        }

        if (topic.indexOf(':') !== -1) {
            return topic // Already resolved.
        }

        if (topic.startsWith('/')) {
            const fileExtention = topic.split('.').pop()
            if (fileExtention === 'json' || fileExtention === 'jsonc') {
                return "json:/" + this.currentApp + topic
            }
            if (fileExtention === 'js') {
                /*eslint no-script-url: 0*/
                return "javascript:/" + this.currentApp + topic
            }
            if (fileExtention === 'sql') {
                return "query:/" + this.currentApp + topic
            }
            if (fileExtention === 'png' || fileExtention === 'apng' || fileExtention === 'jpeg' ||
                fileExtention === 'jpg' || fileExtention === 'gif' || fileExtention === 'bmp') {
                return "image:/" + this.currentApp + topic
            }

            return "file:/" + this.currentApp + topic
        }

        return "app:" + topic
    }

    public static getFieldName(topic: string): string {
        const queryPos = topic.indexOf('#')
        if (queryPos >= 0) {
            return topic.split('#')[1]
        }
        return ""
    }

    /**
     * A topic can include a topic whoose value is substituted into the topic. This
     * is specified using ${topicName}. The substitute topic is normally an app
     * local topic and the value must already be set.
     * 
     * If the app local topic myapp.filePath contained myApp/Pages/Home.json, the topic
     * file:/${myapp.filePath} would get converted to file:/myApp/Pages/Hone.json
     *  
     * @param topic 
     * @returns The topic with substitutions done
     */
    public static performSubstitutions(topic: string) {
        let result = topic
        let startPos = 0
        let endPos = 1
        while (startPos < topic.length && topic.indexOf("${", startPos) !== -1) {
            startPos = topic.indexOf("${", startPos) + 2
            endPos = topic.indexOf("}", startPos)
            const substitueTopic = topic.substring(startPos, endPos)
            const substituteData = this.getCurrentData(substitueTopic) ?? ""
            result = result.replace("${" + substitueTopic + "}", substituteData)
            startPos = endPos + 1
        }
        return result;
    }
}