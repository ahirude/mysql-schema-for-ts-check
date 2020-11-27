module.exports = {
  mode: 'production',
  target: 'node',
  entry: './index.js',
  output: {
    path: __dirname,
    filename: 'mysql-schema.js',
  },
  optimization: {
    minimize: true
  }
}
