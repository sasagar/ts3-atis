module.exports = {
    root: true,
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
        'plugin:vue/recommended',
        'standard'
    ],
    plugins: [
        'vue'
    ],
}