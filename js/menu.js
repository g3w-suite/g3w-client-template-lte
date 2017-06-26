var t = require('core/i18n/i18n.service').t;
var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var merge = require('core/utils/utils').merge;
var Component = require('gui/vue/component');
var GUI = require('gui/gui');
var ProjectsRegistry = require('core/project/projectsregistry');

var InternalComponent = Vue.extend({
  template: require('../html/menu.html'),
  data: function() {
    return {
      state: null,
      loading: false
    }

  },
  methods: {
    trigger: function(item) {
      var self = this;
      if (item.cbk) {
        //setto il modale a schermo intero
        $('#full-screen-modal').modal('show');
        this.loading = true;
        item.cbk.apply(item)
          .then(function(){
            self.loading = false;
            // tyolgo il modale a schermo intero
            $('#full-screen-modal').modal('hide');
          })
          .fail(function() {
            GUI.notify.error("<h4>Errore di caricamento della nuova mappa.</h4>" +
              "<h5>Controllare la connessione internet o contattare l'amministratore</h5>");
            $('#full-screen-modal').modal('hide');
            self.loading = false;
          })
      }
      else if (item.href) {
        window.open(item.href, '_blank');
      }
      else if (item.route) {
        GUI.goto(item.route);
      }
      else {
        console.log("Nessuna azione per "+item.title);
      }
    },
    logoSrc: function(src) {
      if (src.indexOf('./') > -1) {
        return ProjectsRegistry.config.mediaurl + src;
      } else {
        return src;
      }
    }
  },
  mounted: function() {
    Vue.nextTick(function () {
      $("#menu-projects.nano").nanoScroller();
    })
  }
});

function MenuComponent(options){
  options = options || {};
  base(this,options);
  //this.id = "menu_"+Date.now();
  this.title = options.title || "menu";
  this.state.visible = true;
  this.state.menuitems = options.menuitems;
  merge(this, options);
  this.internalComponent = new InternalComponent({
    service: this
  });
  this.internalComponent.state = this.state;
}
inherit(MenuComponent, Component);

var proto = MenuComponent.prototype;

proto.trigger = function(item) {

};

module.exports = MenuComponent;

