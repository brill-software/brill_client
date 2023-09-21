// © 2023 Brill Software Limited - Brill Framework, distributed under the Brill Software Proprietry License.
import React, { Component } from "react"

/**
 * Displays Loading... after a two second delay.
 * 
 */

const DELAY_BEFORE_DISPLAYING_LOADING = 2000

interface Props {
    [propName: string]: any
}
 
interface State {
    timerExpired: boolean
}

export default class LoadingIndicator extends Component<Props, State> {
    timer: NodeJS.Timeout

    constructor(props: Props) {
        super(props)
        this.state = {timerExpired: false}
    }

    componentDidMount() {
        this.timer = setTimeout(() => this.timerExpired(), DELAY_BEFORE_DISPLAYING_LOADING)
    } 

    timerExpired() {
        this.setState({timerExpired: true})
    }

    componentWillUnmount() {
        clearTimeout(this.timer)
    }

    render() {
        if (this.state.timerExpired) {
            return (
                <div>Loading...</div>
            )
        }
        return null
    }
}