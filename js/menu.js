const t = require('core/i18n/i18n.service').t;
const inherit = require('core/utils/utils').inherit;
const base = require('core/utils/utils').base;
const merge = require('core/utils/utils').merge;
const Component = require('gui/vue/component');
const GUI = require('gui/gui');
const ProjectsRegistry = require('core/project/projectsregistry');

const InternalComponent = Vue.extend({
  template: require('../html/menu.html'),
  data: function() {
    return {
      state: null,
      loading: false
    }

  },
  methods: {
    trigger: function(item) {
      if (item.cbk) {
        //set full screen modal
        GUI.showFullModal({
          show: true
        });
        GUI.setLoadingContent(true);
        item.cbk.apply(item)
          .then((promise) => {
            //changeProject is a setter so it return a promise
            promise
              .then(()=>{})
              .fail(() => {
                GUI.notify.error("<h4>" + t("error_map_loading") + "</h4>" +
                  "<h5>"+ t("check_internet_connection_or_server_admin") + "</h5>");
              })
              .always(() => {
                GUI.showFullModal({
                  show: false
                });
                GUI.setLoadingContent(false);
              })
          })
      }
      else if (item.href) window.open(item.href, '_blank');
      else if (item.route) GUI.goto(item.route);
      else console.log("No action for "+item.title);
    },
    logoSrc: function(src) {
      const fakeImage = '/static/client/images/FakeProjectThumb.png';
      if (src) {
        return src.indexOf(ProjectsRegistry.config.mediaurl) !== -1 ? src : (src.indexOf('static') === -1 && src.indexOf('media') === -1) ?
          `${ProjectsRegistry.config.mediaurl}${src}`: fakeImage;
      } else return fakeImage;
    }
  },
  mounted(){}
});

function MenuComponent(options={}){
  base(this,options);
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

const proto = MenuComponent.prototype;

proto.trigger = function(item) {};

module.exports = MenuComponent;

