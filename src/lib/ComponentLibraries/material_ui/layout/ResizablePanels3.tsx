// © 2021 Brill Software Limited - Brill Framework, distributed under the MIT license.
import React, {Component} from "react"
import ReactDOM from "react-dom"
import { Theme } from "lib/ComponentLibraries/material_ui/theme/Theme"
import withStyles from "@mui/styles/withStyles"

/**
 * Provides three panels with a horizontal resize bar.
 * 
 * ----------------------------
 * | Panel 1                  |
 * |---------------------------
 * | Panel 2 || Panel 3       |
 * |         ||               |
 * |         ||               |
 * |         ||               |
 * |         ||               |
 * ---------------------------- 
 *           ^
 *      Column Resizer
 * 
 * Panel 3 expands or contracts when the window is resized.
 * 
 * @param p1Height Height of Panel 1 in pixels. Type is number.
 * @param p2Width Width of Panel 2 in pixels. Type is number.
 * @param children Three children, one for each panel.
 * 
 */

const P1_HEIGHT_DEFAULT = 100
const P2_WIDTH_DEFAULT = 300

interface Props {
    id: string
    classes: any
    p1Height?: number
    p2Width?: number
    children: any
    [propName: string]: any
}

interface State {
    isDragging: boolean
    colResize: boolean  // True if columns are been resized, false if resize of row.
    p1Height: number
    p2Width: number
    currentPanel: number
    initialPos: number
    delta: number
}

class ResizablePanels3 extends Component<Props, State> {

    constructor(props: Props) {
        super(props)
        const p1Height = (props.p1Height === undefined) ? P1_HEIGHT_DEFAULT : props.p1Height
        const p2Width = (props.p2Width === undefined) ? P2_WIDTH_DEFAULT : props.p2Width
        this.state = {
            isDragging: false,
            colResize: true,
            p1Height: p1Height,
            p2Width: p2Width,
            currentPanel: 0,
            initialPos: 0,
            delta: 0
        }
    }

    componentDidMount () {
        ReactDOM.findDOMNode(this)!.addEventListener('mousemove', this.resizePanel.bind(this))
        ReactDOM.findDOMNode(this)!.addEventListener('mouseup', this.stopResize.bind(this))
        ReactDOM.findDOMNode(this)!.addEventListener('mouseleave', this.stopResize.bind(this))
    }

    startResizeCols(event: MouseEvent) {
        this.setState({
            isDragging: true,
            colResize: true,
            initialPos: event.clientX})
    }


    resizePanel(event: any) {
        if (this.state.isDragging) {
              const delta = event.clientX - this.state.initialPos
              this.setState({
                delta: delta
              })
        }    
    }

    stopResize() {
        if (this.state.isDragging) {
            console.log(this.state)
            this.setState({
                isDragging: false,
                p2Width: this.state.p2Width + this.state.delta,
                delta: 0,
                currentPanel: 0
            })
        }
    }
    
    render() {
        const {classes} = this.props

        return (
            <div>
                <div className={classes.panelContainer} onMouseUp={() => this.stopResize()}>
                    {/* Panel 1 */}
                    <div className={classes.panel} style={{height: `${this.state.p1Height}px`}}>
                       {this.props.children[0]}
                    </div>
                    {/* Container for panels 2 and 3 */}
                    <div className={classes.panelRowContainer} style={{height: `calc(100% - ${this.state.p1Height}px)`}}>
                        {/* Panel 2 */}
                        <div className={classes.panel} style={{width:`${this.state.p2Width}px`, height: "100%"}}>
                           {this.props.children[1]}
                        </div>
                        {/* Column resizer */}
                        <div className={classes.colResizer} onMouseDown={(e: any) => this.startResizeCols(e)}
                            style={(this.state.isDragging && this.state.colResize) ? {left: this.state.delta} : {}}></div>                  
                        {/* Panel 3 */}
                        <div className={classes.panel} style={{height: "100%"}}>
                                {this.props.children[2]}
                        </div>        
                    </div>
                </div>
            </div>
        )
    }

    static defaultStyles(theme: Theme): any {
        return {
            panelContainer: {
              display: "flex",
              flexDirection: "column",
              height: "100vh",
              overflow: "hidden"
            },
            panelRowContainer: {
                display: "flex",
                flexDirection: "row",
            },
            panelColContainer: {
                display: "flex",
                flexDirection: "column",
            },
            panel: {
                overflow: "scroll"
            },
            colResizer: {
                width: "3px",
                background: "darkGray",
                position: "relative",
                cursor: "col-resize",
                flexShrink: "0",
                WebkitUserSelect: "none",
                MozUserSelect: "none",
                MsUserSelect: "none",
                userSelect: "none" 
            }
        }        
    }
}

export default withStyles(ResizablePanels3.defaultStyles)(ResizablePanels3)