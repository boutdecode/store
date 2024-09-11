const { randomUUID } = require('crypto')
const { resolve } = require('node:path')
const { Database } = require('sqlite3')

module.exports = ({ dbname, folder = 'data' } = {}) => {
  const storePath = resolve(process.cwd(), folder)
  const db = new Database(`${storePath}/${dbname}_${process.env.APP_ENV}.db`, (err) => {
    if (err) {
      throw err
    }

    // eslint-disable-next-line no-console
    console.log(`💾 Database "${dbname}" connected.`)
  })

  return {
    db,

    run (sql, params = []) {
      return new Promise((resolve, reject) => {
        this.db.run(sql, params, function (err, result) {
          if (err) {
            return reject(err)
          }

          return resolve(result)
        })
      })
    },

    /**
     * Insert document into collection
     * @param {string} table
     * @param {object} data
     * @returns {Promise<*>}
     */
    insert (table, data) {
      return new Promise((resolve, reject) => {
        data.id = randomUUID()
        data.createdAt = new Date()
        data.updatedAt = new Date()

        const sql = `
          INSERT INTO ${table} (${Object.keys(data).join(', ')})
          VALUES (${Object.keys(data).map(() => '?').join(', ')})
        `

        this.db.run(sql, Object.values(data).map(this.normalizeValue), (err) => {
          if (err) {
            return reject(err)
          }

          return resolve(data)
        })
      })
    },

    /**
     * Update document into collection
     * @param {string} table
     * @param {object} query
     * @param {object} data
     * @returns {Promise<*>}
     */
    update (table, query, data) {
      data.updatedAt = new Date()

      const sql = `
        UPDATE ${table}
        SET ${Object.keys(data).map(key => `${key} = ?`).join(', ')}
        WHERE ${Object.keys(query).map(key => `${key} = ?`).join(' AND ')}
      `

      return new Promise((resolve, reject) => {
        this.db.run(sql, [
          ...Object.values(data).map(this.normalizeValue),
          ...Object.values(query)
        ], (err) => {
          if (err) {
            return reject(err)
          }

          return resolve()
        })
      })
    },

    /**
     * Remove document from collection
     * @param {string} table
     * @param {object} query
     * @returns {Promise<*>}
     */
    remove (table, query) {
      const sql = `
        DELETE FROM ${table} WHERE ${Object.keys(query).map(key => `${key} = ?`).join(' AND ')}
      `

      return new Promise((resolve, reject) => {
        this.db.run(sql, Object.values(query), (err) => {
          if (err) {
            return reject(err)
          }

          return resolve()
        })
      })
    },

    /**
     * Find one document from collection
     * @param {string} table
     * @param {object} query
     * @returns {Promise<*>}
     */
    findOne (table, query) {
      const sql = `
        SELECT * FROM ${table}
        WHERE ${Object.keys(query).map(key => `${key} = ?`).join(' AND ')}
      `

      return new Promise((resolve, reject) => {
        this.db.get(sql, Object.values(query), (err, row) => {
          if (err) {
            return reject(err)
          }

          Object.keys(row || {}).forEach(key => {
            row[key] = this.denormalizeValue(row[key])
          })

          return resolve(row)
        })
      })
    },

    /**
     * Find document from collection
     * @param {string} table
     * @param {object} query
     * @param {number} page
     * @param {number} limit
     * @param {object} sort
     * @param {object} options
     * @returns {Promise<*>}
     */
    find (
      table,
      query = {},
      page = 1,
      limit = 100,
      sort = { updatedAt: 'DESC', createdAt: 'DESC' },
      options = { operator: '=', logic: 'AND' }
    ) {
      const sql = `
        SELECT * FROM ${table}
        ${Object.keys(query).length ? 'WHERE' : ''} ${Object.keys(query).map(key => `${key} ${options.operator} ?`).join(` ${options.logic} `)}
        ORDER BY ${Object.keys(sort).map(key => `${key} ${sort[key]}`).join(', ')}
        LIMIT ${limit} OFFSET ${(page - 1) * limit}
      `

      return new Promise((resolve, reject) => {
        this.db.all(sql, Object.values(query), (err, rows) => {
          if (err) {
            return reject(err)
          }

          return resolve(rows.map(row => {
            Object.keys(row).forEach(key => {
              row[key] = this.denormalizeValue(row[key])
            })

            return row
          }))
        })
      })
    },

    /**
     * Find document from collection
     * @param {string} table
     * @param {object} query
     * @param {object} options
     * @returns {Promise<*>}
     */
    count (table, query = {}, options = { operator: '=', logic: 'AND' }) {
      const sql = `
        SELECT COUNT(*) AS count FROM ${table}
        ${Object.keys(query).length ? 'WHERE' : ''} ${Object.keys(query).map(key => `${key} ${options.operator} ?`).join(` ${options.logic} `)}
      `

      return new Promise((resolve, reject) => {
        this.db.get(sql, Object.values(query), (err, { count }) => {
          if (err) {
            return reject(err)
          }

          return resolve(count)
        })
      })
    },

    /**
     * Find document from collection
     * @param {string} table
     * @param {object} query
     * @param {number} page
     * @param {number} limit
     * @param {object} sort
     * @param {object} options
     * @returns {Promise<*>}
     */
    async paginated (
      table,
      query = {},
      page = 1,
      limit = 10,
      sort = { updatedAt: 'DESC', createdAt: 'DESC' },
      options = { operator: '=', logic: 'AND' }
    ) {
      return {
        data: await this.find(table, query, page, limit, sort, options),
        pagination: {
          page,
          limit,
          total: await this.count(table, query, options)
        }
      }
    },

    close () {
      return new Promise((resolve, reject) => {
        this.db.close((err) => {
          if (err) {
            return reject(err)
          }

          return resolve()
        })
      })
    },

    normalizeValue (value) {
      if (value instanceof Date) {
        return value.toISOString()
      }

      if (typeof value === 'object') {
        return JSON.stringify(value)
      }

      if (value === undefined) {
        return null
      }

      return value
    },

    denormalizeValue (value) {
      if (value === null) {
        return null
      }

      if (String(value).match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/)) {
        return new Date(value)
      }

      try {
        return JSON.parse(value)
      } catch (error) {
        return value
      }
    }
  }
}
