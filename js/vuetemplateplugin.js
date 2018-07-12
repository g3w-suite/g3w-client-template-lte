const CssLibraries = require('../config/csslibraries');
const Fonts = require('../config/fonts');
const VueTemplatePlugin = {
  install: function(Vue, {font={name:'fontawsome', version:'5'}, css={name:'bootstrap', version:'3'}} = {}) {
   Vue.prototype.g3wtemplate = {
     info: {
       font,
       css
     },
     css: CssLibraries[css.name].versions[css.version],
     font:Fonts[font.name].versions[font.version],
     get() {},
     getInfo(){
       return this.info
     },
     getInfoString() {
       return `${this.info.library.name} version ${this.info.library.version}`;
     },
     getFontClass(type){
       return this.font[type];
     },
     getClass({type='column', options={}}={}){
       console.log(this.css[type])
     },
     getColumnClass({width='12', breakpoint='sm', offset=null}={}) {
       const prefix = this.css.classes.column;
       // funxtion to create offsetclass
       const createOffsetClass = (index) => {
         let offsetClass = '';
         if (offset && this.info.css.name === 'bootstrap') {
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
       return this.css.classes.row;
     },
     getImageClass({type='default'} = {}) {
       return this.css.classes.image[type]
     },
     getIcon(type) {
       return this.font[type];
     }
   };
  }
};


module.exports = VueTemplatePlugin;
