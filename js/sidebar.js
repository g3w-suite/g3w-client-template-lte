var t = require('sdk/core/i18n/i18n.service').t;
var inherit = require('sdk/core/utils/utils').inherit;
var Stack = require('./barstack.js');
var G3WObject = require('sdk/core/g3wobject');
var base = require('sdk/core/utils/utils').base;

//sidebar item che non è altro che un li della sidebar dove sarà possibile impostare
//titolo tipo di icona etc .. customizzata per ogni componente
var SidebarItem = Vue.extend({
  template: require('../html/sidebar-item.html'),
  data: function() {
    return {
        main: true,
        component: null,
        active: false,
        title: 'component',
        open: false,
        icon: null,
        state: null
      };
  },
  methods: {
    onClickItem: function() {
      var self = this;
      var sidebarService = this.$options.service;
      this.component.setOpen(!this.component.state.open);
      // setto lo stato del componente open
      _.forEach(sidebarService.state.components, function (component) {
        if (component != self.component && self.component.collapsible) {
          component.setOpen(false);
        }
      })
    }
  }
});

// service sidebar
function SidebarService() {
  //stack della sidebar
  this.stack = new Stack();
  // metto i setter close sidebarpanel per catturare l'evento
  // della chiusura del pannello sulla sidebar
  this.setters = {
    closeSidebarPanel: function()  {
      //hook function
    },
    openCloseItem: function(bool) {
    }
  };
  //stato del servizio
  this.state = {
    components: []
  };
  //inizializzazione del servizio (non sembra chaimato mai)
  this.init = function(layout) {
    this.layout = layout;
  };
  // funzione che serve ad aggiungere componeti alla sidebar
  this.addComponents = function(components){
    var self = this;
    // per ogni componente (istanza) appartenete alla sidebar viene chiamato il metodo
    // addComponent
    _.forEach(components,function(component){
      self.addComponent(component);
    });
    // rtorno true alla fine dell'aggiunta dei componenti perchè mi serve
    // al template durante il buoldtemplate di dire se è stato regitstrato (true) o meno
    return true;
  };
  // funzione che aggiunge il singolo componente sulla sidebar
  // aggiungo anche possibilità di insicare la positione nella sidebar
  this.addComponent = function(component, position) {
    //faccio montare il sidebar-item che contiene al suo interno il placeholder del componente vero e proprio
    //in questo modo il componente non si dovrà occupare di costruire anche l'elemento li della sidebar
    //ma conterrà solo il contenuto
    var sidebarItem = new SidebarItem({
      service: this
    });
    //setto le parti della sidebar-item che cambiano da componente a componente (da rivedere)
    sidebarItem.title = component.title || sidebarItem.title;
    sidebarItem.open = component.state.open;//(component.open === undefined) ? sidebarItem.open : component.open;
    sidebarItem.icon = component.icon || sidebarItem.icon;
    sidebarItem.state = component.state || true;
    sidebarItem.collapsible = component.collapsible || true;
    sidebarItem.component = component;
    //lo appendo al g3w-sidebarcomponents (template sidebar.html)
    var itemcomponent = sidebarItem.$mount();
    if (_.isNil(position)) {
      this.state.components.push(component);
      $('#g3w-sidebarcomponents').append(itemcomponent.$el);
    } else {
      this.state.components = this.state.components.splice(0,0,component);
      $('#g3w-sidebarcomponents').children().each(function(index, element) {
        if (position == index) {
          $(itemcomponent.$el).insertBefore(element);
        }
      });
    }
    //monto il componete nella g3w-sidebarcomponent-placeholder (template sidebar-item.html);
    component.mount("#g3w-sidebarcomponent-placeholder");
    // verifico che il componete abbia l'iniService come metodo
    if (_.has(component, 'initService')) {
      //se si lo chiamo inizializzazione del servizo
      component.initService();
    }
    return true;
  };

  // restituisce il component in base all'id
  this.getComponent = function(id) {
    var Component;
    _.forEach(this.state.components, function(component) {
      if (component.getId() == id) {
        Component = component;
        return false;
      }
    });
    return Component;
  };

  // restiuisce tutti i componenti
  this.getComponents = function() {
    return this.state.components;
  };

  this.reloadComponent = function(id) {
    var component = this.getComponent(id);
    component.reload();
  };

  this.reloadComponents = function() {
    _.forEach(this.state.components, function(component) {
      if (component.collapsible && component.state.open) {
        $(component.getInternalComponent().$el).siblings().click();
        component.setOpen(false);
      }
      component.reload();
    })
  };
  //rimuove il component
  this.removeComponent = function(component) {
    var self = this;
    _.forEach(this.state.components, function(sidebarComponent, index) {
      if (component == sidebarComponent) {
        component.unmount();
        self.state.components.splice(index, 1);
        return false;
      }
    })
  };
  // visualizzazione pannello sullo stack
  this.showPanel = function(panel) {
    var parent = "#g3w-sidebarpanel-placeholder";
    // utilizzo il metodo push dello stack per montare il panel sul sidebar
    this.stack.push(panel, {
      parent: parent
    });
  };
  // chiusura pannello
  this.closePanel = function() {
    this.closeSidebarPanel();
    var panel = this.stack.pop();
  };

  base(this);
}

// eredito da G3Wobject così posso agire su onafter etc ..
inherit(SidebarService, G3WObject);

var sidebarService = new SidebarService;

var SidebarComponent = Vue.extend({
    template: require('../html/sidebar.html'),
    data: function() {
    	return {
        components: sidebarService.state.components,
        panels: sidebarService.stack.state.contentsdata,
        bOpen: true,
    		bPageMode: false,
    		header: t('main navigation')
        };
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
        var name = "";
        if (this.components.length){
          name = this.components.slice(-1)[0].getTitle();
        }
        return name;
      },
      panelname: function(){
        var name = "";
        if (this.panels.length){
          name = this.panels.slice(-1)[0].content.getTitle();
        }
        return name;
      }
    },
    methods: {
      closePanel: function(){
        sidebarService.closePanel();
      },
      isMobile: function(){
        return isMobile.any
      }
    }
});

module.exports = {
  SidebarService: sidebarService,
  SidebarComponent: SidebarComponent
};
