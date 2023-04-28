import React, { Component } from 'react';
import Router from './lib/Router/Router';
import { ThemeProvider, createMuiTheme } from '@material-ui/core/styles';

const theme = createMuiTheme();

class Props {
  [propName: string]: any
}

class State {}

export default class App extends Component<Props, State> {
  
  render() {
    return (
        <ThemeProvider theme={theme}>
            <Router />
        </ThemeProvider>
    )
  }
}