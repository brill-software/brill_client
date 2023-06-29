// © 2022 Brill Software Limited - Brill CMS, distributed under the Brill Software Apps license.
import React, {Component} from "react"
import ReactDOM from "react-dom"
import ReactResizeDetector from "react-resize-detector"
import { withStyles } from "@material-ui/core"
import { Theme } from "lib/ComponentLibraries/material_ui/theme/Theme"
import TabBarPane from "lib/ComponentLibraries/cms/TabBarPane"
import ToolTip from "@material-ui/core/Tooltip"
import HorizontalSplitTwoTone from "@material-ui/icons/HorizontalSplitTwoTone"
import VerticalSplitTwoTone from "@material-ui/icons/VerticalSplitTwoTone"
import { MB, Token } from "lib/MessageBroker/MB"
import { ErrorMsg } from "lib/MessageBroker/ErrorMsg"
import { IdGen } from "lib/utils/IdGen"
import { Alert, AlertTitle, Color } from "@material-ui/lab"
import Draggable from "react-draggable"
import { Html } from "lib/utils/HtmlUtils"

/**
 * Brill CMS Resizable Panels
 * 
 * Provides a top panel and left panel with one or more edit panels. The edit panels can be split
 * vertically or horizontally multiple times. 
 * 
 * ----------------------------
 * | Top Panel                |
 * |---------------------------
 * | Left    ||               | 
 * | Panel   || Panel 0       |
 * |         ||               |
 * |         || ============= | 
 * |         || Panel 1       |
 * |         ||               |
 * ---------------------------- 
 *
 * The edit panels uses the TabBarPane component. TabBarPane component can tell this component to
 * close a panel by publish a TabBarPane id to the topic "resizablePanels.closePanel"
 * 
 * @param topPanelHeight Height of Top Panel in pixels. Type is number.
 * @param leftPanelWidth Width of Left Panel 2 in pixels. Type is number.
 * @param children Components for the Top Panel and Left Panel.
 * 
 */

const defaultStyles: any = (theme: Theme) => {
    return {
        panelContainer: {
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          overflow: "hidden",
          ...theme.overrides?.ResizablePanels?.panelContainer
        },
        panelRowContainer: {
            display: "flex",
            flexDirection: "row",
            ...theme.overrides?.ResizablePanels?.panelRowContainer
        },
        panelColContainer: {
            display: "flex",
            flexDirection: "column",
            ...theme.overrides?.ResizablePanels?.panelColContainer
        },
        panel: {
        },
        colResizer: { // For Vertical mode re-sizer bar
            width: "3px",
            background: "darkGray",
            position: "relative",
            cursor: "col-resize",
            flexShrink: "0",
            WebkitUserSelect: "none",
            MozUserSelect: "none",
            MsUserSelect: "none",
            userSelect: "none",
            ...theme.overrides?.ResizablePanels?.colResizer
        },
        rowResizer: { // For Horizontal mode re-sizer bar
          height: "3px",
          width: "100%",
          background: "darkGray",
          position: "relative",
          cursor: "row-resize",
          flexShrink: "0",
          WebkitUserSelect: "none",
          MozUserSelect: "none",
          MsUserSelect: "none",
          userSelect: "none",
          ...theme.overrides?.ResizablePanels?.rowResizer
        },
        splitIconDiv: {
          backgroundColor: "#e0e0e0",
          zIndex: 1,
          ...theme.overrides?.ResizablePanels?.splitIconDiv
        }
    }
}

export const CLOSE_PANEL_TOPIC = "resizablePanels.closePanel"
const MAX_PANELS_TO_ALLOW = 8

// When the component is unmounted, the state is saved. When mounted again with the same id, the state is restored.
class SavedState {
    state: State
    horizontalLayout: boolean
    panel: any[]
    panelSize: number[]
    panelId: string[]
    initialPanelSize: number[]
    constructor(state: State, horizontalLayout: boolean, panel: any[], panelSize: number[], panelId: string[], initialPanelSize: number[]) {
        this.state = state
        this.horizontalLayout = horizontalLayout
        this.panel = panel
        this.panelSize = panelSize
        this.panelId = panelId
        this.initialPanelSize = initialPanelSize
    }
}

interface Props {
    id: string
    theme: Theme
    classes: any
    topPanelHeight: number
    leftPanelWidth: number
    children: any  // Child 1 is for Top Panel, Child 2 is for Left Panel
    [propName: string]: any
}

