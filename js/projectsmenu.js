var t = require('core/i18n/i18n.service').t;
var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var ProjectsStore = require('core/project/projectsstore');
var PluginsRegistry = require('core/plugin/pluginsregistry');
var MenuComponent = require('./menu');
var SidebarService = require('./sidebar').SidebarService;
var GUI = require('sdk').gui.GUI;

function ProjectsMenuComponent(options) {
  options = options || {};
  options.id = 'projectsmenu';
  base(this, options);
  var menuitems = [];
  var projects = ProjectsStore.getListableProjects();
  _.forEach(projects, function(project){
    menuitems.push({
      title: project.title,
      description: project.description,
      thumbnail: project.thumbnail,
      cbk: function() {
        var d = $.Deferred();
        var currentProject;
        ProjectsStore.getProject(project.gid)
        .then(function(project) {
          GUI.closeContent()
            .then(function() {
              currentProject = project;
              var currentUrl = window.location.href;
              var paths = currentUrl.split('/');
              if (!paths[ paths.length-1 ]) {
                paths[ paths.length-2 ] = project.getId();
                paths[ paths.length-3 ] = project.getType();
              } else {
                paths[ paths.length-1 ] = project.getId();
                paths[ paths.length-2 ] = project.getType();
              }
              //window.location = paths.join('/');
              // cambio la url
              history.pushState(null, null, paths.join('/'));
              // vado a afre il reload dei plugins
              PluginsRegistry.reloadPlugins(project);
              ProjectsStore.setCurrentProject(currentProject);
              // vado a fare il reloads dei component
              SidebarService.reloadComponents();
              d.resolve();
            })
        })
        .fail(function() {
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


