const inherit = require('sdk').core.utils.inherit;
const base = require('sdk').core.utils.base;
const G3WObject = require('sdk').core.G3WObject;
const GUI = require('sdk').gui.GUI;

// calsse servizio della viewport
const ViewportService = function() {
  // state of viewport
  this.state = {
    primaryView: 'map', // primary view (default)
    // percentage of secondary view
    secondaryPerc: 0,
    // splitting orientation (h = horizontal, v = vertical)
    split: 'h',
    //map
    map: {
      sizes: {
        width: 0,
        height: 0
      },
      aside: false
    },
    //content
    content:{
      sizes: {
        width: 0,
        height: 0
      },
      aside: true,
      showgoback: true,
      stack: [], // array elements of  stack contents
      closable: true, // (x) is closable
      backonclose: false, // back on prevoius content
      contentsdata:[] // content data array
    }
  };
  // content of viewport (map and content)
  this._components = {
    map: null,
    content: null
  };
  // default contents
  this._defaultMapComponent;
  this._contextualMapComponent;

  // minimun height and width of secondary view
  this._secondaryViewMinWidth = 300;
  this._secondaryViewMinHeight = 200;
  // attributo che serve per
  this._immediateComponentsLayout = true;
  /* PLUBILC INTARFACE */
  this.init = function(options) {
    var options = options || {};
    // check if it set primary view (map is default)
    this.state.primaryView = options.primaryview ? options.primaryview : 'map';
    // check splitting property
    this.state.split = options.split ? options.split : 'h';
    // add component (map and content)
    this._addComponents(options.components);
  };

  this._addComponents = function(components) {
    // components is an object
    //(index.js)
    /*
     {
      map: new MapComponent({
        id: 'map'
      }),
      content: new ContentsComponent({
        id: 'contents'
      })
     }
     */
    Object.entries(components).forEach(([viewName, component]) => {
      // check if component are map or content
      if (['map', 'content'].indexOf(viewName) > -1) {
        component.mount('#g3w-view-'+viewName, true)
          .then(() => {
            this._components[viewName] = component;
            // check if view name is map
            if (viewName == 'map') {
              // sset de fefault component to map
              this._defaultMapComponent = component;
            }
          });
      }
    })
  };

  this.showMap = function() {
    this._toggleMapComponentVisibility(this._defaultMapComponent,true);
    this._components['map'] = this._defaultMapComponent;
    this._showView('map');
  };

  this.showContextualMap = function(options) {
    if (!this._contextualMapComponent) {
      this._contextualMapComponent = this._defaultMapComponent;
    }
    if (this._contextualMapComponent != this._defaultMapComponent) {
      this._toggleMapComponentVisibility(this._defaultMapComponent,false);
    }
    if (!this._contextualMapComponent.ismount()) {
      const contextualMapComponent = this._contextualMapComponent;
      contextualMapComponent.mount('#g3w-view-map', true)
        .then(() => {
          this._components['map'] = contextualMapComponent;
        });
    }
    else {
      this._components['map'] = this._contextualMapComponent;
      this._toggleMapComponentVisibility(this._contextualMapComponent,true);
    }
    this._showView('map',options);
  };

  // get default component
  this.recoverDefaultMap = function() {
    if (this._components['map'] != this._defaultMapComponent) {
      this._components['map'] = this._defaultMapComponent;
      this._toggleMapComponentVisibility(this._contextualMapComponent,false);
      this._toggleMapComponentVisibility(this._defaultMapComponent,true);
    }
    return this._components['map']
  };

  this.setContextualMapComponent = function(mapComponent) {
    if (mapComponent == this._defaultMapComponent) {
      return;
    }
    if (this._contextualMapComponent) {
      this._contextualMapComponent.unmount();
    }
    this._contextualMapComponent = mapComponent;
  };

  this.resetContextualMapComponent = function() {
    if (this._contextualMapComponent) {
      this._contextualMapComponent.unmount();
    }
    this._contextualMapComponent = this._defaultMapComponent;
  };

  this._toggleMapComponentVisibility = function(mapComponent,toggle) {
    mapComponent.internalComponent.$el.style.display = toggle ? 'block' : 'none';
  };

  // close map method
  this.closeMap = function() {
    this.state.secondaryPerc = (this.state.primaryView == 'map') ? 100 : 0;
    this.recoverDefaultMap();
    this._layout();
  };

  // show content of the viewport content
  /*
   options: {
     content: (string, jQuery elemento or Vue component)
     title: Title of the content
     push: (opyionale, default false): if yes the content is push on top of the stack (contentStack)
     split: (optional, default 'h'): 'h' || 'v' splitting map and content orientation
     perc: (optional, default 50): percentage of content
   }
   */

  this.showContent = function(options) {
    // check if push i setted
    options.push = options.push || false;
    // set all pcontenty parameters
    this._prepareContentView(options);
    this._immediateComponentsLayout = false;
    this._showView('content', options, true);
    this._components.content.setContent(options)
      .then(() => {
        this._layoutComponents();
        this._immediateComponentsLayout = true;
      });
  };

  // hide content
  this.hideContent = function(bool, perc) {
    const prevContentPerc = this.state.secondaryPerc;
    this.state.secondaryPerc = !!bool ? 0: perc;
    this.state.secondaryVisible = !bool;
    this._layout();
    // return previous percentage
    return prevContentPerc;
  };

  this.contentLength = function() {
    return this.state.content.contentsdata.length;
  };

  // pull the last element of contentStack
  this.popContent = function() {
    const d = $.Deferred();
    // check if content exist compontentStack
    if (this.state.content.contentsdata.length) {
      this.recoverDefaultMap();
      const data = this._components.content.getPreviousContentData();
      this._prepareContentView(data.options);
      this._immediateComponentsLayout = false;
      this._showView('content');
      this._components.content.popContent()
        .then(() => {
          this._layoutComponents();
          this._immediateComponentsLayout = true;
          this.state.secondaryPerc = data.options.perc;
          this._layout();
          d.resolve(this._components.contentgetCurrentContentData)
        })
    } else
      d.reject();
    return d.promise();
  };

  // close  content
  this.closeContent = function() {
    const d = $.Deferred();
    this._components.content.removeContent();
    // close secondari view( return a promise)
    this.closeSecondaryView()
      .then(() => {
        //recover default map
        const mapComponent = this.recoverDefaultMap();
        d.resolve(mapComponent);
      });
    return d.promise()
  };

  this.removeContent = function() {
    // check if backonclose proprerty is  true o false
    // to remove all content stack or just last component
    if (this.state.content.backonclose && this.state.content.contentsdata.length > 1) {
      this.popContent();
    } else {
      this._components.content.removeContent();
      this.recoverDefaultMap();
      return this.closeSecondaryView();
    }
  };

  this.isPrimaryView = function(viewName) {
    return this.state.primaryView == viewName;
  };

  this.setPrimaryView = function(viewTag) {
    if (this.state.primaryView != viewTag) {
      this.state.primaryView = viewTag;
    }
    this._layout();
  };

  this.showPrimaryView = function(perc) {
    if (perc && this.state.secondaryVisible && this.state.secondaryPerc == 100) {
      this.state.secondaryPerc = 100 - perc;
      this._layout();
    }
  };

  this.showSecondaryView = function(split, perc) {
    this.state.secondaryVisible = true;
    this.state.split = split ? split : this.state.split;
    this.state.secondaryPerc = perc ? perc : this.state.perc;
    this._layout();
  };

  // close secondary view
  this.closeSecondaryView = function(componentId) {
    const d = $.Deferred();
    const secondaryViewComponent = this._components[this._otherView(this.state.primaryView)];
    if (secondaryViewComponent.clearContents) {
      secondaryViewComponent.clearContents()
        .then(() => {
          this.state.secondaryVisible = false;
          this._layout();
          Vue.nextTick(() => {
            d.resolve();
          })
        });
    }
    else {
      this.state.secondaryVisible = false;
      this._layout();
      Vue.nextTick(() => {
        d.resolve();
      })
    }
    return d.promise();
  };

  this.getDefaultViewPerc = function(viewName) {
    return this.isPrimaryView(viewName) ? 100 : 50;
  };

  // return the opposite view
  this._otherView = function(viewName) {
    return (viewName == 'map') ? 'content' : 'map';
  };

  this._isSecondary = function(view) {
    return this.state.primaryView != view;
  };

  this._setPrimaryView = function(viewTag) {
    if (this.state.primaryView != viewTag) {
      this.state.primaryView = viewTag;
    }
  };

  this._prepareContentView = function(options) {
    this.state.content.preferredPerc = options.perc || this.getDefaultViewPerc('content');
    this.state.content.title = options.title;
    this.state.content.closable =  _.isNil(options.closable) ? true : options.closable;
    this.state.content.backonclose = _.isNil(options.backonclose) ? true : options.backonclose;
    this.state.content.contentsdata = this._components.content.contentsdata;
    this.state.content.showgoback = _.isNil(options.showgoback) ? true : options.showgoback;
  };

  // manage all layout logic
  // viewName: map or content
  //options.  percentage , splitting title etc ..
  this._showView = function(viewName, options) {
    options = options || {};
    const perc = options.perc || this.getDefaultViewPerc(viewName);
    const split = options.split || 'h';
    let aside;
    if (this.isPrimaryView(viewName)) {
      aside = (typeof(options.aside) == 'undefined') ? false : options.aside;
    }
    else {
      aside = true;
    }
    this.state[viewName].aside = aside;
    const secondaryPerc = this.isPrimaryView(viewName) ? 100 - perc : perc;
    if (secondaryPerc > 0) {
      this.showSecondaryView(split, secondaryPerc);
    } else {
      return this.closeSecondaryView();
    }
  };

  this._getReducedSizes = function() {
    const contentEl = $('.content');
    let reducedWidth = 0;
    let reducedHeight = 0;
    if (contentEl && this.state.secondaryVisible && this.state.secondaryPerc == 100) {
      const sideBarToggleEl = $('.sidebar-aside-toggle');
      if (sideBarToggleEl && sideBarToggleEl.is(':visible')) {
        const toggleWidth = sideBarToggleEl.outerWidth();
        contentEl.css('padding-left',toggleWidth + 5);
        reducedWidth = (toggleWidth - 5);
      }
    }
    else {
      contentEl.css('padding-left', 15);
    }
    return {
      reducedWidth: reducedWidth,
      reducedHeight: reducedHeight
    }
  };

  //main layout function
  this._layout = function() {
    let closeMapBtn = $('#closemap-btn');
    const splitClassToAdd = (this.state.split == 'h') ? 'split-h' : 'split-v';
    const splitClassToRemove =  (this.state.split == 'h') ? 'split-v' : 'split-c';
    $(".g3w-viewport .g3w-view").addClass(splitClassToAdd);
    $(".g3w-viewport .g3w-view").removeClass(splitClassToRemove);
    const reducesdSizes = this._getReducedSizes();
    this._setViewSizes(reducesdSizes.reducedWidth,reducesdSizes.reducedHeight);
    // cloaseMap button
    if (!closeMapBtn.length) {
      closeMapBtn = $('<div id="closemap-btn" @click="closeMap" style="\
        position: absolute;\
        right: 10px;\
        top: 7px;\
        line-height: 1;\
        padding: 7px 2px;\
        font-size: 1.5em;\
        background-color: #3c8dbc;\
        color: white;\
        z-index:1000;\
        height: 39px;\
        width: 39px">\
          <button class="glyphicon glyphicon-remove pull-right close-panel-button" style="background-color: transparent;border: 0px;"></button>\
        </div>');
      closeMapBtn.on('click', () => {
        this.closeMap();
      });
      const mapView = $(".g3w-viewport .map");
      mapView.append(closeMapBtn);
    }

    if (this.state.secondaryVisible) {
      if (this._isSecondary('content') && (this.state.secondaryPerc < this.state.content.preferredPerc)) {
        closeMapBtn.show()
      }
      else {
        closeMapBtn.hide();
      }
    }
    else {
      closeMapBtn.hide();
    }

    if (this._immediateComponentsLayout) {
      this._layoutComponents();
    }
  };


  this._setViewSizes = function() {
    const primaryView = this.state.primaryView;
    const secondaryView = this._otherView(primaryView);
    const viewportWidth = this._viewportWidth();
    const viewportHeight = this._viewportHeight();
    let primaryWidth = viewportWidth;
    let primaryHeight = viewportHeight;
    let secondaryWidth;
    let secondaryHeight;
    const scale = this.state.secondaryPerc / 100;

    if (this.state.split == 'h') {
      secondaryWidth = this.state.secondaryVisible ? Math.max((viewportWidth * scale),this._secondaryViewMinWidth) : 0;
      secondaryHeight = viewportHeight;
      primaryWidth = viewportWidth - secondaryWidth;
      primaryHeight = viewportHeight;
    }
    else {
      secondaryWidth = viewportWidth;
      secondaryHeight = this.state.secondaryVisible ? Math.max((viewportHeight * scale),this._secondaryViewMinHeight) : 0;
      primaryWidth = viewportWidth;
      primaryHeight = viewportHeight - secondaryHeight;
    }
    this.state[primaryView].sizes.width = primaryWidth;
    this.state[primaryView].sizes.height = primaryHeight;
    this.state[secondaryView].sizes.width = secondaryWidth;
    this.state[secondaryView].sizes.height = secondaryHeight;
  };

  this._viewportHeight = function() {
    const topHeight = $(".navbar").innerHeight();
    return $(window).innerHeight() - topHeight;
  };

  this._viewportWidth = function() {
    const offset = $(".main-sidebar").offset().left;
    const width = $(".main-sidebar").innerWidth();
    const sideBarSpace = width + offset;
    return $(window).innerWidth() - sideBarSpace;
  };

  // load components of  viewport
  // after right size setting
  this._layoutComponents = function() {
    Vue.nextTick(() => {
      const reducesdSizes = this._getReducedSizes();
      const reducedWidth = reducesdSizes.reducedWidth || 0;
      const reducedHeight = reducesdSizes.reducedHeight || 0;
      Object.entries(this._components).forEach(([name, component]) => {
        const width = this.state[name].sizes.width - reducedWidth ;
        const height = this.state[name].sizes.height - reducedHeight;
        component.layout(width, height);
      })
    });
  };

  this._firstLayout = function() {
    let drawing = false;
    let resizeFired = false;

    function triggerResize() {
      resizeFired = true;
      drawResize();
    }

    const drawResize = () => {
      if (resizeFired === true) {
        resizeFired = false;
        drawing = true;
        this._layout(true);
        requestAnimationFrame(drawResize);
      } else {
        drawing = false;
      }
    };
    // resister on readyy GUI
    GUI.on('ready',() => {
      const primaryView = this.state.primaryView;
      const secondaryView = this._otherView(primaryView);
      const secondaryEl = $(".g3w-viewport ."+secondaryView);
      const secondaryViewMinWidth = secondaryEl.css('min-width');
      if ((secondaryViewMinWidth != "") && !_.isNaN(parseFloat(secondaryViewMinWidth))) {
        this._secondaryViewMinWidth =  parseFloat(secondaryViewMinWidth);
      }
      const secondaryViewMinHeight = secondaryEl.css('min-height');
      if ((secondaryViewMinHeight != "") && !_.isNaN(parseFloat(secondaryViewMinHeight))) {
        this._secondaryViewMinHeight =  parseFloat(secondaryViewMinHeight);
      }
      this._layout(true);
      GUI.on('guiresized',() => {
        triggerResize();
      });
      // resize della window
      $(window).resize(() => {
        // set resizedFired to true and execute drawResize if it's not already running
        if (drawing === false) {
          triggerResize();
        }
      });
      // resize sul ridimensionamento della sidebar
      $('.main-sidebar').on('webkitTransitionEnd transitionend msTransitionEnd oTransitionEnd', function () {
        $(this).trigger('trans-end');
        triggerResize();
      });
    });
  };
  this._firstLayout();
  base(this);
};

