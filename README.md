# cloudapi-gql

[![License: MPL 2.0](https://img.shields.io/badge/License-MPL%202.0-brightgreen.svg)](https://opensource.org/licenses/MPL-2.0)

[![Build Status](https://secure.travis-ci.org/joyent/cloudapi-gql.svg)](http://travis-ci.org/joyent/cloudapi-gql)


hapi plugin that exposes [CloudApi](https://apidocs.joyent.com/cloudapi/) through
[GraphQL](http://graphql.org).

## Table of Contents

* [Install](#install)
* [Options](#options)
* [Usage](#usage)

## Install

```
npm install cloudapi-gql
```

## Options

- `authStrategy`: name of the hapi auth strategy to use for `/graphql` route
- `keyPath` private key file path for the key associated with Triton account
- `keyId`: string in the form of `/${SDC_ACCOUNT}/keys/${SDC_KEY_ID}`
- `apiBaseUrl`: cloud API base URL to connect to


## Usage

```js
const server = new Hapi.Server();
await server.register({ plugin: CloudApiGQL, options: { authStrategy, keyPath, keyId, apiBaseUrl } });
```


### Local development

```
npm run dev
```

* [GraphiQL](http://0.0.0.0:4000/graphiql)
* [Graphidoc](http://0.0.0.0:4000/doc)
* [Voyager](http://0.0.0.0:4000/voyager)
* [Playground](http://0.0.0.0:4000/playground)

![](https://cldup.com/StGgfIbD3N.png) ![](https://cldup.com/fhpul_AJ13.png)
![](https://cldup.com/A-VwSbvWBe.png) ![](https://cldup.com/08P360Skhx.png)

```
npm run faker
```

* [GraphQL Faker Interactive Editor](http://0.0.0.0:9002/editor)
* [GraphQL Faker API](http://0.0.0.0:9002/graphql)

![](https://cldup.com/VWadVMorQ0.png)

