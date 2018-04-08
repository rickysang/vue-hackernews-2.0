import fs from 'fs'
import { fetchIdsByType, fetchItem, fetchItems, fetchUser } from '../index'

const types = ['top', 'new', 'show', 'ask', 'job']
const idsByType = {}
const itemMap = {}
const userMap = {}
const pageSize = 25

const getIdsByType = t => fetchIdsByType(t).then(response => {
  const ids = response && response.length > 0 ? response.slice(0, pageSize) : []
  idsByType[t] = ids
  return ids
})

const getItemAndComments = idOrItem => {
  const itemPromise = typeof idOrItem === 'number' ? fetchItem(idOrItem) : Promise.resolve(idOrItem)
  return itemPromise.then(item => {
    if (item) {
      itemMap[item.id] = item
    }

    if (item && item.kids) {
      return fetchItems(item.kids).then(kids => Promise.all(kids.map(k => getItemAndComments(k))))
    }
  })
}

const getUser = id => fetchUser(id).then(user => {
  if (user) {
    userMap[user.id] = user
  }
  return user
})

const saveData = (name, data) => {
  return new Promise((resolve, reject) => {
    fs.writeFile(`./src/api/memory/${name}.json`, JSON.stringify(data, (key, value) => {
      return key === '__lastUpdated' ? undefined : value
    }), err => {
      if (err) {
        reject(err)
      }
      resolve()
    })
  })
}

Promise.all(
  types.map(t => getIdsByType(t))
).then(idsByTypes => {
  console.log('get item ids done')
  const ids = idsByTypes.reduce((acc, cur) => acc.concat(cur || []), [])
  return Promise.all(ids.map(id => getItemAndComments(id)))
}).then(() => {
  console.log('get items and comments done')
  return Object.values(itemMap)
}).then(items => {
  const users = items.map(({ by }) => by).filter(u => !!u);
  const uniqUsers = []
  for (let i = 0, len = users.length; i < len; i++) {
    const userId = users[i]
    if (uniqUsers.indexOf(userId) < 0) {
      uniqUsers.push(userId)
    }
  }
  return Promise.all(uniqUsers.map(id => getUser(id)))
}).then(() => {
  console.log('get users done')
  const result = {
    ids: idsByType,
    items: Object.values(itemMap),
    users: Object.values(userMap)
  }
  return Promise.all(Object.entries(result).map(([name, data]) => saveData(name, data)))
}).then(() => {
  console.log('save data done')
})