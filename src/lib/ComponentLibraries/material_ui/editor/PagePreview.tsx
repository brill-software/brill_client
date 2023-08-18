// © 2021 Brill Software Limited - Brill Framework, distributed under the MIT license.
import React, { Component } from "react"
import { MB, Token } from "lib/MessageBroker/MB"
import { ErrorMsg } from "lib/MessageBroker/ErrorMsg"
import ConfirmDialog from "lib/ComponentLibraries/material_ui/dialog/ConfirmDialog"
import { Page } from "lib/PageService/Page"
import { ComponentManager } from "lib/ComponentManager/ComponentManager"
import { ErrorUtils } from "lib/utils/ErrorUtils"
import { PageService } from "lib/PageService/PageService"
import { EdType, UnsavedChanges } from "./UnsavedChanges"
import { CurrentEditor } from "./CurrentEditor"
import LoadingIndicator from "lib/ComponentLibraries/html/LoadingIndicator"
import TopicsPopover from "lib/ComponentLibraries/cms/TopicsPopover"
import Router from "lib/Router/Router"
import { TopicUtils } from "lib/utils/TopicUtils"
import AlertDialog from "../dialog/AlertDialog"

/**
 * Page Preview of a page including preview of any unsaved changes.
 * 
 */

interface Props {
    id: string
    fileName: string
    subscribeToTopic: string
    publishToTopic: string
    publishTextChangedTopic?: string
    [propName: string]: any
}

interface State {
    page: Page | undefined
    error: Error | undefined
    renderCount: number
}

export default class PagePreview extends Component<Props, State> {
    unsubscribeToken: Token
    unsubscribeTokenCmd: Token
    unsubscribeTokenDisc: Token
    textChanged: boolean = false
    changedText: string
    originalText: string

    constructor(props: Props) {
        super(props)
        this.state = { page: undefined, error: undefined, renderCount: 0}
    }

    componentDidMount() {
        const jsonTopic = this.props.subscribeToTopic.replace("file:/", "json:/")
        this.unsubscribeToken = MB.subscribe(jsonTopic, (topic, page) => this.loadPageCallback(topic, page), (topic, error) => this.errorCallback(topic, error))
        this.unsubscribeTokenCmd = MB.subscribe(`tabBarPane.editor.${this.props.id}`, (topic, command) => this.commandCallback(topic, command), (topic, error) => this.errorCallback(topic, error))
        this.unsubscribeTokenDisc = MB.subscribe(`PagePreview.discardChanges.${this.props.id}`, () => this.discardChanges(), (topic, error) => this.errorCallback(topic, error))
        CurrentEditor.set(this.props.id)
    }

    componentWillUnmount() {
        if (this.textChanged) {
            UnsavedChanges.add(EdType.PAGE_EDITOR, this.props.subscribeToTopic, null, null, 
                this.changedText, 1, 1, true, false, "")
        }
        MB.unsubscribe(this.unsubscribeToken)
        MB.unsubscribe(this.unsubscribeTokenCmd)
        MB.unsubscribe(this.unsubscribeTokenDisc, true)
    }

    async loadPageCallback(topic: string, page: Page) {
        try {
            // Set the default app to the app that is to be previewed.
            MB.setCurrentApp(PageService.getAppName(topic))

            this.originalText = JSON.stringify(page, null, 4)

            if (UnsavedChanges.exists(this.props.subscribeToTopic)) {
                const change = UnsavedChanges.getChange(this.props.subscribeToTopic)
                this.textChanged = change.textChanged
                this.changedText = change.text
                MB.publish(this.props.publishTextChangedTopic, change.textChanged)
                const newPage: Page = JSON.parse(this.changedText)

                const uniqueImports: Array<string> = PageService.getUniqueImports(page.rootComponent)
                // Import the page component modules in parallel. Await completion of all the imports before carrying on.
                await Promise.all(uniqueImports.map( async (moduleName: string) => {
                    await ComponentManager.loadComponent(moduleName)}))
                    
                this.setState({page: newPage})
                UnsavedChanges.remove(this.props.subscribeToTopic)
                return
            }

            MB.publish(this.props.publishTextChangedTopic, false)

            const uniqueImports: Array<string> = PageService.getUniqueImports(page.rootComponent)
            await Promise.all(uniqueImports.map(async (moduleName: string) => {
                await ComponentManager.loadComponent(moduleName)}))

            this.setState({ page: page })
        } catch (error) {
            this.setState({ error: ErrorUtils.cvt(error) })
        }
    }

    commandCallback(topic: string, command: string) {
        CurrentEditor.set(this.props.id)
        if (command === "save" && this.textChanged) {
            const content = { base64: btoa(this.changedText) }
            MB.publish(this.props.publishToTopic, content)
            this.textChanged = false
            MB.publish(this.props.publishTextChangedTopic, false)
            return
        }
        if (command === "revert" && this.textChanged && this.originalText.length > 2) {
            MB.publish(`PagePreview.discardChangesDialog.open.${this.props.id}`,
                `Are you sure you want to discard your changes to ${this.props.fileName} and revert back to the last saved version?`)
            return
        }
        if (command === "topics") {
            MB.publish(`brill_cms.PagePreview.topicsDialog.open.${this.props.id}`,"")
            return
        }
        if (command === "view") {
            if (this.state.page?.rootComponent.module !== "react/ErrorBoundary") {
                MB.publish(`brill_cms.PagePreview.noErrorBoundary.open.${this.props.id}`,
                    "This page has no top level Error Boundary and might be intended to be embedded in another page.")
                return
            }
            if (this.changedText || UnsavedChanges.hasUnsavedChanges()) {
                MB.publish(`brill_cms.PagePreview.unsavedChanges.open.${this.props.id}`,
                    "Please save all unsaved changes first. ")
                return
            }
            Router.goToPage(TopicUtils.getRoute(this.props.subscribeToTopic))
            return
        }
    }

    discardChanges() {
        const newPage: Page = JSON.parse(this.originalText)
        this.textChanged = false
        MB.publish(this.props.publishTextChangedTopic, false)
        this.setState({page: newPage})
        MB.publish("statusBar.message", "reverted...")
    }

    errorCallback(topic: string, error: ErrorMsg) {
        console.error("Error: " + topic + " : " + error.title + " " + error.detail)
    }

    render() {

        const { id, fileName, subscribeToTopic, publishToTopic, publishTextChangedTopic, ...other } = this.props
        
        if (this.state.page === undefined) {
            return <LoadingIndicator />
        }

        const reactElements: React.CElement<any,any> = PageService.createReactElements(this.state.page.rootComponent)
        
        return (
            <div id={id} {...other} >
                {reactElements}            
                <ConfirmDialog title="Please confirm" prompt=""
                    subscribeToTopic={`PagePreview.discardChangesDialog.open.${id}`}
                    publishToTopic={`PagePreview.discardChanges.${id}`} />
                <AlertDialog title="No Error Boundary" prompt=""
                    subscribeToTopic={`brill_cms.PagePreview.noErrorBoundary.open.${id}`} />
                <AlertDialog title="Unsaved Changes" prompt=""
                    subscribeToTopic={`brill_cms.PagePreview.unsavedChanges.open.${id}`} />
                <TopicsPopover subscribeToTopic={`brill_cms.PagePreview.topicsDialog.open.${id}`} />
            </div>
        )
    }
}