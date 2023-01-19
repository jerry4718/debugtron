const originOwner = 'pd4d10'
const branchOwner = 'jerry4718' || originOwner

/** @type {import('@electron-forge/shared-types').ForgeConfig} */
module.exports = {
  packagerConfig: {
    appBundleId: `io.github.${branchOwner}.debugtron`,
    icon: 'assets/icon',
  },
  makers: [
    {
      name: '@electron-forge/maker-squirrel'
    },
    {
      name: '@electron-forge/maker-dmg'
    },
    {
      name: '@electron-forge/maker-deb',
      config: {
        options: {
          description: 'Debug in-production Electron based App',
          name: 'Debugtron',
          categories: [
            'Development'
          ]
        }
      }
    }
  ],
  hooks: {
    generateAssets: async (forgeConfig, platform, arch) => {
      // debugger
      console.log({platform, arch})
      console.log('We should generate some assets here');
    }
  },
  plugins: [
    {
      name: '@electron-forge/plugin-webpack',
      config: {
        mainConfig: './webpack.main.config.js',
        renderer: {
          nodeIntegration: true,
          config: './webpack.renderer.config.js',
          entryPoints: [
            {
              html: './src/index.html',
              js: './src/renderer.js',
              name: 'main_window',
              preload: {
                js: './src/preload.js'
              }
            }
          ]
        }
      }
    }
  ],
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: {
          owner: branchOwner,
          name: 'debugtron'
        }
      }
    }
  ]

}
