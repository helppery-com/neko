// accessor
import { accessor as neko } from './store'
// Plugins
import Logger from './plugins/log'
import Client from './plugins/neko'
import Axios from './plugins/axios'
import Swal from './plugins/swal'
import Anime from './plugins/anime'

// Components
import Connect from '~/components/connect.vue'
import Video from '~/components/video.vue'
import Menu from '~/components/menu.vue'
import Side from '~/components/side.vue'
import Controls from '~/components/controls.vue'
import Members from '~/components/members.vue'
import Emotes from '~/components/emotes.vue'
import About from '~/components/about.vue'
import Header from '~/components/header.vue'

const exportMixin = {
  computed: {
    $accessor() {
      return neko
    },
    $client () {
      return window.$client
    }
  },
}

function extend (component: any) {
  return component
    .use(Logger)
    .use(Axios)
    .use(Swal)
    .use(Anime)
    .use(Client)
    .extend(exportMixin)
}


export const components = {
  'neko-connect': extend(Connect),
  'neko-video': extend(Video),
  'neko-menu': extend(Menu),
  'neko-side': extend(Side),
  'neko-controls': extend(Controls),
  'neko-members': extend(Members),
  'neko-emotes': extend(Emotes),
  'neko-about': extend(About),
  'neko-header': extend(Header),
}

neko.initialise()
export default neko