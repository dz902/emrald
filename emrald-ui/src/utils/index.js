async function get(path) {
  return fetch(`http://localhost:5000${path}`, {
    cors: 'no-cors',
    headers: {
      "Content-Type": "application/json"
    }
  })
}

function findKv(kk, kv, vv, arr) {
  const item = arr.find(a => a[kk] == kv)
  
  return item ? item[vv] : null
}

function secondsToHms(dt) {
  dt = Number.parseFloat(dt);

  const day = (dt / (3600 * 24)).toFixed(1)
  const hours = (dt / 3600).toFixed(1)
  const minutes = (dt / 60).toFixed(1)
  const seconds = Math.round(dt)

  return { day, hours, minutes, seconds }
}

export {
  get, secondsToHms, findKv
}