interface State {
    error: ErrorMsg | null
    isDragging: boolean
    colResize: boolean  // True if resize of Left Panel
    horizontalResize: boolean
    verticalResize: boolean
    topPanelHeight: number
    leftPanelWidth: number
    resizerIndex: number
    initialPos: number
    delta: number
    horizontalResizeDelta: number
    verticalResizeDelta: number
    numPanels: number
    windowResizeCount: number
}

class ResizablePanels extends Component<Props, State> {
    private static savedStateMap: Map<string, SavedState> = new Map<string, SavedState>()
    tokens: Token[] = []
    horizontalLayout: boolean
    panel: any[] = []
    panelSize: number[] // Height if horizontal, width if vertical
    panelId: string[] = []
    initialPanelSize: number[] // Panel size before start of drag.
    ignoreNextWindowResize: boolean = false

    constructor(props: Props) {
        super(props)
        this.horizontalLayout = false
        this.state = {
            error: null,
            isDragging: false,
            colResize: false,
            horizontalResize: false,
            verticalResize: false,
            topPanelHeight: props.topPanelHeight,
            leftPanelWidth: props.leftPanelWidth,
            resizerIndex: 0,
            initialPos: 0,
            delta: 0,
            horizontalResizeDelta: 0,
            verticalResizeDelta: 0,
            numPanels: 0,
            windowResizeCount: 0
        }
    }

    componentDidMount () {
        ReactDOM.findDOMNode(this)!.addEventListener('mousemove', event => this.resizePanel(event))
        ReactDOM.findDOMNode(this)!.addEventListener('mouseup', () => this.stopResize())
        ReactDOM.findDOMNode(this)!.addEventListener('mouseleave', () => this.stopResize())
        this.tokens.push(MB.subscribe(CLOSE_PANEL_TOPIC, 
            (topic, data) => this.dataLoadedCallback(topic, data), 
            (topic, error) => this.errorCallback(topic, error)))
        this.tokens.push(MB.subscribe("app:errors:",
            (topic, error) => this.errorMessageCallback(topic, error),
            (topic, error) => this.errorCallback(topic, error)))

        const savedState = ResizablePanels.savedStateMap.get(this.props.id)
        if (savedState) {
            this.setState(savedState.state)
            this.horizontalLayout = savedState.horizontalLayout
            this.panel = savedState.panel
            this.panelSize = savedState.panelSize
            this.panelId = savedState.panelId
            this.initialPanelSize = savedState.initialPanelSize
            this.ignoreNextWindowResize = true
            ResizablePanels.savedStateMap.delete(this.props.id)
        }    
    }

    /**
     * Closes a panel as a result of the user closing the last tab of a panel. The TabBarPane sends
     * the id of the panel to close.
     */
    dataLoadedCallback(topic: string, panelToCloseId: string) {
        if (this.panel.length > 1) {
            for (let i = 0; i < this.panelId.length; i++) {
                if (this.panelId[i] === panelToCloseId) {
                    this.panel.splice(i, 1)
                    this.panelSize.splice(i, 1)
                    this.panelId.splice(i, 1)
                    this.setPanelsSameSize()
                    this.setState({numPanels: this.panel.length})
                    return
                }
            }
        }
    }

    errorCallback(topic: string, error: ErrorMsg) {
        console.error("Error: " + topic + " : "  + error.title + " " + error.detail)
    }

    errorMessageCallback(topic: string, error: ErrorMsg) {
        this.setState({error: error})
    }   

    componentWillUnmount() {
        ResizablePanels.savedStateMap.set(this.props.id, new SavedState(this.state, 
            this.horizontalLayout, this.panel, this.panelSize, this.panelId, this.initialPanelSize))
        MB.unsubscribeAll(this.tokens)
    }

    startResizeCols(event: MouseEvent) {
        this.setState({
            isDragging: true,
            colResize: true,
            initialPos: event.clientX})
    }

    startResizeHorizontalRows(event: MouseEvent, resizerIndex: number) {
        this.initialPanelSize = JSON.parse(JSON.stringify(this.panelSize))
        this.setState({
            isDragging: true,
            colResize: false,
            horizontalResize: true,
            verticalResize: false,
            resizerIndex: resizerIndex,
            initialPos: event.clientY})
    }

    startResizeVerticalCols(event: MouseEvent, resizerIndex: number) {
        this.initialPanelSize = JSON.parse(JSON.stringify(this.panelSize))
        this.setState({
            isDragging: true,
            colResize: false,
            horizontalResize: false,
            verticalResize: true,
            resizerIndex: resizerIndex,
            initialPos: event.clientX})
    }

