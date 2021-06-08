module.exports = {
    globals: {
        __static: 'readonly',
    },
    env: {
        es6: true
    },
    parserOptions: {
        parser: "babel-eslint",
        sourceType: "module",
    },
    extends: [
        'plugin:vue/vue3-essential',
    ],
    plugins: [
        'vue'
    ],
}