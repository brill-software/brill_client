# Brill Client

---

The Brill Client is part of the Brill Framework. The Brill Client is a React application 
written using TypeScript, that runs on the Web Browser. The Brill Client communicates with
the Brill Server using the [Brill Middleware](https://www.brill.software/brill_software/middleware "Brill Middleware").

## Git Repository

The master copy of the Brill Client project is kept at 

- Bitbucket (git@bitbucket.org:brill-software/brill_client.git)

The project is also available from:

- Sourceforce (git://git.code.sf.net/p/brill-software/brill_client)
- GitLab (git@gitlab.com:brill-software/brill_client.git)
- GitHub (git@github.com:brill-software/brill_client.git)

To make changes, you either need permission to write to the Bitbucket repository or create a fork repository.
You can create a fork repository on Bitbucket, Sourceforge, GitLab, GitHub, AWS CodeCommit or your own Git Server.

## Development

A NodeJS server is used for development purposes. This runs on port 3000 and connects to a
development Brill Server running on port 8080. The port numbers can be changed in the config files.

### Starting the Dev Server

- Get the node_modules directories setup:
```
yarn
```

- Start the Brill Server on port 8080.

- Start the NodeJS development web server on port 3000 :
```
yarn start
```

- Use a web browser to access http://localhost:3000

## Production build

To build:
```
yarn build
```

The build takes a while and the resulting build can be found in the Brill Client **/build** directory. Before building the Brill Server,
the contents of the Brill Client **/build** directory need to be copied over to the Brill Server static content directory. There's Gradle 
task for copying the files over. In production, the Brill Server acts a a Web Server and serves the files that are in the static
content directory. 

See the [Developers Guide](https://www.brill.software/brill_software/developers_guide "Developers Guide") for more information.

## Licensing

See the LICENSE file in the root directory and the [Brill Software Website](https://www.brill.software "Brill Software") for more details.




# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).


Use yarn rather than npm

tsconfig compiler options has
    "baseUrl": "src",
This is to allow absolute import paths to be used instead of relative import paths.
§


Imports

dompurify  - Filters HTML to only contain a limited set of tags and attributes.    

"@mui/styles": "^5.13.7",

Added to tsconfig:
    "strictPropertyInitialization": false,
    "downlevelIteration": true

yarn add @mui/icons-material

yarn add react-draggable  

yarn add react-resize-detector

yarn add @mui/lab     

yarn add mui-datatables
yarn add @types/mui-datatables

yarn add react-monaco-editor
yarn add monaco-editor
yarn add vscode-json-languageservice
yarn add draft-js-export-html   
yarn add draft-js 

yarn add classnames  
yarn add @types/classnames

yarn add @noble/secp256k1

yarn add history@4.10.1
yarn add @types/history@4.7.6

yarn add @babel/plugin-proposal-private-property-in-object




yarn eject
*** The webpack.config.js needs to be modified to add an import for 
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');
 new MonacoWebpackPlugin(),
 

Eject does the following:

chrisbulcock@brill1 poc3 % yarn eject
yarn run v1.22.19
warning ../../package.json: No license field
$ react-scripts eject
NOTE: Create React App 2+ supports TypeScript, Sass, CSS Modules and more without ejecting: https://reactjs.org/blog/2018/10/01/create-react-app-v2.html

✔ Are you sure you want to eject? This action is permanent. … yes
Ejecting...

Copying files into /Users/chrisbulcock/Projects/poc3
  Adding /config/env.js to the project
  Adding /config/getHttpsConfig.js to the project
  Adding /config/modules.js to the project
  Adding /config/paths.js to the project
  Adding /config/webpack.config.js to the project
  Adding /config/webpackDevServer.config.js to the project
  Adding /config/jest/babelTransform.js to the project
  Adding /config/jest/cssTransform.js to the project
  Adding /config/jest/fileTransform.js to the project
  Adding /scripts/build.js to the project
  Adding /scripts/start.js to the project
  Adding /scripts/test.js to the project
  Adding /config/webpack/persistentCache/createEnvironmentHash.js to the project

Updating the dependencies
  Removing react-scripts from dependencies
  Adding @babel/core to dependencies
  Adding @pmmmwh/react-refresh-webpack-plugin to dependencies
  Adding @svgr/webpack to dependencies
  Adding babel-jest to dependencies
  Adding babel-loader to dependencies
  Adding babel-plugin-named-asset-import to dependencies
  Adding babel-preset-react-app to dependencies
  Adding bfj to dependencies
  Adding browserslist to dependencies
  Adding camelcase to dependencies
  Adding case-sensitive-paths-webpack-plugin to dependencies
  Adding css-loader to dependencies
  Adding css-minimizer-webpack-plugin to dependencies
  Adding dotenv to dependencies
  Adding dotenv-expand to dependencies
  Adding eslint to dependencies
  Adding eslint-config-react-app to dependencies
  Adding eslint-webpack-plugin to dependencies
  Adding file-loader to dependencies
  Adding fs-extra to dependencies
  Adding html-webpack-plugin to dependencies
  Adding identity-obj-proxy to dependencies
  Adding jest to dependencies
  Adding jest-resolve to dependencies
  Adding jest-watch-typeahead to dependencies
  Adding mini-css-extract-plugin to dependencies
  Adding postcss to dependencies
  Adding postcss-flexbugs-fixes to dependencies
  Adding postcss-loader to dependencies
  Adding postcss-normalize to dependencies
  Adding postcss-preset-env to dependencies
  Adding prompts to dependencies
  Adding react-app-polyfill to dependencies
  Adding react-dev-utils to dependencies
  Adding react-refresh to dependencies
  Adding resolve to dependencies
  Adding resolve-url-loader to dependencies
  Adding sass-loader to dependencies
  Adding semver to dependencies
  Adding source-map-loader to dependencies
  Adding style-loader to dependencies
  Adding tailwindcss to dependencies
  Adding terser-webpack-plugin to dependencies
  Adding webpack to dependencies
  Adding webpack-dev-server to dependencies
  Adding webpack-manifest-plugin to dependencies
  Adding workbox-webpack-plugin to dependencies

Updating the scripts
  Replacing "react-scripts start" with "node scripts/start.js"
  Replacing "react-scripts build" with "node scripts/build.js"
  Replacing "react-scripts test" with "node scripts/test.js"

Configuring package.json
  Adding Jest configuration
  Adding Babel preset

Running yarn...
warning ../../package.json: No license field
[1/4] 🔍  Resolving packages...
[2/4] 🚚  Fetching packages...
[3/4] 🔗  Linking dependencies...
warning " > @mui/styles@5.13.7" has incorrect peer dependency "react@^17.0.0".
warning " > @testing-library/user-event@13.5.0" has unmet peer dependency "@testing-library/dom@>=7.21.4".
warning " > draft-js-export-html@1.4.1" has unmet peer dependency "immutable@3.x.x".
warning "draft-js-export-html > draft-js-utils@1.4.1" has unmet peer dependency "immutable@3.x.x".
warning "eslint-config-react-app > eslint-plugin-flowtype@8.0.3" has unmet peer dependency "@babel/plugin-syntax-flow@^7.14.5".
warning "eslint-config-react-app > eslint-plugin-flowtype@8.0.3" has unmet peer dependency "@babel/plugin-transform-react-jsx@^7.14.9".
warning "mui-datatables > react-sortable-tree-patch-react-17@2.9.0" has incorrect peer dependency "react@^17.0.0".
warning "mui-datatables > react-sortable-tree-patch-react-17@2.9.0" has incorrect peer dependency "react-dom@^17.0.0".
warning " > react-monaco-editor@0.46.0" has incorrect peer dependency "@types/react@^17.x".
warning " > react-monaco-editor@0.46.0" has incorrect peer dependency "react@^17.x".
[4/4] 🔨  Building fresh packages...
success Saved lockfile.
Ejected successfully!

Staged ejected files for commit.

Please consider sharing why you ejected in this survey:
  http://goo.gl/forms/Bi6CZjk1EqsdelXk1

✨  Done in 8.57s.

yarn install v1.22.19
warning ../../package.json: No license field
info No lockfile found.
[1/4] 🔍  Resolving packages...
warning @svgr/webpack > @svgr/plugin-svgo > svgo@1.3.2: This SVGO version is no longer supported. Upgrade to v2.x.x.
warning @svgr/webpack > @svgr/plugin-svgo > svgo > stable@0.1.8: Modern JS already guarantees Array#sort() is a stable sort, so this library is deprecated. See the compatibility table on MDN: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort#browser_compatibility
warning @types/classnames@2.3.1: This is a stub types definition. classnames provides its own type definitions, so you do not need this installed.
warning css-minimizer-webpack-plugin > cssnano > cssnano-preset-default > postcss-svgo > svgo > stable@0.1.8: Modern JS already guarantees Array#sort() is a stable sort, so this library is deprecated. See the compatibility table on MDN: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort#browser_compatibility
warning jest > @jest/core > jest-config > jest-environment-jsdom > jsdom > w3c-hr-time@1.0.2: Use your platform's native performance.now() and performance.timeOrigin.
warning react-dev-utils > fork-ts-checker-webpack-plugin > memfs@3.6.0: this will be v4
warning webpack-dev-server > webpack-dev-middleware > memfs@3.6.0: this will be v4
warning workbox-webpack-plugin@6.6.1: this package has been deprecated
warning workbox-webpack-plugin > workbox-build@6.6.1: this package has been deprecated
warning workbox-webpack-plugin > workbox-build > rollup-plugin-terser@7.0.2: This package has been deprecated and is no longer maintained. Please use @rollup/plugin-terser
warning workbox-webpack-plugin > workbox-build > workbox-cacheable-response@6.6.1: workbox-background-sync@6.6.1
warning workbox-webpack-plugin > workbox-build > workbox-broadcast-update@6.6.1: this package has been deprecated
warning workbox-webpack-plugin > workbox-build > workbox-background-sync@6.6.1: this package has been deprecated
warning workbox-webpack-plugin > workbox-build > workbox-expiration@6.6.1: this package has been deprecated
warning workbox-webpack-plugin > workbox-build > workbox-navigation-preload@6.6.1: this package has been deprecated
warning workbox-webpack-plugin > workbox-build > workbox-core@6.6.1: this package has been deprecated
warning workbox-webpack-plugin > workbox-build > workbox-cacheable-response > workbox-core@6.6.1: this package has been deprecated
warning workbox-webpack-plugin > workbox-build > workbox-broadcast-update > workbox-core@6.6.1: this package has been deprecated
warning workbox-webpack-plugin > workbox-build > workbox-background-sync > workbox-core@6.6.1: this package has been deprecated
warning workbox-webpack-plugin > workbox-build > workbox-expiration > workbox-core@6.6.1: this package has been deprecated
warning workbox-webpack-plugin > workbox-build > workbox-navigation-preload > workbox-core@6.6.1: this package has been deprecated
warning workbox-webpack-plugin > workbox-build > workbox-google-analytics@6.6.1: this package has been deprecated
warning workbox-webpack-plugin > workbox-build > workbox-google-analytics > workbox-background-sync@6.6.1: this package has been deprecated
warning workbox-webpack-plugin > workbox-build > workbox-google-analytics > workbox-core@6.6.1: this package has been deprecated
warning workbox-webpack-plugin > workbox-build > workbox-precaching@6.6.1: this package has been deprecated
warning workbox-webpack-plugin > workbox-build > workbox-precaching > workbox-core@6.6.1: this package has been deprecated
warning workbox-webpack-plugin > workbox-build > workbox-routing@6.6.1: this package has been deprecated
warning workbox-webpack-plugin > workbox-build > workbox-google-analytics > workbox-routing@6.6.1: this package has been deprecated
warning workbox-webpack-plugin > workbox-build > workbox-precaching > workbox-routing@6.6.1: this package has been deprecated
warning workbox-webpack-plugin > workbox-build > workbox-routing > workbox-core@6.6.1: this package has been deprecated
warning workbox-webpack-plugin > workbox-build > workbox-recipes@6.6.1: this package has been deprecated
warning workbox-webpack-plugin > workbox-build > workbox-recipes > workbox-cacheable-response@6.6.1: workbox-background-sync@6.6.1
warning workbox-webpack-plugin > workbox-build > workbox-recipes > workbox-core@6.6.1: this package has been deprecated
warning workbox-webpack-plugin > workbox-build > workbox-recipes > workbox-expiration@6.6.1: this package has been deprecated
warning workbox-webpack-plugin > workbox-build > workbox-recipes > workbox-precaching@6.6.1: this package has been deprecated
warning workbox-webpack-plugin > workbox-build > workbox-recipes > workbox-routing@6.6.1: this package has been deprecated
warning workbox-webpack-plugin > workbox-build > workbox-range-requests@6.6.1: this package has been deprecated
warning workbox-webpack-plugin > workbox-build > workbox-range-requests > workbox-core@6.6.1: this package has been deprecated
warning workbox-webpack-plugin > workbox-build > workbox-strategies@6.6.1: this package has been deprecated
warning workbox-webpack-plugin > workbox-build > workbox-google-analytics > workbox-strategies@6.6.1: this package has been deprecated
warning workbox-webpack-plugin > workbox-build > workbox-precaching > workbox-strategies@6.6.1: this package has been deprecated
warning workbox-webpack-plugin > workbox-build > workbox-recipes > workbox-strategies@6.6.1: this package has been deprecated
warning workbox-webpack-plugin > workbox-build > workbox-strategies > workbox-core@6.6.1: this package has been deprecated
warning workbox-webpack-plugin > workbox-build > workbox-sw@6.6.1: this package has been deprecated
warning workbox-webpack-plugin > workbox-build > workbox-window@6.6.1: this package has been deprecated
warning workbox-webpack-plugin > workbox-build > workbox-window > workbox-core@6.6.1: this package has been deprecated
warning workbox-webpack-plugin > workbox-build > workbox-streams@6.6.1: this package has been deprecated
warning workbox-webpack-plugin > workbox-build > workbox-streams > workbox-core@6.6.1: this package has been deprecated
warning workbox-webpack-plugin > workbox-build > workbox-streams > workbox-routing@6.6.1: this package has been deprecated
warning workbox-webpack-plugin > workbox-build > @surma/rollup-plugin-off-main-thread > magic-string > sourcemap-codec@1.4.8: Please use @jridgewell/sourcemap-codec instead
[2/4] 🚚  Fetching packages...
[3/4] 🔗  Linking dependencies...
warning " > @mui/styles@5.14.1" has incorrect peer dependency "react@^17.0.0".
warning " > @testing-library/user-event@13.5.0" has unmet peer dependency "@testing-library/dom@>=7.21.4".
warning " > draft-js-export-html@1.4.1" has unmet peer dependency "immutable@3.x.x".
warning "draft-js-export-html > draft-js-utils@1.4.1" has unmet peer dependency "immutable@3.x.x".
warning "eslint-config-react-app > eslint-plugin-flowtype@8.0.3" has unmet peer dependency "@babel/plugin-syntax-flow@^7.14.5".
warning "eslint-config-react-app > eslint-plugin-flowtype@8.0.3" has unmet peer dependency "@babel/plugin-transform-react-jsx@^7.14.9".
warning "mui-datatables > react-sortable-tree-patch-react-17@2.9.0" has incorrect peer dependency "react@^17.0.0".
warning "mui-datatables > react-sortable-tree-patch-react-17@2.9.0" has incorrect peer dependency "react-dom@^17.0.0".
warning " > react-monaco-editor@0.46.0" has incorrect peer dependency "@types/react@^17.x".
warning " > react-monaco-editor@0.46.0" has incorrect peer dependency "react@^17.x".
[4/4] 🔨  Building fresh packages...
success Saved lockfile.
✨  Done in 86.68s.