    resizePanel(event: any) {
        if (this.state.isDragging) {
            if (this.state.colResize) {
              const delta = event.clientX - this.state.initialPos
              this.setState({delta: delta})
            } else {
                if (this.horizontalLayout) {
                    const delta = event.clientY - this.state.initialPos
                    this.panelSize[this.state.resizerIndex] = this.initialPanelSize[this.state.resizerIndex] + delta
                    this.panelSize[this.state.resizerIndex + 1] = this.initialPanelSize[this.state.resizerIndex + 1] - delta
                    this.setState({horizontalResizeDelta: delta})
                } else {
                    const delta = event.clientX - this.state.initialPos
                    this.panelSize[this.state.resizerIndex] = this.initialPanelSize[this.state.resizerIndex] + delta
                    this.panelSize[this.state.resizerIndex + 1] = this.initialPanelSize[this.state.resizerIndex + 1] - delta
                    this.setState({verticalResizeDelta: delta})
                }
            } 
        }    
    }

    stopResize() {
        if (this.state.isDragging) {
            if (this.state.colResize) {
              this.setState({
                isDragging: false,
                leftPanelWidth: this.state.leftPanelWidth + this.state.delta,
                delta: 0
            })
            } else {
                if (this.horizontalLayout) {
                    this.setState({
                    isDragging: false,
                    delta: 0})
                } else {
                    this.setState({
                        isDragging: false,
                        delta: 0})
                }
            }        
        }
    }

    getPanelsHorizontal(): any {
        const {classes} = this.props
        let panelElements = []

        for (const [index, panel] of this.panel.entries()) {
            if (index > 0) { // Add re-size bar
                panelElements.push(
                    <div className={classes.rowResizer} onMouseDown={(e: any) => this.startResizeHorizontalRows(e, index - 1)}></div>
                )
            }
            panelElements.push(
                <div key={this.panelId[index]} className={classes.panel} style={{width: "100%", height: this.panelSize[index]}}>
                    {panel}
                </div>
            )
        }
        return panelElements
    }

    getPanelsVertical(): any {
        const {classes} = this.props
        let panelElements = []

        for (const [index, panel] of this.panel.entries()) {
            if (index > 0) { // Add re-size bar
                panelElements.push(
                    <div className={classes.colResizer} onMouseDown={(e: any) => this.startResizeVerticalCols(e, index - 1)}></div>
                )
            }
            panelElements.push(
                <div key={this.panelId[index]} className={classes.panel} style={{height: "100%", width: this.panelSize[index]}}>
                    {panel}
                </div>
            )
        }
        return panelElements
    }

    setPanelsSameSize() {
        if (this.panel.length === 0) {
            return
        }
        if (this.horizontalLayout) {
            const availableHeightPx: number = (window.innerHeight - this.state.topPanelHeight) - ((this.panel.length -1) * 3) // Subtract resize bars
            const equalHeight: number = Math.floor(availableHeightPx / (this.panel.length))
            const remainder = availableHeightPx % (this.panel.length)
            for (let i = 0; i < this.panelSize.length; i++) {
                this.panelSize[i] = equalHeight
            }
            this.panelSize[this.panel.length - 1] += remainder 
        } else {
            const availableWidthtPx: number = (window.innerWidth - this.state.leftPanelWidth)  - ((this.panel.length - 1) * 3) // Subtract resize bars
            const equalWidth: number = Math.floor(availableWidthtPx / (this.panel.length))
            const remainder = availableWidthtPx % (this.panel.length)
            for (let i = 0; i < this.panelSize.length; i++) {
                this.panelSize[i] = equalWidth
            }
            this.panelSize[this.panel.length - 1] += remainder
        }
    }
    
    splitLastPanel() {
        const panelToSplit = this.panel.length - 1
        const id = IdGen.next()
        this.panel.splice(panelToSplit + 1, 0,
            <TabBarPane id={id} subscribeToTopic="cms.treeItem" /> 
        )
        this.panelSize.splice(panelToSplit + 1, 0, 0)
        this.panelId.splice(panelToSplit + 1, 0, id)
        this.setPanelsSameSize()
        this.setState({numPanels: this.panel.length})
    }

    handleWindowResize() {
        if (this.ignoreNextWindowResize) {
            this.ignoreNextWindowResize = false
            return
        }
        this.setPanelsSameSize()
        this.setState({windowResizeCount: this.state.windowResizeCount + 1})
    }

    onSplitHorizontalClickHandler() {
        this.horizontalLayout = true
        if (this.panel.length >= MAX_PANELS_TO_ALLOW) {
            this.setPanelsSameSize()
            this.setState({windowResizeCount: this.state.windowResizeCount + 1})
            MB.publish("statusBar.message", "limit of 8 editors reached...")
            return
        }
        this.splitLastPanel()
    }

