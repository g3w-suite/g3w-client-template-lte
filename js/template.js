const t = require('sdk/core/i18n/i18n.service').t;
const inherit = require('sdk/core/utils/utils').inherit;
const base = require('sdk/core/utils/utils').base;
const G3WObject = require('sdk/core/g3wobject');
const ComponentsRegistry = require('sdk/gui/componentsregistry');
const GUI = require('sdk/gui/gui');
const VueTemplatePlugin = require('./vuetemplateplugin');

// install template information library (es. classes etc..)
Vue.use(VueTemplatePlugin, {
  font:{
    name: 'fontawsome',
    version: '5'
  }
});

// set mixins inheriAttrs to avoid tha unused props are setted as attrs
Vue.mixin({
  inheritAttrs: false
});

// get all items needed by application
const sidebar = require('./sidebar');
const floatbar = require('./floatbar');
const viewport = require('./viewport');
const navbaritems = require('./navbaritems');
const AppUI = require('./applicationui');
const layout = require('./layout');

// loading spinner at beginning
layout.loading(true);

const ApplicationTemplate = function({ApplicationService}) {
  const appLayoutConfig = ApplicationService.getConfig().layout || {};
  // useful to build a difference layout/compoìnent based on mobile or not
  this._isMobile = isMobile.any;
  this.init = function() {
    // create Vue App
    this._createApp();
  };
  // create application config
  this._createTemplateConfig = function() {
    const G3WTemplate = Vue.prototype.g3wtemplate;
    const appTitle = ApplicationService.getConfig().apptitle || 'G3W Suite';
    // get sdk componets
    const ContentsComponent = require('./contentsviewer');
    const CatalogComponent = require('sdk/gui/catalog/vue/catalog');
    const SearchComponent = require('sdk/gui/search/vue/search');
    const PrintComponent = require('sdk/gui/print/vue/print');
    const MetadataComponent = require('sdk/gui/metadata/vue/metadata');
    const ToolsComponent = require('sdk/gui/tools/vue/tools');
    const MapComponent = require('sdk/gui/map/vue/map');
    const QueryResultsComponent = require('sdk/gui/queryresults/vue/queryresults');
    return {
      title: appTitle,
      placeholders: {
        navbar: {
          components: []
        },
        sidebar: {
          components: [
            new MetadataComponent({
              id: 'metadata',
              open: false,
              collapsible: false,
              context: false,
              icon: G3WTemplate.getFontClass('file'),
              mobile: true
            }),
            new PrintComponent({
              id: 'print',
              open: false,
              collapsible: true, //  it used to manage click event if can run setOpen component method
              icon: G3WTemplate.getFontClass('print'),
              mobile: false
            }),
            new SearchComponent({
              id: 'search',
              open: false,
              collapsible: true,
              icon: G3WTemplate.getFontClass('search'),
              mobile: true
            }),
            // Component that store plugins
            new ToolsComponent({
              id: 'tools',
              open: false,
              collapsible: true,
              icon: G3WTemplate.getFontClass('tools'),
              mobile: false
            }),
            new CatalogComponent({
              id: 'catalog',
              open: false,
              collapsible: false,
              icon: G3WTemplate.getFontClass('map'),
              mobile: true,
              config: {
                legend: appLayoutConfig.legend
              }
            }),
          ]
        },
        floatbar:{
          components: []
        }
      },
      othercomponents: [
        new QueryResultsComponent({
          id: 'queryresults'
        })
      ],
      viewport: {
        // placeholder of the content (view content). Secodary view (hidden)
        components: {
          map: new MapComponent({
            id: 'map'
          }),
          content: new ContentsComponent({
            id: 'contents'
          })
        }
      }
    }
  };

  //Vue app
  this._createApp = function() {
    const store = ApplicationService.getStore();
    const self = this;
    if (isMobile.any) {
      $('body').addClass('sidebar-collapse');
    }
    return new Vue({
      el: '#app',
      store,
      created() {
        // set general metods for the application as  GUI.showForm etc ..
        self._setupInterface();
        // setup layout
        self._setupLayout();
        //register all services fro the application
        self._setUpServices();
        // create templateConfig
        self.templateConfig = self._createTemplateConfig();
      },
      mounted: function() {
        this.$nextTick(function() {
          self._buildTemplate();
          // setup Font, Css class methods
          self._setUpTemplateDependencies(this);
          $(document).localize();
          self._setViewport(self.templateConfig.viewport);
          self.emit('ready');
          //getSkinColor
          const skinColor = $('.navbar').css('background-color');
          GUI.skinColor = `#${skinColor.substr(4, skinColor.indexOf(')') - 4).split(',').map((color) => parseInt(color).toString(16)).join('')}`;
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
      // setup map controls
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
    // dataTable Translations
    $.extend( true, $.fn.dataTable.defaults, {
      "language": {
        "paginate": {
          "previous": t("dataTable.previous"),
          "next": t("dataTable.next"),
        },
        "info": t("dataTable.info"),
        "zeroRecords": t("dataTable.nodatafilterd"),
        "infoFiltered": t("dataTable.infoFiltered")
      }
    });
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
  this._addComponent = function(component, placeholder, options={}) {
    this._addComponents([component], placeholder, options);
  };
  // registry component
  this._addComponents = function(components, placeholder, options) {
    let register = true;
    if (placeholder && ApplicationTemplate.PLACEHOLDERS.indexOf(placeholder) > -1) {
      const placeholderService = ApplicationTemplate.Services[placeholder];
      if (placeholderService) {
        register = placeholderService.addComponents(components, options);
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
  this._showModalOverlay = function(bool=false) {
    const mapService = GUI.getComponent('map').getService();
    if (bool) {
      mapService.startDrawGreyCover();
    } else {
      mapService.stopDrawGreyCover();
    }
  };
  this._showSidebar = function() {
    $('body').addClass('sidebar-open');
    $('body').removeClass('sidebar-collapse')
  };
  this._hideSidebar = function() {
    $('body').removeClass('sidebar-open');
    $('body').addClass('sidebar-collapse')
  };

  // setup Fonts Css dependencies methods
  this._setUpTemplateDependencies = function(VueApp) {
    GUI.isMobile = function() {
      return isMobile.any;
    };
    // method that return Template Info
    GUI.getTemplateInfo = function() {
      return VueApp.g3wtemplate.getInfo();
    };
    GUI.getTemplateInfo = function() {
      return VueApp.g3wtemplate.getInfo();
    };
    GUI.getFontClass = function(type) {
      return VueApp.g3wtemplate.getFontClass(type);
    };
  };
  // setup Interaces
  this._setupInterface = function() {
    /* PLUBLIC INTERFACE */
    /* Common methods */
    GUI.layout = layout;
    GUI.addComponent = this._addComponent.bind(this);
    GUI.removeComponent = this._removeComponent.bind(this);
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
        perc: options.perc || null,
        content: formComponent,
        split: options.split || 'h',
        push: !!options.push, //only one( if other delete previous component)
        showgoback: !!options.showgoback,
        closable: false
      });
      // return service
      return formService;
    };
    GUI.closeForm = function() {
      this.emit('closeform', false);
      viewport.ViewportService.removeContent();
      // force set modal to false
      GUI.setModal(false);
    };

    GUI.disableElement = function({element, disable}) {
      disable && $(element).addClass('g3w-disabled') || $(element).removeClass('g3w-disabled');
    };

    GUI.disableContent = function(disable) {
      GUI.disableElement({
        element: "#g3w-view-content #contents",
        disable
      })
    };

    GUI.disablePanel = function(disable=false) {
      GUI.disableElement({
        element: "#g3w-sidebarpanel-placeholder",
        disable
      })
    };

    // hide content
    GUI.hideContent = function(bool, perc) {
      return viewport.ViewportService.hideContent(bool, perc);
    };

    GUI.closeContent = function() {
      this.emit('closecontent');
      return viewport.ViewportService.closeContent();
    };

    // show results info/search
    GUI.showQueryResults = function(title, results) {
      const perc = appLayoutConfig.rightpanel ?  parseInt(appLayoutConfig.rightpanel.width) : 50;
      const queryResultsComponent = GUI.getComponent('queryresults');
      const queryResultService = queryResultsComponent.getService();
      queryResultService.reset();
      results && queryResultService.setQueryResponse(results);
      GUI.showContextualContent({
        perc,
        content: queryResultsComponent,
        title: [t("info.title"), title].join(' ')
      });
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
    GUI.showFullModal = function({element="#full-screen-modal", show=true} = {}) {
      show && $(element).modal('show') || $(element).modal('hide')
    };

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
    GUI.showContent = (options={}) => {
      options.perc = !this._isMobile ? options.perc || 100 : 100;
      GUI.setContent(options);
    };

    GUI.showContextualContent = (options = {}) => {
      options.perc = !this._isMobile ? options.perc || 50  : 100;
      GUI.setContent(options)
    };
    // add component to stack (append)
    // Differeces between pushContent and setContent are :
    //  - push every componet is added, set is refreshed
    //  - pushContent has a new parameter (backonclose) when is cliccked x
    //  - the contentComponet is close all stack is closed
    GUI.pushContent = (options = {}) => {
      options.perc = !this._isMobile ? options.perc || 100  : 100;
      options.push = true;
      GUI.setContent(options);
    };
    // add content to stack
    GUI.pushContextualContent = (options) => {
      options = options || {};
      options.perc = !this._isMobile ? options.perc || 50  : 100;
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

    GUI.isContentCollapsed = function() {
      return viewport.ViewportService.getContentState().collapsed;
    };

    GUI.collapseContent = function() {
      viewport.ViewportService.collapseContent();
    };

    GUI._setContent = (options={}) => {
      options.content = options.content || null;
      options.title = options.title || "";
      options.push = _.isBoolean(options.push) ? options.push : false;
      options.perc = !this._isMobile ? options.perc || 50 : 100;
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

    // return specific classes
    GUI.getTemplateClasses = function() {
      return BootstrapVersionClasses
    };

    GUI.getTemplateClass = function({element, type}) {
      return BootstrapVersionClasses[element][type];
    };

    GUI.setLoadingContent = function(loading = false) {
      ApplicationTemplate.Services.viewport.setLoadingContent(loading);
    }

    /* END VIEWPORT */
    /*  */
    /* END PUBLIC INTERFACE */
  };
  base(this);
};

inherit(ApplicationTemplate, G3WObject);

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

ApplicationTemplate.fail = function({language='en', error }) {
  layout.loading(false);
  const error_page =  {
    it: {
      error: error || "Errore di connessione",
      at_moment: "Al momento non è possibile caricare la mappa",
      f5: "Premi Ctrl+F5"
    },
    en: {
      error: error || "Connection error",
      at_moment: "At the moment is not possible show map",
      f5: "Press Ctrl+F5"
    }
  };
  const app = new Vue({
    el: '#app',
    template: require('../html/500.html'),
    data: {
      messages: error_page[language]
    }
  });
};


module.exports =  ApplicationTemplate;

