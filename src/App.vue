<template>
  <h1>SHAPANet ATIS Broadcaster</h1>
  <div>
    <form @submit="onSubmit" @reset="onReset">
      <div id="content-group">
        <label for="content">ATIS Content</label>
        <textarea
          id="content"
          v-model="form.content"
          placeholder="Enter ATIS Message."
          rows="4"
          max-rows="6"
        >
        </textarea>
      </div>
      <button type="submit" variant="primary">Generate</button>
      <button type="reset" variant="danger">Reset</button>
    </form>
  </div>
  <div v-if="audio.show">
    <audio controls>
      <source :src="audio.filepath" type="audio/mpeg" />
      Your browser does not support the audio tag.
    </audio>
  </div>
</template>

<script>
// import HelloWorld from './components/HelloWorld.vue'
const ipcRenderer = window.ipcRenderer;

export default {
  name: "App",
  components: {
    // HelloWorld
  },
  data() {
    return {
      form: {
        content: ""
      },
      audio: {
        filepath: "",
        show: false
      }
    };
  },
  methods: {
    async onSubmit(e) {
      e.preventDefault();
      // alert(JSON.stringify(this.form));
      console.log(this.form.content);
      const resFile = await ipcRenderer.invoke(
        "generateAtis",
        this.form.content
      );
      this.audio.filepath = resFile;
      this.audio.show = true;
    },
    onReset(e) {
      e.preventDefault();
      this.form.content = "";
      this.show = false;
      this.$nextTick(() => {
        this.show = true;
      });
    }
  }
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
