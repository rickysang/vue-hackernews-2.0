import ids from './ids.json'
import items from './items.json'
import users from './users.json'

function delayResponse(data, delay = 500) {
  return new Promise(resolve => {
    setTimeout(() => resolve(data), delay)
  })
}

export function fetchIdsByType (type) {
  return delayResponse(ids[type])
}

export function fetchItem (id) {
  return delayResponse(items.find(i => i.id === id))
}

export function fetchItems (ids) {
  return delayResponse(items.filter(({ id }) => ids.indexOf(id) >= 0))
}

export function fetchUser (id) {
  return delayResponse(users.find(u => u.id === id))
}

export function watchList (type, cb) {
  const timerId = setInterval(() => {
    const list = [].concat(ids[type])
    const length = list.length
    const index1 = Math.floor(Math.random() * length)
    const index2 = Math.floor(Math.random() * length)
    const temp = list[index1]
    list[index1] = list[index2]
    list[index2] = temp

    cb(list)
  }, 5000)
  return () => {
    clearInterval(timerId)
  }
}
