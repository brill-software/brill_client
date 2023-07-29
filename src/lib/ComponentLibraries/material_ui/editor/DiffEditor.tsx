// © 2021 Brill Software Limited - Brill Framework, distributed under the MIT license.
import React, {Component} from "react"
import ReactResizeDetector from "react-resize-detector"
import { MB, Token } from "lib/MessageBroker/MB"
import { ErrorMsg } from "lib/MessageBroker/ErrorMsg"
import { MonacoDiffEditor } from "react-monaco-editor"
import * as monaco from "monaco-editor/esm/vs/editor/editor.api"
import ConfirmDialog from "lib/ComponentLibraries/material_ui/dialog/ConfirmDialog"
import { EdType, UnsavedChanges } from "./UnsavedChanges"
import * as monacoEditor from "monaco-editor/esm/vs/editor/editor.api"
import { CurrentEditor } from "./CurrentEditor"
import { TopicUtils } from "lib/utils/TopicUtils"
import { JsonParser } from "lib/utils/JsonParser"
import LoadingIndicator from "lib/ComponentLibraries/html/LoadingIndicator"
import withTheme from "@mui/styles/withTheme"

/**
 * Text Diff Editor - based on the Microsoft Visual Studio Code Monaco Diff Editor.
 * 
 */

interface Props {
    id: string
    key: string
    fileName: string
    subscribeToTopic: string
    subscribeToActionTopic?: string
    publishToTopic: string
    publishTextChangedTopic?: string
    schemasTopic?: string
    [propName: string]: any
}

interface State {
    originalText: string | null
    modifiedText: string | null
}

class DiffEditor extends Component<Props, State> {
    tokens: Token[] = []
    unsubscribeSecondToken: Token
    editor: monacoEditor.editor.IStandaloneDiffEditor
    navi: monacoEditor.editor.IDiffNavigator
    initialText: string = ""
    changed: boolean = false
    language: string =  ""
    externalChangesMade: boolean = false
    ignoreNextDataLoadedCallback: boolean = false

    constructor(props: Props) {
        super(props)
        this.state = {originalText: null, modifiedText: null}
    }

    componentDidMount() {
        if (this.props.schemasTopic) {
            this.tokens.push(MB.subscribe(this.props.schemasTopic, (topic, schemas) => this.schemasLoadedCallback(topic, schemas), 
                    (topic, error) => this.errorCallback(topic, error)))
        }
        let originalTopic = "git:" + MB.resolve(this.props.subscribeToTopic).replace("json:", "file:")
        this.tokens.push(MB.subscribe(originalTopic, (topic, content) => this.dataLoadedOriginalCallback(topic, content), (topic, error) => this.errorCallback(topic, error)))
        this.tokens.push(MB.subscribe(this.props.subscribeToTopic, (topic, data) => this.dataLoadedModifiedCallback(topic, data), (topic, error) => this.errorCallback(topic, error)))
        if (this.props.subscribeToActionTopic) {
            this.tokens.push(MB.subscribe(this.props.subscribeToActionTopic, (topic, command) => this.commandCallback(topic, command), (topic, error) => this.errorCallback(topic, error)))
        } else {
            this.tokens.push(MB.subscribe(`tabBarPane.editor.${this.props.id}`, (topic, command) => this.commandCallback(topic, command), (topic, error) => this.errorCallback(topic, error)))
        }
        
        this.tokens.push(MB.subscribe(`TextEditor.discardChanges.${this.props.id}` , () => this.discardChanges(), (topic, error) => this.errorCallback(topic, error)))
        CurrentEditor.set(this.props.id)
    }

    componentWillUnmount() {
        if (this.editor) {
            const model = this.editor.getModifiedEditor().getModel()
            const viewState = this.editor.getModifiedEditor().saveViewState()
            const editorText = this.editor.getModifiedEditor().getValue()
            const cursorLineNumber = viewState ? viewState.cursorState[0].position.lineNumber : 1
            const cursorColumn = viewState ? viewState.cursorState[0].position.column : 1
            const textChanged = editorText !== this.initialText
            UnsavedChanges.add(EdType.TEXT_EDITOR, this.props.subscribeToTopic, model, viewState, 
                    editorText, cursorLineNumber, cursorColumn, textChanged, this.externalChangesMade, "")
        }
        MB.unsubscribeAll(this.tokens)
    }

