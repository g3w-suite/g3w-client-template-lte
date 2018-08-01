const ApplicationService = require('core/applicationservice');
const ProjectsRegistry = require('core/project/projectsregistry');
const ProjectsMenuComponent = require('./projectsmenu');
const GUI = require('sdk/gui/gui');
const layout = require('./layout');
const AppUI = Vue.extend({
  template: require('../html/app.html'),
  mounted: function(){
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
    credits_logo: function() {
      const client_url = ApplicationService.getConfig().urls.clienturl;
      return `${client_url}images/logo_gis3w_156_85.png`;
    },
    logo_url: function() {
      const config = ApplicationService.getConfig();
      let logo_url;
      const logo_project_url = ProjectsRegistry.getCurrentProject().getThumbnail();
      if (logo_project_url) {
        logo_url = logo_project_url;
      } else {
        logo_url = config.mediaurl+config.logo_img;
      }
      return logo_url;
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
      const currentProject = ProjectsRegistry.getCurrentProject();
      return currentProject.state.name;
    },
    user: function() {
      let user = ApplicationService.getConfig().user;
      // check if user is empty object
      if (!user || !user.username)
        user = null;
      return user;
    },
    numberOfProjectsInGroup: function() {
      return ApplicationService.getConfig().projects.length;
    },
    frontendurl: function() {
      return ApplicationService.getConfig().urls.frontendurl;
    },
    main_title() {
      const config = ApplicationService.getConfig();
      const main_title = config.main_map_title;
      const group_name = config.group.name;
      return main_title ? `${main_title} - ${group_name}` : group_name;
    },
  },
  methods: {
    closePanel: function(){
      sidebarService.closePanel();
    },
    getLogoLink: function() {
      let logo_link = null;
      if (ApplicationService.getConfig().logo_link) {
        logo_link = ApplicationService.getConfig().logo_link;
      }
      return logo_link;
    },
    openProjectsMenu: function() {
      const contentsComponent = GUI.getComponent('contents');
      // check if is projectmenucomponent
      if (contentsComponent.getComponentById('projectsmenu')) {
        GUI.closeContent();
      } else {
        this.isMobile() ? $('#main-navbar.navbar-collapse').removeClass('in') : null;
        GUI.setContent({
          content: new ProjectsMenuComponent(),
          title: '',
          perc:100
        });
      }
    }
  }
});

module.exports = AppUI;