    onSplitVerticalClickHandler() {
        this.horizontalLayout = false
        if (this.panel.length >= MAX_PANELS_TO_ALLOW) {
            this.setPanelsSameSize()
            this.setState({windowResizeCount: this.state.windowResizeCount + 1})
            MB.publish("statusBar.message", "limit of 8 editors reached...")
            return
        }
        this.splitLastPanel()
    }

    closeAlert() {
        this.setState({error: null})
        MB.publish("app:errors:", undefined)
    }

    render() {
        const {classes} = this.props

        // Make sure we have at least one panel
        if (this.panel.length === 0) {
            const id = IdGen.next()
            this.panel.push(
                <TabBarPane id={id} subscribeToTopic="cms.treeItem" /> 
            )
            this.panelSize = [0]
            this.panelId = [id]
            this.setPanelsSameSize()
        }

        return (
            <div style={{width: "100%", height: "100%"}}>
                <ReactResizeDetector
                        handleWidth
                        handleHeight
                        onResize={() => this.handleWindowResize()}
                        refreshMode="debounce"
                        refreshRate={200} />
                { (this.state.error) && (
                    <Draggable handle=".handle">
                        <Alert className="handle" elevation={12}
                            style={{position: "absolute", 
                                left: `calc(${this.state.leftPanelWidth}px + 6px)`,
                                top: `calc(${this.state.topPanelHeight}px + 3px`,
                                cursor: "move",
                                zIndex: 100 
                            }} severity={this.state.error.severity as Color} onClose={() => this.closeAlert()}>
                            <AlertTitle>{this.state.error.title}</AlertTitle>
                            <div dangerouslySetInnerHTML={{__html: Html.sanitize(this.state.error.detail)}} />
                        </Alert>
                    </Draggable>
                )}
                <div className={classes.splitIconDiv} style={{position: "absolute", right: "85px", top: `${this.state.topPanelHeight}px`, height: "24px", width: "20px"}}></div>
                <div className={classes.splitIconDiv} style={{position: "absolute", right: "45px", top: `${this.state.topPanelHeight}px`, height: "24px", width: "40px"}}>
                        <ToolTip title="Split with vertical layout" style={{cursor: "pointer"}}>
                            <div onClick={() => this.onSplitVerticalClickHandler()}>
                            <VerticalSplitTwoTone />
                            </div>
                        </ToolTip>
                </div>
                <div className={classes.splitIconDiv} style={{position: "absolute", right: "0px", top: `${this.state.topPanelHeight}px`, height: "24px",  width: "45px"}}>
                        <ToolTip title="Split with horizontal layout" style={{cursor: "pointer"}}>
                            <div onClick={() => this.onSplitHorizontalClickHandler()}>
                                <HorizontalSplitTwoTone />
                            </div>
                        </ToolTip>           
                </div>                            
                <div className={classes.panelContainer} onMouseUp={() => this.stopResize()}>
                    {/* Top Panel */}
                    <div className={classes.panel} style={{height: `${this.state.topPanelHeight}px`}}>
                       {this.props.children[0]}
                    </div>
                    {/* Container for all the other panels */}
                    <div className={classes.panelRowContainer} style={{height: `calc(100% - ${this.state.topPanelHeight}px)`}}>
                        {/* Left Panel */}
                        <div className={classes.panel} style={{width:`${this.state.leftPanelWidth}px`, height: "100%", overflow: "scroll"}}>
                           {this.props.children[1]}                 
                        </div>
                        {/* Column resizer */}
                        <div className={classes.colResizer} onMouseDown={(e: any) => this.startResizeCols(e)}
                            style={(this.state.isDragging && this.state.colResize) ? {left: this.state.delta} : {}}></div>
                        {/* Container for editor panels. Note: div must have the same key for both vertical and horizontal layouts. */}
                        { this.horizontalLayout && (
                            <div className={classes.panelColContainer} key="panelsOuterDiv" style={{width: `calc(100% - ${this.state.leftPanelWidth}px - 3px)`}}>               
                                {this.getPanelsHorizontal()}
                            </div>
                        )}
                        { !this.horizontalLayout && (
                            <div className={classes.panelRowContainer} key="panelsOuterDiv" style={{width: `calc(100% - ${this.state.leftPanelWidth}px - 3px)`}}>               
                               {this.getPanelsVertical()}
                            </div>
                        )}             
                    </div>
                </div>
            </div>
        )
    }
}

export default withStyles(defaultStyles, { name: "ResizablePanels", withTheme: true})(ResizablePanels)