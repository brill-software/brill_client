// © 2021 Brill Software Limited - Brill Framework, distributed under the MIT license.
import React, {Component} from "react"
import { withTheme, SvgIcon } from "@material-ui/core"
import { Theme } from "lib/ComponentLibraries/material_ui/theme/Theme"
import { MB, Token } from "lib/MessageBroker/MB"
import { ErrorMsg } from "lib/MessageBroker/ErrorMsg"

/**
 * Supports Icons that are 24x24 and have a single colour. Supports Material UI Icons from
 * https://material-ui.com/components/material-icons/ and also loaded from Topic /Icons/fixed/*.json
 * 
 * Icons must be of size 24x24. The colour can be set using the color attribute.
 * 
 * SVG Icons from other libraries can be imported as custom icons. Other librbaries are:
 * Material Design Icons: https://materialdesignicons.com/
 * React Icons: https://react-icons.github.io/react-icons/
 * Comercial Icons: https://www.iconfinder.com/
 * 
 * You can also create your own SVG Icons using various SVG editors.
 *  
 */

interface Props {
    id: string
    theme: Theme
    nameOrTopic: string
    [propName: string]: any
}

interface State {
    muiIcon: boolean
    path_d: string
}

class FixedSizeIcon extends Component<Props, State> { 
    token: Token

    constructor(props: Props) {
        super(props)
        this.state = {muiIcon: false, path_d: ""}
    }

    componentDidMount() {
        const {nameOrTopic} = this.props
        const muiIcon: boolean = !(nameOrTopic && (nameOrTopic.indexOf("/") !== -1 || nameOrTopic.indexOf(".") !== -1))
        if (!muiIcon) {
            this.token = MB.subscribe(this.props.nameOrTopic, (topic, path_d) => this.dataLoadedCallback(topic, path_d), (topic, error) => this.errorCallback(topic, error))
        }
        this.setState({muiIcon: muiIcon})
    }

    componentWillUnmount() {
        if (!this.state.muiIcon) {
            MB.unsubscribe(this.token)
        }
    }
    
    dataLoadedCallback(topic: string, path_d: any) {
        this.setState({path_d: path_d})
    }

    errorCallback(topic: string, error: ErrorMsg) {
        console.error("Error: " + topic + " : "  + error.title + " " + error.detail)
    }    

    render() {
        const {id, theme, nameOrTopic, ...other} = this.props
        
        if (!nameOrTopic) {
            return (
                <div>?</div>
            )
        }

        if (!this.state.muiIcon) {
            if (this.state.path_d.length > 0) {
                return (<SvgIcon {...other}><path d={this.state.path_d} /></SvgIcon> )
            } 
            return <div>?</div> 
        }

        let resolved: any
        try {
            resolved = require(`@material-ui/icons/${nameOrTopic}.js`).default
        } catch (error) {
            console.warn(`Unable to load icon ${nameOrTopic}`);
            resolved = require(`@material-ui/icons/ErrorTwoTone.js`).default
        }
    
        const attribs: any = other
        return React.createElement(resolved, attribs)
    }
}

export default withTheme(FixedSizeIcon) 
