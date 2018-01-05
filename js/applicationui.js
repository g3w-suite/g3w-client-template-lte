const ApplicationService = require('core/applicationservice');
const ProjectsRegistry = require('core/project/projectsregistry');
const t = require('core/i18n/i18n.service').t;
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
        $('.g3w-sidebarpanel').css('height',$(window).height() - $(".main-header").height());
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
      // verifico nel caso fosse un oggetto vuoto
      if (_.isEmpty(user) || !user.username) {user = null}
      return user;
    },
    numberOfProjectsInGroup: function() {
      return ProjectsRegistry.getProjects().length;
    }
  },
  methods: {
    closePanel: function(){
      sidebarService.closePanel();
    },
    isMobile: function(){return isMobile.any},
    getLogoLink: function() {
      let logo_link = null;
      if (ApplicationService.getConfig().logo_link) {
        logo_link = ApplicationService.getConfig().logo_link;
      }
      return logo_link;
    },
    openProjectsMenu: function() {
      const contentsComponent = GUI.getComponent('contents');
      // verifico che il content è il projectsmenu
      if (contentsComponent.getComponentById('projectsmenu')) {
        GUI.closeContent();
      } else {
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
