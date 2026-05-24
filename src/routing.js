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

  replace(path) {
    history.replaceState(null, '', path)
    this.#resolve()
  }

  start() {
    const path = window.location.pathname
    if (!this.#routes[path]) {
      this.replace('/login')
      return
    }
    this.#resolve()
  }

  getPath() {
    return window.location.pathname
  }

  #resolve() {
    const path = window.location.pathname
    const component = this.#routes[path] ?? this.#routes['/']
    this.#listeners.forEach((callback) => callback(component, path))
  }
}
