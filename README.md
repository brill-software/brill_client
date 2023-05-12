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

## Documentation

[Brill Software Website](https://www.brill.software "Brill Software")

[Brill Software Developer Guide](https://www.brill.software/brill_software/developers_guide "Developers Guide")

[Brill Software Middleware](https://brill.software/brill_software/middleware "Brill Middleware")
