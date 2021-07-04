import axios from 'axios'

axios.defaults.baseURL = 'https://asia-northeast1-oogiri-bot.cloudfunctions.net/api'

export { axios as api }
