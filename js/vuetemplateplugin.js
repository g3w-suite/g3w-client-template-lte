const CssLibraries = require('../config/frameworks/css');
const Fonts = require('../config/frameworks/fonts');
const VueTemplatePlugin = {
  install: function(Vue, {font={name:'fontawsome', version:'4'}, css={name:'bootstrap', version:'3'}} = {}) {
    // set g3wtemplate property to all instances
    Vue.prototype.g3wtemplate = {
      css: CssLibraries[css.name].versions[css.version],
      font: Fonts[font.name].versions[font.version],
      get() {
      },
      getInfo() {
        return {
          css: this.css,
          font: this.font
        }
      },
      getInfoString() {
        return `${this.info.library.name} version ${this.info.library.version}`;
      },
      getFontClass(type) {
        return this.font[type];
      },
      getClass({type = 'column', options = {}} = {}) {
        return this.css[type]
      },
      getColumnClass({width = '12', breakpoint = 'sm', offset = null} = {}) {
        const prefix = this.css.classes.column;
        // funxtion to create offsetclass
        const createOffsetClass = (index) => {
          let offsetClass = '';
          if(offset && this.info.css.name === 'bootstrap') {
            switch (this.info.version) {
              case '3':
              default:
                offsetClass = `${prefix}${index !== undefined ? breakpoint[index] : breakpoint}-offset-${index !== undefined ? offset[index] : offset}`;
                break;
              case '4':
                offsetClass = `$offset-${index !== undefined ? breakpoint[index] : breakpoint}-${index !== undefined ? offset[index] : offset}`;
                break;
            }
          }
          return offsetClass;
        };
        if(Array.isArray(width) && Array.isArray(breakpoint)) {
          const classes = width.map((value, index) => {
            const offsetClass = createOffsetClass(index);
            return `${prefix}${breakpoint[index]}-${value} ${offsetClass}`
          });
          return classes.join(' ')
        }
        else {
          const offsetClass = createOffsetClass();
          return `${prefix}${breakpoint}-${width} ${offsetClass}`
        }

      },
      getRowClass() {
        return this.css.classes.row;
      },
      getImageClass({type = 'default'} = {}) {
        return this.css.classes.image[type]
      }
    };

    // set isMobile method to all Vue instances
    Vue.mixin({
      methods: {
        isMobile: function () {
          return isMobile.any
        }
      }
    })
  }
};


module.exports = VueTemplatePlugin;
