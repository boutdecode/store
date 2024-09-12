# Store tools by Bout de code

![https://boutdecode.fr](https://boutdecode.fr/img/logo.png)

[Bout de code](https://boutdecode.fr) - Développement de site internet et blog avec de vrais morceaux de codes, simples, élégants, utiles (parfois) et surtout sans fioriture.

## Installation

```shell
$ npm install @boutdecode/store
```

## Usage

```javascript
const { createApp, createServer } = require('@boutdecode/yion')
const { plugin, providers } = require('@boutdecode/store')

const app = createApp()
const server = createServer(app)

app.use(plugin({ dbname: 'data', provider: providers.sqlite() }))

let migrated = false
app.use(async ({ store }, next) => {
  if (migrated) {
    return next()
  }
  
  await store.run(`
    CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL
   )`)

  migrated = true

  next()
})

app.get('/items', async ({ req, res, store }) => {
  const item = await store.findOne('items', { id: 1 })
  
  res.json(item)
})

server.listen(8080)
```

## Tests

```shell
$ npm run test
```
