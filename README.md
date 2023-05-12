# Brill Client

---

The Brill Client is part of the Brill Framework. The Brill Client is a React application 
written using TypeScript, that runs on the Web Browser. The Brill Client communicates with
the Brill Server using the Brill Middleware.

## Development

A NodeJS server is used for development purposes. This runs on port 3000 and connects to a
development Brill Server running on port 8080. The port numbers can be changed in the config files.

### Starting the Dev Server

- Get the node_modules directories setup:
```
yarn
```

- Start the Brill Server.

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

## Licenses

The Brill Framework (Client, Middleware and Server) is distributed under the MIT license. The Brill Framework modules are marked with
the following copyright notice:

```
// © 2023 Brill Software Limited - Brill Framework, distributed under the MIT license.
```

The MIT license is a short simple permissive license with conditions only requiring preservation of copyright and 
license notices. Licensed works, modifications, and larger works may be distributed under different terms and without source code.

You may wish to mark any code modification you make with your own copyright notice. For example:

```
// Original: © 2023 Brill Software Limited - Brill Framework, distributed under the MIT license.
// Modifications: © 2023 Trading Enterprises Inc. - Trader project, distributed under the Trader Enterprises Inc. license.
```

You don't need to identify the exact lines of code that were changed, as these can be identified using Git and a differences tool.

It would be appreciated if you were able to make any generic fixes and changes under the MIT license, so that they could be 
included into future releases of the Brill Framework.

You can distribute any web applications and components you develop under your own license.

The Brill CMS is distributed under the Brill Software Apps license. Brill CMS components have the following copyright notice:

```
// © 2023 Brill Software Limited - Brill CMS, distributed under the Brill Software Apps license.
```

## Documentation

[Brill Software Website](https://www.brill.software "Brill Software")

[Brill Software Developer Guide](https://www.brill.software/brill_software/developers_guide "Developers Guide")

[Brill Software Middleware](https://brill.software/brill_software/middleware "Brill Middleware")
