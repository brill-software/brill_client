# Brill Client

---

The Brill Client is part of the Brill Framework. The Brill Client is a React application 
written using TypeScript, that runs on the Web Browser. The Brill Client communicates with
the Brill Server using the Brill Middleware, which is based on WebSockets.

## Development

A NodeJS server is used for development purposes. This runs on port 3000 and connects to a
development Brill Server running on port 8080. The port numbers can be changed in the config files.

Get the node_modules directory setup:
```
yarn
```

Start the Brill Server.

Start the NodeJS development web server on port 3000 :
```
yarn start
```

Use a web browser to access http://localhost:3000

## Production build

To build:
```
yarn build
```

The build takes a while and the resulting build can be found in the /build directory. Before building the Brill Server,
the /build directory needs to be copied over to the Brill Server static content directory. There's Gradle 
task for copying the files over. In production, the Brill Server acts a a Web Server and serves the files in the static
content directory. 

## Licenses

The Brill Framework (Client, Middleware and Server) is distributed under the MIT license. See the LICENSE file.

The MIT license is a short simple permissive license with conditions only requiring preservation of copyright and 
license notices. Licensed works, modifications, and larger works may be distributed under different terms and without source code.

You may wish to mark any code modification you make with your own copyright and license details. For example:

```
// Original: © 2023 Brill Software Limited - Brill Framework, distributed under the MIT license.
// Modifications: © 2023 Trading Enterprises Inc. - Trader project, distributed under the Trader Enterprices Inc. license.
```

You don't need to identify the exact lines of code that were changed as these can be identified using Git and a differences tool.

It would be appreciated if you were able to make any generic fixes and changes under the MIT license, so that they could be 
included into future releases of the Brill Framework.

You can distribute any applications you develop under your own license or any license you choose.

The Brill CMS is distributed under the Brill Software Appplications license.


### Clone repository

### Merge develop into master

```
git checkout master
git merge develop
git push
```
### Tag master

```
git checkout master
git tag -a v0.1 -m "Version 0.1"
git push origin v0.1
```



