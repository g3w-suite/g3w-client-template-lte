<template>
  <div class="usermessage-content" :style="style">
    <i style="align-self: flex-start; padding: 10px 0 0 5px;" :class="g3wtemplate.getFontClass(type)"></i>
    <div class="usermessage-right">
      <div v-if="closable" class="usermessage-close usermessage-right-item" @click="closeUserMessage"><i :class="g3wtemplate.getFontClass('close')"></i></div>
    </div>
    <slot name="header">
      <h4 class="usermessage-header">{{ title }}</h4>
    </slot>
    <slot name="body">
      <div class="usermessage-message" v-html="message"></div>
    </slot>
    <slot name="footer"></slot>
  </div>
</template>

<script>
  const COLORS = {
    info: {
      backgroundColor: '#d9edf7',
      color: '#31708f'
    },
    warning: {
      backgroundColor: '#FEEFB3',
      color: '#9F6000'
    },
    error: {
      backgroundColor: '#FFBABA',
      color: '#D8000C'
    },
    tool: {
      backgroundColor: '#e2e2e2',
      color: "#000000"
    }
  };
  export default {
    name: "usermessage",
    props: {
      type: {
        type: String,
        default: 'info' // info, warning, error, tool
      },
      title: {
        type: String,
        default: null,
      },
      position: {
        type: String,
        default: 'top'
      },
      size: {
        type: 'String',
        default: null
      },
      message: {
        type: String,
        deafult: ''
      },
      autoclose: {
        type: Boolean,
        default: false
      },
      draggable: {
        type: Boolean,
        default: false
      },
      closable: {
        type: Boolean,
        default: true
      }
    },
    methods: {
      closeUserMessage(){
        this.$emit('close-usermessage')
      },
      hideShow() {
      }
    },
    created() {
      const position = {
        [this.position]: 0,
        width: !this.size ? '100%' : this.size === 'small' ? '25%': '50%'
      };
      this.style = {
      ...COLORS[this.type],
      ...position,
      }
    },
    mounted(){
      this.autoclose && this.$nextTick(() => {
        const timeout = setTimeout(() =>{
          this.closeUserMessage();
          clearTimeout(timeout)
        }, 1000)
      })
    }
  }
</script>

<style scoped>
  .usermessage-content {
    color: #FFFFFF;
    z-index: 1000;
    position: absolute;
    display: flex;
    flex-wrap: wrap;
    flex-direction: column;
    align-items: center;
  }
  .usermessage-content /deep/ .usermessage-right {
    display: flex;
    justify-items: flex-end;
    position: absolute;
    right: 10px;
    cursor: pointer;
    font-weight: bold;
    padding: 5px;
  }
  .usermessage-content /deep/ .usermessage-right-item {
    padding: 5px;
  }
  .usermessage-header {
    font-weight: bold;
  }
  .usermessage-content /deep/ .usermessage-message {
    margin: 5px;
    width: 100%;
    max-height: 50px;
    font-weight: bold;
    font-size: 1.2em;
    align-self: flex-start;
    overflow-y: auto;
  }

</style>
