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
  this.state.menuitems = [];
  const ApplicationService = require('core/applicationservice');
  const projects = ProjectRegistry.getListableProjects();
  projects.forEach((project) => {
    this.state.menuitems.push({
      title: project.title,
      description: project.description,
      thumbnail: project.thumbnail,
      cbk: function() {
        const d = $.Deferred();
        const projectConfig = ProjectRegistry.getProjectConfigByGid(project.gid);
        const projecId = projectConfig.gid.split(':')[1];
        const currentUrl = window.location.href;
        const paths = currentUrl.split('/');
        if (!paths[ paths.length-1 ]) {
          paths[ paths.length-2 ] = projecId;
          paths[ paths.length-3 ] = project.type;
        } else {
          paths[ paths.length-1 ] = projecId;
          paths[ paths.length-2 ] = project.type;
        }
        // change url using history
        history.replaceState(null, null, paths.join('/'));
        //remove tools
        ApplicationService.obtainInitConfig()
          .then((initConfig) => {
            ProjectRegistry.getProject(project.gid)
              .then((project) => {
                GUI.closeContent()
                  .then(() => {
                    // change current project project
                    ProjectRegistry.setCurrentProject(project);
                    // remove all toos
                    GUI.getComponent('tools').getService().reload();
                    // reload metadati
                    GUI.getComponent('metadata').getService().reload();
                    // reload plugins
                    PluginsRegistry.reloadPlugins(initConfig, project);
                    // reload components
                    SidebarService.reloadComponents();
                    d.resolve();
                  })
                  .fail((err) => {
                    console.log(err);
                  })
              })
              .fail(() => {
                d.reject();
              });
          })
          .fail((err) => {
            //TODO
          });
        return d.promise();
      }
    })
  });
}

inherit(ProjectsMenuComponent, MenuComponent);

module.exports = ProjectsMenuComponent;


