// © 2021 Brill Software Limited - Brill MUI Components, distributed under the MIT License.
import React, {Component} from "react"
import Tooltip from "@mui/material/Tooltip"
import { IconButton as MuiIconButton } from '@mui/material'
import { Theme } from "lib/ComponentLibraries/material_ui/theme/Theme"
import Brightness7 from "@mui/icons-material/Brightness7"
import Brightness4 from "@mui/icons-material/Brightness4"
import { MB, Token } from "lib/MessageBroker/MB"
import { ErrorMsg } from "lib/MessageBroker/ErrorMsg"
import { THEME_PROVIDER_DARK_TOPIC, THEME_PROVIDER_SWITCH_TOPIC } from "lib/ComponentLibraries/material_ui/theme/ThemeProvider"
import withStyles from "@mui/styles/withStyles"

/**
 * Button for switching between the light and dark themes.
 * 
 */

interface Props {
    theme: Theme
    classes: any
    setDarkToolTip: string
    setLightToolTip: string
    [propName: string]: any
}

interface State {
    dark: boolean
}

class ThemeSwitchButton extends Component<Props, State> {
    token: Token



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

    static defaultStyles(theme: Theme): any {
        return  { root: { ...theme.components?.ThemeSwitchButton?.styleOverrides?.root }}
    }
}

export default withStyles(ThemeSwitchButton.defaultStyles, {withTheme: true})(ThemeSwitchButton)