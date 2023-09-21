// © 2021 Brill Software Limited - Brill Framework, distributed under the Brill Software Proprietry License.
import React, {Component} from "react"
import ReactResizeDetector from 'react-resize-detector';
import { MB, Token } from "lib/MessageBroker/MB"
import { ErrorMsg } from "lib/MessageBroker/ErrorMsg"
import MonacoEditor from "react-monaco-editor"
import * as monaco from "monaco-editor/esm/vs/editor/editor.api"
import { TopicUtils } from "lib/utils/TopicUtils"
import { IdGen } from "lib/utils/IdGen"
import { JsonParser } from "lib/utils/JsonParser"
import * as monacoEditor from "monaco-editor/esm/vs/editor/editor.api"
import { UnsavedChanges, EdType } from "lib/ComponentLibraries/material_ui/editor/UnsavedChanges"
import ConfirmDialog from "lib/ComponentLibraries/material_ui/dialog/ConfirmDialog";
import { TextUtils } from "lib/utils/TextUtils";
import { CurrentEditor } from "./CurrentEditor";
import { getLanguageService, TextDocument } from "vscode-json-languageservice"
import withTheme from "@mui/styles/withTheme"
import { Base64 } from "js-base64";

/**
 * Text editor - based on the Microsoft Visual Studio Code Monaco Editor.
 * 
 * The editor supports many files types including JSON, SQL, JavaScipt and HTML.
 * The light or dark theme used is based on the currently set theme.palatte.type of "dark" or "light".
 * 
 */

// TO BE REMOVED when schema resolution sorted.
 const jsonSchemaUri = "foo://server/data.schema.json";
 const jsonSchema = {
     "type": "object",
     "properties": {
         "name": {
             "type": "string"
         },
         "country": {
             "type": "string",
             "enum": ["Ireland", "Iceland"]
         }
     }
 }

interface Props {
    id: string
    key: string
    fileName: string
    subscribeToTopic: string
    subscribeToActionTopic?: string
    publishToTopic: string
    publishTextChangedTopic?: string
    schemasTopic?: string
    options?: object
    language?: string
    [propName: string]: any
}

interface State {
    model: monacoEditor.editor.ITextModel | undefined
}

class TextEditor extends Component<Props, State> {
    tokens: Token[] = []
    unsubscribeSecondToken: Token
    editor: monacoEditor.editor.IStandaloneCodeEditor
    initialText: string = ""
    changed: boolean = false
    externalChangesMade: boolean = false
    ignoreNextDataLoadedCallback: boolean = false
    textAlreadyLoaded: boolean = false
    
    constructor(props: Props) {
        super(props)
        this.state = {model: undefined}
    }


    componentDidMount() {
        // See if there's an existing unsaved changes model available
        if (UnsavedChanges.exists(this.props.subscribeToTopic)) {
            const change = UnsavedChanges.getChange(this.props.subscribeToTopic)
            if (change.editor === EdType.TEXT_EDITOR) {
                // Use existing model
                this.setState({model: change.model})
                return
            }
        }

        // Create a new model
        const language = this.getLanguage(this.props.subscribeToTopic)
        const modelUri = monaco.Uri.parse(this.props.subscribeToTopic + "/" + IdGen.next())
        const newModel = monaco.editor.createModel(this.initialText, language, modelUri)
        this.setState({model: newModel})
    }

    editorDidMount(editor: monacoEditor.editor.IStandaloneCodeEditor, monaco: typeof monacoEditor) {
        this.editor = editor
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S, this.save.bind(this))

        if (UnsavedChanges.exists(this.props.subscribeToTopic)) {
            this.applyUnsavedChanges()
        }

