// © 2021 Brill Software Limited - Brill Framework, distributed under the Brill Software Proprietry License.
import React, {Component, ErrorInfo} from "react"

type Props = {
    children?: any
}

type State = Readonly<{
    hasError: boolean
    errorMsg: string
}>

/**
 * Error boundary handler.
 * 
 */

export default class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, errorMsg: "" };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // You can also log the error to an error reporting service
        console.log("ErrorBoundary: " + JSON.stringify(errorInfo));
        this.setState({ hasError: true, errorMsg: error.message })
    }

    clearErrorMsg() {
        this.setState({ hasError: false, errorMsg: '' });
    }

    render() {
        if (this.state.hasError) {
            return ( 
                <div>   
                    <div>{this.state.errorMsg}</div><br />
                    <button onClick={() => this.clearErrorMsg()}>Close</button>
                    {this.props.children}
                </div> );
        }
        return this.props.children;
    }
}