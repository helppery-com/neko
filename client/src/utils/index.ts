export function makeid(length: number) {
  let result = ''
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const charactersLength = characters.length
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength))
  }
  return result
}

export function random(max, min) {
  min = min === undefined ? 0: min
  return Math.floor(Math.random() * max) + min
}

const userPalette = ["ff9f1c","e086d3","8332ac","cbf3f0","2ec4b6","dd614a","ffc15e","e4b7e5","18314f","73a580"]
export function rndColor() {
  return userPalette[random(userPalette.length)]
}