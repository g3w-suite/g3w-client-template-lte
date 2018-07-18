const Css = {
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
        templates: {},
      }
    }
  }
};

module.exports = Css;
