const VueTemplatePlugin = {
  install: function(Vue, {library='bootstrap', version='3'} = {}) {
    const libraries = {
      bootstrap: {
        versions: {
          '3': {
            classes: {
              column: 'col-',
              row: 'row',
              image: {
                responsive: 'img-responsive',
                rounded: 'img-rounded',
                circe: 'img-circle'
              },
              panel: {},
              navbar: {
                default: 'navbar-default',
                toggle: 'navbar-toggle',
                form: 'navbar-form',
                btn: 'navbar-btn',
                right: 'navbar-right',
                left: 'navbar-left',
                fixed: 'navbar-fixed-top'
              },
              tables: {}
            },
            icons: {},
            templates: {},

          },
          '4': {
            classes: {
              column: 'col-',
              row: 'row',
              image: {
                responsive: 'img-fluid',
                rounded: 'rounded',
                circe: 'rounded-circle'
              },
              panel: {},
              navbar: {
                default: 'navbar-light',
                toggle: 'navbar-toggler',
                form: 'form-inline',
                btn: 'nav-item',
                right: 'ml-auto',
                left: 'ml-auto',
                fixed: 'fixed-top'
              },
              tables: {}
            },
            icons: {},
            templates: {},
          }
        }
      },
    };
   Vue.prototype.g3wtemplate = {
     info: {
       library,
       version
     },
     data: libraries[library].versions[version],
     get() {},
     getInfo(){
       return this.info
     },
     getInfoString() {
       return `${this.info.library} version ${this.info.version}`;
     },
     getClass({type='column', options={}}={}){
       console.log(this.data[type])
     },
     getColumnClass({width='12', breakpoint='sm', offset=null}={}) {
       const prefix = this.data.classes.column;
       // funxtion to create offsetclass
       const createOffsetClass = (index) => {
         let offsetClass = '';
         if (offset && this.info.library === 'bootstrap') {
           switch(this.info.version) {
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
       if (Array.isArray(width) && Array.isArray(breakpoint)) {
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
       return this.data.classes.row;
     },
     getImageClass({type='default'} = {}) {
       return this.data.classes.image[type]
     }
   };
  }
};


module.exports = VueTemplatePlugin;
