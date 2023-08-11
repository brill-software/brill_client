// © 2021 Brill Software Limited - Brill Framework, distributed under the MIT license.
import { ErrorMsg } from "lib/MessageBroker/ErrorMsg"
import { ErrorUtils } from "lib/utils/ErrorUtils"

/**
 * Topic Entry
 * 
 */

export type CallbackFunction = (topic: string, data: any) => void

export class Filter {
    public offset?: number
    public row_count?: number
    public sort_col?: string
    public sort_direction?: string
    public search_text?: string
    public columns?: string[]
    public filter_list?: string[]

    constructor(offset: number, row_count: number, sort_col: string, sort_direction: string,
        search_text: string, columns: string[], filter_list: string[]) {
        this.offset = offset
        this.row_count = row_count
        this.sort_col = sort_col
        this.sort_direction = sort_direction
        this.search_text = search_text
        this.columns = columns
        this.filter_list = filter_list
    }
}

// Used to create a new object for a parent topic when there's no existing object.
class Obj {
    [propName: string]: any
}

export class TopicEntry {
    private topic: string
    private data: any
    private error: ErrorMsg
    private callback: CallbackFunction[]
    private errorCallback: CallbackFunction[]
    private validationCallback: CallbackFunction | null
    private filter: Filter | undefined

    constructor(topic: string, data: any = undefined, callback?: CallbackFunction, errorCallback?: CallbackFunction, filter?: Filter) {
        this.topic = topic
        this.data = data
        this.error = new ErrorMsg("", "");
        this.callback = []
        this.errorCallback = []
        if (callback !== undefined) {
            this.callback.push(callback)
        }
        if (errorCallback !== undefined) {
            this.errorCallback.push(errorCallback)
        }
        this.validationCallback = null
        this.filter = filter
    }

    public getCallbackLen() {
        return this.callback.length
    }

    public addCallback(callbackFunc: CallbackFunction): void {
        if (!this.callback.includes(callbackFunc)) {
            this.callback.push(callbackFunc)
        }
    }

    public addErrorCallback(errorCallbackFunc: CallbackFunction): void {
        if (!this.errorCallback.includes(errorCallbackFunc)) {
            this.errorCallback.push(errorCallbackFunc)
        }
    }

    public removeCallback(callbackFunc: CallbackFunction): void {
        this.callback = this.callback.filter((value: CallbackFunction) => { return value !== callbackFunc })
    }

    public removeErrorCallback(errorCallbackFunc: CallbackFunction): void {
        this.errorCallback = this.errorCallback.filter((value: CallbackFunction) => { return value !== errorCallbackFunc })
    }

    public callCallbackIfData(callbackFunc: CallbackFunction): void {
        if (this.data !== undefined) {
            this.deliver(callbackFunc)
        }
    }

    public callErrorCallbackIfError(errorCallbackFunc: CallbackFunction): void {
        if (this.data !== undefined) {
            this.deliver(errorCallbackFunc)
        }
    }

    public setData(newData: any): void {
        this.data = newData
    }

    /**
     * Sets a specific field of the data, assuming data contains an object.
     * 
     * @param fieldName 
     * @param fieldValue 
     */
    public setDataField(fieldName: string, fieldValue: any): void {
        if (this.data === undefined || typeof (this.data) !== 'object') {
            let newObj: Obj = new Obj()
            newObj[fieldName] = fieldValue
            this.data = newObj
        } else {
            this.data[fieldName] = fieldValue
        }
    }

    public setError(error: ErrorMsg): void {
        this.error = error
    }

    public getTopic(): string {
        return this.topic
    }

    public getData(): any {
        return this.data
    }

    public getError(): ErrorMsg {
        return this.error
    }

    public getFilter(): Filter {
        if (this.filter === undefined) {
            return {}
        }
        return this.filter
    }

    public setFilter(filter: Filter | undefined) {
        this.filter = filter
    }

    public isFilterUndefined() {
        return this.filter === undefined
    }

    public setValidationCallback(validationCallback: CallbackFunction) {
        this.validationCallback = validationCallback
    }

    public getValidationCallback(): CallbackFunction | null {
        return this.validationCallback
    }

    public callCallbacks(): void {
        this.callback.map(func => this.deliverImmediately(func))
    }

    private deliverImmediately(callback: CallbackFunction): void {
        try {
            setTimeout(callback, 0, this.topic, this.data)
        } catch (ex) {
            console.log("Exception while calling callback method")
        }
    }

    public callErrorCallbacks(): void {
        this.errorCallback.map(func => this.deliverError(func))
    }

    public deliver(callback: CallbackFunction): void {
        try {
            // A timeout value of 1 is used rather than 0, so that any code after
            // a subscription call gets to run first, before the callback is called.
            setTimeout(callback, 1, this.topic, this.data)
        } catch (ex) {
            console.log("Exception while calling callback method")
        }
    }

    public deliverField(callback: CallbackFunction, fieldName: string): void {
        try {
            if (this.data !== undefined && typeof (this.data) === 'object') {
                const topicWithFieldName = this.topic + "#" + fieldName
                const fieldValue = this.data[fieldName]
                if (fieldValue !== undefined) {
                    setTimeout(callback, 1, topicWithFieldName, fieldValue)
                }
            }
        } catch (ex) {
            console.log("Exception while calling deliver field callback method")
        }
    }

    public deliverError(errorCallback: CallbackFunction): void {
        try {
            setTimeout(errorCallback, 1, this.topic, this.error)
        } catch (ex) {
            console.log("Excpetion while calling error callback method")
        }
    }

    public devliverImmediate(callback: CallbackFunction): any {
        try {
            console.log("Immediately calling callback function")
            return callback(this.topic, this.data)
        } catch (ex) {
            const error: Error = ErrorUtils.cvt(ex)
            console.warn("Exception while calling callback method immediately for topic %s: %s", this.topic, error.message)
            return undefined
        }
    }

    public devliverErrorImmediate(errorCallback: CallbackFunction): any {
        try {
            console.log("Immediately calling error callback function")
            return errorCallback(this.topic, this.error)
        } catch (ex) {
            console.warn("Excpetion while calling error callback method immediately")
            return undefined
        }
    }
}