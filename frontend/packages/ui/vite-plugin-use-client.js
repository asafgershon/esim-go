// Plugin to add "use client" directive to the built output
function useClientPlugin() {
  return {
    name: 'use-client',
    generateBundle(options, bundle) {
      for (const fileName in bundle) {
        const chunk = bundle[fileName];
        
        // Only process JavaScript files
        if (chunk.type === 'chunk' && (fileName.endsWith('.mjs') || fileName.endsWith('.cjs'))) {
          // Add "use client" directive at the beginning of the file
          chunk.code = '"use client";\n' + chunk.code;
        }
      }
    }
  };
}

module.exports = useClientPlugin;