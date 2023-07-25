// © 2021 Brill Software Limited - Brill Framework, distributed under the MIT license.
import React, {Component} from "react"
import { Theme } from "lib/ComponentLibraries/material_ui/theme/Theme"
import withStyles from "@mui/styles/withStyles"

/**
 * Card compnent - based on the MUI Card component.
 * 
 */

interface Props {
    id: string
    children: any
    title: string
    [propName: string]: any
}

interface State {
}

 class Card extends Component<Props, State> {

    render() {
        const {id, classes, title, children, ...other} = this.props
        
        return (
            <div className={classes.root} {...other}>
                <div className={classes.title}>{title}</div>
                    <div className={classes.body}>
                        {children}
                    </div>
            </div>
        )
    }

    static defaultStyles(theme: Theme): any {
        return  { 
            root: {
                borderRadius: theme.shape.borderRadius,
                boxSizing: 'border-box',
                border: '0.0625rem solid',
                borderColor: theme.palette.grey.A100,
                backgroundColor: theme.palette.background.paper,
                boxShadow: '0 0.125rem 0.3125rem 0 rgba(0,0,0,0.05)'
            },
            title: {
                backgroundColor: theme.palette.primary.main,
                lineHeight: '1.5rem',
                padding: '0.7rem 0.5625rem 0.7rem 0.825rem',
                borderRadius: '0.1875rem 0.1875rem 0 0',
                color: theme.palette.primary.contrastText,  
                fontFamily: theme.typography.caption.fontFamily,
                fontWeight: theme.typography.caption.fontWeight,
                fontSize: theme.typography.caption.fontSize
            },
            body: {
                padding: '1rem'
              }
          }
    }
}

export default withStyles(Card.defaultStyles)(Card)