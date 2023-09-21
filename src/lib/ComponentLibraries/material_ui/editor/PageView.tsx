// © 2023 Brill Software Limited - Brill Framework, distributed under the Brill Software Proprietry License.
import React, { Component } from "react"
import { MB, Token } from "lib/MessageBroker/MB"
import { ErrorMsg } from "lib/MessageBroker/ErrorMsg"
import { Page } from "lib/PageService/Page"
import { ComponentManager } from "lib/ComponentManager/ComponentManager"
import { ErrorUtils } from "lib/utils/ErrorUtils"
import { PageService } from "lib/PageService/PageService"
import { CurrentEditor } from "./CurrentEditor"
import LoadingIndicator from "lib/ComponentLibraries/html/LoadingIndicator"

/**
 * View of a page within an edit window. Similar to Preview but no save option.
 * 
 */

interface Props {
    id: string
    fileName: string
    subscribeToTopic: string
    [propName: string]: any
}

interface State {
    page: Page | undefined
    error: Error | undefined
    renderCount: number
}

export default class PageView extends Component<Props, State> {
    token: Token
    tokenCmd: Token

    constructor(props: Props) {
        super(props)
        this.state = { page: undefined, error: undefined, renderCount: 0}
    }

    componentDidMount() {
        const jsonTopic = this.props.subscribeToTopic.replace("view:/", "json:/")
        this.token = MB.subscribe(jsonTopic, 
            (topic, page) => this.loadPageCallback(topic, page), (topic, error) => this.errorCallback(topic, error))
        this.tokenCmd = MB.subscribe(`tabBarPane.editor.${this.props.id}`, 
            (topic, command) => this.commandCallback(topic, command), (topic, error) => this.errorCallback(topic, error))
        CurrentEditor.set(this.props.id)
    }

    componentWillUnmount() {
        MB.unsubscribe(this.token)
        MB.unsubscribe(this.tokenCmd)
    }

    async loadPageCallback(topic: string, page: Page) {
        try {
            // Set the default app to the app that is to be viewed.
            MB.setCurrentApp(PageService.getAppName(topic))

            const uniqueImports: Array<string> = PageService.getUniqueImports(page.rootComponent)
            await Promise.all(uniqueImports.map(async (moduleName: string) => {
                await ComponentManager.loadComponent(moduleName)}))

            this.setState({ page: page })
        } catch (error) {
            this.setState({ error: ErrorUtils.cvt(error) })
        }
    }

    commandCallback(topic: string, command: string) {
    }

    errorCallback(topic: string, error: ErrorMsg) {
        console.error("Error: " + topic + " : " + error.title + " " + error.detail)
    }

    render() {

        const { id, fileName, subscribeToTopic, publishTextChangedTopic, ...other } = this.props
        
        if (this.state.page === undefined) {
            return <LoadingIndicator />
        }

        const reactElements: React.CElement<any,any> = PageService.createReactElements(this.state.page.rootComponent)
        
        return (
            <div id={id} {...other} >
                {reactElements}            
            </div>
        )
    }
}