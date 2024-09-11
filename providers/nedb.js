const path = require('node:path')
const Datastore = require('nedb')

module.exports = ({ stores = [], folder = 'data' } = {}) => ({
  _stores: [],

  getCollection (name) {
    if (!stores.includes(name)) {
      throw new Error(`Collection ${name} does not exists.`)
    }

    if (!this._stores[name]) {
      const storePath = path.resolve(process.cwd(), folder)
      this._stores[name] = new Datastore({ filename: `${storePath}/${name}_${process.env.APP_ENV}.db`, autoload: true })
    }

    return this._stores[name]
  },

  /**
   * Insert document into collection
   * @param {string} collection
   * @param {object} data
   * @returns {Promise<*>}
   */
  insert (collection, data) {
    return new Promise((resolve, reject) => {
      data.createdAt = new Date()
      data.editedAt = new Date()

      this.getCollection(collection).insert(data, (err, result) => {
        if (err) {
          return reject(err)
        }

        return resolve(result)
      })
    })
  },

  /**
   * Update document into collection
   * @param {string} collection
   * @param {object} query
   * @param {object} data
   * @param {object} options
   * @returns {Promise<*>}
   */
  update (collection, query, data, options = {}) {
    return new Promise((resolve, reject) => {
      if (data.$set) {
        data.$set.editedAt = new Date()
      } else {
        data.editedAt = new Date()
      }

      this.getCollection(collection).update(query, data, options, (err, result) => {
        if (err) {
          return reject(err)
        }

        return resolve(result)
      })
    })
  },

  /**
   * Remove document from collection
   * @param {string} collection
   * @param {object} query
   * @param {object} options
   * @returns {Promise<*>}
   */
  remove (collection, query, options = {}) {
    return new Promise((resolve, reject) => {
      this.getCollection(collection).remove(query, options, (err, result) => {
        if (err) {
          return reject(err)
        }

        return resolve(result)
      })
    })
  },

  /**
   * Find one document from collection
   * @param {string} collection
   * @param {object} query
   * @returns {Promise<*>}
   */
  findOne (collection, query) {
    return new Promise((resolve, reject) => {
      this.getCollection(collection).findOne(query, (err, result) => {
        if (err) {
          return reject(err)
        }

        return resolve(result)
      })
    })
  },

  /**
   * Find document from collection
   * @param {string} collection
   * @param {object} query
   * @param {number} page
   * @param {number} limit
   * @param {object} sort
   * @returns {Promise<*>}
   */
  find (collection, query = {}, page = 1, limit = 100, sort = { editedAt: -1, createdAt: -1 }) {
    return new Promise((resolve, reject) => {
      this.getCollection(collection).find(query).skip((page - 1) * limit).limit(limit).sort(sort).exec((err, result) => {
        if (err) {
          return reject(err)
        }

        return resolve(result)
      })
    })
  },

  /**
   * Find document from collection
   * @param {string} collection
   * @param {object} query
   * @returns {Promise<*>}
   */
  count (collection, query = {}) {
    return new Promise((resolve, reject) => {
      this.getCollection(collection).count(query, (err, result) => {
        if (err) {
          return reject(err)
        }

        return resolve(result)
      })
    })
  },

  /**
   * Find document from collection
   * @param {string} collection
   * @param {object} query
   * @param {number} page
   * @param {number} limit
   * @param {object} sort
   * @returns {Promise<*>}
   */
  async paginated (collection, query = {}, page = 1, limit = 10, sort = { editedAt: -1, createdAt: -1 }) {
    return {
      data: await this.find(collection, query, page, limit, sort),
      pagination: {
        page,
        limit,
        total: await this.count(collection, query)
      }
    }
  }
})
