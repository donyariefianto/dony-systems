module.exports = {
 apps: [
  {
   name: 'dony',
   script: 'node',
   //    args: 'ace serve --watch',
   // Or use --hmr for Hot Module Replacement
   args: 'ace serve --hmr',
   env: {
    NODE_ENV: 'development',
   },
  },
 ],
}
