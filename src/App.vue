<template>
  <main>
    <h1>SHAPANet ATIS Broadcaster</h1>
    <div>
      <form @submit="onSubmit" @reset="onReset" v-show="show">
        <div class="group" id="icao-group">
          <label for="icao">AIRPORT ICAO</label>
          <input type="text" placeholder="ICAO" id="icao" v-model="form.icao" />
        </div>
        <div class="group" id="info-group">
          <label for="info">INFORMATION</label>
          <select id="info" v-model="form.info">
            <option>A</option>
            <option>B</option>
            <option>C</option>
            <option>D</option>
            <option>E</option>
            <option>F</option>
            <option>G</option>
            <option>H</option>
            <option>I</option>
            <option>J</option>
            <option>K</option>
            <option>L</option>
            <option>M</option>
            <option>N</option>
            <option>O</option>
            <option>P</option>
            <option>Q</option>
            <option>R</option>
            <option>S</option>
            <option>T</option>
            <option>U</option>
            <option>V</option>
            <option>W</option>
            <option>X</option>
            <option>Y</option>
            <option>Z</option>
          </select>
        </div>
        <div class="group" id="time-group">
          <label for="time">TIME</label>
          <input
            type="text"
            placeholder="0000"
            id="time"
            v-model="form.time"
          />Z
        </div>
        <div class="group" id="content-group">
          <label for="content" class="block">ATIS Content</label>
          <textarea
            id="content"
            v-model="form.content"
            placeholder="Enter ATIS Message."
            rows="4"
            max-rows="6"
          >
          </textarea>
        </div>
        <div class="group" id="voice-group">
          <label for="voice">VOICE</label>
          <select id="voice" v-model="form.voice">
            <option v-for="voice in voices" :key="voice.Id" :value="voice.Id">
              {{ voice.Name }} ({{ voice.Gender }})
            </option>
          </select>
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
  </main>
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
        icao: "",
        info: "",
        content: "",
        voice: ""
      },
      audio: {
        filepath: "",
        show: false
      },
      voices: [],
      show: true
    };
  },
  created: async function() {
    const voiceList = await ipcRenderer.invoke("getVoices");
    this.voices = voiceList;
  },
  methods: {
    async onSubmit(e) {
      e.preventDefault();
      this.audio.show = false;
      const resFile = await ipcRenderer.invoke(
        "generateAtis",
        JSON.stringify(this.form)
      );
      this.audio.filepath = resFile;
      this.audio.show = true;
    },
    onReset(e) {
      e.preventDefault();
      this.form.icao = "";
      this.form.info = "";
      this.form.content = "";
      this.show = false;
      this.$nextTick(() => {
        this.show = true;
      });
    }
  }
};
</script>

<style lang="scss">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  margin-top: 60px;
}

main {
  width: 90%;
  max-width: 960px;
  margin: 0 auto;
}

h1 {
  text-align: center;
}

.group {
  margin-bottom: 1rem;
}

label.block {
  display: block;
}

#time {
  width: 2rem;
}

textarea {
  width: 100%;
}
</style>