    editorDidMount(editor: monacoEditor.editor.IStandaloneDiffEditor, monaco: typeof monacoEditor) {
        this.editor = editor
        this.navi = monaco.editor.createDiffNavigator(editor)
        // editor.getModifiedEditor().addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, this.save.bind(this))
        editor.getModifiedEditor().addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, this.save.bind(this))
        editor.getModifiedEditor().addCommand(monaco.KeyMod.Shift  | monaco.KeyCode.F7, this.previous.bind(this))
        editor.getModifiedEditor().addCommand(monaco.KeyCode.F7, this.next.bind(this))
        // editor.getOriginalEditor().addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, this.save.bind(this))
        editor.getOriginalEditor().addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, this.save.bind(this))
        editor.getOriginalEditor().addCommand(monaco.KeyMod.Shift  | monaco.KeyCode.F7, this.previous.bind(this))
        editor.getOriginalEditor().addCommand(monaco.KeyCode.F7, this.next.bind(this))
    }

    save(editor: monacoEditor.editor.IStandaloneDiffEditor) {
        const editorText = this.editor.getModifiedEditor().getValue()
        if (editorText !== undefined && editorText !== this.initialText && this.props.publishToTopic) { // Only save if there are changes
            const content = {base64: btoa(editorText)}
            this.ignoreNextDataLoadedCallback = true
            MB.publish(this.props.publishToTopic, content)
            this.initialText = editorText
            this.changed = false
            MB.publish(this.props.publishTextChangedTopic, false)
            this.editor.focus()
        }
    }

    previous() {
        this.navi.previous()
    }

    next() {
        this.navi.next()
    }

    revert() {
        MB.publish(`TextEditor.discardChangesDialog.open.${this.props.id}`, 
            `Are you sure you want to discard your changes to ${this.props.fileName} and revert back to the last saved version?`)
    }

    discardChanges() {
        if (this.editor && this.editor.getModifiedEditor) {
            this.editor.getModifiedEditor().setValue(this.initialText)
        }
        this.changed = false
        MB.publish(this.props.publishTextChangedTopic, false)
    }

    triggerCommand(command: string) {
        // This focus call is required due to an issue with versions of the Monaco editor after 0.20.0
        if (this.editor && this.editor.getModifiedEditor) {     
            this.editor.getModifiedEditor().focus()
            this.editor.trigger("button", command, "")
        }
    }

    commandCallback(topic: string, command: string) {
        CurrentEditor.set(this.props.id)
        switch (command) {
            case "save": 
                this.save(this.editor)
                break
            case "revert":
                this.revert()
                break
            case "previous":
                this.previous()
                break
            case "next":
                this.next()
                break
            default:
                this.triggerCommand(command)
                break
        }        
    }

    schemasLoadedCallback(topic: string, schemas: any) {
        let schemasObj: object = {}
        if (topic.startsWith("file:/")) {
            schemasObj = JsonParser.parse(atob(schemas.base64))
        } else {
            schemasObj = schemas // Assume json:/
        }
        monaco.languages.json.jsonDefaults.setDiagnosticsOptions(schemasObj)
    }

    dataLoadedOriginalCallback(topic: string, content: any) {
        const originalText = (topic.startsWith("json:/")) ? JSON.stringify(content,null, 4) : atob(content.base64)
        this.setState({originalText: originalText})
    }

    dataLoadedModifiedCallback(topic: string, data: any) {
        if (this.ignoreNextDataLoadedCallback) {
            this.ignoreNextDataLoadedCallback = false
            return
        }
        // Prevent a Save in other panes from overwriting any unsaved changes
        if (this.changed) {
            return
        }
        if (typeof data === "string") {
            let secondTopic = data.replace("json:/", "file:/")
            this.unsubscribeSecondToken = MB.subscribe(secondTopic, (topic, data) => this.secondDataLoadedCallback(topic, data), (topic, error) => this.errorCallback(topic, error))
            return
        }
        const text = (topic.startsWith("json:/")) ? JSON.stringify(data,null, 4) : atob(data.base64)
        monaco.languages.json.jsonDefaults.setDiagnosticsOptions({allowComments: (TopicUtils.getFileExtension(topic) === "jsonc")})
        this.setEditorText(topic, text)
    }

    secondDataLoadedCallback(topic: string, data: any) {
        MB.unsubscribe(this.unsubscribeSecondToken)
        const text = (topic.startsWith("json:/")) ? JSON.stringify(data,null, 4) : atob(data.base64)
        monaco.languages.json.jsonDefaults.setDiagnosticsOptions({allowComments: (TopicUtils.getFileExtension(topic) === "jsonc")})
        this.setEditorText(topic, text)
    } 

    private setEditorText(topic: string, text: string) {
        this.initialText = text
        this.language = this.getLanguage(topic)

        // See if there are any unsaved changes from when editor was open before
        if (UnsavedChanges.exists(this.props.subscribeToTopic)) {
            const change = UnsavedChanges.getChange(this.props.subscribeToTopic)
            if (change.editor === EdType.TEXT_EDITOR) {
                this.changed = change.textChanged
                this.externalChangesMade = change.externalChangesMade
                MB.publish(this.props.publishTextChangedTopic, change.textChanged)
                this.setState({modifiedText: change.model.getValue()})
                this.editor?.getModifiedEditor()?.focus()
                UnsavedChanges.remove(this.props.subscribeToTopic)
                return
            }
            if (change.editor === EdType.XHTML_EDITOR || change.editor === EdType.PAGE_EDITOR) {
                this.changed = change.textChanged
                this.externalChangesMade = change.externalChangesMade
                MB.publish(this.props.publishTextChangedTopic, change.textChanged)
                this.setState({modifiedText: change.text})
                this.editor?.getModifiedEditor()?.focus()
                UnsavedChanges.remove(this.props.subscribeToTopic)
                return
            }
        }

        MB.publish(this.props.publishTextChangedTopic, false)
        this.setState({modifiedText: this.initialText})
    }

    private getLanguage(topic: string) {
        let language = ""
        const fileExtension = TopicUtils.getFileExtension(topic)
        switch (fileExtension) {
            case "js": 
                language = "javascript"
                break
            case "ts":
            case "tsx":
                language = "typescript"
                break
            case "md":
                language = "markdown"
                break
            case "xhtml":
                language = "html"
                break
            case "jsonc":
                language = "json"
                break
            default:
                language = fileExtension
                break
        }
        return language
    }

    errorCallback(topic: string, error: ErrorMsg) {
        console.error("Error: " + topic + " : "  + error.title + " " + error.detail)
    }

    onChange(newValue: string, e: object) {
        CurrentEditor.set(this.props.id)
        if (this.props.publishTextChangedTopic) {
            const modifiedEdText: string = this.editor.getModifiedEditor().getValue()
            this.changed = modifiedEdText !== this.initialText
            MB.publish(this.props.publishTextChangedTopic, this.changed)
        }
    }
  
    handleResize(width: number | undefined, height: number | undefined) {
        if (width && height) {
            this.editor.layout({height, width})
        }
    }

    render() {
        const {id, key, theme, name, subscribeToTopic, publishToTopic, schemasTopic, ...other} = this.props
      
        // Handles both MUI v4 and MUI v5 themes.
        let editorTheme: string =  "vs-light"
        if ((theme.palette?.type && theme.palette.type === "dark") || 
            (theme.palette?.mode && theme.palette.mode === "dark")) {
            editorTheme = "vs-dark"
        }

        if (this.state.originalText !== null && this.state.modifiedText !== null) {
            return (
                <div style={{height: "100%"}}>
                    <ReactResizeDetector
                        handleWidth
                        handleHeight
                        onResize={(width, height) => this.handleResize(width, height)}
                        refreshMode="debounce"
                        refreshRate={200} />
                    <MonacoDiffEditor
                        height="100%"
                        theme={editorTheme}
                        language={this.language}
                        original={this.state.originalText}
                        value={this.state.modifiedText}
                        onChange={(newValue, e) => this.onChange(newValue, e)}
                        editorDidMount={(editor, monaco) => this.editorDidMount(editor, monaco)}
                        key={key}
                        {...other}/>
                    <ConfirmDialog title="Please confirm" prompt="" 
                    subscribeToTopic={`TextEditor.discardChangesDialog.open.${this.props.id}`}
                    publishToTopic={`TextEditor.discardChanges.${this.props.id}`} />

                </div>
            )
        }
        return <LoadingIndicator />
    }
}

export default withTheme(DiffEditor as any)