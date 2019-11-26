const HeaderItemComponent = {
  props: ['state'],
  template: require('../html/headeritem.html'),
  methods: {
    showCustomModal(id) {
      this.$emit('show-custom-modal-content', id)
    }
  },
  created() {
    this.state.type = this.state.type || 'link';
  }
};

module.exports = HeaderItemComponent;