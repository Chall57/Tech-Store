import { defineConfig } from 'cypress'
import { execFile } from 'node:child_process'
import { resolve } from 'node:path'
import { promisify } from 'node:util'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5174',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    supportFile: 'cypress/support/e2e.ts',
    setupNodeEvents(on) {
      on('task', {
        async condicionarVenda({ clienteId, operacao, valor, referenciaId }: { clienteId: string; operacao: 'prazo' | 'estoque' | 'cupom'; valor: number; referenciaId?: string }) {
          const { stdout } = await promisify(execFile)('pwsh.exe', ['-NoProfile', '-File', resolve('../scripts/condicionar-venda-e2e.ps1'),
            '-ClienteId', clienteId, '-Operacao', operacao, '-Valor', String(valor),
            ...(referenciaId ? ['-ReferenciaId', referenciaId] : [])], { timeout: 60000, windowsHide: true })
          return JSON.parse(stdout.trim())
        },
        async auditoriaPedido({ clienteId, pedidoId }: { clienteId: string; pedidoId: string }) {
          const { stdout } = await promisify(execFile)('pwsh.exe', ['-NoProfile', '-File', resolve('../scripts/consultar-auditoria-pedido.ps1'),
            '-ClienteId', clienteId, '-PedidoId', pedidoId], { timeout: 60000, windowsHide: true })
          return JSON.parse(stdout.trim())
        },
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
          launchOptions.args.push('--window-size=1920,1200', '--force-device-scale-factor=1')
        }
        return launchOptions
      })
    },
  },
  viewportWidth: 1680,
  viewportHeight: 1050,
  scrollBehavior: 'center',
  expose: { actionDelay: 350, pageDelay: 600, typeDelay: 25 },
  defaultCommandTimeout: 10000,
  video: true,
  screenshotOnRunFailure: true,
})
