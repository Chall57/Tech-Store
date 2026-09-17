import { defineConfig } from 'cypress'
import { execFile } from 'node:child_process'
import { resolve } from 'node:path'
import { promisify } from 'node:util'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5174',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    supportFile: false,
    setupNodeEvents(on) {
      on('task', {
        async prepararAdmin() {
          for (const script of ['preparar-dados-locais.ps1', 'preparar-dados-admin.ps1']) {
            await promisify(execFile)('pwsh.exe', ['-NoProfile', '-File', resolve('../scripts/' + script), '-ApiBase', 'http://127.0.0.1:8081/api', '-BancoSchema', 'techstore_e2e'], { timeout: 60000, windowsHide: true })
          }
          return null
        },
        async prepararPerfilLucas() {
          await promisify(execFile)('pwsh.exe', ['-NoProfile', '-File', resolve('../scripts/preparar-dados-locais.ps1'),
            '-ApiBase', 'http://127.0.0.1:8081/api', '-BancoSchema', 'techstore_e2e'], { timeout: 60000, windowsHide: true })
          return null
        },
      })
      on('before:browser:launch', (browser, launchOptions) => {
        if (browser.family === 'chromium' && browser.name !== 'electron') {
          launchOptions.args.push('--window-size=1600,1200', '--force-device-scale-factor=1')
        }
        return launchOptions
      })
    },
  },
  viewportWidth: 1440,
  viewportHeight: 1000,
  defaultCommandTimeout: 10000,
  video: true,
  screenshotOnRunFailure: true,
})
