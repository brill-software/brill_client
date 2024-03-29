# Brill Client

***

The Brill Client is part of the Brill Framework. The Brill Client is a React application
written in TypeScript and runs in the Web Browser. The Brill Client communicates with
the Brill Server using [Brill Middleware](https://www.brill.software/brill_software/middleware "Brill Middleware").

## Git Repository

The master copy of the Brill Client project is kept at

* Bitbucket (git@bitbucket.org:brill-software/brill\_client.git)

The project is also available from:

* Sourceforce (git://git.code.sf.net/p/brill-software/brill\_client)
* GitLab (git@gitlab.com:brill-software/brill\_client.git)
* GitHub (git@github.com:brill-software/brill\_client.git)

To make changes, you either need permission to write to the Bitbucket repository or create a fork repository.
You can create a fork repository on Bitbucket, Sourceforge, GitLab, GitHub or on your own Git Server.

## Development

A NodeJS server is used for development purposes. This runs on port 3000 and connects to a
development Brill Server running on port 8080. The port numbers can be changed in the config files.

### Starting the Dev Server

* Get the node\_modules directories setup:

```
yarn
```

* Start the Brill Server on port 8080.
* Start the NodeJS development web server on port 3000 :

```
yarn start
```

* Use a web browser to access http://localhost:3000

## Production build

To build:

```
yarn build
```

The build takes a while and the resulting build can be found in the Brill Client **/build** directory. Before building the Brill Server,
the contents of the Brill Client **/build** directory need to be copied over to the Brill Server static content directory. There's a Gradle
task for copying the files over. In production, the Brill Server acts a a Web Server and serves the files that are in the static
content directory.

See the [Developers Guide](https://www.brill.software/brill_software/developers_guide "Developers Guide") for more information.

## Licensing

See the LICENSE file in the root directory and the [Brill Software Website](https://www.brill.software "Brill Software") for more details.

## Adding new components

For the Brill CMS to be able to access a React component, it must reside in a sub-directory under the `src/lib/ComponentLibraries/` directory. To add your own components, create a fork of the repository and create a new directory under the `src/lib/ComponentLibraries/`.