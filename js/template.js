const t = require('sdk/core/i18n/i18n.service').t;
const inherit = require('core/utils/utils').inherit;
const base = require('core/utils/utils').base;
const G3WObject = require('core/g3wobject');
const ComponentsRegistry = require('sdk/gui/componentsregistry');
const GUI = require('sdk/gui/gui');

// get other global directive
require('sdk/gui/vue/vue.directives');
const config = {
  client: {}
};
// get all items needed by application
const sidebar = require('./sidebar');
const floatbar = require('./floatbar');
const viewport = require('./viewport');
const navbaritems = require('./navbaritems');
const AppUI = require('./applicationui');
const layout = require('./layout');

// loading spinner at beginning
layout.loading(true);

const ApplicationTemplate = function(templateConfig, ApplicationService) {
  this.templateConfig = templateConfig;
  this.init = function() {
    // set general metods for the application as  GUI.showForm etc ..
    this._setupInterface();
    // setup layout
    this._setupLayout();
    //register all services fro the application
    this._setUpServices();
    this._createApp();
  };

  //Vue app
  this._createApp = function() {
    const self = this;
    this.emit('ready');
    const app = new Vue({
      el: '#app',
      mounted: function() {
        self._buildTemplate();
        $(document).localize();
        this.$nextTick(function(){
          self._setViewport(self.templateConfig.viewport);
          self.emit('ready');
          GUI.ready();
        });
      }
    });
  };

  this._setupLayout = function(){
    Vue.filter('t', function (value) {
      return t(value);
    });

    if (!isMobile.any) {
      $("<style type='text/css'> .ol-control-tl {" +
        "top: 7px;" +
        "left:43px;" +
      "}</style>").appendTo("head");
    }
    // Inizialization of the components of the application
    Vue.component('sidebar', sidebar.SidebarComponent);
    //Navbar custom items
    Vue.component('navbarleftitems', navbaritems.components.left);
    Vue.component('navbarrightitems', navbaritems.components.right);
    Vue.component('viewport', viewport.ViewportComponent);
    Vue.component('floatbar', floatbar.FloatbarComponent);
    Vue.component('app', AppUI);
  };

  // route setting att beginning (is an example)
  this._addRoutes = function() {
    const RouterService = ApplicationService.getRouterService();
    const mapService = GUI.getComponent('map').getService();
    RouterService.addRoute('map/zoomto/{coordinate}/:zoom:', function(coordinate, zoom) {
      coordinate = _.map(coordinate.split(','), function(xy) {
        return Number(xy)
      });
      zoom = zoom ? Number(zoom): null;
      if (coordinate.length) {
        mapService.on('ready', function() {
          this.zoomTo(coordinate, zoom);
        })
      }
    })
  };

  //register all services
  this._setUpServices = function() {
    _.forEach(ApplicationTemplate.Services, function(service, element) {
      ApplicationService.registerService(element, service);
    });
    _.forEach(GUI.getComponents(), function(component) {
      ApplicationService.registerService(component.id, component.getService());
    })
  };
  // build template function
  this._buildTemplate = function() {
    floatbar.FloatbarService.init(layout);
    // recupero i plceholders dalla configurazione del template
    const placeholdersConfig = this.templateConfig.placeholders;
    // ciclo su ogni placeholder
    Object.entries(placeholdersConfig).forEach(([placeholder, options]) => {
      this._addComponents(options.components, placeholder);
    });
    //register other compoents
    this._addOtherComponents();
  };

  //add component not related to placeholder
  this._addOtherComponents = function() {
    if (this.templateConfig.othercomponents) {
      this._addComponents(this.templateConfig.othercomponents);
    }
  };
  // viewport setting
  this._setViewport = function(viewportOptions) {
    // viewport components
    // es.: map e content
    /*

    components: {
      map: new MapComponent({
        id: 'map'
      }),
      content: new ContentsComponent({
        id: 'content',
      })
     }

     */
    if (viewportOptions) {
      ApplicationTemplate.Services.viewport.init(viewportOptions);
      this._addComponents(viewportOptions.components);
    }
  };
  // add component to template
  this._addComponent = function(component, placeholder) {
    this._addComponents([component], placeholder);
  };
  // registry component
  this._addComponents = function(components, placeholder) {
    let register = true;
    if (placeholder && ApplicationTemplate.PLACEHOLDERS.indexOf(placeholder) > -1) {
      const placeholderService = ApplicationTemplate.Services[placeholder];
      if (placeholderService) {
        register = placeholderService.addComponents(components);
      }
    }
    Object.entries(components).forEach(([key, component])=> {
      if (register) {
        ComponentsRegistry.registerComponent(component);
      }
    })
  };
  this._removeComponent = function(componentId) {
    ComponentsRegistry.unregisterComponent(componentId);
  };
  this._showModalOverlay = function(bool) {
    const mapService = GUI.getComponent('map').getService();
    if (bool) {
      mapService.startDrawGreyCover();
    } else {
      mapService.stopDrawGreyCover();
    }
  };
  this._showSidebar = function() {
    //TODO
  };
  this._hideSidebar = function() {
    //TODO
  };
  this._setupInterface = function() {
    /* PLUBLIC INTERFACE */
    /* Common methods */
    GUI.layout = layout;
    GUI.addComponent = _.bind(this._addComponent, this);
    GUI.removeComponent = _.bind(this._removeComponent, this);
    /* Metodos to define */
    GUI.getResourcesUrl = _.bind(function() {
      return ApplicationService.getConfig().resourcesurl;
    },this);
    //LIST
    GUI.showList = _.bind(floatbar.FloatbarService.showPanel, floatbar.FloatbarService);
    GUI.closeList = _.bind(floatbar.FloatbarService.closePanel, floatbar.FloatbarService);
    GUI.hideList = _.bind(floatbar.FloatbarService.hidePanel, floatbar.FloatbarService);
    // TABLE
    GUI.showTable = function() {};
    GUI.closeTable = function() {};
    GUI.showContentFactory = function(type) {
      let showPanelContent;
      switch (type) {
        case 'query':
          showPanelContent = GUI.showQueryResults;
          break;
        case 'form':
          showPanelContent = GUI.showForm;
          break;
      }
      return showPanelContent;
    };
    GUI.showForm = function(options) {
      const FormComponent = require('sdk').gui.vue.FormComponent;
      // new isnstace every time
      const formComponent = options.formComponent ? new options.formComponent(options) :  new FormComponent(options);
      //get service
      const formService = formComponent.getService();
      // parameters : [content, title, push, perc, split, closable]
      GUI.setContent({
        content: formComponent,
        push: !!options.push, //only one( if other delete previous component)
        showgoback: !!options.showgoback,
        closable: false
      });
      // return service
      return formService;
    };
    GUI.closeForm = function() {
      viewport.ViewportService.removeContent();
      // force set modal to false
      GUI.setModal(false);
    };

    // hide content
    GUI.hideContent = function(bool, perc) {
      return viewport.ViewportService.hideContent(bool, perc);
    };

    GUI.closeContent = function() {
      return viewport.ViewportService.closeContent();
    };

    // show results info/seach
    GUI.showQueryResults = function(title, results) {
      const queryResultsComponent = GUI.getComponent('queryresults');
      const queryResultService = queryResultsComponent.getService();
      queryResultService.reset();
      if (results) {
        queryResultService.setQueryResponse(results);
      }
      const contentsComponent = GUI.getComponent('contents');
      if (!contentsComponent.getContentData().length || (contentsComponent.getContentData().length == 1 && contentsComponent.getCurrentContentData().content.getId() == 'queryresults')) {
        GUI.showContextualContent(
          {
            content: queryResultsComponent,
            title: [t("info.title"), title].join(' ')
          }
        );
      } else {
        if (['queryresults', 'openattributetable'].find((element) => element == contentsComponent.getCurrentContentData().content.getId())) {
          contentsComponent.popContent();
        }
        GUI.pushContent({
          content: queryResultsComponent,
          backonclose: true,
          perc: 50,
          title: "Risultati " + title
        });
      }
      return queryResultService;
    };

    GUI.addNavbarItem = function(item) {
      navbaritems.NavbarItemsService.addItem(item)
    };

    GUI.removeNavBarItem = function() {};

    GUI.showPanel = _.bind(sidebar.SidebarService.showPanel, sidebar.SidebarService);
    GUI.closePanel = _.bind(sidebar.SidebarService.closePanel, sidebar.SidebarService);

    /* ------------------ */

    toastr.options.positionClass = 'toast-top-center';
    toastr.options.preventDuplicates = true;
    toastr.options.timeOut = 2000;

    /* --------------------- */
    // proxy  toastr library
    GUI.notify = toastr;
    // proxy  bootbox library
    GUI.dialog = bootbox;
    /* spinner */
    GUI.showSpinner = function(options){
      const container = options.container || 'body';
      const id = options.id || 'loadspinner';
      const where = options.where || 'prepend'; // append | prepend
      const style = options.style || '';
      const transparent = options.transparent ? 'background-color: transparent' : '';
      const center = options.center ? 'margin: auto' : '';
      if (!$("#"+id).length) {
        $(container)[where].call($(container),'<div id="'+id+'" class="spinner-wrapper '+style+'" style="'+transparent+'"><div class="spinner '+style+'" style="'+ center+'"></div></div>');
      }
    };
    //hide spinner
    GUI.hideSpinner = function(id){
      $("#"+id).remove();
    };
    /* end spinner*/
    /* end common methods */

    /*  */
    // FLOATBAR //
    GUI.showFloatbar = function() {
      floatbar.FloatbarService.open();
    };
    GUI.hideFloatbar = function() {
      floatbar.FloatbarService.close();
    };
    // SIDEBAR //
    GUI.showSidebar = _.bind(this._showSidebar, this);
    GUI.hideSidebar = _.bind(this._hideSidebar, this);
    // MODAL
    GUI.setModal = _.bind(this._showModalOverlay, this);

    // VIEWPORT //
    GUI.setPrimaryView = function(viewName) {
      viewport.ViewportService.setPrimaryView(viewName);
    };
    // only map
    GUI.showMap = function() {
      viewport.ViewportService.showMap();
    };

    GUI.showContextualMap = function(perc,split) {
      perc = perc || 30;
      viewport.ViewportService.showContextualMap({
        perc: perc,
        split: split
      })
    };
    GUI.setContextualMapComponent = function(mapComponent) {
      viewport.ViewportService.setContextualMapComponent(mapComponent);
    };
    GUI.resetContextualMapComponent = function() {
      viewport.ViewportService.resetContextualMapComponent();
    };
    //  (100%) content
    GUI.showContent = function(options) {
      options =  options || {};
      options.perc = options.perc || 100;
      GUI.setContent(options);
    };

    GUI.showContextualContent = function(options) {
      options =  options || {};
      options.perc = options.perc || 50;
      GUI.setContent(options)
    };
    // add component to stack (append)
    // Differeces between pushContent and setContent are :
    //  - push every componet is added, set is refreshed
    //  - pushContent has a new parameter (backonclose) when is cliccked x
    //  - the contentComponet is close all stack is closed
    GUI.pushContent = function(options) {
      options =  options || {};
      options.perc = options.perc || 100;
      options.push = true;
      GUI.setContent(options);
    };
    // add content to stack
    GUI.pushContextualContent = function(options) {
      options = options || {};
      options.perc = options.perc || 50;
      options.push = true;
      GUI.setContent(options);
    };
    // remove last content from stack
    GUI.popContent = function() {
      viewport.ViewportService.popContent()
    };
    //return number of component of stack
    GUI.getContentLength = function() {
      return viewport.ViewportService.contentLength();
    };
    GUI.setContent = function(options) {
      options = options || {};
      options.content = options.content || null;
      options.title = options.title || "";
      options.push = _.isBoolean(options.push) ? options.push : false;
      options.perc = options.perc || 50;
      options.split = options.split || 'h';
      options.backonclose = _.isBoolean(options.backonclose) ? options.backonclose : false;
      options.showtitle = _.isBoolean(options.showtitle) ? options.showtitle : true;
      viewport.ViewportService.showContent(options);
    };

    GUI.hideClientMenu = function() {
      ApplicationService.getConfig().user = null;
    };

    GUI.hideChangeMaps = function() {
      ApplicationService.getConfig().projects = [];
    };

    /* FINE VIEWPORT */
    /*  */
    /* END PUBLIC INTERFACE */
  };
  base(this);
};

inherit(ApplicationTemplate, G3WObject);

ApplicationTemplate.fail = function(bootstrap, errorMsg) {
  layout.loading(false);
  const background_image = require('../../images/error_backgroung.png');
  if (!layout.bootstrap) layout.bootstrap = bootstrap;
  layout.reload(errorMsg, background_image);
};

// Placeholder knowed by application
ApplicationTemplate.PLACEHOLDERS = [
  'navbar',
  'sidebar',
  'viewport',
  'floatbar'
];

// service know by the applications (standard)
ApplicationTemplate.Services = {
  navbar: null,
  sidebar: sidebar.SidebarService,
  viewport: viewport.ViewportService,
  floatbar: sidebar.FloatbarService
};

module.exports =  ApplicationTemplate;

