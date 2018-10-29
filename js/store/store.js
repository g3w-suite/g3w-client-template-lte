const store = {
  state: {
    viewport: {
      map: {
        open: true,
        sizes: {
          width:0,
          height:0
        }
      },
      constent: {
        open: false,
        sizes: {
          width:0,
          height:0
        }
      }
    },
    sidebar: {
      items: {}
    },
    error: null
  },
  mutations: {
    addSidebarItem(state, {name, item}) {
      state.sidebar[name] = item;
    },
  },
  actions: {},
  getters: {
    openContent: state => {
      return state.viewport.content.open
    },
    error: state => state.error
  }
};


export default store;

