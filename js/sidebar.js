const t = require('sdk/core/i18n/i18n.service').t;
const inherit = require('sdk/core/utils/utils').inherit;
const Stack = require('./barstack.js');
const G3WObject = require('sdk/core/g3wobject');
const base = require('sdk/core/utils/utils').base;

const SIDEBAREVENTBUS = new Vue();

//sidebar item is a <li> dom element of the sidebar . Where is possible set
//title, icon type etc ..  is possible to customize component
const SidebarItem = Vue.extend({
  template: require('../html/sidebar-item.html'),
  data: function() {
    return {
        main: true,
        component: null,
        active: false,
        title: '',
        open: false,
        icon: null,
        state: null,
        iconColor: null,
        collapsible: null
      };
  },
  methods: {
    onClickItem: function() {
      const sidebarService = this.$options.service;
      // force to close
      if (!this.component.state.open) {
        // set state of opened component
        sidebarService.state.components.forEach((component) => {
          if (component !== this.component && (this.component.collapsible || !this.component.context)) {
            if (component.state.open) {
              !this.component.context ? $(component.getInternalComponent().$el).siblings('a').click() : null;
              component.setOpen(false);
            }
          }
        });
      }
      this.component.setOpen(!this.component.state.open);
      if (!this.component.collapsible && isMobile.any) {
        SIDEBAREVENTBUS.$emit('sidebaritemclick');
      }
    }
  }
});

function SidebarService() {
  //set sidebar stack
  this.stack = new Stack();
  // set setter for close sidebarpanel to catch event
  // of closing panel of the sidebar
  this.setters = {
    closeSidebarPanel: function() {},
    openCloseItem: function(bool) {}
  };
  //service state
  this.state = {
    components: [],
    gui: {
      title: ''
    }
  };
  //inizialize method
  this.init = function(layout) {
    this.layout = layout;
  };
  // add component to sidebar
  this.addComponents = function(components, options={}) {
    const {position} = options;
    //for each component of the sidebar it is call addComponent method
    components.forEach((component) => {
      this.addComponent(component, position);
    });
    return true;
  };
  // add each component to the sidebar
  // add also position insiede the sidebar
  this.addComponent = function(component, position) {
    if (isMobile.any && !component.mobile) {
      return false
    }
    const sidebarItem = new SidebarItem({
      service: this
    });
    sidebarItem.title = component.title || sidebarItem.title;
    sidebarItem.open = component.state.open;//(component.open === undefined) ? sidebarItem.open : component.open;
    sidebarItem.icon = component.icon || sidebarItem.icon;
    sidebarItem.iconColor = component.iconColor;
    sidebarItem.state = component.state || true;
    sidebarItem.collapsible = (typeof component.collapsible === 'boolean') ? component.collapsible : true;
    sidebarItem.context = (typeof component.context === 'boolean') ? component.context: true;
    sidebarItem.component = component;
    //append component to  g3w-sidebarcomponents (template sidebar.html)
    const itemcomponent = sidebarItem.$mount();
    if (position === null || position === undefined) {
      this.state.components.push(component);
      $('#g3w-sidebarcomponents').append(itemcomponent.$el);
    } else {
      this.state.components = this.state.components.splice(0,0,component);
      $('#g3w-sidebarcomponents').children().each(function(index, element) {
        if (position === index) {
          $(itemcomponent.$el).insertBefore(element);
        }
      });
    }
    //mount componet to g3w-sidebarcomponent-placeholder (template sidebar-item.html);
    component.mount("#g3w-sidebarcomponent-placeholder");
    // check if componentonent has iniService method
    if (_.has(component, 'initService')) {
      component.initService();
    }
    return true;
  };

  // get component by id
  this.getComponent = function(id) {
    let Component;
    for (const component of this.state.components) {
      if (component.getId() === id) {
        Component = component;
        break;
      }
    }
    return Component;
  };

  // get all components
  this.getComponents = function() {
    return this.state.components;
  };

  this.reloadComponent = function(id) {
    const component = this.getComponent(id);
    component.reload();
  };

  this.reloadComponents = function() {
    // force close of the panel
    this.closePanel();
    this.state.components.forEach((component) => {
      if (component.collapsible && component.state.open) {
        $(component.getInternalComponent().$el).siblings().click();
        component.setOpen(false);
      }
      component.reload();
    })
  };
  //remove component
  this.removeComponent = function(component) {
    this.state.components.forEach((sidebarComponent, index) => {
      if (component == sidebarComponent) {
        component.unmount();
        this.state.components.splice(index, 1);
        return false;
      }
    })
  };
  // show panel on stack
  this.showPanel = function(panel) {
    return new Promise((resolve, reject) => {
      this.state.gui.title = panel.title;
      const parent = "#g3w-sidebarpanel-placeholder";
      this.stack.push(panel, {
        parent: parent
      }).then((content) => {
        resolve(content)
      })
    })
  };

  // close panel
  this.closePanel = function() {
    this.closeSidebarPanel();
    this.stack.pop().then((content) => {
      content = null;
    })
  };

  base(this);
}

inherit(SidebarService, G3WObject);

const sidebarService = new SidebarService;

const SidebarComponent = Vue.extend({
    template: require('../html/sidebar.html'),
    data: function() {
    	return {
        components: sidebarService.state.components,
        panels: sidebarService.stack.state.contentsdata,
        bOpen: true,
        bPageMode: false,
        header: t('main navigation'),
        gui: sidebarService.state.gui
      }
    },
    computed: {
      // quanti pannelli sono attivi nello stack
      panelsinstack: function(){
        return this.panels.length > 0;
      },
      showmainpanel: function(){
        return this.components.length>0 && !this.panelsinstack;
      },
      componentname: function(){
        return this.components.length ? this.components.slice(-1)[0].getTitle(): "";
      },
      panelname: function(){
        let name = "";
        if (this.panels.length){
          name = this.panels.slice(-1)[0].content.getTitle();
        }
        return name;
      }
    },
    methods: {
      closePanel: function() {
        sidebarService.closePanel();
      }
    },
    created() {
      SIDEBAREVENTBUS.$on('sidebaritemclick', ()=> {
        $('.sidebar-toggle').click();
      })
    }
});

module.exports = {
  SidebarService: sidebarService,
  SidebarComponent: SidebarComponent
};
