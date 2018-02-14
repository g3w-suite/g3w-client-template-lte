const t = require('core/i18n/i18n.service').t;
const inherit = require('core/utils/utils').inherit;
const base = require('core/utils/utils').base;
const ProjectRegistry = require('core/project/projectsregistry');
const PluginsRegistry = require('core/plugin/pluginsregistry');
const MenuComponent = require('./menu');
const SidebarService = require('./sidebar').SidebarService;
const GUI = require('sdk').gui.GUI;

function ProjectsMenuComponent(options) {
  options = options || {};
  options.id = 'projectsmenu';
  base(this, options);
  const menuitems = [];
  const projects = ProjectRegistry.getListableProjects();
  projects.forEach((project) => {
    menuitems.push({
      title: project.title,
      description: project.description,
      thumbnail: project.thumbnail,
      cbk: function() {
        const d = $.Deferred();
        let currentProject;
        ProjectRegistry.getProject(project.gid)
        .then((project) => {
          GUI.closeContent()
            .then(() => {
              currentProject = project;
              const currentUrl = window.location.href;
              const paths = currentUrl.split('/');
              if (!paths[ paths.length-1 ]) {
                paths[ paths.length-2 ] = project.getId();
                paths[ paths.length-3 ] = project.getType();
              } else {
                paths[ paths.length-1 ] = project.getId();
                paths[ paths.length-2 ] = project.getType();
              }
              // change url using history
              history.pushState(null, null, paths.join('/'));
              // change current project currentProject
              ProjectRegistry.setCurrentProject(currentProject);
              // reload plugins
              PluginsRegistry.reloadPlugins(project);
              // reload components
              SidebarService.reloadComponents();
              d.resolve();
            })
        })
        .fail(() => {
          d.reject();
        });
        return d.promise();
      }
    })
  });
  this.state.menuitems = menuitems;
}

inherit(ProjectsMenuComponent, MenuComponent);

module.exports = ProjectsMenuComponent;


