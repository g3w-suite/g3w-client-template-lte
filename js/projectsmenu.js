const inherit = require('core/utils/utils').inherit;
const base = require('core/utils/utils').base;
const ProjectRegistry = require('core/project/projectsregistry');
const MenuComponent = require('./menu');

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
        return ApplicationService.changeProject({
          gid: project.gid
        })
      }
    })
  });
}

inherit(ProjectsMenuComponent, MenuComponent);

module.exports = ProjectsMenuComponent;


