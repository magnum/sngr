export class Router {
  #routes = {}
  #listeners = []

  constructor(routes) {
    this.#routes = routes
    window.addEventListener('popstate', () => this.#resolve())
  }

  onChange(callback) {
    this.#listeners.push(callback)
    return () => {
      this.#listeners = this.#listeners.filter((listener) => listener !== callback)
    }
  }

  navigate(path) {
    history.pushState(null, '', path)
    this.#resolve()
  }

  start() {
    if (window.location.pathname !== '/' && !this.#routes[window.location.pathname]) {
      this.navigate('/')
      return
    }
    this.#resolve()
  }

  #resolve() {
    const path = window.location.pathname
    const component = this.#routes[path] ?? this.#routes['/']
    this.#listeners.forEach((callback) => callback(component, path))
  }
}
