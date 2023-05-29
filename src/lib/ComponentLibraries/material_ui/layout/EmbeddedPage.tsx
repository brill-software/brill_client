// © 2023 Brill Software Limited - Brill Framework, distributed under the MIT license.
import React, { Component } from "react"
import { Theme } from "lib/ComponentLibraries/material_ui/theme/Theme"
import { ComponentManager } from "lib/ComponentManager/ComponentManager"
import { Page } from "lib/PageService/Page"
import { MB, Token } from "lib/MessageBroker/MB"
import { ErrorUtils } from "lib/utils/ErrorUtils"
import { ErrorMsg } from "lib/MessageBroker/ErrorMsg"
import { PageService } from "lib/PageService/PageService"

/**
 * Embeds a page within a page.
 * 
 * Uses the subscribeToTopic to load the page if the Topic URI is for a JSON page. If the value of the
 * subscribeToTopic is a string, the string is used as the topic.
 * 
 * Example:
 * 
 * {
 *     "id": "embedded_page",
 *     "module": "material_ui/layout/EmbeddedPage",
 *     "attributes": {
 *         "subscribeToTopic": "app.treeItem"
 *     }
 * }
 * 
 */

interface Props {
    id: string
    theme: Theme
    classes: any
    subscribeToTopic: string
    [propName: string]: any
}

interface State {
    page: Page | undefined
    error: Error | undefined
}

export default class EmbeddedPage extends Component<Props, State> {
    tokens: Token[] = []
    token: Token
    token2: Token

    constructor(props: Props) {
        super(props)
        this.state = { page: undefined, error: undefined }
    }   

    componentDidMount() {
        this.token = MB.subscribe(this.props.subscribeToTopic, (topic, data) => this.loadPageCallback(topic, data), 
            (topic, error) => this.errorCallback(topic, error))
    }

    componentWillUnmount() {
        MB.unsubscribe(this.token)
    }

    errorCallback(topic: string, error: ErrorMsg) {
        console.error("Error: " + topic + " : "  + error.title + " " + error.detail)
        this.setState({error: ErrorUtils.cvt(topic + " " + error.title + " " + error.detail)}) 
    }

    /**
     * Load the page or if the topic contains a string, use it to get the page.
     * 
     * @param topic 
     * @param data A Page or string.
     */
    async loadPageCallback(topic: string, data: any) {
        try {
            if (typeof data === "string") {
                const topic: string = data
                this.token2 = MB.subscribe(topic, (topic, page) => this.loadActualPageCallback(topic, page), 
                    (topic, error) => this.errorCallback(topic, error))
                return
            }
            const page: Page = data
            const uniqueImports: Array<string> = PageService.getUniqueImports(page.rootComponent)
            await Promise.all(uniqueImports.map( async (moduleName: string) => {
                await ComponentManager.loadComponent(moduleName)
            }))
            this.setState({page: page})
        } catch (error) {
            this.setState({error: ErrorUtils.cvt(error)})  
        }
    }

    /**
     * Loads the page when there's a level of indirection and the topic contains the page URI.
     * 
     * @param topic 
     * @param page 
     */
    async loadActualPageCallback(topic: string, page: Page) {
        try {
            MB.unsubscribe(this.token2)     
            const uniqueImports: Array<string> = PageService.getUniqueImports(page.rootComponent)
            await Promise.all(uniqueImports.map( async (moduleName: string) => {
                await ComponentManager.loadComponent(moduleName)
            }))
            this.setState({page: page})          
        } catch (error) {
            this.setState({error: ErrorUtils.cvt(error)})  
        }
    }

    render() {
        const {theme, classes, subscribeToTopic, ...other} = this.props

        if (this.state.error !== undefined) {
            return <div><p>Error while loading page: {this.state.error.message}</p></div>
        }

        if (this.state.page === undefined) {
            return null
        }        
        
        const reactElements: React.CElement<any,any> = PageService.createReactElements(this.state.page.rootComponent)

        return (
            <div {...other}>
                {reactElements}
            </div>
            )
    }
}