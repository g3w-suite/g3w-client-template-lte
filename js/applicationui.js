const ApplicationService = require('core/applicationservice');
const ProjectsRegistry = require('core/project/projectsregistry');
const ProjectsMenuComponent = require('./projectsmenu');
const HeaderLinkComponent = require('./headerlink');
const GUI = require('sdk/gui/gui');
const layout = require('./layout');
const AppUI = Vue.extend({
  template: require('../html/app.html'),
  data() {
    return {
      customcredits: false
    }
  },
  components: {
    'header-link': HeaderLinkComponent
  },
  mounted: function() {
    this.$nextTick(function(){
      /* start to render LayoutManager layout */
      layout.loading(false);
      layout.setup();
      //Fix the problem with right sidebar and layout boxed
      layout.pushMenu.expandOnHover();
      layout.controlSidebar._fix($(".control-sidebar-bg"));
      layout.controlSidebar._fix($(".control-sidebar"));
      const controlsidebarEl = layout.options.controlSidebarOptions.selector;
      function setFloatBarMaxHeight() {
        $(controlsidebarEl).css('max-height',$(window).innerHeight());
        $('.g3w-sidebarpanel').css('height',$(window).height() - $("#main-navbar").height());
      }
      setFloatBarMaxHeight();
      function setModalHeight(){
        $('#g3w-modal-overlay').css('height',$(window).height());
      }
      $(window).resize(function() {
        setFloatBarMaxHeight();
        setModalHeight();
      });
    })
  },
  computed: {
    currentProject() {
      return ProjectsRegistry.getCurrentProject();
    },
    appconfig() {
      return ApplicationService.getConfig();
    },
    customlinks() {
      return Array.isArray(this.appconfig.header_custom_links) ? this.appconfig.header_custom_links.filter((header_link) => {
        return header_link !== null
      }): [];
    },
    urls() {
      return this.appconfig.urls;
    },
    powered_by() {
      return this.appconfig.group.powered_by;
    },
    g3w_suite_logo() {
      const client_url = this.urls.clienturl;
      return `${client_url}images/g3wsuite_logo.png`;
    },
    credits_logo: function() {
      const client_url = this.urls.clienturl;
      return `${client_url}images/logo_gis3w_156_85.png`;
    },
    logo_url: function() {
      const logo_project_url = this.currentProject.getThumbnail();
      return logo_project_url ? logo_project_url : `${this.appconfig.mediaurl}${this.appconfig.logo_img}`;
    },
    logo_link: function() {
      const logo_link = this.getLogoLink();
      return logo_link ? logo_link : "#";
    },
    logo_link_target: function() {
      const logo_link = this.getLogoLink();
      return logo_link ? "_blank" : "";
    },
    project_title: function() {
      return this.currentProject.getState().name;
    },
    user: function() {
      return (this.appconfig.user && this.appconfig.user.username) ? this.appconfig.user : null;
    },
    numberOfProjectsInGroup: function() {
      return this.appconfig.projects.length;
    },
    frontendurl: function() {
      return this.urls.frontendurl;
    },
    main_title() {
      const main_title = this.appconfig.main_map_title;
      const group_name = this.appconfig.group.name;
      return main_title ? `${main_title} - ${group_name}` : group_name;
    },
  },
  methods: {
    closePanel: function(){
      sidebarService.closePanel();
    },
    getLogoLink: function() {
      return this.appconfig.logo_link ? this.appconfig.logo_link: null;
    },
    openProjectsMenu: function() {
      const contentsComponent = GUI.getComponent('contents');
      // check if is projectmenucomponent
      if (contentsComponent.getComponentById('projectsmenu')) {
        GUI.closeContent();
      } else {
        if (this.isMobile()) {
          GUI.hideSidebar();
          $('#main-navbar.navbar-collapse').removeClass('in');
        }
        GUI.setContent({
          content: new ProjectsMenuComponent(),
          title: '',
          perc:100
        });
      }
    }
  },
  created() {
    !!this.appconfig.credits && $.get(this.appconfig.credits).then((credits)=> {
      this.customcredits = credits !== 'None' && credits
    });
  }
});

module.exports = AppUI;
