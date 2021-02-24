

class Api {
  constructor () {
    const search = window.location.search.substring(1)
    search.split('&').forEach(e => {
      const kv = e.split("=")
      const key = kv[0].toUpperCase()
      let val = kv[1]
      try {
        val = JSON.parse(val)
      } catch{}
      // @ts-ignore
      this[key] = val
    })
  }

  get settings () {
    return this
  }
}

export const api = new Api();
