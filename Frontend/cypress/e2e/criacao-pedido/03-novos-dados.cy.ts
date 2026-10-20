import { prepararPedido, iniciarCarrinho, abrirFinalizacao, novosDados, finalizarPedido, conferirPerfil } from '../../support/pedido'

describe('Pedido — novos dados RF0035/RF0036/RN0023/RN0024/RN0025', () => {
  for (const incorporar of [true, false]) {
    it(incorporar ? '[RF0035][RF0036][RF0038][RN0023][RN0024][RN0025] cadastra novo endereço e cartão na compra e consulta ambos no perfil' : '[RF0035][RF0036][RF0038][RN0023][RN0024][RN0025] usa novo endereço e cartão somente no pedido, sem incorporá-los ao perfil', () => {
      prepararPedido().then(base => {
        iniciarCarrinho(base); abrirFinalizacao(); novosDados(incorporar)
        finalizarPedido(base).then(p => {
          expect(p.addressSnapshot).to.contain('Apartamento').and.to.contain('Francisco Rodrigues')
          expect(p.payments?.[0].lastDigits).to.eq('1881')
          expect(p.payments?.[0].brand).to.eq('Visa')
          expect(Boolean(p.addressId)).to.eq(incorporar)
          expect(Boolean(p.payments?.[0].cardId)).to.eq(incorporar)
        })
        conferirPerfil(base, incorporar)
      })
    })
  }
})
