module.exports = ({ dbname, provider = null, folder = 'data' } = {}) => {
  if (!provider) {
    throw new Error('No provider specified')
  }

  const store = provider({ dbname, folder })
  return (context, next) => {
    context.set('store', store)

    next()
  }
}