inherit(ViewportService, G3WObject);

//singleton
const viewportService = new ViewportService;

// COMPONENTE VUE VIEWPORT
const ViewportComponent = Vue.extend({
  template: require('../html/viewport.html'),
  data: function() {
    return {
      state: viewportService.state
    }
  },
  computed: {
    showtitle: function() {
      let showtitle = true;
      const contentsData = this.state.content.contentsdata;
      if (contentsData.length) {
        const options = contentsData[contentsData.length - 1].options;
        if (_.isBoolean(options.showtitle)) showtitle = options.showtitle;
      }
      return showtitle;
    },
    showContent: function() {
      return this.state.content.show;
    },
    contentTitle: function() {
      const contentsData = this.state.content.contentsdata;
      if (contentsData.length) {
        return contentsData[contentsData.length - 1].options.title;
      }
    },
    previousTitle: function() {
      const contentsData = this.state.content.contentsdata;
      if (contentsData.length > 1 && this.state.content.showgoback) {
        if (!contentsData[contentsData.length - 2].options.title) {
          return 'indietro'
        }
        return 'a ' + contentsData[contentsData.length - 2].options.title;
      }
      return false;
    },
    contentSmallerThenPreferred: function() {
      return this.state.secondaryPerc < this.state.content.preferredPerc;
    }
  },
  methods: {
    closeContent: function() {
      viewportService.removeContent();
    },
    closeMap: function() {
      viewportService.closeMap();
    },
    gotoPreviousContent: function() {
      viewportService.popContent();
    }
  }
});

module.exports = {
  ViewportService: viewportService,
  ViewportComponent: ViewportComponent
};
