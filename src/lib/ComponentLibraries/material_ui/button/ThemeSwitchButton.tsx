// © 2021 Brill Software Limited - Brill Framework, distributed under the MIT license.
import React, {Component} from "react"
import Tooltip from "@material-ui/core/Tooltip"
import { IconButton as MuiIconButton, withStyles } from '@material-ui/core'
import { Theme } from "lib/ComponentLibraries/material_ui/theme/Theme"
import Brightness7 from "@material-ui/icons/Brightness7"
import Brightness4 from "@material-ui/icons/Brightness4"
import { MB, Token } from "lib/MessageBroker/MB"
import { ErrorMsg } from "lib/MessageBroker/ErrorMsg"
import { THEME_PROVIDER_DARK_TOPIC, THEME_PROVIDER_SWITCH_TOPIC } from "lib/ComponentLibraries/material_ui/theme/ThemeProvider"

/**
 * Button for switching between the light and dark themes.
 * 
 */

interface Props {
    theme: Theme
    setDarkToolTip: string
    setLightToolTip: string
    [propName: string]: any
}

interface State {
    dark: boolean
}

class ThemeSwitchButton extends Component<Props, State> {
    token: Token

    static defaultStyles(theme: Theme): any {
        return  { root: { ...theme.overrides?.ThemeSwitchButton?.root }}
    }

    constructor(props: Props) {
        super(props);
        this.state = {dark: false};
    }

    componentDidMount() {
        this.token = MB.subscribe(THEME_PROVIDER_DARK_TOPIC, 
            (topic, data) => this.dataCallback(topic, data), (topic, error) => this.errorCallback(topic, error))
    }

    dataCallback(topic: string, data: string) {
        this.setState({dark: (data === "Y")})
    }

    errorCallback(topic: string, error: ErrorMsg) {
        console.error("Error: " + topic + " : "  + error.title + " " + error.detail)
    }

    componentWillUnmount() {
        MB.unsubscribe(this.token)
    }

    onClickHandler() {
        MB.publish(THEME_PROVIDER_SWITCH_TOPIC, "switch")
    }

    render() {
        const {theme, classes, setDarkToolTip, setLightToolTip, ...other} = this.props
        const tooltip = (this.state.dark) ? setLightToolTip : setDarkToolTip

        return (
            <Tooltip title={tooltip}>
                <MuiIconButton className={classes.root} aria-label={tooltip} {...other}
                    onClick={() => this.onClickHandler()}>
                    {this.state.dark && (<Brightness7 />)}
                    {!this.state.dark && (<Brightness4 />)}
               </MuiIconButton>
            </Tooltip>
        )
    }
}

export default withStyles(ThemeSwitchButton.defaultStyles, {withTheme: true})(ThemeSwitchButton)