var t = require('sdk/core/i18n/i18n.service').t;
var inherit = require('sdk/core/utils/utils').inherit;
var G3WObject = require('sdk/core/g3wobject');
var base = require('sdk/core/utils/utils').base;

// service sidebar
function navbaritemsService() {
  this.state = {
    items: {
      left:[],
      right:[]
    }

  };
  this.addItem = function(item, position) {
    position = position || 'right';
    this.state.items[position].push(item);
  };

  base(this)
}

// eredito da G3Wobject così posso agire su onafter etc ..
inherit(navbaritemsService, G3WObject);

var navbaritemsService = new navbaritemsService();

var NavbarLeftItemsComponent = Vue.extend({
  template: require('../html/navbarleftitems.html'),
  data: function() {
    return {
      items: navbaritemsService.state.items.left
    }
  },
  computed: {},
  methods: {}
});

var NavbarRightItemsComponent = Vue.extend({
  template: require('../html/navbarrightitems.html'),
  data: function() {
    return {
      items: navbaritemsService.state.items.right
    }
  },
  computed: {},
  methods: {}
});


module.exports = {
  NavbarItemsService: navbaritemsService,
  components: {
    left: NavbarLeftItemsComponent,
    right: NavbarRightItemsComponent
  }
};
