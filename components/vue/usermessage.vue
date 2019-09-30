<template>
  <div class="usermessage-content" :style="style">
    <div class="usermessage-close" @click="closeUserMessage">x</div>
    <slot name="header">
      <h4 class="usermessage-header">{{ title }}</h4>
    </slot>
    <div class="usermessage-message" v-html="message"></div>
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
  };
  export default {
    name: "usermessage",
    props: {
      type: {
        type: String,
        default: 'info' // info, warning, error
      },
      title: {
        type: String,
        default: null,
      },
      position: {
        type: String,
        default: 'top'
      },
      message: {
        type: String,
        deafult: ''
      },
      autoclose: {
        type: Boolean,
        default: false
      }
    },
    computed: {
      style() {
        return {
          ...COLORS[this.type],
          [this.position]: 0
        };
      }
    },
    methods: {
      closeUserMessage(){
        this.$emit('close-usermessage')
      }
    },
    mounted(){
      this.autoclose && this.$nextTick(() => {
        setTimeout(() =>{
          this.closeUserMessage();
        }, 1000)
      })
    }
  }
</script>

<style scoped>
  .usermessage-content {
    color: #FFFFFF;
    background: red;
    z-index: 1000;
    min-height:100px;
    position: absolute;
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
  }

  .usermessage-header {
    font-weight: bold;
  }

  .usermessage-close {
    position: absolute;
    top: 10px;
    right: 10px;
    cursor: pointer;
    font-weight: bold;
    padding: 5px;
  }

  .usermessage-message {
    marging: 5px;
    padding: 10px;
    align-self: flex-start;
  }

</style>