        if (this.props.schemasTopic) {
            this.tokens.push(MB.subscribe(this.props.schemasTopic, (topic, schema) => this.schemasLoadedCallback(topic, schema), (topic, error) => this.errorCallback(topic, error)))
        }
        this.tokens.push(MB.subscribe(this.props.subscribeToTopic, (topic, data) => this.dataLoadedCallback(topic, data), (topic, error) => this.errorCallback(topic, error)))
        if (this.props.subscribeToActionTopic) {
            this.tokens.push(MB.subscribe(this.props.subscribeToActionTopic, (topic, command) => this.commandCallback(topic, command), (topic, error) => this.errorCallback(topic, error)))
        }
        this.tokens.push(MB.subscribe(`TextEditor.discardChanges.${this.props.id}`, () => this.discardChanges(), (topic, error) => this.errorCallback(topic, error)))
        CurrentEditor.set(this.props.id)

    }

    private applyUnsavedChanges() {
        const change = UnsavedChanges.getChange(this.props.subscribeToTopic)
        
        this.changed = change.textChanged
        this.externalChangesMade = change.externalChangesMade
        MB.publish(this.props.publishTextChangedTopic, change.textChanged)
        this.editor.focus()

        if (change.editor === EdType.TEXT_EDITOR) {
            this.editor.restoreViewState(change.viewState)
            UnsavedChanges.remove(this.props.subscribeToTopic)
            this.textAlreadyLoaded = true
           return
        }
        
        this.state.model?.setValue(change.text)

        if (change.selectedText) {
            const match = TextUtils.findMatch(change.text, change.selectedText)
            if (match !== null) {
                const range: monaco.Range = new monaco.Range(match.startLine, 0, match.endLine, 0)
                this.editor.setSelection(range)
                const position = {lineNumber: match.startLine, column: 1}
                this.editor.revealPositionNearTop(position)
            }
        } else {
            const position = {lineNumber: change.cursorLineNumber, column: change.cursorColumn}
            this.editor.setPosition(position)
            this.editor.revealPositionNearTop(position)
        }
        UnsavedChanges.remove(this.props.subscribeToTopic)
        this.textAlreadyLoaded = true
    }

    dataLoadedCallback(topic: string, data: any) {
        if (this.ignoreNextDataLoadedCallback) {
            this.ignoreNextDataLoadedCallback = false
            return
        }
        // Check to see if the file has been deleted.
        if (data === null) {
            MB.publish("statusBar.message", "deleted...")
            return
        }

        if (typeof data === "string") {
            let secondTopic = data.replace("json:/", "file:/")
            this.unsubscribeSecondToken = MB.subscribe(secondTopic, (topic, data) => this.secondDataLoadedCallback(topic, data), (topic, error)  => this.errorCallback(topic , error))
            return
        }

        this.initialText = (data.base64) ? Base64.decode(data.base64) : JSON.stringify(data, null, 4)
        monaco.languages.json.jsonDefaults.setDiagnosticsOptions({allowComments: (TopicUtils.getFileExtension(topic) === "jsonc")})

        // Prevent overwriting any unsaved changes and already set view state. 
        if (this.changed || this.textAlreadyLoaded) {
            this.textAlreadyLoaded =false
            return
        }
        this.setEditorText(topic, this.initialText)
    }

    secondDataLoadedCallback(topic: string, data: any) {
        MB.unsubscribe(this.unsubscribeSecondToken)
        this.initialText = (topic.startsWith("json:/")) ? JSON.stringify(data, null, 4) : Base64.decode(data.base64)
        monaco.languages.json.jsonDefaults.setDiagnosticsOptions({allowComments: (TopicUtils.getFileExtension(topic) === "jsonc")})
        if (this.changed || this.textAlreadyLoaded) {
            this.textAlreadyLoaded = false
            return
        }
        monaco.editor.setModelLanguage(this.editor.getModel() as any, this.getLanguage(topic))
        this.setEditorText(topic, this.initialText)
    } 

    componentWillUnmount() {
        if (this.editor) {
            const viewState = this.editor.saveViewState()
            const editorText = this.editor.getValue()
            const cursorLineNumber = viewState ? viewState.cursorState[0].position.lineNumber : 1
            const cursorColumn = viewState ? viewState.cursorState[0].position.column : 1
            // const textChanged = editorText !== this.initialText
            UnsavedChanges.add(EdType.TEXT_EDITOR, this.props.subscribeToTopic, this.state.model, viewState, 
                editorText, cursorLineNumber, cursorColumn, this.changed, this.externalChangesMade, "")
        }
        MB.unsubscribeAll(this.tokens)
    }

    async save(editor: monacoEditor.editor.IStandaloneCodeEditor) {
        const editorText = this.editor?.getValue()

        if (editorText !== undefined && editorText !== this.initialText && this.props.publishToTopic) { // Only save if there are changes
            const content = {base64: Base64.encode(editorText)}
            this.ignoreNextDataLoadedCallback = true
            MB.publish(this.props.publishToTopic, content)
            this.initialText = editorText
            this.changed = false
            MB.publish(this.props.publishTextChangedTopic, false)
            this.editor.focus()
            MB.publish("statusBar.message", "saved...")
        }
    }

    /**
     * Validates the JOSN before saving. 
     * 
     * More work required to provide schema based on loaded schemas.
     * 
     * @param editorText 
     */
    async jsonValidation(editorText: string) {
        const textDocument: TextDocument =  TextDocument.create(this.props.subscribeToTopic, 'json', 4, editorText)
        const jsonLanguageService = getLanguageService(
            {
                schemaRequestService: (uri) => {
                    if (uri === jsonSchemaUri) {
                        return Promise.resolve(JSON.stringify(jsonSchema))
                    }
                    return Promise.reject(`Unabled to load schema at ${uri}`)
                }
            })
            const jsonDocument = jsonLanguageService.parseJSONDocument(textDocument)
            const diagnostics = await jsonLanguageService.doValidation(textDocument, jsonDocument)
            console.log('Validation results:', diagnostics.map(d => `[line ${d.range.start.line}] ${d.message}`))
    }

    revert() {
        MB.publish(`TextEditor.discardChangesDialog.open.${this.props.id}`, 
        `Are you sure you want to discard your changes to ${this.props.fileName} and revert back to the last saved version?`)
    }

    discardChanges() {
        if (this.editor && this.editor.setValue) {
            this.editor.setValue(this.initialText)
        }
        this.changed = false
        MB.publish(this.props.publishTextChangedTopic, false)
        MB.publish("statusBar.message", "reverted...")
    }

    triggerCommand(command: string) {
        // This focus call is required due to an issue with versions of the Monaco editor after 0.20.0
        if (this.editor && this.editor.focus) {
            this.editor.focus()
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
            default:
                this.triggerCommand(command)
                break
        }        
    }

    schemasLoadedCallback(topic: string, schemas: any) {
        let schemasObj: object = {}
        if (topic.startsWith("file:/")) {
            schemasObj = JsonParser.parse(Base64.decode(schemas.base64))
        } else {
            schemasObj = schemas // Assume json:/
        }
        if (!monaco.languages.json || !monaco.languages.json.jsonDefaults) {
            console.error("Check that webpack.config.js has the MonacoWebpackPlugin installed.")
        }
        monaco.languages.json.jsonDefaults.setDiagnosticsOptions(schemasObj)
    }

    private setEditorText(topic: string, text: string) {
        this.initialText = text
        let model = this.state.model
        if (model) {
            model.setValue(this.initialText)
            this.setState({model: model})
        }
    }

    private getLanguage(topic: string) {
        if (this.props.language) {
            return this.props.language
        }
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
            case "json":
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
            // Tell the active tab whether the user has changed the text or not.
            this.changed = this.editor.getValue() !== this.initialText
            MB.publish(this.props.publishTextChangedTopic, this.changed)
        }
    }
  
    handleResize(width: number | undefined, height: number | undefined) {
        if (width && height) {
            this.editor.layout({height, width})
        }
    }

    onClickHandler(event: any) {
        CurrentEditor.set(this.props.id)
    }

    render() {
        const {id, theme, key, name, subscribeToTopic, publishToTopic, schemasTopic, options, language, ...other} = this.props
        
        // Handles both MUI v4 and MUI v5 themes.
        let editorTheme: string =  "vs-light"
        if ((theme.palette?.type && theme.palette.type === "dark") || 
            (theme.palette?.mode && theme.palette.mode === "dark")) {
            editorTheme = "vs-dark"
        }

        if (this.state.model) {
            const optionsObj = {model: this.state.model, ...options}
            return (
                <div style={{height: "100%"}} onClick={(event) => this.onClickHandler(event)}>
                    <ReactResizeDetector
                        handleWidth
                        handleHeight
                        onResize={(width, height) => this.handleResize(width, height)}
                        refreshMode="debounce"
                        refreshRate={200} />
                    <MonacoEditor
                        height="100%"
                        language={this.getLanguage(this.props.subscribeToTopic)}
                        theme={editorTheme}
                        options={optionsObj}
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
        return null
    }
}

export default withTheme(TextEditor as any)