const store = {
  state: {
    viewport: {
      primary: {},
      secondary: {}
    },
    sidebar: {
      items: {}
    }
  },
  mutations: {
    addSidebarItem(state, {name, item}) {
      state.sidebar[name] = item;
    }
  },
  actions: {},
  getters: {},
};


export default store;

