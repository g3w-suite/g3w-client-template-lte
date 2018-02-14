const inherit = require('core/utils/utils').inherit;
const base = require('core/utils/utils').base;
const Stack = require('./barstack.js');
const Component = require('gui/vue/component');

// Internal Component (VUE) of the content of the  viewport
const InternalComponent = Vue.extend({
  template: require('../html/contentsviewer.html'), //  <div id="contents" class="contents"></div>
  data: function() {
    return {
      state: null
    }
  }
});

function ContentsViewerComponent(options) {
  base(this, options);
  this.stack = new Stack();
  this.setService(this);
  this.title = "contents";
  // parent component state is
  /*
   this.state = {
    visible: options.visible || true,
    open: options.open || false
   }
   */
  this.contentsdata = this.stack.state.contentsdata;
  this.state.visible = true;
  this.setInternalComponent(new InternalComponent({
    service: this
  }));
  this.internalComponent.state = this.state;
}

inherit(ContentsViewerComponent, Component);

const proto = ContentsViewerComponent.prototype;

proto.setContent = function(options) {
  const d = $.Deferred();
  const push = options.push || false;
  const content = options.content;
  // svuoto sempre lo stack, così ho sempre un solo elemento (la gestione dello stack è delegata alla viewport).
  // Uso comunque barstack perché implementa già la logica di montaggio dei contenuti nel DOM
  if (!push) {
    // elemino tutto lo stack content
    this.clearContents()
    .then(() => {
      this.addContent(content, options)
      .then(() => {
        d.resolve();
      })
    })
  }
  else {
    this.addContent(content,options)
    .then(() => {
      d.resolve();
    })
  }
  this.setOpen(true);
  return d.promise();
};

proto.addContent = function(content, options) {
  // parent element is the internal element
  options.parent = this.internalComponent.$el;
  options.append = true;
  return this.stack.push(content, options)
  .then(() => {
    // get stack content
    this.contentsdata = this.stack.state.contentsdata;
    // update the visibility of the others components
    this.updateContentVisibility();
  })
};

// remove content from stack
proto.removeContent = function() {
  this.setOpen(false);
  return this.clearContents();
};

// used by  viewport.js
proto.popContent = function() {
  return this.stack.pop()
  .then(() => {
    // updatethe content of contentsdata only after stack is updated
    this.contentsdata = this.stack.state.contentsdata;
    this.updateContentVisibility();
  });
};

// get component through cclass
proto.getComponentByClass = function(componentClass) {
  let component;
  const contentdata = this.stack.getContentData();
  contentdata.forEach((content) => {
    if (content.content instanceof componentClass) {
      component = content.content;
      return false
    }
  });
  return component
};

// get component by component id
proto.getComponentById = function(id) {
  let component;
  const contentdata = this.stack.getContentData();
  contentdata.forEach((content) => {
    if (content.content.id == id) {
      component = content.content;
      return false
    }
  });
  return component
};

proto.getContentData = function() {
  return this.stack.getContentData();
};

// get current contentdata
proto.getCurrentContentData = function(){
  return this.stack.getCurrentContentData();
};

// get  previuos contentdata
proto.getPreviousContentData = function() {
  return this.stack.getPreviousContentData();
};

// update visibility of the components of content
proto.updateContentVisibility = function() {
  // hide each elements but not the last one
  const contentsEls = $(this.internalComponent.$el).children();
  contentsEls.hide();
  contentsEls.last().show();
};

// stack clear because if we want the contentComponente stack
// it has to be empty stack
proto.clearContents = function() {
  return this.stack.clear()
  .then(() => {
    this.contentsdata = this.stack.state.contentsdata;
  })
};

// Set layout of the content each time
// Parameters are: height and with of the parent content
proto.layout = function(parentWidth, parentHeight) {
  const el = $(this.internalComponent.$el);
  //run the callback only after that vue state is updated
  Vue.nextTick(() => {
    const contentsdata = this.stack.state.contentsdata;
    // el.parent() is div g3w-view-content
    const height = el.parent().height() - el.siblings('.close-panel-block').outerHeight(true) - el.siblings('.g3w_contents_back').outerHeight(true);
    el.height(height);
    el.children().first().height(height);
    contentsdata.forEach((data) => {
      //check each componentstored in stack
      if (typeof data.content.layout == 'function') {
        //call function layout of each component that are stored into the stack
        data.content.layout(parentWidth, height);
      }
    })
  })
};

module.exports = ContentsViewerComponent;
