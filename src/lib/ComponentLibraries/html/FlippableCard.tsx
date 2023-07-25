// © 2023 Brill Software Limited - Brill Framework, distributed under the MIT license.
import React, {Component} from "react"
import { Theme } from "lib/ComponentLibraries/material_ui/theme/Theme"
import withStyles from "@mui/styles/withStyles"

/**
 * Flippable Card component.
 * 
 */

interface Props {
    theme: Theme
    classes: any
    children?: any // First child is the front, second child is when flipped.
    [propName: string]: any
}

interface State {
}

class FlippableCard extends Component<Props, State> {
    cardInnerRef: React.RefObject<any>

    constructor(props: Props) {
        super(props)
        this.state = {}
        this.cardInnerRef = React.createRef()
    }

    onClickHandler(event: any) {
        this.cardInnerRef.current.classList.toggle(this.props.classes.isFlipped)
    }

    render() {
        const {theme, classes, subscribeToTopic, text, children, bgImageTopic, ...other} = this.props

        if (!children || children.length !== 2) {
            return <div>FlippableCard expects two child components.</div>
        }

        return (
            <div className={classes.card} onClick={event => this.onClickHandler(event)}  {...other}>
                <div className={classes.cardInner} ref={this.cardInnerRef}>
                    <div className={classes.cardFront}>{this.props.children[0]}</div>
                    <div className={classes.cardBack}>{this.props.children[1]}</div>
                </div> 
            </div>
        )
    }

    static defaultStyles(theme: Theme): any {

        return {
            card: {
                width: "300px",
                height: "436px",
                perspective: "1000px",
                ...theme.components?.styleOverrides?.FlippableCard?.card
            },
            cardInner: {
                width: "100%",
                height: "100%",
                transition: "transform 2s",
                transformStyle: "preserve-3d",
                cursor: "pointer",
                position: "relative",
                ...theme.components?.FlippableCard?.styleOverrides?.cardInner
            },
            cardFront: {
                position: "absolute",
                width: "100%",
                height: "100%",
                backfaceVisibility: "hidden",
                overflow: "hidden",
                boxShadow: "0px 3px 18px 3px rgba(0, 0, 0, 0.2)",
                color: "white",
                backgroundColor: "#1156a1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "24px",
                borderRadius: "14px",
                ...theme.components?.FlippableCard?.styleOverrides?.cardFront
            },
            cardBack: {
                position: "absolute",
                width: "100%",
                height: "100%",
                backfaceVisibility: "hidden",
                overflow: "hidden",
                boxShadow: "0px 3px 18px 3px rgba(0, 0, 0, 0.2)",
                transform: "rotateY(180deg)",
                backgroundColor: "rgba(0,0,0,0.0)",
                borderRadius: "14px",
                ...theme.components?.FlippableCard?.styleOverrides?.cardBack
            },
            isFlipped: {
                transform: "rotateY(180deg)",
                ...theme.components?.FlippableCard?.styleOverrides?.isFlipped
            }
        }
    }
}

export default withStyles(FlippableCard.defaultStyles, { withTheme: true })(FlippableCard)