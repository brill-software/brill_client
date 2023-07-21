import React, { Component } from "react"
import Router from "./lib/Router/Router"

class Props {
  [propName: string]: any
}

class State {}

export default class App extends Component<Props, State> {
  
  constructor(props: Props) {
      super(props)
      console.log("Constructor called")
  }

  componentDidMount() {
      console.log("App coomponetDidMount")
  }

  componentWillUnmount() {
    console.log("App componentWillUnmount")
}

  render() {
    return (
        <div>
            <Router />
        </div>
    )
  }
}